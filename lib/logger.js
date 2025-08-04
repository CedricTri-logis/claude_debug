/**
 * Legacy Logger Module
 * This file is maintained for backward compatibility
 * All functionality now delegated to the unified logger
 */

import { 
  UnifiedLogger,
  createLogger as createUnifiedLogger,
  logger as unifiedLogger 
} from './unified-logger.js';

// Re-export the UnifiedLogger as IntegratedLogger for backward compatibility
class IntegratedLogger extends UnifiedLogger {
  // All methods are inherited from UnifiedLogger
  // No need to redefine them
}

/**
 * Create a new logger instance
 * @param {Object} context - Initial context for the logger
 * @returns {IntegratedLogger} Logger instance
 */
export function createLogger(context = {}) {
  return createUnifiedLogger(context);
}

/**
 * Global logger instance
 */
export const logger = unifiedLogger;

// Export the logger class for extension
export { IntegratedLogger };

// Default export
export default logger;