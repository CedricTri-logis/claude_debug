// File: /Users/cedriclajoie/Project/Claude_debug/config/logflare.config.js

import pino from 'pino';
import { createPinoBrowserSend, createWriteStream } from 'pino-logflare';
import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

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

let logflareLogger = null;
let isInitialized = false;

/**
 * Initialize Logflare logger with comprehensive configuration
 * @returns {Object} Configured Logflare logger instance
 */
export function initializeLogflare() {
  const startTime = Date.now();
  const correlationId = randomUUID();
  
  try {
    // Log initialization start
    console.log({
      timestamp: new Date().toISOString(),
      correlationId,
      level: 'info',
      operation: 'logflare_init_start',
      component: 'logflare-config',
      config: {
        apiKey: process.env.LOGFLARE_API_KEY ? 'configured' : 'missing',
        sourceToken: process.env.LOGFLARE_SOURCE_TOKEN ? 'configured' : 'missing'
      }
    });

    // Check if Logflare is enabled
    if (process.env.ENABLE_LOGFLARE !== 'true') {
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'warn',
        operation: 'logflare_init_skipped',
        component: 'logflare-config',
        reason: 'ENABLE_LOGFLARE is not true'
      });
      
      // Return console logger as fallback
      return createConsoleLogger();
    }

    // Validate required environment variables
    if (!process.env.LOGFLARE_API_KEY || !process.env.LOGFLARE_SOURCE_TOKEN) {
      throw new Error('Missing Logflare configuration. Please set LOGFLARE_API_KEY and LOGFLARE_SOURCE_TOKEN');
    }

    // Create Logflare write stream
    const stream = createWriteStream({
      apiKey: process.env.LOGFLARE_API_KEY,
      sourceToken: process.env.LOGFLARE_SOURCE_TOKEN,
      apiBaseUrl: process.env.LOGFLARE_API_BASE_URL || 'https://api.logflare.app',
      size: 10, // Batch size
      interval: 1000, // Flush interval in ms
    });

    // Create Pino logger with Logflare transport
    logflareLogger = pino(
      {
        name: 'claude-debug-infrastructure',
        level: process.env.LOG_LEVEL || 'debug',
        
        // Base context added to all logs
        base: {
          service: 'claude-debug',
          environment: process.env.NODE_ENV || 'development',
          version: process.env.SENTRY_RELEASE || '1.0.0',
          hostname: process.env.HOSTNAME || 'localhost'
        },
        
        // Timestamp configuration
        timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
        
        // Format configuration
        formatters: {
          level: (label) => {
            return { level: label };
          },
          bindings: (bindings) => {
            return {
              pid: bindings.pid,
              hostname: bindings.hostname,
              node_version: process.version
            };
          }
        },
        
        // Serializers for common objects
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
            path: req.path,
            parameters: sanitizeParams(req.params),
            query: sanitizeParams(req.query),
            correlationId: req.headers?.['x-correlation-id'],
            userAgent: req.headers?.['user-agent'],
            ip: req.ip || req.connection?.remoteAddress
          }),
          
          res: (res) => ({
            statusCode: res.statusCode,
            duration: res.responseTime,
            headers: res.getHeaders ? res.getHeaders() : {}
          }),
          
          err: (err) => ({
            type: err.constructor.name,
            message: err.message,
            stack: err.stack,
            code: err.code,
            statusCode: err.statusCode,
            correlationId: err.correlationId
          })
        },
        
        // Redact sensitive fields
        redact: {
          paths: [
            'password',
            'token',
            'authorization',
            'cookie',
            'secret',
            'key',
            'apiKey',
            '*.password',
            '*.token',
            '*.authorization'
          ],
          censor: '[REDACTED]'
        },
        
        // Mixin for adding correlation ID to all logs
        mixin: () => {
          const correlationId = getCorrelationId();
          return correlationId ? { correlationId } : {};
        },
        
        // Pretty print for development
        prettyPrint: process.env.NODE_ENV === 'development' ? {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname'
        } : false
      },
      stream
    );

    // Add custom methods for structured logging
    enhanceLogger(logflareLogger);

    isInitialized = true;

    // Success: Should log successful initialization
    logflareLogger.info({
      operation: 'logflare_init_success',
      component: 'logflare-config',
      duration: Date.now() - startTime,
      correlationId
    });

    return logflareLogger;

  } catch (err) {
    // Failure: Log initialization error
    console.log({
      timestamp: new Date().toISOString(),
      correlationId,
      level: 'error',
      operation: 'logflare_init_failed',
      component: 'logflare-config',
      error: err.message,
      stack: err.stack,
      duration: Date.now() - startTime
    });

    // Capture in Sentry
    Sentry.captureException(err, {
      tags: {
        component: 'logflare-config',
        operation: 'initialization',
        correlationId
      }
    });

    // Return console logger as fallback
    return createConsoleLogger();
  }
}

