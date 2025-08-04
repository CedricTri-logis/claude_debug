// File: /Users/cedriclajoie/Project/Claude_debug/config/sentry.config.js

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
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

/**
 * Initialize Sentry with comprehensive configuration
 * @returns {boolean} True if initialization successful
 */
export function initializeSentry() {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  
  try {
    // Log initialization start
    console.log({
      timestamp: new Date().toISOString(),
      correlationId,
      level: 'info',
      operation: 'sentry_init_start',
      component: 'sentry-config',
      config: {
        dsn: process.env.SENTRY_DSN ? 'configured' : 'missing',
        environment: process.env.SENTRY_ENVIRONMENT || 'development'
      }
    });

    // Check if Sentry is enabled
    if (process.env.ENABLE_SENTRY !== 'true') {
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'warn',
        operation: 'sentry_init_skipped',
        component: 'sentry-config',
        reason: 'ENABLE_SENTRY is not true'
      });
      return false;
    }

    // Initialize Sentry
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || 'development',
      release: process.env.SENTRY_RELEASE || '1.0.0',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0'),
      debug: process.env.SENTRY_DEBUG === 'true',
      
      // Integrations
      integrations: [
        // HTTP integration for tracing
        new Sentry.Integrations.Http({
          tracing: true,
          breadcrumbs: true
        }),
        
        // Console integration
        new Sentry.Integrations.Console(),
        
        // Context lines in stack traces
        new Sentry.Integrations.ContextLines({
          frameContextLines: 5
        }),
        
        // Linked errors
        new Sentry.Integrations.LinkedErrors({
          key: 'cause',
          limit: 5
        }),
        
        // Performance profiling
        new ProfilingIntegration()
      ],
      
      // Performance monitoring
      profilesSampleRate: 1.0,
      
      // Before send hook for data sanitization
      beforeSend(event, hint) {
        // Add correlation ID if available
        if (hint.originalException && hint.originalException.correlationId) {
          event.tags = {
            ...event.tags,
            correlationId: hint.originalException.correlationId
          };
        }
        
        // Sanitize sensitive data
        if (event.request) {
          // Remove authorization headers
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
          
          // Sanitize query strings
          if (event.request.query_string) {
            event.request.query_string = sanitizeQueryString(event.request.query_string);
          }
        }
        
        // Log that we're sending to Sentry
        console.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'sentry_event_sending',
          component: 'sentry-config',
          eventId: event.event_id,
          level: event.level,
          errorType: hint.originalException?.name
        });
        
        return event;
      },
      
      // Before send transaction for performance monitoring
      beforeSendTransaction(event) {
        // Add custom tags to all transactions
        event.tags = {
          ...event.tags,
          nodeVersion: process.version,
          service: 'claude-debug-infrastructure'
        };
        return event;
      },
      
      // Transport options
      transportOptions: {
        maxRetries: 3,
        retryDelay: 1000
      }
    });

    // Set initial user context
    Sentry.setUser({
      id: 'system',
      environment: process.env.NODE_ENV || 'development'
    });

    // Set initial tags
    Sentry.setTags({
      service: 'claude-debug-infrastructure',
      version: process.env.SENTRY_RELEASE || '1.0.0',
      nodeVersion: process.version
    });

    // Success: Should log successful initialization
    console.log({
      timestamp: new Date().toISOString(),
      correlationId,
      level: 'info',
      operation: 'sentry_init_success',
      component: 'sentry-config',
      duration: Date.now() - startTime,
      config: {
        environment: process.env.SENTRY_ENVIRONMENT || 'development',
        release: process.env.SENTRY_RELEASE || '1.0.0',
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0')
      }
    });

    return true;

  } catch (err) {
    // Failure: Log initialization error
    console.log({
      timestamp: new Date().toISOString(),
      correlationId,
      level: 'error',
      operation: 'sentry_init_failed',
      component: 'sentry-config',
      error: err.message,
      stack: err.stack,
      duration: Date.now() - startTime
    });

    // Can't use Sentry to report its own initialization failure
    console.error('Failed to initialize Sentry:', err);
    
    return false;
  }
}

/**
 * Sanitize query string to remove sensitive parameters
 * @param {string} queryString - Query string to sanitize
 * @returns {string} Sanitized query string
 */
function sanitizeQueryString(queryString) {
  const sensitiveParams = ['password', 'token', 'key', 'secret', 'auth'];
  const params = new URLSearchParams(queryString);
  
  sensitiveParams.forEach(param => {
    if (params.has(param)) {
      params.set(param, '[REDACTED]');
    }
  });
  
  return params.toString();
}

/**
 * Create a Sentry transaction for performance monitoring
 * @param {string} name - Transaction name
 * @param {string} op - Operation type
 * @returns {Object} Sentry transaction
 */
export function createTransaction(name, op = 'function') {
  try {
    const transaction = Sentry.startTransaction({
      op,
      name,
      tags: {
        source: 'custom'
      }
    });
    
    Sentry.getCurrentHub().configureScope(scope => scope.setSpan(transaction));
    
    return transaction;
  } catch (err) {
    console.log({
      timestamp: new Date().toISOString(),
      level: 'error',
      operation: 'sentry_transaction_create_failed',
      component: 'sentry-config',
      error: err.message,
      transactionName: name
    });
    
    return null;
  }
}

/**
 * Add breadcrumb for better error context
 * @param {Object} breadcrumb - Breadcrumb data
 */
export function addBreadcrumb(breadcrumb) {
  try {
    Sentry.addBreadcrumb({
      timestamp: Date.now() / 1000,
      ...breadcrumb
    });
    
    // Also log to console for correlation
    console.log({
      timestamp: new Date().toISOString(),
      level: 'debug',
      operation: 'sentry_breadcrumb_added',
      component: 'sentry-config',
      breadcrumb
    });
  } catch (err) {
    console.error('Failed to add breadcrumb:', err);
  }
}

/**
 * Capture exception with enhanced context
 * @param {Error} error - Error to capture
 * @param {Object} context - Additional context
 * @param {string} correlationId - Correlation ID for tracing
 */
export function captureException(error, context = {}, correlationId = null) {
  try {
    // Add correlation ID to error if provided
    if (correlationId) {
      error.correlationId = correlationId;
    }
    
    // Capture with context
    Sentry.captureException(error, {
      tags: {
        ...context.tags,
        correlationId
      },
      extra: {
        ...context.extra,
        timestamp: new Date().toISOString()
      },
      level: context.level || 'error'
    });
    
    // Log for correlation
    console.log({
      timestamp: new Date().toISOString(),
      correlationId,
      level: 'error',
      operation: 'sentry_exception_captured',
      component: 'sentry-config',
      error: error.message,
      errorName: error.name,
      context
    });
    
  } catch (err) {
    console.error('Failed to capture exception:', err);
  }
}

/**
 * Flush Sentry events before shutdown
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} Success status
 */
export async function flushSentry(timeout = 2000) {
  try {
    const flushed = await Sentry.flush(timeout);
    
    console.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      operation: 'sentry_flush_complete',
      component: 'sentry-config',
      success: flushed
    });
    
    return flushed;
  } catch (err) {
    console.error('Failed to flush Sentry:', err);
    return false;
  }
}

// Export Sentry instance for direct use
export { Sentry };

// Initialize on module load if in production
if (process.env.NODE_ENV === 'production') {
  initializeSentry();
}