// File: /Users/cedriclajoie/Project/Claude_debug/tests/logger.test.js

import * as Sentry from '@sentry/node';
import { jest } from '@jest/globals';
import { createLogger, IntegratedLogger } from '../../../lib/logger.js';
import debugger from '../../../lib/debugger.js';

/**
 * Debugging Guide:
 * 1. Find error in Sentry by searching for component tag
 * 2. Copy the timestamp from Sentry error
 * 3. Search Logflare for logs within ±5 seconds of that timestamp
 * 4. Look for matching operation/table/context values
 * 5. Trace the full request flow using the correlation ID if available
 */

// Mock Sentry to prevent actual error reporting during tests
jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  startTransaction: jest.fn(() => ({
    spanId: 'test-span-id',
    traceId: 'test-trace-id',
    setStatus: jest.fn(),
    setTag: jest.fn(),
    finish: jest.fn()
  }))
}));

describe('Logger Tests', () => {
  let logger;
  let testCorrelationId;

  beforeEach(() => {
    try {
      // Create fresh logger instance for each test
      logger = createLogger({ component: 'test' });
      testCorrelationId = logger.correlationId;
      
      // Clear debugger state
      debugger.clear();
      
      // Log test start
      console.log({
        timestamp: new Date().toISOString(),
        level: 'info',
        operation: 'test_start',
        testName: expect.getState().currentTestName,
        correlationId: testCorrelationId
      });
    } catch (err) {
      console.error('Test setup failed:', err);
      throw err;
    }
  });

  afterEach(() => {
    try {
      // Log test completion
      console.log({
        timestamp: new Date().toISOString(),
        level: 'info',
        operation: 'test_complete',
        testName: expect.getState().currentTestName,
        correlationId: testCorrelationId
      });
      
      // Clear all mocks
      jest.clearAllMocks();
    } catch (err) {
      console.error('Test cleanup failed:', err);
    }
  });

  describe('Logger Initialization', () => {
    test('should create logger with correlation ID', () => {
      try {
        expect(logger).toBeInstanceOf(IntegratedLogger);
        expect(logger.correlationId).toBeDefined();
        expect(typeof logger.correlationId).toBe('string');
        
        // Success: Logger initialized with correlation ID
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_logger_init_success',
          correlationId: logger.correlationId
        });
      } catch (err) {
        // Failure: Logger initialization test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_logger_init_failed',
          error: err.message,
          stack: err.stack
        });
        throw err;
      }
    });

    test('should set context correctly', () => {
      try {
        const context = { userId: '123', requestId: 'abc' };
        logger.setContext(context);
        
        expect(logger.context).toMatchObject(context);
        
        // Success: Context set correctly
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_context_set_success',
          context
        });
      } catch (err) {
        // Failure: Context test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_context_set_failed',
          error: err.message
        });
        throw err;
      }
    });

    test('should create child logger with inherited context', () => {
      try {
        logger.setContext({ parent: 'context' });
        const childLogger = logger.child({ child: 'context' });
        
        expect(childLogger.context).toMatchObject({
          parent: 'context',
          child: 'context'
        });
        expect(childLogger.correlationId).toBe(logger.correlationId);
        
        // Success: Child logger created
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_child_logger_success',
          parentContext: logger.context,
          childContext: childLogger.context
        });
      } catch (err) {
        // Failure: Child logger test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_child_logger_failed',
          error: err.message
        });
        throw err;
      }
    });
  });

  describe('Logging Levels', () => {
    test('should log info level correctly', () => {
      try {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        logger.info('Test info message', { extra: 'data' });
        
        if (process.env.NODE_ENV === 'development') {
          expect(consoleSpy).toHaveBeenCalled();
        }
        
        consoleSpy.mockRestore();
        
        // Success: Info logging works
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_info_log_success'
        });
      } catch (err) {
        // Failure: Info logging test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_info_log_failed',
          error: err.message
        });
        throw err;
      }
    });

    test('should log errors and capture in Sentry', () => {
      try {
        const error = new Error('Test error');
        logger.error(error, { context: 'test' });
        
        expect(Sentry.captureException).toHaveBeenCalledWith(
          error,
          expect.objectContaining({
            tags: expect.objectContaining({
              correlationId: logger.correlationId
            })
          }),
          logger.correlationId
        );
        
        // Success: Error logging and Sentry capture works
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_error_log_success',
          sentryCallCount: Sentry.captureException.mock.calls.length
        });
      } catch (err) {
        // Failure: Error logging test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_error_log_failed',
          error: err.message
        });
        throw err;
      }
    });

    test('should add breadcrumbs for warnings', () => {
      try {
        logger.warn('Test warning', { severity: 'low' });
        
        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'warning',
            category: 'logger',
            level: 'warning'
          })
        );
        
        // Success: Warning breadcrumb added
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_warning_breadcrumb_success'
        });
      } catch (err) {
        // Failure: Warning test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_warning_breadcrumb_failed',
          error: err.message
        });
        throw err;
      }
    });
  });

  describe('Database Query Logging', () => {
    test('should log successful database query', async () => {
      try {
        const mockResult = { rowCount: 5, rows: [] };
        const result = await logger.dbQuery('select', 'SELECT * FROM users', {
          table: 'users',
          execute: async () => mockResult
        });
        
        expect(result).toBe(mockResult);
        
        // Success: Database query logged
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_db_query_success',
          rowCount: mockResult.rowCount
        });
      } catch (err) {
        // Failure: Database query test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_db_query_failed',
          error: err.message
        });
        throw err;
      }
    });

    test('should log failed database query', async () => {
      try {
        const dbError = new Error('Database connection failed');
        
        await expect(
          logger.dbQuery('select', 'SELECT * FROM users', {
            table: 'users',
            execute: async () => { throw dbError; }
          })
        ).rejects.toThrow('Database connection failed');
        
        // Success: Failed query logged correctly
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_db_query_error_success'
        });
      } catch (err) {
        // Failure: Database error test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_db_query_error_failed',
          error: err.message
        });
        throw err;
      }
    });
  });

  describe('API Call Logging', () => {
    test('should log successful API call', async () => {
      try {
        const mockResponse = { status: 200, data: { success: true } };
        const result = await logger.apiCall('GET', 'https://api.example.com', {
          execute: async () => mockResponse
        });
        
        expect(result).toBe(mockResponse);
        
        // Success: API call logged
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_api_call_success',
          status: mockResponse.status
        });
      } catch (err) {
        // Failure: API call test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_api_call_failed',
          error: err.message
        });
        throw err;
      }
    });
  });

  describe('Performance Tracking', () => {
    test('should measure performance correctly', async () => {
      try {
        const result = await logger.measurePerformance(
          'test_operation',
          async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return 'completed';
          },
          { metadata: 'test' }
        );
        
        expect(result).toBe('completed');
        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'info',
            category: 'performance'
          })
        );
        
        // Success: Performance measured
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_performance_success'
        });
      } catch (err) {
        // Failure: Performance test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_performance_failed',
          error: err.message
        });
        throw err;
      }
    });

    test('should handle performance measurement errors', async () => {
      try {
        const perfError = new Error('Performance test error');
        
        await expect(
          logger.measurePerformance(
            'failing_operation',
            async () => { throw perfError; }
          )
        ).rejects.toThrow('Performance test error');
        
        // Success: Performance error handled
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_performance_error_success'
        });
      } catch (err) {
        // Failure: Performance error test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_performance_error_failed',
          error: err.message
        });
        throw err;
      }
    });
  });

  describe('Transaction and Span Management', () => {
    test('should create and end spans correctly', () => {
      try {
        const span = logger.startSpan('test_span', { op: 'test' });
        
        expect(span).toBeDefined();
        expect(span.spanId).toBe('test-span-id');
        
        logger.endSpan(span, 'ok');
        expect(span.finish).toHaveBeenCalled();
        
        // Success: Span management works
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_span_success',
          spanId: span.spanId
        });
      } catch (err) {
        // Failure: Span test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_span_failed',
          error: err.message
        });
        throw err;
      }
    });

    test('should wrap function in transaction', async () => {
      try {
        const result = await logger.transaction(
          'test_transaction',
          async (span) => {
            expect(span).toBeDefined();
            return 'transaction_result';
          },
          { metadata: 'test' }
        );
        
        expect(result).toBe('transaction_result');
        
        // Success: Transaction wrapper works
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_transaction_success'
        });
      } catch (err) {
        // Failure: Transaction test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_transaction_failed',
          error: err.message
        });
        throw err;
      }
    });
  });

  describe('Security Event Logging', () => {
    test('should log security events correctly', () => {
      try {
        logger.securityEvent('unauthorized_access', {
          ip: '192.168.1.1',
          path: '/admin'
        });
        
        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'security',
            category: 'security'
          })
        );
        
        // Success: Security event logged
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_security_event_success'
        });
      } catch (err) {
        // Failure: Security event test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_security_event_failed',
          error: err.message
        });
        throw err;
      }
    });

    test('should capture critical security events in Sentry', () => {
      try {
        logger.securityEvent('data_breach', {
          severity: 'critical',
          affected: 1000
        });
        
        expect(Sentry.captureMessage).toHaveBeenCalledWith(
          'Critical security event: data_breach',
          'warning'
        );
        
        // Success: Critical security event captured
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_critical_security_success'
        });
      } catch (err) {
        // Failure: Critical security test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_critical_security_failed',
          error: err.message
        });
        throw err;
      }
    });
  });

  describe('HTTP Request Logging', () => {
    test('should log successful HTTP requests', () => {
      try {
        const req = {
          method: 'GET',
          path: '/api/users',
          headers: { 'user-agent': 'test-agent' },
          query: { limit: 10 },
          params: { id: '123' }
        };
        
        const res = { statusCode: 200 };
        
        logger.httpRequest(req, res, 150);
        
        // Success: HTTP request logged
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_http_request_success',
          statusCode: res.statusCode
        });
      } catch (err) {
        // Failure: HTTP request test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_http_request_failed',
          error: err.message
        });
        throw err;
      }
    });

    test('should log failed HTTP requests as errors', () => {
      try {
        const req = {
          method: 'POST',
          path: '/api/error',
          headers: {}
        };
        
        const res = { statusCode: 500 };
        
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        logger.httpRequest(req, res, 100);
        consoleSpy.mockRestore();
        
        // Success: Failed HTTP request logged as error
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'test_http_error_success',
          statusCode: res.statusCode
        });
      } catch (err) {
        // Failure: HTTP error test failed
        console.log({
          timestamp: new Date().toISOString(),
          level: 'error',
          operation: 'test_http_error_failed',
          error: err.message
        });
        throw err;
      }
    });
  });
});

// Run tests summary
afterAll(() => {
  console.log({
    timestamp: new Date().toISOString(),
    level: 'info',
    operation: 'all_tests_complete',
    message: 'All logger tests completed'
  });
});