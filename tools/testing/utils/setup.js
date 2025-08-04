#!/usr/bin/env node

/**
 * Test Environment Setup
 *
 * This module provides utilities for setting up and tearing down
 * test environments, including database connections, mock services,
 * and test data initialization.
 */

import { createSupabaseTestClients } from "../../shared/supabase-client.js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.join(__dirname, "..", "config", "test.env") });
dotenv.config(); // Also load main .env as fallback

/**
 * Test environment configuration
 */
export const testConfig = {
  // Database settings
  database: {
    url: process.env.SUPABASE_TEST_URL || process.env.SUPABASE_URL,
    anonKey:
      process.env.SUPABASE_TEST_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    serviceKey:
      process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    poolSize: parseInt(process.env.TEST_DATABASE_POOL_SIZE || "10"),
  },

  // Test execution settings
  execution: {
    timeout: parseInt(process.env.TEST_TIMEOUT || "30000"),
    retryCount: parseInt(process.env.TEST_RETRY_COUNT || "3"),
    parallelLimit: parseInt(process.env.TEST_PARALLEL_LIMIT || "5"),
    verbose: process.env.TEST_VERBOSE === "true",
    coverage: process.env.TEST_COVERAGE !== "false",
  },

  // Agent testing
  agents: {
    model: process.env.TEST_AGENT_MODEL || "haiku",
    timeout: parseInt(process.env.TEST_AGENT_TIMEOUT || "60000"),
    cleanup: process.env.TEST_AGENT_CLEANUP !== "false",
  },

  // Mock services
  mocks: {
    externalAPIs: process.env.MOCK_EXTERNAL_APIS !== "false",
    sentry: process.env.MOCK_SENTRY !== "false",
    logflare: process.env.MOCK_LOGFLARE !== "false",
  },

  // Performance testing
  performance: {
    iterations: parseInt(process.env.PERF_TEST_ITERATIONS || "100"),
    warmup: parseInt(process.env.PERF_TEST_WARMUP || "10"),
    threshold: parseInt(process.env.PERF_TEST_THRESHOLD || "1000"),
  },

  // Debug settings
  debug: {
    sql: process.env.DEBUG_SQL === "true",
    agents: process.env.DEBUG_AGENTS === "true",
    parallel: process.env.DEBUG_PARALLEL === "true",
  },
};

/**
 * Create Supabase clients for testing
 */
export function createTestClients() {
  const { admin: adminClient, anon: anonClient } = createSupabaseTestClients();

  return { adminClient, anonClient };
}

/**
 * Set up test database with clean state
 */
export async function setupTestDatabase() {
  const { adminClient } = createTestClients();

  try {
    // Create test schema if it doesn't exist
    await adminClient
      .rpc("exec_sql", {
        sql: `CREATE SCHEMA IF NOT EXISTS test_schema;`,
      })
      .catch(() => {
        // Fallback if exec_sql doesn't exist
        console.log(
          "Note: exec_sql function not available, using default schema",
        );
      });

    // Clean up any existing test data
    await cleanupTestData();

    // Initialize test data
    await initializeTestData();

    if (testConfig.execution.verbose) {
      console.log("✅ Test database setup complete");
    }

    return true;
  } catch (error) {
    console.error("❌ Error setting up test database:", error.message);
    return false;
  }
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  const { adminClient } = createTestClients();

  try {
    // Delete test products (those with names starting with 'TEST_')
    await adminClient.from("products").delete().like("name", "TEST_%");

    // Clean up test users if they exist
    const { data: testUsers } = await adminClient
      .from("auth.users")
      .select("id")
      .like("email", "test%@example.com");

    if (testUsers && testUsers.length > 0) {
      const userIds = testUsers.map((u) => u.id);
      await adminClient.from("auth.users").delete().in("id", userIds);
    }

    if (testConfig.execution.verbose) {
      console.log("🧹 Test data cleaned up");
    }

    return true;
  } catch (error) {
    console.error("⚠️  Error cleaning up test data:", error.message);
    return false;
  }
}

/**
 * Initialize test data
 */
