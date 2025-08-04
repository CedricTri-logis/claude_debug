#!/usr/bin/env node

/**
 * Database Table Listing Script
 * 
 * This script connects to the Supabase PostgreSQL database and lists all tables
 * with their basic structure including column information.
 * 
 * Usage: node scripts/list-tables.js
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
dotenv.config({ path: join(rootDir, '.env') });

// Database connection configuration
function createDatabaseConnection() {
  const connectionString = process.env.DATABASE_URL.replace(
    '${SUPABASE_DB_PASSWORD}',
    process.env.SUPABASE_DB_PASSWORD
  );
  
  return new pg.Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

// Query to get all tables and their basic information
const GET_TABLES_QUERY = `
  SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
  FROM pg_tables 
  WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
  ORDER BY schemaname, tablename;
`;

// Query to get column information for a specific table
const GET_COLUMNS_QUERY = `
  SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
  FROM information_schema.columns 
  WHERE table_schema = $1 AND table_name = $2
  ORDER BY ordinal_position;
`;

// Query to get table row counts
const GET_ROW_COUNT_QUERY = `
  SELECT schemaname, tablename, n_tup_ins as row_count_estimate
  FROM pg_stat_user_tables 
  WHERE schemaname = $1 AND tablename = $2;
`;

// Query to get table constraints
const GET_CONSTRAINTS_QUERY = `
  SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
  FROM information_schema.table_constraints tc
  LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.table_schema = $1 AND tc.table_name = $2
  ORDER BY tc.constraint_type, tc.constraint_name;
`;

async function listAllTables() {
  const client = createDatabaseConnection();
  
  try {
    console.log('🔗 Connecting to Supabase database...\n');
    await client.connect();
    
    // Get current timestamp for the report
    const { rows: timeRows } = await client.query('SELECT NOW() as current_time');
    const currentTime = timeRows[0].current_time;
    
    console.log('=' .repeat(80));
    console.log('DATABASE TABLES INVENTORY');
    console.log('=' .repeat(80));
    console.log(`Generated: ${currentTime}`);
    console.log(`Database: ${process.env.SUPABASE_URL}`);
    console.log('=' .repeat(80));
    console.log();
    
    // Get all tables
    const { rows: tables } = await client.query(GET_TABLES_QUERY);
    
    if (tables.length === 0) {
      console.log('📭 No user tables found in the database.');
      console.log('\nThis could mean:');
      console.log('  • The database is empty (no tables created yet)');
      console.log('  • All tables are in system schemas');
      console.log('  • Connection permissions may be limiting table visibility');
      return;
    }
    
    console.log(`📊 Found ${tables.length} table(s) in the database:\n`);
    
    // Process each table
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const { schemaname, tablename, tableowner, hasindexes, hasrules, hastriggers, rowsecurity } = table;
      
      console.log(`${i + 1}. ${schemaname}.${tablename}`);
      console.log(`   Owner: ${tableowner}`);
      console.log(`   Features: ${[
        hasindexes ? 'Indexes' : null,
        hasrules ? 'Rules' : null,
        hastriggers ? 'Triggers' : null,
        rowsecurity ? 'RLS' : null
      ].filter(Boolean).join(', ') || 'None'}`);
      
      try {
        // Get row count estimate
        const { rows: countRows } = await client.query(GET_ROW_COUNT_QUERY, [schemaname, tablename]);
        const rowCount = countRows.length > 0 ? countRows[0].row_count_estimate : 'Unknown';
        console.log(`   Estimated rows: ${rowCount}`);
        
        // Get column information
        const { rows: columns } = await client.query(GET_COLUMNS_QUERY, [schemaname, tablename]);
        
        if (columns.length > 0) {
          console.log('   Columns:');
          columns.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
            let dataType = col.data_type;
            
            // Add length/precision info for applicable types
            if (col.character_maximum_length) {
              dataType += `(${col.character_maximum_length})`;
            } else if (col.numeric_precision && col.numeric_scale !== null) {
              dataType += `(${col.numeric_precision},${col.numeric_scale})`;
            } else if (col.numeric_precision) {
              dataType += `(${col.numeric_precision})`;
            }
            
            console.log(`     • ${col.column_name}: ${dataType} ${nullable}${defaultVal}`);
          });
        }
        
        // Get constraints
        const { rows: constraints } = await client.query(GET_CONSTRAINTS_QUERY, [schemaname, tablename]);
        
        if (constraints.length > 0) {
          console.log('   Constraints:');
          const constraintsByType = constraints.reduce((acc, constraint) => {
            if (!acc[constraint.constraint_type]) {
              acc[constraint.constraint_type] = [];
            }
            acc[constraint.constraint_type].push(constraint);
            return acc;
          }, {});
          
          Object.entries(constraintsByType).forEach(([type, constraintList]) => {
            const typeLabel = {
              'PRIMARY KEY': 'Primary Key',
              'FOREIGN KEY': 'Foreign Key',
              'UNIQUE': 'Unique',
              'CHECK': 'Check'
            }[type] || type;
            
            constraintList.forEach(constraint => {
              let description = `${constraint.constraint_name} (${constraint.column_name})`;
              if (constraint.foreign_table_name) {
                description += ` → ${constraint.foreign_table_name}(${constraint.foreign_column_name})`;
              }
              console.log(`     • ${typeLabel}: ${description}`);
            });
          });
        }
        
      } catch (error) {
        console.log(`   ⚠️  Error getting details: ${error.message}`);
      }
      
      console.log(); // Empty line between tables
    }
    
    // Summary
    console.log('=' .repeat(80));
    console.log('SUMMARY');
    console.log('=' .repeat(80));
    
    const schemaGroups = tables.reduce((acc, table) => {
      if (!acc[table.schemaname]) {
        acc[table.schemaname] = [];
      }
      acc[table.schemaname].push(table.tablename);
      return acc;
    }, {});
    
    Object.entries(schemaGroups).forEach(([schema, tableNames]) => {
      console.log(`📁 Schema "${schema}": ${tableNames.length} table(s)`);
      tableNames.forEach(name => console.log(`   • ${name}`));
    });
    
    console.log(`\n✅ Successfully listed ${tables.length} table(s) from the database.`);
    
  } catch (error) {
    console.error('❌ Error connecting to database:');
    console.error(error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.error('\n🔑 Authentication failed. Please check:');
      console.error('   • SUPABASE_DB_PASSWORD in .env file');
      console.error('   • Database password in Supabase Dashboard > Settings > Database');
    } else if (error.message.includes('does not exist')) {
      console.error('\n🏗️  Database connection failed. Please check:');
      console.error('   • DATABASE_URL in .env file');
      console.error('   • Supabase project is active and accessible');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Export the table data to a file
async function exportTableInventory() {
  const client = createDatabaseConnection();
  
  try {
    console.log('\n💾 Exporting table inventory to file...');
    await client.connect();
    
    const { rows: tables } = await client.query(GET_TABLES_QUERY);
    const timestamp = new Date().toISOString();
    
    let output = `# Database Table Inventory\n\n`;
    output += `**Generated:** ${timestamp}\n`;
    output += `**Database:** ${process.env.SUPABASE_URL}\n`;
    output += `**Total Tables:** ${tables.length}\n\n`;
    
    if (tables.length === 0) {
      output += 'No user tables found in the database.\n';
    } else {
      output += '## Tables\n\n';
      
      for (const table of tables) {
        output += `### ${table.schemaname}.${table.tablename}\n\n`;
        output += `- **Owner:** ${table.tableowner}\n`;
        output += `- **Features:** ${[
          table.hasindexes ? 'Indexes' : null,
          table.hasrules ? 'Rules' : null,
          table.hastriggers ? 'Triggers' : null,
          table.rowsecurity ? 'Row Level Security' : null
        ].filter(Boolean).join(', ') || 'None'}\n\n`;
        
        try {
          const { rows: columns } = await client.query(GET_COLUMNS_QUERY, [table.schemaname, table.tablename]);
          
          if (columns.length > 0) {
            output += '**Columns:**\n\n';
            output += '| Column | Type | Nullable | Default |\n';
            output += '|--------|------|----------|----------|\n';
            
            columns.forEach(col => {
              const nullable = col.is_nullable === 'YES' ? 'Yes' : 'No';
              const defaultVal = col.column_default || '';
              let dataType = col.data_type;
              
              if (col.character_maximum_length) {
                dataType += `(${col.character_maximum_length})`;
              } else if (col.numeric_precision && col.numeric_scale !== null) {
                dataType += `(${col.numeric_precision},${col.numeric_scale})`;
              } else if (col.numeric_precision) {
                dataType += `(${col.numeric_precision})`;
              }
              
              output += `| ${col.column_name} | ${dataType} | ${nullable} | ${defaultVal} |\n`;
            });
            output += '\n';
          }
        } catch (error) {
          output += `*Error retrieving column details: ${error.message}*\n\n`;
        }
      }
    }
    
    // Write to file
    const fs = await import('fs/promises');
    const outputPath = join(rootDir, 'db_schema', 'table_inventory.txt');
    await fs.writeFile(outputPath, output);
    
    console.log(`✅ Table inventory exported to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error exporting inventory:', error.message);
  } finally {
    await client.end();
  }
}

// Main execution
async function main() {
  // Validate required environment variables
  const required = ['SUPABASE_URL', 'SUPABASE_DB_PASSWORD', 'DATABASE_URL'];
  const missing = required.filter(key => !process.env[key] || process.env[key].includes('your-'));
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   • ${key}`));
    console.error('\nPlease configure these in your .env file.');
    process.exit(1);
  }
  
  await listAllTables();
  await exportTableInventory();
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n👋 Script interrupted by user');
  process.exit(0);
});

// Run the script
main().catch(console.error);