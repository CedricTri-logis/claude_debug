// File: /Users/cedriclajoie/Project/Claude_debug/lib/debugger.js

import * as Sentry from '@sentry/node';
import { logger } from './logger.js';
import { performance } from 'perf_hooks';
import { randomUUID } from 'crypto';

/**
 * Debugging Guide:
 * 1. Find error in Sentry by searching for component tag
 * 2. Copy the timestamp from Sentry error
 * 3. Search Logflare for logs within ±5 seconds of that timestamp
 * 4. Look for matching operation/table/context values
 * 5. Trace the full request flow using the correlation ID if available
 */

/**
 * Debugging utilities for correlating logs and analyzing issues
 */
class DebuggerUtility {
  constructor() {
    this.timeline = [];
    this.correlationMap = new Map();
    this.performanceMarks = new Map();
    this.errorContext = new Map();
  }

  /**
   * Start tracking a debug session
   * @param {string} sessionId - Session identifier
   * @param {Object} context - Initial context
   * @returns {string} Debug session ID
   */
  startSession(sessionId = null, context = {}) {
    const debugSessionId = sessionId || randomUUID();
    const startTime = Date.now();

    try {
      const session = {
        id: debugSessionId,
        startTime,
        context,
        events: [],
        errors: [],
        performance: []
      };

      this.correlationMap.set(debugSessionId, session);

      // Log session start
      logger.info({
        operation: 'debug_session_start',
        debugSessionId,
        context,
        timestamp: new Date().toISOString()
      });

      // Success: Debug session started
      return debugSessionId;

    } catch (err) {
      // Failure: Could not start debug session
      logger.error({
        operation: 'debug_session_start_failed',
        error: err.message,
        stack: err.stack
      });

      Sentry.captureException(err, {
        tags: {
          component: 'debugger',
          operation: 'start_session'
        }
      });

      throw err;
    }
  }

  /**
   * Add event to debug timeline
   * @param {string} sessionId - Debug session ID
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   */
  addTimelineEvent(sessionId, eventType, data = {}) {
    try {
      const timestamp = Date.now();
      const event = {
        timestamp,
        isoTime: new Date(timestamp).toISOString(),
        type: eventType,
        data,
        correlationId: data.correlationId || sessionId
      };

      // Add to global timeline
      this.timeline.push(event);

      // Add to session if exists
      const session = this.correlationMap.get(sessionId);
      if (session) {
        session.events.push(event);
      }

      // Log the timeline event
      logger.debug({
        operation: 'debug_timeline_event',
        sessionId,
        eventType,
        ...data
      });

      // Keep timeline size manageable (last 1000 events)
      if (this.timeline.length > 1000) {
        this.timeline.shift();
      }

    } catch (err) {
      logger.error({
        operation: 'debug_timeline_event_failed',
        error: err.message,
        sessionId,
        eventType
      });
    }
  }

  /**
   * Correlate logs by timestamp range
   * @param {Date|string} timestamp - Central timestamp
   * @param {number} windowSeconds - Window in seconds (default ±5)
   * @returns {Object} Correlated events
   */
  correlateLogs(timestamp, windowSeconds = 5) {
    try {
      const targetTime = new Date(timestamp).getTime();
      const windowMs = windowSeconds * 1000;
      const startTime = targetTime - windowMs;
      const endTime = targetTime + windowMs;

      // Filter timeline events within window
      const correlatedEvents = this.timeline.filter(event => 
        event.timestamp >= startTime && event.timestamp <= endTime
      );

      // Group by correlation ID
      const grouped = {};
      correlatedEvents.forEach(event => {
        const id = event.correlationId || 'unknown';
        if (!grouped[id]) {
          grouped[id] = [];
        }
        grouped[id].push(event);
      });

      // Sort each group by timestamp
      Object.keys(grouped).forEach(id => {
        grouped[id].sort((a, b) => a.timestamp - b.timestamp);
      });

      logger.info({
        operation: 'debug_logs_correlated',
        targetTimestamp: timestamp,
        windowSeconds,
        eventsFound: correlatedEvents.length,
        correlationIds: Object.keys(grouped).length
      });

      return {
        timestamp: targetTime,
        window: `±${windowSeconds}s`,
        totalEvents: correlatedEvents.length,
        grouped,
        timeline: correlatedEvents
      };

    } catch (err) {
      logger.error({
        operation: 'debug_correlate_logs_failed',
        error: err.message,
        timestamp,
        windowSeconds
      });

      Sentry.captureException(err, {
        tags: {
          component: 'debugger',
          operation: 'correlate_logs'
        }
      });

      return { error: err.message, timeline: [] };
    }
  }

