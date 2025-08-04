/**
 * Logflare Configuration
 * Provides logging infrastructure for the application
 */

// Mock logger implementation (replace with actual Logflare SDK when available)
class LogflareLogger {
  constructor(config = {}) {
    this.config = config;
    this.buffer = [];
    this.apiKey = process.env.LOGFLARE_API_KEY;
    this.sourceId = process.env.LOGFLARE_SOURCE_ID;
    this.endpoint = process.env.LOGFLARE_ENDPOINT || "https://api.logflare.app/logs";
  }

  log(level, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      ...data,
      metadata: {
        ...data.metadata,
        environment: process.env.NODE_ENV || "development",
      },
    };

    // In production, send to Logflare
    if (this.apiKey && this.sourceId) {
      this.buffer.push(logEntry);
      if (this.buffer.length >= 10) {
        this.flush();
      }
    }

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[${level.toUpperCase()}]`, data);
    }
  }

  info(data) {
    this.log("info", data);
  }

  debug(data) {
    this.log("debug", data);
  }

  warn(data) {
    this.log("warn", data);
  }

  error(data) {
    this.log("error", data);
  }

  fatal(data) {
    this.log("fatal", data);
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const logs = [...this.buffer];
    this.buffer = [];

    // In production, would send to Logflare API
    if (this.apiKey && this.sourceId) {
      // TODO: Implement actual Logflare API call
      console.log(`Flushing ${logs.length} logs to Logflare`);
    }
  }
}

let loggerInstance = null;

export function initializeLogflare() {
  if (process.env.LOGFLARE_API_KEY) {
    loggerInstance = new LogflareLogger();
    console.log("Logflare initialized");
    return true;
  }
  console.log("Logflare not initialized (no API key)");
  return false;
}

export function getLogger() {
  if (!loggerInstance) {
    loggerInstance = new LogflareLogger();
  }
  return loggerInstance;
}

export function createChildLogger(bindings = {}) {
  const parentLogger = getLogger();
  const childLogger = new LogflareLogger(bindings);
  // Inherit parent configuration
  childLogger.apiKey = parentLogger.apiKey;
  childLogger.sourceId = parentLogger.sourceId;
  childLogger.endpoint = parentLogger.endpoint;
  // Add bindings to all logs
  const originalLog = childLogger.log.bind(childLogger);
  childLogger.log = (level, data) => {
    originalLog(level, { ...bindings, ...data });
  };
  return childLogger;
}

export async function flushLogs() {
  const logger = getLogger();
  await logger.flush();
  console.log("Logs flushed");
  return true;
}
