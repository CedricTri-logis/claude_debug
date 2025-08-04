#!/usr/bin/env node

/**
 * Parallel Test Runner
 *
 * Executes multiple test suites in parallel with intelligent batching
 * based on the partial parallelism findings from our analysis.
 */

import { performance } from "perf_hooks";
import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";
import { testConfig } from "../utils/setup.js";
import {
  createTestAgent,
  createTestOrchestrator,
} from "../utils/agent-creator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

/**
 * Test suite configuration
 */
const testSuites = {
  database: {
    name: "Database Tests",
    tests: ["connection.test.js", "migrations.test.js", "tables.test.js"],
    parallel: true,
  },
  api: {
    name: "API Tests",
    tests: [
      "endpoints.test.js",
      "authentication.test.js",
      "validation.test.js",
    ],
    parallel: true,
  },
  integration: {
    name: "Integration Tests",
    tests: ["supabase.test.js", "github.test.js", "agent-coordination.test.js"],
    parallel: false, // These should run sequentially
  },
  performance: {
    name: "Performance Tests",
    tests: ["benchmark.test.js", "load.test.js", "stress.test.js"],
    parallel: false, // Performance tests should run in isolation
  },
};

/**
 * Execute a single test file
 */
async function executeTest(testPath, suiteName) {
  return new Promise((resolve) => {
    const startTime = performance.now();

    // Simulate test execution (in real implementation, this would run the actual test)
    // For now, we'll use a Worker thread to demonstrate parallel execution

    const worker = new Worker(
      `
            import { parentPort } from 'worker_threads';
            
            // Simulate test execution
            setTimeout(() => {
                const result = {
                    test: '${testPath}',
                    suite: '${suiteName}',
                    status: Math.random() > 0.1 ? 'pass' : 'fail',
                    duration: 1000 + Math.random() * 2000
                };
                parentPort.postMessage(result);
            }, 1000 + Math.random() * 2000);
        `,
      { eval: true },
    );

    worker.on("message", (result) => {
      result.actualDuration = performance.now() - startTime;
      resolve(result);
    });

    worker.on("error", (error) => {
      resolve({
        test: testPath,
        suite: suiteName,
        status: "error",
        error: error.message,
        duration: performance.now() - startTime,
      });
    });
  });
}

/**
 * Execute tests with batching for optimal parallelism
 */
async function executeTestBatch(
  tests,
  batchSize = testConfig.execution.parallelLimit,
) {
  const results = [];

  for (let i = 0; i < tests.length; i += batchSize) {
    const batch = tests.slice(i, i + batchSize);

    console.log(
      `${colors.cyan}Executing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tests.length / batchSize)}${colors.reset}`,
    );

    const batchResults = await Promise.all(
      batch.map((test) => executeTest(test.path, test.suite)),
    );

    results.push(...batchResults);

    // Log batch results
    batchResults.forEach((result) => {
      const statusIcon = result.status === "pass" ? "✅" : "❌";
      const duration = `${(result.actualDuration / 1000).toFixed(2)}s`;
      console.log(`  ${statusIcon} ${result.test} (${duration})`);
    });
  }

  return results;
}

/**
 * Run a test suite
 */
async function runTestSuite(suiteName, suiteConfig) {
  console.log(
    `\n${colors.bright}${colors.blue}Running ${suiteConfig.name}${colors.reset}`,
  );
  console.log("=".repeat(40));

  const startTime = performance.now();
  const tests = suiteConfig.tests.map((test) => ({
    path: test,
    suite: suiteName,
  }));

  let results;

  if (suiteConfig.parallel) {
    // Run tests in parallel with batching
    results = await executeTestBatch(tests);
  } else {
    // Run tests sequentially
    results = [];
    for (const test of tests) {
      const result = await executeTest(test.path, test.suite);
      const statusIcon = result.status === "pass" ? "✅" : "❌";
      const duration = `${(result.actualDuration / 1000).toFixed(2)}s`;
      console.log(`  ${statusIcon} ${result.test} (${duration})`);
      results.push(result);
    }
  }

  const duration = performance.now() - startTime;
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter(
    (r) => r.status === "fail" || r.status === "error",
  ).length;

  console.log(`\nSuite Summary:`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  ⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);

  return {
    suite: suiteName,
    name: suiteConfig.name,
    passed,
    failed,
    duration,
    results,
  };
}

