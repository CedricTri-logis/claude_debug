#!/usr/bin/env node

/**
 * Migration Runner Script
 * 
 * This script helps run database migrations against your Supabase instance.
 * It includes safety checks and logging for proper database management.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('   Please check your .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Execute a SQL migration file
 * @param {string} migrationFile - Path to the migration file
 * @param {boolean} isRollback - Whether this is a rollback operation
 */
async function runMigration(migrationFile, isRollback = false) {
    try {
        console.log(`\n🔄 ${isRollback ? 'Rolling back' : 'Running'} migration: ${path.basename(migrationFile)}`);
        
        // Read the migration file
        const migrationSQL = await fs.readFile(migrationFile, 'utf8');
        
        if (!migrationSQL.trim()) {
            console.error('❌ Migration file is empty');
            return false;
        }

        console.log(`📝 Executing SQL commands...`);
        
        // Split SQL commands by semicolon but preserve semicolons within $$
        const commands = [];
        let currentCommand = '';
        let inDollarQuote = false;
        
        for (let i = 0; i < migrationSQL.length; i++) {
            const char = migrationSQL[i];
            const nextChar = migrationSQL[i + 1];
            
            if (char === '$' && nextChar === '$') {
                inDollarQuote = !inDollarQuote;
                currentCommand += '$$';
                i++; // Skip next $
            } else if (char === ';' && !inDollarQuote) {
                currentCommand = currentCommand.trim();
                if (currentCommand) {
                    commands.push(currentCommand);
                }
                currentCommand = '';
            } else {
                currentCommand += char;
            }
        }
        
        // Add last command if exists
        currentCommand = currentCommand.trim();
        if (currentCommand) {
            commands.push(currentCommand);
        }
        
        // Execute each command separately
        for (const command of commands) {
            if (!command.trim() || command.trim().startsWith('--')) {
                continue;
            }
            
            try {
                // First try to execute the command directly using the database connection
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql: command
                });
                
                if (error) {
                    // If exec_sql doesn't exist, use the query endpoint instead
                    if (error.message.includes('exec_sql')) {
                        // Use fetch to directly call the SQL endpoint
                        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': supabaseServiceKey,
                                'Authorization': `Bearer ${supabaseServiceKey}`
                            },
                            body: JSON.stringify({ query: command })
                        });
                        
                        if (!response.ok) {
                            // Try alternative approach - direct database connection
                            console.error(`❌ Command failed: ${command.substring(0, 50)}...`);
                            console.error('Error:', await response.text());
                            return false;
                        }
                    } else {
                        console.error(`❌ Command failed: ${command.substring(0, 50)}...`);
                        console.error('Error:', error.message);
                        return false;
                    }
                }
            } catch (err) {
                console.error(`❌ Command failed: ${command.substring(0, 50)}...`);
                console.error('Error:', err.message);
                return false;
            }
        }

        console.log(`✅ Migration ${isRollback ? 'rollback' : 'execution'} completed successfully`);
        return true;
        
    } catch (error) {
        console.error('❌ Error during migration:', error.message);
        return false;
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

  node scripts/run-migration.js <migration-file> [--rollback]

Examples:
  # Run migration
  node scripts/run-migration.js database/migrations/001_create_products_table.sql
  
  # Rollback migration
  node scripts/run-migration.js database/migrations/001_create_products_table_rollback.sql
  
  # Or use the --rollback flag with the main migration file
  node scripts/run-migration.js database/migrations/001_create_products_table.sql --rollback

Available migrations:
        `);
        
        try {
            const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
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
    if (supabaseUrl.includes('supabase.co')) {
        console.log('\n⚠️  WARNING: You are about to run a migration against a production Supabase instance!');
        console.log('   Please ensure you have backups and have tested this migration.');
        
        // In a real-world scenario, you might want to add interactive confirmation here
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

// Create the exec_sql RPC function helper (this would typically be done once in your database)
async function ensureExecSqlFunction() {
    // Note: The exec_sql function would need to be created manually in Supabase
    // or we'll execute commands directly using the Supabase client
    console.log('ℹ️  Note: Using direct SQL execution via Supabase client');
}

// Run the main function
ensureExecSqlFunction().then(() => main()).catch(console.error);

export { runMigration };