// File: /Users/cedriclajoie/Project/Claude_debug/lib/logger.js

import * as Sentry from '@sentry/node';
import { getLogger, createChildLogger } from '../config/logflare.config.js';
import { captureException as sentryCaptureException } from '../config/sentry.config.js';
import { randomUUID } from 'crypto';
import { performance } from 'perf_hooks';

/**
 * Debugging Guide:
 * 1. Find error in Sentry by searching for component tag
 * 2. Copy the timestamp from Sentry error
 * 3. Search Logflare for logs within ±5 seconds of that timestamp
 * 4. Look for matching operation/table/context values
 * 5. Trace the full request flow using the correlation ID if available
 */

/**
 * Main Logger class that integrates Sentry and Logflare
 */
class IntegratedLogger {
  constructor() {
    this.logflare = getLogger();
    this.correlationId = null;
    this.context = {};
    this.startTime = Date.now();
  }

  /**
   * Set correlation ID for the logger instance
   * @param {string} correlationId - Correlation ID for tracing
   */
  setCorrelationId(correlationId) {
    this.correlationId = correlationId || randomUUID();
    return this;
  }

  /**
   * Generate a new correlation ID
   * @returns {string} New correlation ID
   */
  generateCorrelationId() {
    this.correlationId = randomUUID();
    return this.correlationId;
  }

  /**
   * Set additional context for all logs
   * @param {Object} context - Context to add to logs
   */
  setContext(context) {
    this.context = { ...this.context, ...context };
    return this;
  }

  /**
   * Create a child logger with additional context
   * @param {Object} bindings - Additional context
   * @returns {IntegratedLogger} Child logger instance
   */
  child(bindings) {
    const childLogger = new IntegratedLogger();
    childLogger.logflare = createChildLogger(bindings);
    childLogger.correlationId = this.correlationId;
    childLogger.context = { ...this.context, ...bindings };
    return childLogger;
  }

