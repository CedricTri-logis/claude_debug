#!/usr/bin/env node

// JavaScript-based Database Schema Export
// Uses Supabase client to export schema information

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function exportSchema() {
  console.log('======================================');
  console.log('Supabase Database Export (JS)');
  console.log('======================================');
  console.log('');

  // Create database directory
  const dbSchemaDir = path.join(process.cwd(), 'database');
  if (!fs.existsSync(dbSchemaDir)) {
    fs.mkdirSync(dbSchemaDir, { recursive: true });
  }

  try {
    // 1. Get all tables
    console.log('1. Fetching table information...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name, table_type')
      .in('table_schema', ['public', 'auth'])
      .order('table_schema,table_name');

    if (tablesError) throw tablesError;

    // 2. Get columns for each table
    console.log('2. Fetching column information...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('table_schema, table_name, column_name, data_type, is_nullable, column_default')
      .in('table_schema', ['public', 'auth'])
      .order('table_schema,table_name,ordinal_position');

    if (columnsError) throw columnsError;

    // 3. Create schema documentation
    console.log('3. Creating schema documentation...');
    
    let schemaDoc = '# Database Schema Documentation\n\n';
    schemaDoc += `Generated: ${new Date().toISOString()}\n\n`;
    
    // Group columns by table
    const tableMap = {};
    
    if (tables) {
      tables.forEach(table => {
        const key = `${table.table_schema}.${table.table_name}`;
        tableMap[key] = {
          schema: table.table_schema,
          name: table.table_name,
          type: table.table_type,
          columns: []
        };
      });
    }
    
    if (columns) {
      columns.forEach(col => {
        const key = `${col.table_schema}.${col.table_name}`;
        if (tableMap[key]) {
          tableMap[key].columns.push(col);
        }
      });
    }
    
    // Write documentation
    for (const [key, table] of Object.entries(tableMap)) {
      schemaDoc += `## ${table.schema}.${table.name}\n\n`;
      schemaDoc += `Type: ${table.type}\n\n`;
      
      if (table.columns.length > 0) {
        schemaDoc += '| Column | Type | Nullable | Default |\n';
        schemaDoc += '|--------|------|----------|------|\n';
        
        table.columns.forEach(col => {
          schemaDoc += `| ${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${col.column_default || 'NULL'} |\n`;
        });
      }
      
      schemaDoc += '\n';
    }
    
    // Save schema documentation
    fs.writeFileSync(path.join(dbSchemaDir, 'schema_documentation.md'), schemaDoc);
    console.log('✅ Schema documentation created');
    
    // 4. Export sample data for public tables
    console.log('4. Exporting sample data...');
    
    const publicTables = Object.values(tableMap).filter(t => t.schema === 'public');
    const dataSamples = {};
    
    for (const table of publicTables) {
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(5);
        
        if (!error && data) {
          dataSamples[table.name] = data;
          console.log(`   ✅ ${table.name}: ${data.length} rows`);
        }
      } catch (e) {
        console.log(`   ⚠️  ${table.name}: Could not fetch data`);
      }
    }
    
    // Save data samples
    fs.writeFileSync(
      path.join(dbSchemaDir, 'data_samples.json'),
      JSON.stringify(dataSamples, null, 2)
    );
    
    // 5. Create summary
    const summary = {
      exported_at: new Date().toISOString(),
      statistics: {
        total_tables: Object.keys(tableMap).length,
        public_tables: publicTables.length,
        auth_tables: Object.values(tableMap).filter(t => t.schema === 'auth').length,
        total_columns: columns ? columns.length : 0
      },
      tables: Object.keys(tableMap).sort()
    };
    
    fs.writeFileSync(
      path.join(dbSchemaDir, 'export_summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('');
    console.log('======================================');
    console.log('Export Complete!');
    console.log('======================================');
    console.log('');
    console.log('Files created:');
    console.log('  - database/schema_documentation.md');
    console.log('  - database/data_samples.json');
    console.log('  - database/export_summary.json');
    console.log('');
    console.log('Statistics:');
    console.log(`  - Total tables: ${summary.statistics.total_tables}`);
    console.log(`  - Public tables: ${summary.statistics.public_tables}`);
    console.log(`  - Total columns: ${summary.statistics.total_columns}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    
    // Try alternative approach - just document what we know
    console.log('\nFalling back to basic documentation...');
    
    const basicDoc = `# Database Schema
    
## Configuration

- **Supabase URL**: ${process.env.SUPABASE_URL}
- **Project ID**: ${process.env.SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1]}
- **Export Date**: ${new Date().toISOString()}

## Connection Details

- **Host**: ${process.env.DATABASE_URL.match(/@([^:]+)/)?.[1]}
- **Port**: 5432
- **Database**: postgres

## Notes

This is a placeholder schema document. To get the full schema:

1. Install Supabase CLI locally
2. Run: \`supabase db dump --db-url "${process.env.DATABASE_URL}"\`

Or use the GitHub Actions workflow that will automatically export on push to main.
`;
    
    fs.writeFileSync(path.join(dbSchemaDir, 'schema_documentation.md'), basicDoc);
    console.log('✅ Basic documentation created');
  }
}

// Run the export
exportSchema().catch(console.error);