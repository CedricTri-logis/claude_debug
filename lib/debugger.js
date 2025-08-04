/**
 * Legacy Debugger Module
 * This file is maintained for backward compatibility
 * All functionality now delegated to the unified logger
 */

import { 
  UnifiedLogger,
  createDebugger as createUnifiedDebugger,
  debugger as unifiedDebugger 
} from './unified-logger.js';

/**
 * Debugging utilities for correlating logs and analyzing issues
 * Now extends UnifiedLogger for compatibility
 */
class DebuggerUtility extends UnifiedLogger {
  // All methods are inherited from UnifiedLogger
  // Maintaining the same interface for backward compatibility
}

// Create singleton instance
const debuggerInstance = unifiedDebugger;

// Export debugger instance and class
export { DebuggerUtility };
export default debuggerInstance;