  /**
   * Log with level and structured data
   * @param {string} level - Log level
   * @param {Object} data - Log data
   */
  log(level, data) {
    const logData = {
      ...data,
      correlationId: this.correlationId,
      ...this.context,
      timestamp: new Date().toISOString()
    };

    // Log to Logflare
    this.logflare[level](logData);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(logData, null, 2));
    }
  }

  /**
   * Info level logging
   * @param {string|Object} message - Message or data to log
   * @param {Object} metadata - Additional metadata
   */
  info(message, metadata = {}) {
    const data = typeof message === 'string' 
      ? { message, ...metadata }
      : { ...message, ...metadata };
    
    this.log('info', data);
  }

  /**
   * Debug level logging
   * @param {string|Object} message - Message or data to log
   * @param {Object} metadata - Additional metadata
   */
  debug(message, metadata = {}) {
    const data = typeof message === 'string' 
      ? { message, ...metadata }
      : { ...message, ...metadata };
    
    this.log('debug', data);
  }

  /**
   * Warning level logging
   * @param {string|Object} message - Message or data to log
   * @param {Object} metadata - Additional metadata
   */
  warn(message, metadata = {}) {
    const data = typeof message === 'string' 
      ? { message, ...metadata }
      : { ...message, ...metadata };
    
    this.log('warn', data);
    
    // Add breadcrumb to Sentry
    Sentry.addBreadcrumb({
      type: 'warning',
      category: 'logger',
      message: typeof message === 'string' ? message : message.message,
      level: 'warning',
      data: metadata
    });
  }

  /**
   * Error level logging with Sentry integration
   * @param {string|Error|Object} error - Error or message to log
   * @param {Object} metadata - Additional metadata
   */
  error(error, metadata = {}) {
    const isError = error instanceof Error;
    const errorData = {
      message: isError ? error.message : (error.message || error),
      stack: isError ? error.stack : undefined,
      code: isError ? error.code : undefined,
      ...(!isError && typeof error === 'object' ? error : {}),
      ...metadata
    };

    // Log to Logflare
    this.log('error', errorData);

    // Capture in Sentry
    if (isError) {
      sentryCaptureException(error, {
        tags: {
          ...this.context,
          correlationId: this.correlationId
        },
        extra: metadata
      }, this.correlationId);
    } else {
      Sentry.captureMessage(errorData.message, 'error');
    }
  }

  /**
   * Fatal level logging
   * @param {string|Error|Object} error - Fatal error
   * @param {Object} metadata - Additional metadata
   */
  fatal(error, metadata = {}) {
    const errorData = {
      level: 'fatal',
      ...(typeof error === 'object' ? error : { message: error }),
      ...metadata
    };

    this.log('fatal', errorData);
    
    // Always capture fatal errors in Sentry
    const err = error instanceof Error ? error : new Error(error.message || error);
    sentryCaptureException(err, {
      level: 'fatal',
      tags: this.context,
      extra: metadata
    }, this.correlationId);
  }

  /**
   * Log database query with timing
   * @param {string} operation - Database operation type
   * @param {string} query - SQL query or operation description
   * @param {Object} params - Query parameters
   */
  async dbQuery(operation, query, params = {}) {
    const startTime = performance.now();
    const queryId = randomUUID();

    try {
      // Log query start
      this.info({
        operation: `db_${operation}_start`,
        query,
        queryId,
        table: params.table,
        params: params.values
      });

      // Execute the provided function if passed
      let result = null;
      if (typeof params.execute === 'function') {
        result = await params.execute();
      }

      const duration = performance.now() - startTime;

      // Success: Log query completion
      this.info({
        operation: `db_${operation}_success`,
        query,
        queryId,
        table: params.table,
        duration,
        rowCount: result?.rowCount || result?.length || 0
      });

      return result;

    } catch (err) {
      const duration = performance.now() - startTime;

      // Failure: Log query error
      this.error({
        operation: `db_${operation}_failed`,
        query,
        queryId,
        table: params.table,
        duration,
        error: err.message,
        stack: err.stack
      });

      throw err;
    }
  }

  /**
   * Log API call with timing
   * @param {string} method - HTTP method
   * @param {string} url - API endpoint URL
   * @param {Object} options - Request options
   */
  async apiCall(method, url, options = {}) {
    const startTime = performance.now();
    const requestId = randomUUID();

    try {
      // Log API call start
      this.info({
        operation: 'api_call_start',
        method,
        url,
        requestId,
        headers: options.headers,
        body: options.body
      });

      // Execute the provided function if passed
      let response = null;
      if (typeof options.execute === 'function') {
        response = await options.execute();
      }

      const duration = performance.now() - startTime;

      // Success: Log API response
      this.info({
        operation: 'api_call_success',
        method,
        url,
        requestId,
        duration,
        statusCode: response?.status || response?.statusCode,
        headers: response?.headers
      });

      return response;

    } catch (err) {
      const duration = performance.now() - startTime;

      // Failure: Log API error
      this.error({
        operation: 'api_call_failed',
        method,
        url,
        requestId,
        duration,
        error: err.message,
        stack: err.stack
      });

      throw err;
    }
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {Function} fn - Function to measure
   * @param {Object} metadata - Additional metadata
   */
  async measurePerformance(operation, fn, metadata = {}) {
    const startTime = performance.now();
    const perfId = randomUUID();

    try {
      this.debug({
        operation: `perf_${operation}_start`,
        perfId,
        ...metadata
      });

      const result = await fn();

      const duration = performance.now() - startTime;

      this.info({
        operation: `perf_${operation}_complete`,
        perfId,
        duration,
        ...metadata
      });

      // Add performance breadcrumb to Sentry
      Sentry.addBreadcrumb({
        type: 'info',
        category: 'performance',
        message: `${operation} completed in ${duration}ms`,
        level: 'info',
        data: { duration, ...metadata }
      });

      return result;

    } catch (err) {
      const duration = performance.now() - startTime;

      this.error({
        operation: `perf_${operation}_failed`,
        perfId,
        duration,
        error: err.message,
        ...metadata
      });

      throw err;
    }
  }

  /**
   * Start a span for distributed tracing
   * @param {string} name - Span name
   * @param {Object} attributes - Span attributes
   * @returns {Object} Span object
   */
  startSpan(name, attributes = {}) {
    const span = Sentry.startTransaction({
      name,
      op: attributes.op || 'function',
      tags: {
        correlationId: this.correlationId,
        ...attributes
      }
    });

    this.debug({
      operation: 'span_started',
      spanName: name,
      spanId: span.spanId,
      traceId: span.traceId,
      ...attributes
    });

    return span;
  }

  /**
   * End a span
   * @param {Object} span - Span to end
   * @param {string} status - Span status
   */
  endSpan(span, status = 'ok') {
    if (span && span.finish) {
      span.setStatus(status);
      span.finish();

      this.debug({
        operation: 'span_ended',
        spanId: span.spanId,
        traceId: span.traceId,
        status
      });
    }
  }

  /**
   * Create a transaction wrapper for automatic span management
   * @param {string} name - Transaction name
   * @param {Function} fn - Function to wrap
   * @param {Object} metadata - Additional metadata
   */
  async transaction(name, fn, metadata = {}) {
    const span = this.startSpan(name, metadata);

    try {
      const result = await fn(span);
      this.endSpan(span, 'ok');
      return result;
    } catch (err) {
      this.endSpan(span, 'internal_error');
      throw err;
    }
  }

  /**
   * Log security event
   * @param {string} event - Security event type
   * @param {Object} details - Event details
   */
  securityEvent(event, details = {}) {
    const securityData = {
      operation: `security_${event}`,
      event,
      ...details,
      timestamp: new Date().toISOString()
    };

    // Log as warning
    this.warn(securityData);

    // Add to Sentry as breadcrumb
    Sentry.addBreadcrumb({
      type: 'security',
      category: 'security',
      message: `Security event: ${event}`,
      level: 'warning',
      data: details
    });

    // If it's a critical security event, also capture in Sentry
    if (details.severity === 'critical') {
      Sentry.captureMessage(`Critical security event: ${event}`, 'warning');
    }
  }

  /**
   * Structured logging for HTTP requests
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {number} duration - Request duration
   */
  httpRequest(req, res, duration) {
    const logData = {
      operation: 'http_request',
      method: req.method,
      path: req.path || req.url,
      statusCode: res.statusCode,
      duration,
      correlationId: req.headers?.['x-correlation-id'] || this.correlationId,
      userAgent: req.headers?.['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
      query: req.query,
      params: req.params
    };

    if (res.statusCode >= 500) {
      this.error(logData);
    } else if (res.statusCode >= 400) {
      this.warn(logData);
    } else {
      this.info(logData);
    }
  }
}

/**
 * Create a new logger instance
 * @param {Object} context - Initial context for the logger
 * @returns {IntegratedLogger} Logger instance
 */
export function createLogger(context = {}) {
  const logger = new IntegratedLogger();
  logger.setContext(context);
  logger.generateCorrelationId();
  return logger;
}

/**
 * Global logger instance
 */
export const logger = createLogger({
  service: 'claude-debug-infrastructure'
});

// Export the logger class for extension
export { IntegratedLogger };

// Default export
export default logger;