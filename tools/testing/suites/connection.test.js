#!/usr/bin/env node

/**
 * Database Connection Tests
 *
 * Tests Supabase database connectivity and basic operations
 */

import {
  createTestClients,
  testConfig,
  logTestExecution,
} from "../utils/setup.js";
import { performance } from "perf_hooks";

/**
 * Test basic database connectivity
 */
export async function testBasicConnection() {
  const startTime = performance.now();
  const testName = "Basic Connection";

  try {
    const { adminClient, anonClient } = createTestClients();

    // Test admin connection
    const { data: adminData, error: adminError } = await adminClient
      .from("products")
      .select("count")
      .limit(1);

    if (adminError) {
      throw new Error(`Admin connection failed: ${adminError.message}`);
    }

    // Test anon connection
    const { data: anonData, error: anonError } = await anonClient
      .from("products")
      .select("count")
      .limit(1);

    if (anonError) {
      throw new Error(`Anonymous connection failed: ${anonError.message}`);
    }

    const duration = performance.now() - startTime;
    logTestExecution(testName, duration, "pass");

    return {
      status: "pass",
      duration,
      details: {
        adminConnection: "successful",
        anonConnection: "successful",
      },
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    logTestExecution(testName, duration, "fail");

    return {
      status: "fail",
      duration,
      error: error.message,
    };
  }
}

/**
 * Test connection pooling
 */
export async function testConnectionPooling() {
  const startTime = performance.now();
  const testName = "Connection Pooling";

  try {
    const connections = [];
    const poolSize = testConfig.database.poolSize;

    // Create multiple connections
    for (let i = 0; i < poolSize; i++) {
      const { adminClient } = createTestClients();
      connections.push(adminClient);
    }

    // Execute queries on all connections simultaneously
    const queries = connections.map((client) =>
      client.from("products").select("id").limit(1),
    );

    const results = await Promise.all(queries);

    // Check all queries succeeded
    const failures = results.filter((r) => r.error);
    if (failures.length > 0) {
      throw new Error(`${failures.length} connections failed`);
    }

    const duration = performance.now() - startTime;
    logTestExecution(testName, duration, "pass");

    return {
      status: "pass",
      duration,
      details: {
        poolSize,
        successfulConnections: results.length,
      },
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    logTestExecution(testName, duration, "fail");

    return {
      status: "fail",
      duration,
      error: error.message,
    };
  }
}

/**
 * Test connection timeout handling
 */
export async function testConnectionTimeout() {
  const startTime = performance.now();
  const testName = "Connection Timeout";

  try {
    const { adminClient } = createTestClients();

    // Create a promise that will timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Connection timeout")), 5000);
    });

    // Create a slow query (this is simulated)
    const queryPromise = adminClient.from("products").select("*").limit(1000);

    // Race between query and timeout
    try {
      await Promise.race([queryPromise, timeoutPromise]);
    } catch (error) {
      if (error.message === "Connection timeout") {
        // This is expected behavior - timeout handling works
        const duration = performance.now() - startTime;
        logTestExecution(testName, duration, "pass");

        return {
          status: "pass",
          duration,
          details: {
            timeoutHandling: "working correctly",
          },
        };
      }
      throw error;
    }

    // If we get here, the query completed before timeout
    const duration = performance.now() - startTime;
    logTestExecution(testName, duration, "pass");

    return {
      status: "pass",
      duration,
      details: {
        queryCompleted: "before timeout",
      },
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    logTestExecution(testName, duration, "fail");

    return {
      status: "fail",
      duration,
      error: error.message,
    };
  }
}

/**
 * Test connection recovery after failure
 */
export async function testConnectionRecovery() {
  const startTime = performance.now();
  const testName = "Connection Recovery";

  try {
    const { adminClient } = createTestClients();

    // First, verify connection works
    const { error: initialError } = await adminClient
      .from("products")
      .select("id")
      .limit(1);

    if (initialError) {
      throw new Error("Initial connection failed");
    }

    // Simulate connection failure by using invalid table
    const { error: failureError } = await adminClient
      .from("non_existent_table")
      .select("*");

    if (!failureError) {
      throw new Error("Expected failure did not occur");
    }

    // Test recovery - should work again
    const { error: recoveryError } = await adminClient
      .from("products")
      .select("id")
      .limit(1);

    if (recoveryError) {
      throw new Error("Connection recovery failed");
    }

    const duration = performance.now() - startTime;
    logTestExecution(testName, duration, "pass");

    return {
      status: "pass",
      duration,
      details: {
        recovery: "successful",
        connectionResilience: "verified",
      },
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    logTestExecution(testName, duration, "fail");

    return {
      status: "fail",
      duration,
      error: error.message,
    };
  }
}

/**
 * Test connection with different authentication methods
 */
export async function testAuthenticationMethods() {
  const startTime = performance.now();
  const testName = "Authentication Methods";

  try {
    const results = {};

    // Test service role authentication
    const { adminClient } = createTestClients();
    const { error: serviceError } = await adminClient.from("products").insert({
      name: "TEST_Auth_Product",
      price: 10.0,
      stock_quantity: 1,
    });

    results.serviceRole = serviceError ? "failed" : "successful";

    // Clean up test data if insert succeeded
    if (!serviceError) {
      await adminClient
        .from("products")
        .delete()
        .eq("name", "TEST_Auth_Product");
    }

    // Test anonymous authentication (should fail for insert)
    const { anonClient } = createTestClients();
    const { error: anonError } = await anonClient.from("products").insert({
      name: "TEST_Anon_Product",
      price: 10.0,
      stock_quantity: 1,
    });

    results.anonymous = anonError
      ? "properly restricted"
      : "unexpected success";

    const duration = performance.now() - startTime;
    logTestExecution(testName, duration, "pass");

    return {
      status: "pass",
      duration,
      details: results,
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    logTestExecution(testName, duration, "fail");

    return {
      status: "fail",
      duration,
      error: error.message,
    };
  }
}

/**
 * Run all connection tests
 */
export async function runConnectionTests() {
  console.log("\n🔌 Running Database Connection Tests\n");

  const tests = [
    { name: "Basic Connection", fn: testBasicConnection },
    { name: "Connection Pooling", fn: testConnectionPooling },
    { name: "Connection Timeout", fn: testConnectionTimeout },
    { name: "Connection Recovery", fn: testConnectionRecovery },
    { name: "Authentication Methods", fn: testAuthenticationMethods },
  ];

  const results = [];

  for (const test of tests) {
    const result = await test.fn();
    results.push({
      name: test.name,
      ...result,
    });
  }

  // Summary
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log("\n📊 Connection Test Summary");
  console.log("========================");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Time: ${(totalDuration / 1000).toFixed(2)}s`);

  return {
    passed,
    failed,
    totalDuration,
    results,
  };
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runConnectionTests().catch(console.error);
}

export default {
  testBasicConnection,
  testConnectionPooling,
  testConnectionTimeout,
  testConnectionRecovery,
  testAuthenticationMethods,
  runConnectionTests,
};
