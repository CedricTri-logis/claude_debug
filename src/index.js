// File: /Users/cedriclajoie/Project/Claude_debug/src/index.js

import { 
  initializeSentry, 
  flushSentry,
  captureException,
  captureMessage,
  addBreadcrumb 
} from "../config/sentry.unified.js";
import { initializeLogflare, flushLogs } from "../config/logflare.config.js";
import { createLogger } from "../lib/unified-logger.js";
import debugModule from "../lib/unified-logger.js"; // Using unified logger for debugging
import dotenv from "dotenv";

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
 * Main application entry point
 */
async function main() {
  const startTime = Date.now();
  const logger = createLogger({ component: "main" });
  const correlationId = logger.correlationId;

  try {
    // Log application start
    logger.info({
      operation: "app_start",
      message: "Claude Debug Infrastructure starting...",
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
    });

    // Initialize Sentry
    const sentryInitialized = initializeSentry();
    if (sentryInitialized) {
      logger.info({
        operation: "sentry_initialized",
        message: "Sentry error tracking initialized successfully",
      });
    } else {
      logger.warn({
        operation: "sentry_not_initialized",
        message: "Sentry initialization skipped or failed",
      });
    }

    // Initialize Logflare
    const logflareLogger = initializeLogflare();
    if (logflareLogger) {
      logger.info({
        operation: "logflare_initialized",
        message: "Logflare logging initialized successfully",
      });
    } else {
      logger.warn({
        operation: "logflare_not_initialized",
        message: "Logflare initialization skipped or failed",
      });
    }

    // Start debug session
    const debugSessionId = debugModule.startSession(correlationId, {
      app: "claude-debug-infrastructure",
      version: "1.0.0",
    });

    logger.info({
      operation: "debug_session_created",
      debugSessionId,
      message: "Debug session started",
    });

    // Demonstrate various logging capabilities
    await demonstrateLogging(logger, debugSessionId);

    // Demonstrate error handling
    await demonstrateErrorHandling(logger, debugSessionId);

    // Demonstrate performance tracking
    await demonstratePerformanceTracking(logger, debugSessionId);

    // Success: Application completed successfully
    const duration = Date.now() - startTime;
    logger.info({
      operation: "app_complete",
      message: "Claude Debug Infrastructure demonstration completed",
      duration,
      debugSessionId,
    });

    // Dump final debug state
    const debugState = debugModule.dumpState(debugSessionId);
    logger.info({
      operation: "final_debug_state",
      state: debugState,
    });

    // Graceful shutdown
    await shutdown(logger);
  } catch (err) {
    // Failure: Application error
    logger.fatal({
      operation: "app_failed",
      message: "Claude Debug Infrastructure encountered fatal error",
      error: err.message,
      stack: err.stack,
      duration: Date.now() - startTime,
    });

    // Capture in Sentry
    captureException(err, {
      tags: {
        component: "main",
        correlationId,
      },
    });

    // Emergency shutdown
    await shutdown(logger, 1);
  }
}

/**
 * Demonstrate various logging capabilities
 */
async function demonstrateLogging(logger, debugSessionId) {
  const childLogger = logger.child({
    module: "logging-demo",
    debugSessionId,
  });

  try {
    // Info logging
    childLogger.info("Demonstrating info level logging");

    // Debug logging
    childLogger.debug("Demonstrating debug level logging", {
      details: "This includes additional metadata",
      timestamp: Date.now(),
    });

    // Warning logging
    childLogger.warn("Demonstrating warning level logging", {
      reason: "This is just a demonstration",
      severity: "low",
    });

    // Structured logging
    childLogger.info({
      operation: "structured_log_demo",
      message: "Demonstrating structured logging",
      metadata: {
        key1: "value1",
        key2: "value2",
        nested: {
          deep: "value",
        },
      },
    });

    // Database operation logging
    await childLogger.dbQuery("select", "SELECT * FROM users WHERE id = $1", {
      table: "users",
      values: [123],
      execute: async () => {
        // Simulate database query
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { rowCount: 1, rows: [{ id: 123, name: "Test User" }] };
      },
    });

    // API call logging
    await childLogger.apiCall("GET", "https://api.example.com/users/123", {
      headers: { Authorization: "Bearer [REDACTED]" },
      execute: async () => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 150));
        return { status: 200, data: { id: 123, name: "Test User" } };
      },
    });

    // Security event logging
    childLogger.securityEvent("login_attempt", {
      username: "testuser",
      ip: "192.168.1.1",
      success: true,
    });

    // Add debug checkpoint
    debugModule.checkpoint("logging_demo_complete", {
      logsCreated: 8,
    });

    // Success: Logging demonstration complete
    childLogger.info({
      operation: "logging_demo_success",
      message: "Logging demonstration completed successfully",
    });
  } catch (err) {
    // Failure: Logging demonstration failed
    childLogger.error({
      operation: "logging_demo_failed",
      error: err.message,
      stack: err.stack,
    });

    throw err;
  }
}

