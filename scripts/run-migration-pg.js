#!/usr/bin/env node

/**
 * Migration Runner Script using PostgreSQL client
 * 
 * This script runs database migrations directly against your Supabase PostgreSQL instance.
 */

import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const databaseUrl = process.env.DATABASE_URL?.replace('${SUPABASE_DB_PASSWORD}', process.env.SUPABASE_DB_PASSWORD);

if (!databaseUrl) {
    console.error('❌ Missing required environment variable: DATABASE_URL');
    process.exit(1);
}

// Create PostgreSQL client
const { Client } = pg;

/**
 * Execute a SQL migration file
 * @param {string} migrationFile - Path to the migration file
 * @param {boolean} isRollback - Whether this is a rollback operation
 */
async function runMigration(migrationFile, isRollback = false) {
    const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log(`\n🔄 ${isRollback ? 'Rolling back' : 'Running'} migration: ${path.basename(migrationFile)}`);
        
        // Connect to database
        await client.connect();
        console.log('✅ Connected to database');
        
        // Read the migration file
        const migrationSQL = await fs.readFile(migrationFile, 'utf8');
        
        if (!migrationSQL.trim()) {
            console.error('❌ Migration file is empty');
            return false;
        }

        console.log(`📝 Executing SQL commands...`);
        
        // Execute the migration as a single transaction
        await client.query('BEGIN');
        
        try {
            await client.query(migrationSQL);
            await client.query('COMMIT');
            console.log(`✅ Migration ${isRollback ? 'rollback' : 'execution'} completed successfully`);
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Migration failed:', error.message);
            console.error('   Rolling back transaction...');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error during migration:', error.message);
        return false;
    } finally {
        await client.end();
        console.log('🔌 Disconnected from database');
    }
}

/**
 * Main function to handle command line arguments
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
📚 Migration Runner Usage:

  node scripts/run-migration-pg.js <migration-file> [--rollback]

Examples:
  # Run migration
  node scripts/run-migration-pg.js db_schema/migrations/001_create_products_table.sql
  
  # Rollback migration
  node scripts/run-migration-pg.js db_schema/migrations/001_create_products_table_rollback.sql
  
  # Or use the --rollback flag with the main migration file
  node scripts/run-migration-pg.js db_schema/migrations/001_create_products_table.sql --rollback

Available migrations:
        `);
        
        try {
            const migrationsDir = path.join(__dirname, '..', 'db_schema', 'migrations');
            const files = await fs.readdir(migrationsDir);
            const migrationFiles = files.filter(f => f.endsWith('.sql')).sort();
            
            migrationFiles.forEach(file => {
                console.log(`  - ${file}`);
            });
        } catch (error) {
            console.log('  (No migrations directory found)');
        }
        
        return;
    }

    const migrationFile = args[0];
    const isRollback = args.includes('--rollback');
    
    // If rollback flag is used, try to find the rollback version
    let actualMigrationFile = migrationFile;
    if (isRollback && !migrationFile.includes('_rollback.sql')) {
        actualMigrationFile = migrationFile.replace('.sql', '_rollback.sql');
    }
    
    // Check if file exists
    try {
        await fs.access(actualMigrationFile);
    } catch (error) {
        console.error(`❌ Migration file not found: ${actualMigrationFile}`);
        process.exit(1);
    }

    console.log('🚀 Starting migration process...');
    console.log(`📁 Migration file: ${actualMigrationFile}`);
    console.log(`🔧 Operation: ${isRollback ? 'ROLLBACK' : 'FORWARD'}`);
    
    // Safety confirmation for production-like environments
    if (databaseUrl.includes('supabase.com')) {
        console.log('\n⚠️  WARNING: You are about to run a migration against a production Supabase instance!');
        console.log('   Please ensure you have backups and have tested this migration.');
        console.log('   Proceeding in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    const success = await runMigration(actualMigrationFile, isRollback);
    
    if (success) {
        console.log('\n🎉 Migration completed successfully!');
        
        if (!isRollback) {
            console.log('\n💡 Next steps:');
            console.log('   - Verify the changes in your Supabase dashboard');
            console.log('   - Test your application functionality');
            console.log('   - Update your schema documentation if needed');
        }
    } else {
        console.log('\n💥 Migration failed. Please check the error messages above.');
        process.exit(1);
    }
}

// Run the main function
main().catch(console.error);

export { runMigration };