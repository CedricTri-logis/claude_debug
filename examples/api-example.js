// File: /Users/cedriclajoie/Project/Claude_debug/examples/api-example.js

import * as Sentry from '@sentry/node';
import express from 'express';
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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for JSON parsing
app.use(express.json());

/**
 * Correlation ID middleware
 */
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  
  // Create request-scoped logger
  req.logger = createLogger({ 
    component: 'api',
    correlationId,
    path: req.path,
    method: req.method
  });
  
  // Start debug session for this request
  req.debugSessionId = debugger.startSession(correlationId, {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  
  next();
});

/**
 * Request logging middleware
 */
app.use((req, res, next) => {
  const startTime = Date.now();
  
  try {
    // Log request start
    req.logger.info({
      operation: 'http_request_start',
      method: req.method,
      path: req.path,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type']
      }
    });
    
    // Add debug checkpoint
    debugger.checkpoint('request_received', {
      method: req.method,
      path: req.path
    });
    
    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      // Log response
      req.logger.httpRequest(req, res, duration);
      
      // Add performance data
      debugger.addTimelineEvent(req.debugSessionId, 'request_complete', {
        statusCode: res.statusCode,
        duration
      });
      
      // Success: Request completed
      if (res.statusCode < 400) {
        req.logger.info({
          operation: 'http_request_success',
          statusCode: res.statusCode,
          duration
        });
      } else {
        // Failure: Request failed
        req.logger.warn({
          operation: 'http_request_failed',
          statusCode: res.statusCode,
          duration
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
    
  } catch (err) {
    // Failure: Middleware error
    req.logger.error({
      operation: 'middleware_error',
      error: err.message,
      stack: err.stack
    });
    
    Sentry.captureException(err, {
      tags: {
        component: 'api-middleware',
        correlationId: req.correlationId
      }
    });
    
    next(err);
  }
});

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    req.logger.info({
      operation: 'health_check_start'
    });
    
    // Check various components
    const checks = {
      api: 'healthy',
      sentry: process.env.ENABLE_SENTRY === 'true' ? 'enabled' : 'disabled',
      logflare: process.env.ENABLE_LOGFLARE === 'true' ? 'enabled' : 'disabled',
      timestamp: new Date().toISOString()
    };
    
    // Success: Health check passed
    req.logger.info({
      operation: 'health_check_success',
      checks,
      duration: Date.now() - startTime
    });
    
    res.json({
      status: 'healthy',
      checks,
      correlationId: req.correlationId
    });
    
  } catch (err) {
    // Failure: Health check failed
    req.logger.error({
      operation: 'health_check_failed',
      error: err.message,
      stack: err.stack,
      duration: Date.now() - startTime
    });
    
    Sentry.captureException(err, {
      tags: {
        component: 'health-check',
        correlationId: req.correlationId
      }
    });
    
    res.status(500).json({
      status: 'unhealthy',
      error: err.message,
      correlationId: req.correlationId
    });
  }
});

/**
 * User creation endpoint (simulated)
 */
app.post('/api/users', async (req, res) => {
  const profile = debugger.createPerformanceProfile('create_user');
  
  try {
    profile.mark('validation_start');
    
    // Validate request body
    const { name, email } = req.body;
    
    if (!name || !email) {
      throw new Error('Name and email are required');
    }
    
    profile.mark('validation_end');
    
    req.logger.info({
      operation: 'user_create_start',
      userData: { name, email: email.replace(/(.{2}).*@/, '$1***@') } // Sanitize email
    });
    
    profile.mark('db_operation_start');
    
    // Simulate database operation
    const user = await req.logger.dbQuery('insert', 'INSERT INTO users (name, email) VALUES ($1, $2)', {
      table: 'users',
      values: [name, email],
      execute: async () => {
        // Simulate DB delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          rowCount: 1,
          rows: [{
            id: Math.floor(Math.random() * 10000),
            name,
            email,
            created_at: new Date().toISOString()
          }]
        };
      }
    });
    
    profile.mark('db_operation_end');
    profile.measure('validation_duration', 'validation_start', 'validation_end');
    profile.measure('db_duration', 'db_operation_start', 'db_operation_end');
    
    const profileResults = profile.end();
    
    // Success: User created
    req.logger.info({
      operation: 'user_create_success',
      userId: user.rows[0].id,
      performance: profileResults
    });
    
    res.status(201).json({
      success: true,
      user: user.rows[0],
      correlationId: req.correlationId
    });
    
  } catch (err) {
    profile.end();
    
    // Failure: User creation failed
    req.logger.error({
      operation: 'user_create_failed',
      error: err.message,
      stack: err.stack
    });
    
    // Analyze the error
    const analysis = debugger.analyzeError(err, req.correlationId);
    req.logger.info({
      operation: 'error_analysis',
      errorId: analysis.errorId,
      suggestions: analysis.suggestions
    });
    
    Sentry.captureException(err, {
      tags: {
        component: 'api-users',
        operation: 'create',
        correlationId: req.correlationId
      },
      extra: {
        requestBody: req.body
      }
    });
    
    res.status(400).json({
      success: false,
      error: err.message,
      errorId: analysis.errorId,
      correlationId: req.correlationId
    });
  }
});

