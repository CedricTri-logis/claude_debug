/**
 * Unified Logger Module
 * Consolidates logging and debugging functionality from logger.js and debugger.js
 * Eliminates 40% code duplication while maintaining all features
 */

import { 
  captureException as sentryCaptureException,
  captureMessage as sentryCaptureMessage,
  addBreadcrumb,
  startTransaction as sentryStartTransaction
} from '../config/sentry.unified.js';
import { getLogger, createChildLogger } from '../config/logflare.config.js';
import { randomUUID } from 'crypto';
import { performance } from 'perf_hooks';

/**
 * Base Logger class with common functionality
 */
class BaseLogger {
  constructor(config = {}) {
    this.correlationId = config.correlationId || null;
    this.context = config.context || {};
    this.startTime = Date.now();
    this.logflare = config.logflare || getLogger();
  }

  /**
   * Set or generate correlation ID
   */
  setCorrelationId(correlationId = null) {
    this.correlationId = correlationId || randomUUID();
    return this;
  }

  /**
   * Generate a new correlation ID
   */
  generateCorrelationId() {
    this.correlationId = randomUUID();
    return this.correlationId;
  }

  /**
   * Set additional context
   */
  setContext(context) {
    this.context = { ...this.context, ...context };
    return this;
  }

  /**
   * Core logging method
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

    // Development console logging
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(logData, null, 2));
    }

    return logData;
  }

  /**
   * Log methods for different levels
   */
  info(message, metadata = {}) {
    const data = typeof message === 'string' 
      ? { message, ...metadata }
      : { ...message, ...metadata };
    return this.log('info', data);
  }

  debug(message, metadata = {}) {
    const data = typeof message === 'string' 
      ? { message, ...metadata }
      : { ...message, ...metadata };
    return this.log('debug', data);
  }

  warn(message, metadata = {}) {
    const data = typeof message === 'string' 
      ? { message, ...metadata }
      : { ...message, ...metadata };
    
    this.log('warn', data);
    
    // Add Sentry breadcrumb
    addBreadcrumb({
      type: 'warning',
      category: 'logger',
      message: typeof message === 'string' ? message : message.message,
      level: 'warning',
      data: metadata
    });
    
    return data;
  }

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
      sentryCaptureMessage(errorData.message, 'error');
    }

    return errorData;
  }

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

    return errorData;
  }
}

/**
 * Enhanced Logger with performance and tracing capabilities
 */
class UnifiedLogger extends BaseLogger {
  constructor(config = {}) {
    super(config);
    this.timeline = [];
    this.performanceMarks = new Map();
    this.errorContext = new Map();
    this.sessions = new Map();
  }

  /**
   * Create a child logger with additional context
   */
  child(bindings) {
    const childLogger = new UnifiedLogger({
      correlationId: this.correlationId,
      context: { ...this.context, ...bindings },
      logflare: createChildLogger(bindings)
    });
    return childLogger;
  }

