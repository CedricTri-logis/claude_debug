// File: /Users/cedriclajoie/Project/Claude_debug/examples/database-example.js

import * as Sentry from '@sentry/node';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '../lib/logger.js';
import debugger from '../lib/debugger.js';
import { initializeSentry } from '../config/sentry.config.js';
import { initializeLogflare } from '../config/logflare.config.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Debugging Guide:
 * 1. Find error in Sentry by searching for component tag
 * 2. Copy the timestamp from Sentry error
 * 3. Search Logflare for logs within ±5 seconds of that timestamp
 * 4. Look for matching operation/table/context values
 * 5. Trace the full request flow using the correlation ID if available
 */

// Initialize debugging infrastructure
initializeSentry();
initializeLogflare();

const logger = createLogger({ component: 'database-example' });

/**
 * PostgreSQL connection pool with logging
 */
class LoggedPgPool extends pg.Pool {
  constructor(config) {
    super(config);
    this.logger = createLogger({ component: 'pg-pool' });
  }

  async query(text, params) {
    const startTime = Date.now();
    const queryId = crypto.randomUUID();
    
    try {
      // Log query start
      this.logger.info({
        operation: 'db_query_start',
        queryId,
        query: text,
        paramCount: params?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      // Execute query
      const result = await super.query(text, params);
      
      // Success: Log query result
      this.logger.info({
        operation: 'db_query_success',
        queryId,
        query: text,
        rowCount: result.rowCount,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      
      return result;
      
    } catch (err) {
      // Failure: Log query error
      this.logger.error({
        operation: 'db_query_failed',
        queryId,
        query: text,
        error: err.message,
        code: err.code,
        stack: err.stack,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      
      // Capture in Sentry
      Sentry.captureException(err, {
        tags: {
          component: 'pg-pool',
          queryId,
          errorCode: err.code
        },
        extra: {
          query: text,
          params
        }
      });
      
      throw err;
    }
  }
}

/**
 * Initialize PostgreSQL connection
 */
function initializePostgreSQL() {
  const startTime = Date.now();
  
  try {
    logger.info({
      operation: 'pg_init_start',
      message: 'Initializing PostgreSQL connection pool'
    });
    
    const pool = new LoggedPgPool({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
      min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
    
    // Add event listeners for pool monitoring
    pool.on('connect', (client) => {
      logger.debug({
        operation: 'pg_client_connected',
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      });
    });
    
    pool.on('acquire', (client) => {
      logger.debug({
        operation: 'pg_client_acquired',
        totalCount: pool.totalCount,
        idleCount: pool.idleCount
      });
    });
    
    pool.on('error', (err, client) => {
      logger.error({
        operation: 'pg_pool_error',
        error: err.message,
        stack: err.stack
      });
      
      Sentry.captureException(err, {
        tags: {
          component: 'pg-pool',
          event: 'pool-error'
        }
      });
    });
    
    pool.on('remove', (client) => {
      logger.debug({
        operation: 'pg_client_removed',
        totalCount: pool.totalCount
      });
    });
    
    // Success: Pool initialized
    logger.info({
      operation: 'pg_init_success',
      message: 'PostgreSQL pool initialized',
      duration: Date.now() - startTime
    });
    
    return pool;
    
  } catch (err) {
    // Failure: Pool initialization failed
    logger.error({
      operation: 'pg_init_failed',
      error: err.message,
      stack: err.stack,
      duration: Date.now() - startTime
    });
    
    Sentry.captureException(err, {
      tags: {
        component: 'database',
        operation: 'pg-init'
      }
    });
    
    throw err;
  }
}

/**
 * Initialize Supabase client with logging
 */
function initializeSupabase() {
  const startTime = Date.now();
  
  try {
    logger.info({
      operation: 'supabase_init_start',
      message: 'Initializing Supabase client'
    });
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false
        },
        global: {
          fetch: async (url, options = {}) => {
            const fetchLogger = createLogger({ component: 'supabase-fetch' });
            const requestId = crypto.randomUUID();
            
            try {
              fetchLogger.debug({
                operation: 'supabase_request_start',
                requestId,
                url,
                method: options.method || 'GET'
              });
              
              const response = await fetch(url, options);
              
              fetchLogger.debug({
                operation: 'supabase_request_complete',
                requestId,
                status: response.status
              });
              
              return response;
              
            } catch (err) {
              fetchLogger.error({
                operation: 'supabase_request_failed',
                requestId,
                error: err.message
              });
              throw err;
            }
          }
        }
      }
    );
    
    // Success: Supabase initialized
    logger.info({
      operation: 'supabase_init_success',
      message: 'Supabase client initialized',
      duration: Date.now() - startTime
    });
    
    return supabase;
    
  } catch (err) {
    // Failure: Supabase initialization failed
    logger.error({
      operation: 'supabase_init_failed',
      error: err.message,
      stack: err.stack,
      duration: Date.now() - startTime
    });
    
    Sentry.captureException(err, {
      tags: {
        component: 'database',
        operation: 'supabase-init'
      }
    });
    
    return null;
  }
}

/**
 * Example database operations with comprehensive logging
 */
async function runDatabaseExamples() {
  const sessionId = debugger.startSession(null, {
    example: 'database-operations'
  });
  
  const sessionLogger = logger.child({ sessionId });
  
  try {
    sessionLogger.info({
      operation: 'examples_start',
      message: 'Starting database operation examples'
    });
    
    // Initialize connections
    const pgPool = process.env.DATABASE_URL ? initializePostgreSQL() : null;
    const supabase = initializeSupabase();
    
    // PostgreSQL Examples
    if (pgPool) {
      await runPostgreSQLExamples(pgPool, sessionLogger);
    }
    
    // Supabase Examples
    if (supabase) {
      await runSupabaseExamples(supabase, sessionLogger);
    }
    
    // Get debug state
    const debugState = debugger.dumpState(sessionId);
    sessionLogger.info({
      operation: 'debug_state',
      eventsCount: debugState.session?.eventsCount || 0
    });
    
    // Success: Examples completed
    sessionLogger.info({
      operation: 'examples_complete',
      message: 'Database operation examples completed successfully'
    });
    
    // Cleanup
    if (pgPool) {
      await pgPool.end();
    }
    
  } catch (err) {
    // Failure: Examples failed
    sessionLogger.error({
      operation: 'examples_failed',
      error: err.message,
      stack: err.stack
    });
    
    // Analyze error
    const analysis = debugger.analyzeError(err, sessionId);
    sessionLogger.info({
      operation: 'error_analysis',
      errorId: analysis.errorId,
      suggestions: analysis.suggestions
    });
    
    Sentry.captureException(err, {
      tags: {
        component: 'database-examples',
        sessionId
      }
    });
    
    throw err;
  }
}

/**
 * PostgreSQL operation examples
 */
async function runPostgreSQLExamples(pool, logger) {
  const profile = debugger.createPerformanceProfile('postgresql_examples');
  
  try {
    logger.info({
      operation: 'pg_examples_start',
      message: 'Running PostgreSQL examples'
    });
    
    profile.mark('create_table_start');
    
    // Create table
    await logger.dbQuery('create_table', 'CREATE TABLE IF NOT EXISTS test_users', {
      table: 'test_users',
      execute: async () => {
        return await pool.query(`
          CREATE TABLE IF NOT EXISTS test_users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }
    });
    
    profile.mark('create_table_end');
    profile.mark('insert_start');
    
    // Insert data
    const insertResult = await logger.dbQuery('insert', 'INSERT INTO test_users', {
      table: 'test_users',
      execute: async () => {
        return await pool.query(
          'INSERT INTO test_users (name, email) VALUES ($1, $2) RETURNING *',
          ['Test User', `test${Date.now()}@example.com`]
        );
      }
    });
    
    profile.mark('insert_end');
    profile.mark('select_start');
    
    // Select data
    const selectResult = await logger.dbQuery('select', 'SELECT * FROM test_users', {
      table: 'test_users',
      execute: async () => {
        return await pool.query('SELECT * FROM test_users LIMIT 10');
      }
    });
    
    profile.mark('select_end');
    profile.mark('update_start');
    
    // Update data
    if (insertResult.rows.length > 0) {
      await logger.dbQuery('update', 'UPDATE test_users', {
        table: 'test_users',
        execute: async () => {
          return await pool.query(
            'UPDATE test_users SET name = $1 WHERE id = $2',
            ['Updated User', insertResult.rows[0].id]
          );
        }
      });
    }
    
    profile.mark('update_end');
    profile.mark('transaction_start');
    
    // Transaction example
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      await logger.dbQuery('transaction_insert', 'INSERT in transaction', {
        table: 'test_users',
        execute: async () => {
          return await client.query(
            'INSERT INTO test_users (name, email) VALUES ($1, $2)',
            ['Transaction User', `trans${Date.now()}@example.com`]
          );
        }
      });
      
      await client.query('COMMIT');
      
      logger.info({
        operation: 'transaction_commit',
        message: 'Transaction committed successfully'
      });
      
    } catch (err) {
      await client.query('ROLLBACK');
      
      logger.error({
        operation: 'transaction_rollback',
        error: err.message
      });
      
      throw err;
    } finally {
      client.release();
    }
    
    profile.mark('transaction_end');
    
    // Create measures
    profile.measure('create_table_duration', 'create_table_start', 'create_table_end');
    profile.measure('insert_duration', 'insert_start', 'insert_end');
    profile.measure('select_duration', 'select_start', 'select_end');
    profile.measure('update_duration', 'update_start', 'update_end');
    profile.measure('transaction_duration', 'transaction_start', 'transaction_end');
    
    const results = profile.end();
    
    // Success: PostgreSQL examples completed
    logger.info({
      operation: 'pg_examples_complete',
      rowsSelected: selectResult.rows.length,
      performance: results
    });
    
  } catch (err) {
    profile.end();
    
    // Failure: PostgreSQL examples failed
    logger.error({
      operation: 'pg_examples_failed',
      error: err.message,
      stack: err.stack
    });
    
    throw err;
  }
}

/**
 * Supabase operation examples
 */
async function runSupabaseExamples(supabase, logger) {
  const profile = debugger.createPerformanceProfile('supabase_examples');
  
  try {
    logger.info({
      operation: 'supabase_examples_start',
      message: 'Running Supabase examples'
    });
    
    profile.mark('insert_start');
    
    // Insert data
    const insertResult = await logger.dbQuery('supabase_insert', 'INSERT via Supabase', {
      table: 'test_table',
      execute: async () => {
        const { data, error } = await supabase
          .from('test_table')
          .insert([
            { name: 'Supabase User', email: `sb${Date.now()}@example.com` }
          ])
          .select();
        
        if (error) throw error;
        return { rows: data, rowCount: data?.length || 0 };
      }
    });
    
    profile.mark('insert_end');
    profile.mark('select_start');
    
    // Select data with filters
    const selectResult = await logger.dbQuery('supabase_select', 'SELECT via Supabase', {
      table: 'test_table',
      execute: async () => {
        const { data, error, count } = await supabase
          .from('test_table')
          .select('*', { count: 'exact' })
          .limit(10)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return { rows: data, rowCount: count };
      }
    });
    
    profile.mark('select_end');
    profile.mark('rpc_start');
    
    // RPC call example
    try {
      await logger.dbQuery('supabase_rpc', 'RPC call via Supabase', {
        table: 'rpc_function',
        execute: async () => {
          const { data, error } = await supabase
            .rpc('test_function', { param1: 'value1' });
          
          if (error) throw error;
          return { rows: data, rowCount: 1 };
        }
      });
    } catch (err) {
      // RPC might not exist, log but continue
      logger.warn({
        operation: 'supabase_rpc_skipped',
        reason: err.message
      });
    }
    
    profile.mark('rpc_end');
    profile.mark('realtime_start');
    
    // Realtime subscription example
    const channel = supabase
      .channel('test_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'test_table' },
        (payload) => {
          logger.info({
            operation: 'realtime_event',
            event: payload.eventType,
            table: payload.table,
            record: payload.new || payload.old
          });
        }
      )
      .subscribe((status) => {
        logger.info({
          operation: 'realtime_subscription',
          status
        });
      });
    
    // Wait a bit for subscription to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Unsubscribe
    await supabase.removeChannel(channel);
    
    profile.mark('realtime_end');
    
    // Create measures
    profile.measure('insert_duration', 'insert_start', 'insert_end');
    profile.measure('select_duration', 'select_start', 'select_end');
    profile.measure('rpc_duration', 'rpc_start', 'rpc_end');
    profile.measure('realtime_duration', 'realtime_start', 'realtime_end');
    
    const results = profile.end();
    
    // Success: Supabase examples completed
    logger.info({
      operation: 'supabase_examples_complete',
      rowsSelected: selectResult?.rows?.length || 0,
      performance: results
    });
    
  } catch (err) {
    profile.end();
    
    // Failure: Supabase examples failed
    logger.error({
      operation: 'supabase_examples_failed',
      error: err.message,
      stack: err.stack
    });
    
    Sentry.captureException(err, {
      tags: {
        component: 'supabase-examples'
      }
    });
    
    // Don't throw, as Supabase might not be configured
    logger.warn({
      operation: 'supabase_examples_error_handled',
      message: 'Supabase examples failed but continuing'
    });
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDatabaseExamples()
    .then(() => {
      logger.info('Database examples completed');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Database examples failed:', err);
      process.exit(1);
    });
}

export { runDatabaseExamples, initializePostgreSQL, initializeSupabase };