/**
 * Unified Sentry Configuration
 * Consolidates all Sentry configurations into a single module with environment-specific exports
 */

import * as Sentry from "@sentry/nextjs";
import * as SentryNode from "@sentry/node";

// Common configuration shared across all environments
const commonConfig = {
  dsn: process.env.SENTRY_DSN || "https://f9cb50e4418d0fc39e5e6645bff593c5@o4509787362623488.ingest.us.sentry.io/4509787363606528",
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "1.0"),
  enableLogs: process.env.SENTRY_ENABLE_LOGS !== "false",
  debug: process.env.NODE_ENV === "development" && process.env.SENTRY_DEBUG === "true",
  environment: process.env.NODE_ENV || "development",
};

/**
 * Initialize Sentry for Edge runtime
 * Used for middleware, edge routes, and edge functions
 */
export function initializeEdge() {
  if (!commonConfig.dsn) {
    console.warn("Sentry Edge: No DSN configured, skipping initialization");
    return false;
  }

  try {
    Sentry.init({
      ...commonConfig,
      // Edge-specific configuration
      integrations: [
        ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
      ],
    });
    
    console.log("Sentry Edge initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize Sentry Edge:", error);
    return false;
  }
}

/**
 * Initialize Sentry for Server/Node.js runtime
 * Used for API routes, server-side rendering, and Node.js applications
 */
export function initializeServer() {
  if (!commonConfig.dsn) {
    console.warn("Sentry Server: No DSN configured, skipping initialization");
    return false;
  }

  try {
    Sentry.init({
      ...commonConfig,
      // Server-specific configuration
      integrations: [
        ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
        // Add server-specific integrations here
      ],
    });
    
    console.log("Sentry Server initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize Sentry Server:", error);
    return false;
  }
}

/**
 * Initialize Sentry for Node.js applications (non-Next.js)
 * Used for standalone Node.js scripts and utilities
 */
export function initializeNode() {
  if (!commonConfig.dsn) {
    console.warn("Sentry Node: No DSN configured, skipping initialization");
    return false;
  }

  try {
    SentryNode.init({
      ...commonConfig,
      // Node-specific configuration
      integrations: [
        // Add Node.js specific integrations here
      ],
    });
    
    console.log("Sentry Node initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize Sentry Node:", error);
    return false;
  }
}

/**
 * Initialize Sentry based on the current runtime environment
 * Automatically detects and initializes the appropriate configuration
 */
export function initializeSentry() {
  // Detect runtime environment
  const isEdgeRuntime = typeof EdgeRuntime !== "undefined";
  const isNextServer = typeof window === "undefined" && process.env.NEXT_RUNTIME !== "edge";
  const isNode = !isEdgeRuntime && !isNextServer && typeof window === "undefined";

  if (isEdgeRuntime) {
    return initializeEdge();
  } else if (isNextServer) {
    return initializeServer();
  } else if (isNode) {
    return initializeNode();
  }
  
  console.warn("Unknown runtime environment, skipping Sentry initialization");
  return false;
}

/**
 * Capture an exception with additional context
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context to attach to the error
 * @param {string} correlationId - Optional correlation ID for tracing
 */
export function captureException(error, context = {}, correlationId = null) {
  const sentryContext = {
    ...context,
    tags: {
      ...context.tags,
      ...(correlationId && { correlationId }),
    },
    extra: {
      ...context.extra,
      timestamp: new Date().toISOString(),
    },
  };

  // Use appropriate Sentry instance based on environment
  const sentryInstance = typeof window === "undefined" ? 
    (typeof EdgeRuntime !== "undefined" ? Sentry : SentryNode) : 
    Sentry;

  return sentryInstance.captureException(error, sentryContext);
}

/**
 * Capture a message with additional context
 * @param {string} message - The message to capture
 * @param {string} level - Severity level
 * @param {Object} context - Additional context
 */
export function captureMessage(message, level = "info", context = {}) {
  const sentryInstance = typeof window === "undefined" ? 
    (typeof EdgeRuntime !== "undefined" ? Sentry : SentryNode) : 
    Sentry;

  return sentryInstance.captureMessage(message, level, context);
}

/**
 * Add a breadcrumb for better error context
 * @param {Object} breadcrumb - Breadcrumb data
 */
export function addBreadcrumb(breadcrumb) {
  const sentryInstance = typeof window === "undefined" ? 
    (typeof EdgeRuntime !== "undefined" ? Sentry : SentryNode) : 
    Sentry;

  return sentryInstance.addBreadcrumb(breadcrumb);
}

/**
 * Start a transaction for performance monitoring
 * @param {Object} transactionContext - Transaction context
 */
export function startTransaction(transactionContext) {
  const sentryInstance = typeof window === "undefined" ? 
    (typeof EdgeRuntime !== "undefined" ? Sentry : SentryNode) : 
    Sentry;

  return sentryInstance.startTransaction(transactionContext);
}

/**
 * Flush all pending Sentry events
 * @param {number} timeout - Timeout in milliseconds
 */
export async function flushSentry(timeout = 2000) {
  const sentryInstance = typeof window === "undefined" ? 
    (typeof EdgeRuntime !== "undefined" ? Sentry : SentryNode) : 
    Sentry;

  try {
    const result = await sentryInstance.close(timeout);
    console.log("Sentry events flushed successfully");
    return result;
  } catch (error) {
    console.error("Failed to flush Sentry events:", error);
    return false;
  }
}

/**
 * Get the current Sentry hub
 */
export function getCurrentHub() {
  const sentryInstance = typeof window === "undefined" ? 
    (typeof EdgeRuntime !== "undefined" ? Sentry : SentryNode) : 
    Sentry;

  return sentryInstance.getCurrentHub();
}

/**
 * Configuration getters for runtime-specific needs
 */
export const config = {
  get dsn() { return commonConfig.dsn; },
  get environment() { return commonConfig.environment; },
  get debug() { return commonConfig.debug; },
  get tracesSampleRate() { return commonConfig.tracesSampleRate; },
  get enableLogs() { return commonConfig.enableLogs; },
};

// Export Sentry instances for direct access if needed
export { Sentry, SentryNode };

// Default export with all utilities
export default {
  initializeSentry,
  initializeEdge,
  initializeServer,
  initializeNode,
  captureException,
  captureMessage,
  addBreadcrumb,
  startTransaction,
  flushSentry,
  getCurrentHub,
  config,
};