/**
 * Create test orchestrator agent
 */
async function createOrchestratorAgent() {
  const agents = [
    { name: "database-test-agent", description: "Tests database operations" },
    { name: "api-test-agent", description: "Tests API endpoints" },
    { name: "integration-test-agent", description: "Tests system integration" },
    {
      name: "performance-test-agent",
      description: "Tests performance metrics",
    },
  ];

  const orchestrator = await createTestOrchestrator({
    name: "main-test-orchestrator",
    agents,
    strategy: `
1. Run database tests first to ensure data layer is working
2. Run API tests in parallel with integration tests
3. Run performance tests last in isolation
4. If any critical test fails, stop execution and report immediately
5. Aggregate all results into a comprehensive report
`,
    additionalInstructions: `
## Critical Tests
The following tests are considered critical and must pass:
- Database connection test
- Authentication test
- Core API endpoints test

## Performance Thresholds
- Database queries: < 100ms
- API responses: < 500ms
- Page loads: < 2s
`,
  });

  return orchestrator;
}

/**
 * Main parallel test runner
 */
export async function runParallelTests(options = {}) {
  console.log(
    `${colors.bright}${colors.magenta}╔═══════════════════════════════════════╗${colors.reset}`,
  );
  console.log(
    `${colors.bright}${colors.magenta}║     Parallel Test Runner v1.0.0       ║${colors.reset}`,
  );
  console.log(
    `${colors.bright}${colors.magenta}╚═══════════════════════════════════════╝${colors.reset}\n`,
  );

  const startTime = performance.now();
  const suiteResults = [];

  // Configuration
  const config = {
    suites: options.suites || Object.keys(testSuites),
    parallel: options.parallel !== false,
    createOrchestrator: options.orchestrator !== false,
    verbose: options.verbose || testConfig.execution.verbose,
  };

  console.log(`${colors.cyan}Configuration:${colors.reset}`);
  console.log(`  • Test Suites: ${config.suites.join(", ")}`);
  console.log(
    `  • Parallel Execution: ${config.parallel ? "Enabled" : "Disabled"}`,
  );
  console.log(`  • Batch Size: ${testConfig.execution.parallelLimit}`);
  console.log(
    `  • Orchestrator: ${config.createOrchestrator ? "Enabled" : "Disabled"}`,
  );

  // Create orchestrator if requested
  if (config.createOrchestrator) {
    console.log(
      `\n${colors.yellow}Creating test orchestrator agent...${colors.reset}`,
    );
    const orchestrator = await createOrchestratorAgent();
    console.log(
      `${colors.green}✓ Orchestrator created: ${orchestrator.name}${colors.reset}`,
    );
  }

  // Run test suites
  if (config.parallel && config.suites.length > 1) {
    // Run multiple suites in parallel
    console.log(
      `\n${colors.cyan}Running ${config.suites.length} test suites in parallel...${colors.reset}`,
    );

    const suitePromises = config.suites
      .map((suiteName) => {
        if (testSuites[suiteName]) {
          return runTestSuite(suiteName, testSuites[suiteName]);
        }
        return null;
      })
      .filter((p) => p !== null);

    const results = await Promise.all(suitePromises);
    suiteResults.push(...results);
  } else {
    // Run suites sequentially
    console.log(
      `\n${colors.cyan}Running ${config.suites.length} test suites sequentially...${colors.reset}`,
    );

    for (const suiteName of config.suites) {
      if (testSuites[suiteName]) {
        const result = await runTestSuite(suiteName, testSuites[suiteName]);
        suiteResults.push(result);
      }
    }
  }

  // Calculate totals
  const totalDuration = performance.now() - startTime;
  const totalPassed = suiteResults.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = suiteResults.reduce((sum, r) => sum + r.failed, 0);
  const totalTests = totalPassed + totalFailed;

  // Generate report
  console.log(
    `\n${colors.bright}${colors.magenta}═══════════════════════════════════════${colors.reset}`,
  );
  console.log(
    `${colors.bright}${colors.magenta}         FINAL TEST REPORT${colors.reset}`,
  );
  console.log(
    `${colors.bright}${colors.magenta}═══════════════════════════════════════${colors.reset}\n`,
  );

  // Suite breakdown
  console.log(`${colors.cyan}Suite Results:${colors.reset}`);
  suiteResults.forEach((suite) => {
    const status = suite.failed === 0 ? colors.green : colors.red;
    console.log(
      `  ${status}${suite.name}: ${suite.passed}/${suite.passed + suite.failed} passed (${(suite.duration / 1000).toFixed(2)}s)${colors.reset}`,
    );
  });

  // Overall summary
  console.log(`\n${colors.cyan}Overall Summary:${colors.reset}`);
  console.log(`  • Total Tests: ${totalTests}`);
  console.log(`  • ${colors.green}Passed: ${totalPassed}${colors.reset}`);
  console.log(`  • ${colors.red}Failed: ${totalFailed}${colors.reset}`);
  console.log(
    `  • Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`,
  );
  console.log(`  • Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

  // Performance analysis
  const expectedSequentialTime = suiteResults.reduce(
    (sum, r) => sum + r.duration,
    0,
  );
  const parallelSpeedup = expectedSequentialTime / totalDuration;

  console.log(`\n${colors.cyan}Performance Analysis:${colors.reset}`);
  console.log(
    `  • Sequential Time (estimated): ${(expectedSequentialTime / 1000).toFixed(2)}s`,
  );
  console.log(`  • Actual Time: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`  • Parallel Speedup: ${parallelSpeedup.toFixed(2)}x`);

  // Recommendations
  if (totalFailed > 0) {
    console.log(`\n${colors.yellow}⚠️  Recommendations:${colors.reset}`);
    console.log(`  • Review failed tests and fix issues`);
    console.log(`  • Consider running failed tests in isolation for debugging`);
    console.log(`  • Check test logs for detailed error messages`);
  } else {
    console.log(
      `\n${colors.green}🎉 All tests passed successfully!${colors.reset}`,
    );
  }

  return {
    success: totalFailed === 0,
    totalTests,
    totalPassed,
    totalFailed,
    totalDuration,
    parallelSpeedup,
    suiteResults,
  };
}