  /**
   * Analyze error context
   * @param {Error} error - Error to analyze
   * @param {string} correlationId - Correlation ID
   * @returns {Object} Error analysis
   */
  analyzeError(error, correlationId = null) {
    try {
      const errorId = randomUUID();
      const timestamp = Date.now();

      // Extract error details
      const analysis = {
        errorId,
        timestamp: new Date(timestamp).toISOString(),
        correlationId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code
        },
        stackTrace: this.parseStackTrace(error.stack),
        relatedEvents: [],
        suggestions: []
      };

      // Find related events if correlation ID provided
      if (correlationId) {
        const session = this.correlationMap.get(correlationId);
        if (session) {
          analysis.relatedEvents = session.events.filter(e => 
            Math.abs(e.timestamp - timestamp) < 30000 // Within 30 seconds
          );
        }
      }

      // Add common debugging suggestions
      analysis.suggestions = this.generateDebuggingSuggestions(error);

      // Store error context
      this.errorContext.set(errorId, analysis);

      // Log the analysis
      logger.info({
        operation: 'debug_error_analyzed',
        errorId,
        correlationId,
        errorType: error.name,
        suggestions: analysis.suggestions.length
      });

      return analysis;

    } catch (err) {
      logger.error({
        operation: 'debug_analyze_error_failed',
        error: err.message,
        originalError: error.message
      });

      return { error: 'Analysis failed', originalError: error.message };
    }
  }

  /**
   * Parse stack trace into structured format
   * @param {string} stack - Stack trace string
   * @returns {Array} Parsed stack frames
   */
  parseStackTrace(stack) {
    if (!stack) return [];

    try {
      const lines = stack.split('\n');
      const frames = [];

      lines.forEach(line => {
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        if (match) {
          frames.push({
            function: match[1],
            file: match[2],
            line: parseInt(match[3]),
            column: parseInt(match[4])
          });
        } else {
          const simpleMatch = line.match(/at\s+(.+?):(\d+):(\d+)/);
          if (simpleMatch) {
            frames.push({
              function: 'anonymous',
              file: simpleMatch[1],
              line: parseInt(simpleMatch[2]),
              column: parseInt(simpleMatch[3])
            });
          }
        }
      });

      return frames;

    } catch (err) {
      logger.error({
        operation: 'debug_parse_stack_failed',
        error: err.message
      });
      return [];
    }
  }

  /**
   * Generate debugging suggestions based on error type
   * @param {Error} error - Error to analyze
   * @returns {Array} Debugging suggestions
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
   * Create performance profile
   * @param {string} operation - Operation name
   * @returns {Object} Performance profiler
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
      
      // Mark a point in time
      mark: (name) => {
        const markTime = performance.now();
        const mark = {
          name,
          time: markTime,
          elapsed: markTime - startTime
        };
        profile.marks.push(mark);
        
        logger.debug({
          operation: 'debug_performance_mark',
          profileId,
          markName: name,
          elapsed: mark.elapsed
        });
        
        return mark;
      },
      
      // Measure between two marks
      measure: (name, startMark, endMark) => {
        const start = profile.marks.find(m => m.name === startMark);
        const end = profile.marks.find(m => m.name === endMark);
        
        if (start && end) {
          const duration = end.time - start.time;
          const measure = {
            name,
            startMark,
            endMark,
            duration
          };
          profile.measures.push(measure);
          
          logger.debug({
            operation: 'debug_performance_measure',
            profileId,
            measureName: name,
            duration
          });
          
          return measure;
        }
        return null;
      },
      
      // End profiling and get results
      end: () => {
        const endTime = performance.now();
        const totalDuration = endTime - startTime;
        
        const results = {
          profileId,
          operation,
          totalDuration,
          marks: profile.marks,
          measures: profile.measures
        };
        
        logger.info({
          operation: 'debug_performance_profile_complete',
          profileId,
          operationName: operation,
          totalDuration,
          marksCount: profile.marks.length,
          measuresCount: profile.measures.length
        });
        
        // Add to Sentry breadcrumb
        Sentry.addBreadcrumb({
          type: 'info',
          category: 'performance',
          message: `Profile ${operation}: ${totalDuration.toFixed(2)}ms`,
          level: 'info',
          data: results
        });
        
        return results;
      }
    };

    this.performanceMarks.set(profileId, profile);
    return profile;
  }

  /**
   * Create a checkpoint for debugging
   * @param {string} name - Checkpoint name
   * @param {Object} data - Data to capture
   */
  checkpoint(name, data = {}) {
    const checkpoint = {
      name,
      timestamp: Date.now(),
      isoTime: new Date().toISOString(),
      data,
      stack: new Error().stack
    };

    // Add to timeline
    this.timeline.push({
      ...checkpoint,
      type: 'checkpoint'
    });

    // Log the checkpoint
    logger.debug({
      operation: 'debug_checkpoint',
      checkpointName: name,
      ...data
    });

    // Add Sentry breadcrumb
    Sentry.addBreadcrumb({
      type: 'debug',
      category: 'checkpoint',
      message: `Checkpoint: ${name}`,
      level: 'debug',
      data
    });

    return checkpoint;
  }

  /**
   * Dump current debug state
   * @param {string} sessionId - Optional session ID to dump
   * @returns {Object} Debug state
   */
  dumpState(sessionId = null) {
    try {
      const state = {
        timestamp: new Date().toISOString(),
        sessionsCount: this.correlationMap.size,
        timelineLength: this.timeline.length,
        performanceProfilesCount: this.performanceMarks.size,
        errorContextCount: this.errorContext.size
      };

      if (sessionId) {
        const session = this.correlationMap.get(sessionId);
        if (session) {
          state.session = {
            id: session.id,
            startTime: new Date(session.startTime).toISOString(),
            duration: Date.now() - session.startTime,
            eventsCount: session.events.length,
            errorsCount: session.errors.length,
            context: session.context
          };
        }
      }

      // Recent timeline events
      state.recentEvents = this.timeline.slice(-10).map(e => ({
        type: e.type,
        timestamp: e.isoTime,
        correlationId: e.correlationId
      }));

      logger.info({
        operation: 'debug_state_dumped',
        sessionId,
        ...state
      });

      return state;

    } catch (err) {
      logger.error({
        operation: 'debug_dump_state_failed',
        error: err.message
      });

      Sentry.captureException(err, {
        tags: {
          component: 'debugger',
          operation: 'dump_state'
        }
      });

      return { error: 'Failed to dump state' };
    }
  }

  /**
   * Clear debug data
   * @param {string} sessionId - Optional session ID to clear
   */
  clear(sessionId = null) {
    try {
      if (sessionId) {
        this.correlationMap.delete(sessionId);
        logger.info({
          operation: 'debug_session_cleared',
          sessionId
        });
      } else {
        // Clear all data
        this.timeline = [];
        this.correlationMap.clear();
        this.performanceMarks.clear();
        this.errorContext.clear();
        
        logger.info({
          operation: 'debug_all_cleared'
        });
      }
    } catch (err) {
      logger.error({
        operation: 'debug_clear_failed',
        error: err.message
      });
    }
  }
}

// Create singleton instance
const debugger = new DebuggerUtility();

// Export debugger instance and class
export { DebuggerUtility };
export default debugger;