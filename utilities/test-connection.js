// Test script to verify all service connections
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

// Load environment variables
dotenv.config();

console.log('🔧 Testing Service Connections...\n');

// Test 1: Supabase Client Connection
async function testSupabaseClient() {
  console.log('1️⃣ Testing Supabase Client Connection...');
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // Try a simple query
    const { data, error } = await supabase.from('_test_connection').select('*').limit(1);
    
    if (error && error.code !== '42P01') { // 42P01 = table doesn't exist (which is fine)
      throw error;
    }
    
    console.log('✅ Supabase Client: Connected successfully!\n');
    return true;
  } catch (error) {
    console.error('❌ Supabase Client: Connection failed!');
    console.error('   Error:', error.message, '\n');
    return false;
  }
}

// Test 2: Direct PostgreSQL Connection
async function testPostgresConnection() {
  console.log('2️⃣ Testing Direct PostgreSQL Connection...');
  
  // Build the connection string with the password
  const connectionString = process.env.DATABASE_URL.replace(
    '${SUPABASE_DB_PASSWORD}',
    process.env.SUPABASE_DB_PASSWORD
  );
  
  const client = new pg.Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL: Connected successfully!');
    console.log('   Server time:', result.rows[0].now, '\n');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL: Connection failed!');
    console.error('   Error:', error.message, '\n');
    return false;
  } finally {
    await client.end();
  }
}

// Test 3: Verify Environment Variables
function testEnvironmentVariables() {
  console.log('3️⃣ Checking Environment Variables...');
  
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_DB_PASSWORD',
    'DATABASE_URL'
  ];
  
  let allPresent = true;
  
  for (const key of required) {
    if (!process.env[key] || process.env[key].includes('your-')) {
      console.error(`❌ ${key}: Missing or not configured`);
      allPresent = false;
    } else {
      const value = process.env[key];
      const display = value.length > 20 ? value.substring(0, 20) + '...' : value;
      console.log(`✅ ${key}: ${display}`);
    }
  }
  
  console.log('');
  return allPresent;
}

// Run all tests
async function runTests() {
  console.log('='.repeat(50));
  console.log('SUPABASE CONNECTION TEST');
  console.log('='.repeat(50), '\n');
  
  const envOk = testEnvironmentVariables();
  
  if (!envOk) {
    console.log('⚠️  Please configure all required environment variables in .env file');
    process.exit(1);
  }
  
  const supabaseOk = await testSupabaseClient();
  const postgresOk = await testPostgresConnection();
  
  console.log('='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  
  if (supabaseOk && postgresOk) {
    console.log('🎉 All connections successful! Your setup is ready.');
  } else {
    console.log('⚠️  Some connections failed. Please check your configuration.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);