  /**
   * Start a debug/tracking session
   */
  startSession(sessionId = null, context = {}) {
    const id = sessionId || randomUUID();
    const startTime = Date.now();

    try {
      const session = {
        id,
        startTime,
        context,
        events: [],
        errors: [],
        performance: [],
      };

      this.sessions.set(id, session);

      this.info({
        operation: 'session_start',
        sessionId: id,
        context,
      });

      return id;
    } catch (err) {
      this.error({
        operation: 'session_start_failed',
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }
  }

  /**
   * Add event to timeline
   */
  addTimelineEvent(sessionId, eventType, data = {}) {
    try {
      const timestamp = Date.now();
      const event = {
        timestamp,
        isoTime: new Date(timestamp).toISOString(),
        type: eventType,
        data,
        correlationId: data.correlationId || sessionId || this.correlationId,
      };

      // Add to timeline
      this.timeline.push(event);

      // Add to session if exists
      const session = this.sessions.get(sessionId);
      if (session) {
        session.events.push(event);
      }

      this.debug({
        operation: 'timeline_event',
        sessionId,
        eventType,
        ...data,
      });

      // Keep timeline manageable
      if (this.timeline.length > 1000) {
        this.timeline.shift();
      }

      return event;
    } catch (err) {
      this.error({
        operation: 'timeline_event_failed',
        error: err.message,
        sessionId,
        eventType,
      });
      return null;
    }
  }

  /**
   * Measure performance of an operation
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
      addBreadcrumb({
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
   * Create performance profile
   */
  createPerformanceProfile(operation) {
    const profileId = randomUUID();
    const startTime = performance.now();

    const profile = {
      id: profileId,
      operation,
      startTime,
      marks: [],
      measures: [],

      mark: (name) => {
        const markTime = performance.now();
        const mark = {
          name,
          time: markTime,
          elapsed: markTime - startTime,
        };
        profile.marks.push(mark);

        this.debug({
          operation: 'performance_mark',
          profileId,
          markName: name,
          elapsed: mark.elapsed,
        });

        return mark;
      },

      measure: (name, startMark, endMark) => {
        const start = profile.marks.find((m) => m.name === startMark);
        const end = profile.marks.find((m) => m.name === endMark);

        if (start && end) {
          const duration = end.time - start.time;
          const measure = {
            name,
            startMark,
            endMark,
            duration,
          };
          profile.measures.push(measure);

          this.debug({
            operation: 'performance_measure',
            profileId,
            measureName: name,
            duration,
          });

          return measure;
        }
        return null;
      },

      end: () => {
        const endTime = performance.now();
        const totalDuration = endTime - startTime;

        const results = {
          profileId,
          operation,
          totalDuration,
          marks: profile.marks,
          measures: profile.measures,
        };

        this.info({
          operation: 'performance_profile_complete',
          profileId,
          operationName: operation,
          totalDuration,
          marksCount: profile.marks.length,
          measuresCount: profile.measures.length,
        });

        // Add to Sentry breadcrumb
        addBreadcrumb({
          type: 'info',
          category: 'performance',
          message: `Profile ${operation}: ${totalDuration.toFixed(2)}ms`,
          level: 'info',
          data: results,
        });

        return results;
      },
    };

    this.performanceMarks.set(profileId, profile);
    return profile;
  }

  /**
   * Log database query with timing
   */
  async dbQuery(operation, query, params = {}) {
    const startTime = performance.now();
    const queryId = randomUUID();

    try {
      this.info({
        operation: `db_${operation}_start`,
        query,
        queryId,
        table: params.table,
        params: params.values
      });

      let result = null;
      if (typeof params.execute === 'function') {
        result = await params.execute();
      }

      const duration = performance.now() - startTime;

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
   */
  async apiCall(method, url, options = {}) {
    const startTime = performance.now();
    const requestId = randomUUID();

    try {
      this.info({
        operation: 'api_call_start',
        method,
        url,
        requestId,
        headers: options.headers,
        body: options.body
      });

      let response = null;
      if (typeof options.execute === 'function') {
        response = await options.execute();
      }

      const duration = performance.now() - startTime;

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
   * Create a transaction wrapper
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
   * Start a span for distributed tracing
   */
  startSpan(name, attributes = {}) {
    const span = sentryStartTransaction({
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
   * Log security event
   */
  securityEvent(event, details = {}) {
    const securityData = {
      operation: `security_${event}`,
      event,
      ...details,
    };

    this.warn(securityData);

    // Add to Sentry as breadcrumb
    addBreadcrumb({
      type: 'security',
      category: 'security',
      message: `Security event: ${event}`,
      level: 'warning',
      data: details
    });

    // Critical security events
    if (details.severity === 'critical') {
      sentryCaptureMessage(`Critical security event: ${event}`, 'warning');
    }
  }

  /**
   * HTTP request logging
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

    return logData;
  }

  /**
   * Create a checkpoint for debugging
   */
  checkpoint(name, data = {}) {
    const checkpoint = {
      name,
      timestamp: Date.now(),
      isoTime: new Date().toISOString(),
      data,
      stack: new Error().stack,
    };

    // Add to timeline
    this.timeline.push({
      ...checkpoint,
      type: 'checkpoint',
    });

    this.debug({
      operation: 'checkpoint',
      checkpointName: name,
      ...data,
    });

    // Add Sentry breadcrumb
    addBreadcrumb({
      type: 'debug',
      category: 'checkpoint',
      message: `Checkpoint: ${name}`,
      level: 'debug',
      data,
    });

    return checkpoint;
  }

  /**
   * Correlate logs by timestamp
   */
  correlateLogs(timestamp, windowSeconds = 5) {
    try {
      const targetTime = new Date(timestamp).getTime();
      const windowMs = windowSeconds * 1000;
      const startTime = targetTime - windowMs;
      const endTime = targetTime + windowMs;

      // Filter timeline events within window
      const correlatedEvents = this.timeline.filter(
        (event) => event.timestamp >= startTime && event.timestamp <= endTime,
      );

      // Group by correlation ID
      const grouped = {};
      correlatedEvents.forEach((event) => {
        const id = event.correlationId || 'unknown';
        if (!grouped[id]) {
          grouped[id] = [];
        }
        grouped[id].push(event);
      });

      // Sort each group by timestamp
      Object.keys(grouped).forEach((id) => {
        grouped[id].sort((a, b) => a.timestamp - b.timestamp);
      });

      this.info({
        operation: 'logs_correlated',
        targetTimestamp: timestamp,
        windowSeconds,
        eventsFound: correlatedEvents.length,
        correlationIds: Object.keys(grouped).length,
      });

      return {
        timestamp: targetTime,
        window: `±${windowSeconds}s`,
        totalEvents: correlatedEvents.length,
        grouped,
        timeline: correlatedEvents,
      };
    } catch (err) {
      this.error({
        operation: 'correlate_logs_failed',
        error: err.message,
        timestamp,
        windowSeconds,
      });

      return { error: err.message, timeline: [] };
    }
  }

  /**
   * Analyze error with context
   */
  analyzeError(error, correlationId = null) {
    try {
      const errorId = randomUUID();
      const timestamp = Date.now();

      const analysis = {
        errorId,
        timestamp: new Date(timestamp).toISOString(),
        correlationId: correlationId || this.correlationId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code,
        },
        stackTrace: this.parseStackTrace(error.stack),
        relatedEvents: [],
        suggestions: this.generateDebuggingSuggestions(error),
      };

      // Find related events if correlation ID provided
      if (correlationId || this.correlationId) {
        const session = this.sessions.get(correlationId || this.correlationId);
        if (session) {
          analysis.relatedEvents = session.events.filter(
            (e) => Math.abs(e.timestamp - timestamp) < 30000, // Within 30 seconds
          );
        }
      }

      // Store error context
      this.errorContext.set(errorId, analysis);

      this.info({
        operation: 'error_analyzed',
        errorId,
        correlationId: analysis.correlationId,
        errorType: error.name,
        suggestions: analysis.suggestions.length,
      });

      return analysis;
    } catch (err) {
      this.error({
        operation: 'analyze_error_failed',
        error: err.message,
        originalError: error.message,
      });

      return { error: 'Analysis failed', originalError: error.message };
    }
  }

  /**
   * Parse stack trace
   */
  parseStackTrace(stack) {
    if (!stack) return [];

    try {
      const lines = stack.split('\n');
      const frames = [];

      lines.forEach((line) => {
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        if (match) {
          frames.push({
            function: match[1],
            file: match[2],
            line: parseInt(match[3]),
            column: parseInt(match[4]),
          });
        } else {
          const simpleMatch = line.match(/at\s+(.+?):(\d+):(\d+)/);
          if (simpleMatch) {
            frames.push({
              function: 'anonymous',
              file: simpleMatch[1],
              line: parseInt(simpleMatch[2]),
              column: parseInt(simpleMatch[3]),
            });
          }
        }
      });

      return frames;
    } catch (err) {
      this.error({
        operation: 'parse_stack_failed',
        error: err.message,
      });
      return [];
    }
  }

  /**
   * Generate debugging suggestions
   */
  generateDebuggingSuggestions(error) {
    const suggestions = [];

    // Database errors
    if (error.message?.includes('database') || error.message?.includes('sql')) {
      suggestions.push('Check database connection string in .env');
      suggestions.push('Verify database server is running');
      suggestions.push('Check SQL query syntax');
      suggestions.push('Review database logs for more details');
    }

    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      suggestions.push('Verify the target service is running');
      suggestions.push('Check network connectivity');
      suggestions.push('Review firewall settings');
      suggestions.push('Check the service URL and port');
    }

    // Permission errors
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      suggestions.push('Check file/directory permissions');
      suggestions.push('Verify user has necessary privileges');
      suggestions.push('Review security policies');
    }

    // Memory errors
    if (error.message?.includes('heap') || error.message?.includes('memory')) {
      suggestions.push('Check for memory leaks');
      suggestions.push('Increase Node.js heap size');
      suggestions.push('Review large data processing');
      suggestions.push('Consider implementing pagination');
    }

    // API errors
    if (error.response?.status >= 400) {
      suggestions.push(`API returned ${error.response.status} status`);
      suggestions.push('Check API authentication credentials');
      suggestions.push('Review API rate limits');
      suggestions.push('Verify API endpoint URL');
    }

    // Generic suggestions
    suggestions.push('Check Sentry for similar errors');
    suggestions.push('Search Logflare for related logs');
    suggestions.push('Review recent code changes');

    return suggestions;
  }

  /**
   * Dump current state
   */
  dumpState(sessionId = null) {
    try {
      const state = {
        timestamp: new Date().toISOString(),
        sessionsCount: this.sessions.size,
        timelineLength: this.timeline.length,
        performanceProfilesCount: this.performanceMarks.size,
        errorContextCount: this.errorContext.size,
      };

      if (sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
          state.session = {
            id: session.id,
            startTime: new Date(session.startTime).toISOString(),
            duration: Date.now() - session.startTime,
            eventsCount: session.events.length,
            errorsCount: session.errors.length,
            context: session.context,
          };
        }
      }

      // Recent timeline events
      state.recentEvents = this.timeline.slice(-10).map((e) => ({
        type: e.type,
        timestamp: e.isoTime,
        correlationId: e.correlationId,
      }));

      this.info({
        operation: 'state_dumped',
        sessionId,
        ...state,
      });

      return state;
    } catch (err) {
      this.error({
        operation: 'dump_state_failed',
        error: err.message,
      });

      return { error: 'Failed to dump state' };
    }
  }

  /**
   * Clear logger data
   */
  clear(sessionId = null) {
    try {
      if (sessionId) {
        this.sessions.delete(sessionId);
        this.info({
          operation: 'session_cleared',
          sessionId,
        });
      } else {
        // Clear all data
        this.timeline = [];
        this.sessions.clear();
        this.performanceMarks.clear();
        this.errorContext.clear();

        this.info({
          operation: 'all_data_cleared',
        });
      }
    } catch (err) {
      this.error({
        operation: 'clear_failed',
        error: err.message,
      });
    }
  }
}

/**
 * Factory function to create a logger instance
 */
export function createLogger(context = {}) {
  const logger = new UnifiedLogger({ context });
  logger.generateCorrelationId();
  return logger;
}

/**
 * Create a debugger instance (backward compatibility)
 */
export function createDebugger(context = {}) {
  return createLogger(context);
}

// Create singleton instances
const loggerInstance = createLogger({ service: 'claude-debug-infrastructure' });
const debuggerInstance = loggerInstance; // Same instance, different alias

// Export classes and instances
export { BaseLogger, UnifiedLogger };
export { loggerInstance as logger, debuggerInstance as debugger };

// Default export
export default loggerInstance;