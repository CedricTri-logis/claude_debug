/**
 * Shared Database Connection Utility
 *
 * Provides centralized database connection functionality for all database scripts.
 * This consolidates the previously duplicated createDatabaseConnection() functions
 * found in multiple database scripts.
 *
 * Usage:
 *   import { createDatabaseConnection } from '../shared/database-connection.js';
 *   const client = createDatabaseConnection();
 */

import dotenv from "dotenv";
import pg from "pg";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "../../..");
dotenv.config({ path: join(rootDir, ".env") });

/**
 * Creates a PostgreSQL client connection to the Supabase database
 * @returns {pg.Client} Configured PostgreSQL client
 */
export function createDatabaseConnection() {
  const connectionString = process.env.DATABASE_URL.replace(
    "${SUPABASE_DB_PASSWORD}",
    process.env.SUPABASE_DB_PASSWORD,
  );

  return new pg.Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
  });
}

/**
 * Validates that required environment variables are present
 * @returns {string[]} Array of missing environment variable names
 */
export function validateDatabaseEnvironment() {
  const required = ["SUPABASE_URL", "SUPABASE_DB_PASSWORD", "DATABASE_URL"];
  return required.filter(
    (key) => !process.env[key] || process.env[key].includes("your-"),
  );
}

/**
 * Creates a database connection with automatic error handling and validation
 * @returns {Promise<pg.Client>} Connected PostgreSQL client
 * @throws {Error} If environment validation fails or connection fails
 */
export async function createValidatedDatabaseConnection() {
  // Validate environment
  const missing = validateDatabaseEnvironment();
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  // Create and connect client
  const client = createDatabaseConnection();

  try {
    await client.connect();
    return client;
  } catch (error) {
    await client.end();
    throw error;
  }
}