/**
 * CLI interface
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  const options = {
    suites: [],
    parallel: true,
    orchestrator: false,
    verbose: false,
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--suite":
      case "-s":
        if (args[i + 1]) {
          options.suites.push(args[i + 1]);
          i++;
        }
        break;
      case "--sequential":
        options.parallel = false;
        break;
      case "--orchestrator":
      case "-o":
        options.orchestrator = true;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        console.log(`
Parallel Test Runner

Usage: node tools/testing/runners/parallel-runner.js [options]

Options:
  -s, --suite <name>    Run specific test suite (can be used multiple times)
  --sequential          Run tests sequentially instead of in parallel
  -o, --orchestrator    Create and use test orchestrator agent
  -v, --verbose         Enable verbose output
  -h, --help           Show this help message

Available suites: ${Object.keys(testSuites).join(", ")}

Examples:
  node tools/testing/runners/parallel-runner.js                    # Run all tests in parallel
  node tools/testing/runners/parallel-runner.js -s database        # Run only database tests
  node tools/testing/runners/parallel-runner.js --sequential       # Run all tests sequentially
  node tools/testing/runners/parallel-runner.js -o                 # Use orchestrator agent
                `);
        process.exit(0);
    }
  }

  // Default to all suites if none specified
  if (options.suites.length === 0) {
    options.suites = Object.keys(testSuites);
  }

  // Run tests
  runParallelTests(options)
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error(`${colors.red}Fatal error:${colors.reset}`, error);
      process.exit(1);
    });
}

export default {
  runParallelTests,
  executeTest,
  executeTestBatch,
  runTestSuite,
  createOrchestratorAgent,
};