export async function initializeTestData() {
  const { adminClient } = createTestClients();

  try {
    // Create sample test products
    const testProducts = [
      {
        name: "TEST_Product_1",
        description: "Test product for automated testing",
        price: 99.99,
        stock_quantity: 100,
      },
      {
        name: "TEST_Product_2",
        description: "Another test product",
        price: 49.99,
        stock_quantity: 50,
      },
      {
        name: "TEST_Product_3",
        description: "Third test product",
        price: 199.99,
        stock_quantity: 25,
      },
    ];

    const { error } = await adminClient.from("products").insert(testProducts);

    if (error && !error.message.includes("already exists")) {
      throw error;
    }

    if (testConfig.execution.verbose) {
      console.log("📦 Test data initialized");
    }

    return true;
  } catch (error) {
    console.error("⚠️  Error initializing test data:", error.message);
    return false;
  }
}

/**
 * Set up mock services
 */
export function setupMocks() {
  const mocks = {};

  if (testConfig.mocks.sentry) {
    // Mock Sentry
    mocks.sentry = {
      captureException: jest.fn(),
      captureMessage: jest.fn(),
      setContext: jest.fn(),
      setTag: jest.fn(),
    };
    global.Sentry = mocks.sentry;
  }

  if (testConfig.mocks.logflare) {
    // Mock Logflare
    mocks.logflare = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    };
    global.Logflare = mocks.logflare;
  }

  if (testConfig.mocks.externalAPIs) {
    // Mock fetch for external APIs
    mocks.fetch = jest.fn((url) => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ mocked: true }),
        text: () => Promise.resolve("mocked response"),
      });
    });
    global.fetch = mocks.fetch;
  }

  if (testConfig.execution.verbose) {
    console.log("🎭 Mock services configured");
  }

  return mocks;
}

/**
 * Tear down test environment
 */
export async function teardownTestEnvironment() {
  try {
    // Clean up test data
    await cleanupTestData();

    // Clean up test agents if configured
    if (testConfig.agents.cleanup) {
      await cleanupTestAgents();
    }

    // Reset mocks
    if (global.Sentry) delete global.Sentry;
    if (global.Logflare) delete global.Logflare;
    if (global.fetch && global.fetch.mockReset) {
      global.fetch.mockReset();
    }

    if (testConfig.execution.verbose) {
      console.log("🏁 Test environment torn down");
    }

    return true;
  } catch (error) {
    console.error("⚠️  Error tearing down test environment:", error.message);
    return false;
  }
}

/**
 * Clean up test agents
 */
async function cleanupTestAgents() {
  const agentDir = path.join(
    __dirname,
    "..",
    "..",
    ".claude",
    "agents",
    "test",
  );

  try {
    const files = await fs.readdir(agentDir);

    for (const file of files) {
      if (file.startsWith("test-") || file.startsWith("TEST_")) {
        await fs.unlink(path.join(agentDir, file));
      }
    }

    if (testConfig.execution.verbose) {
      console.log("🤖 Test agents cleaned up");
    }
  } catch (error) {
    // Directory might not exist, that's okay
    if (error.code !== "ENOENT") {
      console.error("⚠️  Error cleaning up test agents:", error.message);
    }
  }
}

/**
 * Wait for condition with timeout
 */
export async function waitForCondition(
  condition,
  timeoutMs = testConfig.execution.timeout,
  intervalMs = 100,
) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Condition not met within ${timeoutMs}ms`);
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff(
  fn,
  maxRetries = testConfig.execution.retryCount,
  baseDelayMs = 1000,
) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);

        if (testConfig.execution.verbose) {
          console.log(`⏳ Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Log test execution details
 */
export function logTestExecution(testName, duration, status) {
  if (!testConfig.execution.verbose) return;

  const statusEmoji = status === "pass" ? "✅" : "❌";
  const durationStr =
    duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`;

  console.log(`${statusEmoji} ${testName} (${durationStr})`);
}

/**
 * Create test context
 */
export function createTestContext() {
  return {
    config: testConfig,
    clients: createTestClients(),
    mocks: {},
    startTime: Date.now(),

    async setup() {
      await setupTestDatabase();
      this.mocks = setupMocks();
    },

    async teardown() {
      await teardownTestEnvironment();
    },

    getDuration() {
      return Date.now() - this.startTime;
    },
  };
}

// Export for use in tests
export default {
  testConfig,
  createTestClients,
  setupTestDatabase,
  cleanupTestData,
  initializeTestData,
  setupMocks,
  teardownTestEnvironment,
  waitForCondition,
  retryWithBackoff,
  logTestExecution,
  createTestContext,
};
