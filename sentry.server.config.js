/**
 * Sentry Server Configuration
 * This file initializes Sentry on the server for handling requests
 * Now uses the unified Sentry configuration module
 */

import { initializeServer } from "./config/sentry.unified.js";

// Initialize Sentry for Server runtime
initializeServer();
