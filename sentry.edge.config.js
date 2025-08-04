/**
 * Sentry Edge Configuration
 * This file initializes Sentry for edge features (middleware, edge routes, etc.)
 * Now uses the unified Sentry configuration module
 */

import { initializeEdge } from "./config/sentry.unified.js";

// Initialize Sentry for Edge runtime
initializeEdge();
