/**
 * Shared Supabase Client Utility
 *
 * Provides centralized Supabase client initialization and configuration for all scripts.
 * This consolidates the previously duplicated Supabase client creation patterns
 * found across multiple files.
 *
 * Usage:
 *   import { createSupabaseAdmin, createSupabaseAnon, validateSupabaseEnvironment } from '../shared/supabase-client.js';
 *   const adminClient = createSupabaseAdmin();
 *   const anonClient = createSupabaseAnon();
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "../../..");
dotenv.config({ path: join(rootDir, ".env") });

/**
 * Creates a Supabase client with admin (service role) privileges
 * @returns {import('@supabase/supabase-js').SupabaseClient} Supabase admin client
 */
export function createSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing required Supabase admin environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Creates a Supabase client with anonymous (public) privileges
 * @returns {import('@supabase/supabase-js').SupabaseClient} Supabase anonymous client
 */
export function createSupabaseAnon() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing required Supabase anonymous environment variables: SUPABASE_URL and SUPABASE_ANON_KEY",
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Creates a Supabase client with test environment configuration
 * @returns {Object} Object containing both admin and anon test clients
 */
export function createSupabaseTestClients() {
  const supabaseUrl = process.env.SUPABASE_TEST_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey =
    process.env.SUPABASE_TEST_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    throw new Error("Missing required Supabase test environment variables");
  }

  return {
    admin: createClient(supabaseUrl, supabaseServiceKey),
    anon: createClient(supabaseUrl, supabaseAnonKey),
  };
}

/**
 * Validates that required Supabase environment variables are present
 * @param {boolean} includeTest - Whether to include test environment variables in validation
 * @returns {string[]} Array of missing environment variable names
 */
export function validateSupabaseEnvironment(includeTest = false) {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ANON_KEY",
  ];

  if (includeTest) {
    required.push(
      "SUPABASE_TEST_URL",
      "SUPABASE_TEST_SERVICE_ROLE_KEY",
      "SUPABASE_TEST_ANON_KEY",
    );
  }

  return required.filter(
    (key) => !process.env[key] || process.env[key].includes("your-"),
  );
}

/**
 * Creates Supabase clients with automatic environment validation
 * @param {Object} options - Configuration options
 * @param {boolean} options.includeAnon - Whether to create anonymous client (default: true)
 * @param {boolean} options.isTest - Whether to use test environment (default: false)
 * @returns {Object} Object containing the requested clients
 */
export function createValidatedSupabaseClients(options = {}) {
  const { includeAnon = true, isTest = false } = options;

  // Validate environment
  const missing = validateSupabaseEnvironment(isTest);
  if (missing.length > 0) {
    throw new Error(
      `Missing required Supabase environment variables: ${missing.join(", ")}`,
    );
  }

  // Create clients based on environment
  if (isTest) {
    return createSupabaseTestClients();
  }

  const clients = {
    admin: createSupabaseAdmin(),
  };

  if (includeAnon) {
    clients.anon = createSupabaseAnon();
  }

  return clients;
}