/**
 * Create a console logger as fallback
 * @returns {Object} Console logger instance
 */
function createConsoleLogger() {
  const logger = pino({
    name: 'claude-debug-console',
    level: process.env.LOG_LEVEL || 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname'
      }
    }
  });
  
  enhanceLogger(logger);
  return logger;
}

/**
 * Enhance logger with custom methods
 * @param {Object} logger - Pino logger instance
 */
function enhanceLogger(logger) {
  // Add database logging method
  logger.dbQuery = function(operation, query, params = {}) {
    const log = {
      operation: `db_${operation}`,
      query: sanitizeQuery(query),
      ...params,
      timestamp: new Date().toISOString()
    };
    
    this.info(log);
  };
  
  // Add API logging method
  logger.apiCall = function(method, url, params = {}) {
    const log = {
      operation: 'api_call',
      method,
      url: sanitizeUrl(url),
      ...params,
      timestamp: new Date().toISOString()
    };
    
    this.info(log);
  };
  
  // Add performance logging method
  logger.performance = function(operation, duration, metadata = {}) {
    const log = {
      operation: `perf_${operation}`,
      duration,
      ...metadata,
      timestamp: new Date().toISOString()
    };
    
    this.info(log);
  };
  
  // Add security event logging
  logger.security = function(event, details = {}) {
    const log = {
      operation: `security_${event}`,
      ...details,
      timestamp: new Date().toISOString()
    };
    
    this.warn(log);
  };
}

/**
 * Sanitize parameters to remove sensitive data
 * @param {Object} params - Parameters to sanitize
 * @returns {Object} Sanitized parameters
 */
function sanitizeParams(params) {
  if (!params) return {};
  
  const sanitized = { ...params };
  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Sanitize SQL query
 * @param {string} query - SQL query to sanitize
 * @returns {string} Sanitized query
 */
function sanitizeQuery(query) {
  if (!query) return '';
  
  // Replace actual values in WHERE clauses with placeholders
  return query
    .replace(/password\s*=\s*'[^']*'/gi, "password='[REDACTED]'")
    .replace(/token\s*=\s*'[^']*'/gi, "token='[REDACTED]'")
    .replace(/key\s*=\s*'[^']*'/gi, "key='[REDACTED]'");
}

/**
 * Sanitize URL to remove sensitive query parameters
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
function sanitizeUrl(url) {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth'];
    
    sensitiveParams.forEach(param => {
      if (params.has(param)) {
        params.set(param, '[REDACTED]');
      }
    });
    
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Get correlation ID from async local storage or generate new one
 * @returns {string} Correlation ID
 */
function getCorrelationId() {
  // In a real application, this would get from AsyncLocalStorage
  // For now, return null to let individual operations set their own
  return null;
}

/**
 * Get the initialized Logflare logger
 * @returns {Object} Logflare logger instance
 */
export function getLogger() {
  if (!logflareLogger) {
    logflareLogger = initializeLogflare();
  }
  return logflareLogger;
}

/**
 * Create a child logger with additional context
 * @param {Object} bindings - Additional context for child logger
 * @returns {Object} Child logger instance
 */
export function createChildLogger(bindings) {
  const logger = getLogger();
  return logger.child(bindings);
}

/**
 * Flush logs before shutdown
 * @returns {Promise<void>}
 */
export async function flushLogs() {
  const logger = getLogger();
  
  if (logger && logger.flush) {
    try {
      await logger.flush();
      console.log({
        timestamp: new Date().toISOString(),
        level: 'info',
        operation: 'logflare_flush_complete',
        component: 'logflare-config'
      });
    } catch (err) {
      console.error('Failed to flush Logflare logs:', err);
    }
  }
}

// Export the logger instance
export default getLogger();