/**
 * Demonstrate error handling capabilities
 */
async function demonstrateErrorHandling(logger, debugSessionId) {
  const childLogger = logger.child({
    module: "error-demo",
    debugSessionId,
  });

  try {
    // Simulate different error types
    const errors = [
      new Error("Standard error example"),
      new TypeError("Type error example"),
      {
        name: "CustomError",
        message: "Custom error object example",
        code: "CUSTOM_001",
      },
    ];

    for (const error of errors) {
      try {
        throw error;
      } catch (err) {
        // Log and analyze the error
        childLogger.error(err, {
          context: "Error handling demonstration",
          handled: true,
        });

        // Analyze error
        const analysis = debugModule.analyzeError(err, debugSessionId);
        childLogger.info({
          operation: "error_analyzed",
          errorId: analysis.errorId,
          suggestionsCount: analysis.suggestions?.length || 0,
        });
      }
    }

    // Demonstrate error correlation
    const timestamp = new Date().toISOString();
    const correlated = debugModule.correlateLogs(timestamp, 5);

    childLogger.info({
      operation: "errors_correlated",
      eventsFound: correlated.totalEvents,
      correlationWindow: correlated.window,
    });

    // Success: Error handling demonstration complete
    childLogger.info({
      operation: "error_demo_success",
      message: "Error handling demonstration completed successfully",
    });
  } catch (err) {
    // Failure: Error demonstration failed
    childLogger.error({
      operation: "error_demo_failed",
      error: err.message,
      stack: err.stack,
    });

    captureException(err, {
      tags: {
        component: "error-demo",
        debugSessionId,
      },
    });

    throw err;
  }
}

/**
 * Demonstrate performance tracking capabilities
 */
async function demonstratePerformanceTracking(logger, debugSessionId) {
  const childLogger = logger.child({
    module: "performance-demo",
    debugSessionId,
  });

  try {
    // Create performance profile
    const profile = debugModule.createPerformanceProfile("demo_operation");

    // Mark start
    profile.mark("start");

    // Simulate some work
    await childLogger.measurePerformance("step1", async () => {
      profile.mark("step1_start");
      await new Promise((resolve) => setTimeout(resolve, 50));
      profile.mark("step1_end");
      return "Step 1 complete";
    });

    // More work
    await childLogger.measurePerformance("step2", async () => {
      profile.mark("step2_start");
      await new Promise((resolve) => setTimeout(resolve, 75));
      profile.mark("step2_end");
      return "Step 2 complete";
    });

    // Transaction example
    await childLogger.transaction("complex_operation", async (span) => {
      profile.mark("transaction_start");

      // Simulate complex operation
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (span) {
        span.setTag("result", "success");
      }

      profile.mark("transaction_end");
      return "Transaction complete";
    });

    // Mark end
    profile.mark("end");

    // Create measures
    profile.measure("step1_duration", "step1_start", "step1_end");
    profile.measure("step2_duration", "step2_start", "step2_end");
    profile.measure(
      "transaction_duration",
      "transaction_start",
      "transaction_end",
    );
    profile.measure("total_duration", "start", "end");

    // End profiling and get results
    const results = profile.end();

    childLogger.info({
      operation: "performance_profile_complete",
      profileId: results.profileId,
      totalDuration: results.totalDuration,
      measures: results.measures.map((m) => ({
        name: m.name,
        duration: m.duration,
      })),
    });

    // Success: Performance tracking demonstration complete
    childLogger.info({
      operation: "performance_demo_success",
      message: "Performance tracking demonstration completed successfully",
    });
  } catch (err) {
    // Failure: Performance demonstration failed
    childLogger.error({
      operation: "performance_demo_failed",
      error: err.message,
      stack: err.stack,
    });

    captureException(err, {
      tags: {
        component: "performance-demo",
        debugSessionId,
      },
    });

    throw err;
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(logger, exitCode = 0) {
  try {
    logger.info({
      operation: "shutdown_start",
      message: "Starting graceful shutdown...",
      exitCode,
    });

    // Flush all logs
    await flushLogs();
    logger.info("Logflare logs flushed");

    // Flush Sentry events
    await flushSentry(2000);
    logger.info("Sentry events flushed");

    logger.info({
      operation: "shutdown_complete",
      message: "Graceful shutdown completed",
      exitCode,
    });

    process.exit(exitCode);
  } catch (err) {
    console.error("Shutdown error:", err);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  captureException(err, {
    tags: { fatal: true },
  });
  shutdown(createLogger({ component: "uncaught" }), 1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  captureException(new Error(`Unhandled Rejection: ${reason}`), {
    tags: { fatal: true },
  });
  shutdown(createLogger({ component: "unhandled" }), 1);
});

// Handle termination signals
process.on("SIGTERM", () => {
  console.log("SIGTERM received");
  shutdown(createLogger({ component: "signal" }), 0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received");
  shutdown(createLogger({ component: "signal" }), 0);
});

// Run the main function
main().catch((err) => {
  console.error("Fatal error in main:", err);
  process.exit(1);
});
