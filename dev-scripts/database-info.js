#!/usr/bin/env node

/**
 * Database Information Script
 * 
 * This script provides basic database information and statistics
 * including version, size, schemas, and extensions.
 * 
 * Usage: node scripts/database-info.js
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

async function getDatabaseInfo() {
  const client = createDatabaseConnection();
  
  try {
    console.log('🔗 Connecting to Supabase database...\n');
    await client.connect();
    
    console.log('=' .repeat(80));
    console.log('DATABASE INFORMATION & STATISTICS');
    console.log('=' .repeat(80));
    console.log();
    
    // Basic database information
    console.log('📋 Basic Information:');
    
    // Database version
    const { rows: versionRows } = await client.query('SELECT version()');
    console.log(`   PostgreSQL Version: ${versionRows[0].version}`);
    
    // Current database
    const { rows: dbRows } = await client.query('SELECT current_database()');
    console.log(`   Database Name: ${dbRows[0].current_database}`);
    
    // Current timestamp
    const { rows: timeRows } = await client.query('SELECT NOW() as current_time');
    console.log(`   Server Time: ${timeRows[0].current_time}`);
    
    // Database size
    try {
      const { rows: sizeRows } = await client.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
      `);
      console.log(`   Database Size: ${sizeRows[0].db_size}`);
    } catch (error) {
      console.log(`   Database Size: Unable to determine (${error.message})`);
    }
    
    console.log();
    
    // Schema information
    console.log('📁 Schemas:');
    const { rows: schemaRows } = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
      ORDER BY schema_name
    `);
    
    schemaRows.forEach(schema => {
      console.log(`   • ${schema.schema_name}`);
    });
    
    console.log();
    
    // Extensions
    console.log('🔧 Extensions:');
    const { rows: extensionRows } = await client.query(`
      SELECT extname, extversion, nspname as schema
      FROM pg_extension e
      JOIN pg_namespace n ON e.extnamespace = n.oid
      ORDER BY extname
    `);
    
    if (extensionRows.length > 0) {
      extensionRows.forEach(ext => {
        console.log(`   • ${ext.extname} (v${ext.extversion}) in schema: ${ext.schema}`);
      });
    } else {
      console.log('   No extensions found');
    }
    
    console.log();
    
    // Table statistics by schema
    console.log('📊 Table Statistics:');
    const { rows: tableStatsRows } = await client.query(`
      SELECT 
        schemaname,
        COUNT(*) as table_count
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
      GROUP BY schemaname
      ORDER BY table_count DESC, schemaname
    `);
    
    if (tableStatsRows.length > 0) {
      let totalTables = 0;
      tableStatsRows.forEach(stat => {
        console.log(`   • ${stat.schemaname}: ${stat.table_count} table(s)`);
        totalTables += parseInt(stat.table_count);
      });
      console.log(`   Total Tables: ${totalTables}`);
    } else {
      console.log('   No tables found');
    }
    
    console.log();
    
    // Connection information
    console.log('🔗 Connection Information:');
    const { rows: connRows } = await client.query(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
    `);
    
    if (connRows.length > 0) {
      const conn = connRows[0];
      console.log(`   • Total Connections: ${conn.total_connections}`);
      console.log(`   • Active Connections: ${conn.active_connections}`);
      console.log(`   • Idle Connections: ${conn.idle_connections}`);
    }
    
    // Current user and roles
    const { rows: userRows } = await client.query('SELECT current_user, session_user');
    console.log(`   • Current User: ${userRows[0].current_user}`);
    console.log(`   • Session User: ${userRows[0].session_user}`);
    
    console.log();
    
    // Supabase specific information
    console.log('🚀 Supabase Configuration:');
    console.log(`   • Project URL: ${process.env.SUPABASE_URL}`);
    console.log(`   • Project ID: ${process.env.SUPABASE_URL ? process.env.SUPABASE_URL.split('.')[0].replace('https://', '') : 'Not configured'}`);
    console.log(`   • Connection Pool: Min ${process.env.DATABASE_POOL_MIN || 'default'}, Max ${process.env.DATABASE_POOL_MAX || 'default'}`);
    
    console.log();
    
    // Quick health checks
    console.log('✅ Health Checks:');
    
    // Check if we can create a test table (rollback immediately)
    try {
      await client.query('BEGIN');
      await client.query('CREATE TEMP TABLE _health_check (id INT)');
      await client.query('INSERT INTO _health_check VALUES (1)');
      const { rows: testRows } = await client.query('SELECT COUNT(*) FROM _health_check');
      await client.query('ROLLBACK');
      console.log(`   • Read/Write Access: ✅ Working (test count: ${testRows[0].count})`);
    } catch (error) {
      console.log(`   • Read/Write Access: ❌ Limited (${error.message})`);
    }
    
    // Check if authentication is working
    try {
      const { rows: authTest } = await client.query('SELECT current_user');
      console.log(`   • Authentication: ✅ Connected as ${authTest[0].current_user}`);
    } catch (error) {
      console.log(`   • Authentication: ❌ Issue (${error.message})`);
    }
    
    // Check if we can access system catalogs
    try {
      const { rows: catalogTest } = await client.query('SELECT COUNT(*) FROM pg_tables LIMIT 1');
      console.log(`   • System Catalog Access: ✅ Working`);
    } catch (error) {
      console.log(`   • System Catalog Access: ❌ Limited (${error.message})`);
    }
    
    console.log();
    console.log('=' .repeat(80));
    console.log('✅ Database information retrieved successfully!');
    console.log('=' .repeat(80));
    
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
  
  await getDatabaseInfo();
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