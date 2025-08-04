/**
 * Legacy Sentry Configuration
 * This file is maintained for backward compatibility
 * All functionality now delegated to the unified configuration
 */

import { 
  initializeNode as initializeSentry,
  flushSentry,
  captureException,
  captureMessage,
  addBreadcrumb 
} from "./sentry.unified.js";

// Re-export functions for backward compatibility
export { 
  initializeSentry,
  flushSentry,
  captureException,
  captureMessage,
  addBreadcrumb 
};