/**
 * Simulated external API call endpoint
 */
app.get('/api/external', async (req, res) => {
  const startTime = Date.now();
  
  try {
    req.logger.info({
      operation: 'external_api_start',
      target: 'jsonplaceholder.typicode.com'
    });
    
    // Simulate external API call
    const response = await req.logger.apiCall('GET', 'https://jsonplaceholder.typicode.com/users/1', {
      execute: async () => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
          status: 200,
          data: {
            id: 1,
            name: 'Leanne Graham',
            email: 'Sincere@april.biz'
          }
        };
      }
    });
    
    // Success: External API call succeeded
    req.logger.info({
      operation: 'external_api_success',
      duration: Date.now() - startTime,
      responseStatus: response.status
    });
    
    res.json({
      success: true,
      data: response.data,
      correlationId: req.correlationId
    });
    
  } catch (err) {
    // Failure: External API call failed
    req.logger.error({
      operation: 'external_api_failed',
      error: err.message,
      stack: err.stack,
      duration: Date.now() - startTime
    });
    
    Sentry.captureException(err, {
      tags: {
        component: 'api-external',
        correlationId: req.correlationId
      }
    });
    
    res.status(500).json({
      success: false,
      error: 'External API call failed',
      correlationId: req.correlationId
    });
  }
});

/**
 * Debug endpoint to get current state
 */
app.get('/api/debug', (req, res) => {
  try {
    const state = debugger.dumpState(req.debugSessionId);
    
    req.logger.info({
      operation: 'debug_state_requested',
      sessionId: req.debugSessionId
    });
    
    res.json({
      success: true,
      debugState: state,
      correlationId: req.correlationId
    });
    
  } catch (err) {
    req.logger.error({
      operation: 'debug_state_failed',
      error: err.message
    });
    
    res.status(500).json({
      success: false,
      error: err.message,
      correlationId: req.correlationId
    });
  }
});

/**
 * Error handler middleware
 */
app.use((err, req, res, next) => {
  const errorId = crypto.randomUUID();
  
  // Log the error
  req.logger.error({
    operation: 'unhandled_error',
    errorId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // Capture in Sentry
  Sentry.captureException(err, {
    tags: {
      component: 'api-error-handler',
      errorId,
      correlationId: req.correlationId
    },
    extra: {
      path: req.path,
      method: req.method,
      query: req.query,
      body: req.body
    }
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    errorId,
    correlationId: req.correlationId
  });
});

/**
 * Start the server
 */
const server = app.listen(PORT, () => {
  const logger = createLogger({ component: 'api-server' });
  
  logger.info({
    operation: 'server_started',
    message: `API server listening on port ${PORT}`,
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
  
  console.log(`🚀 API server running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Debug state: http://localhost:${PORT}/api/debug`);
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  const logger = createLogger({ component: 'api-shutdown' });
  
  logger.info({
    operation: 'shutdown_initiated',
    message: 'SIGTERM received, shutting down gracefully'
  });
  
  server.close(() => {
    logger.info({
      operation: 'server_closed',
      message: 'HTTP server closed'
    });
    
    process.exit(0);
  });
});

export default app;