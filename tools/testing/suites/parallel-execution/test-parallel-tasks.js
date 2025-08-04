#!/usr/bin/env node

/**
 * Test Script for Parallel Task Execution
 *
 * This script tests whether the Task tool can execute multiple subagents
 * in parallel or if they run sequentially.
 *
 * Test methodology:
 * - Create 3 simple tasks that each take approximately 10 seconds
 * - Invoke all 3 tasks in a single batch
 * - Measure total execution time
 * - If parallel: total time should be ~10-15 seconds
 * - If sequential: total time should be ~30-35 seconds
 */

import { performance } from "perf_hooks";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

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
};

/**
 * Create a test agent file that sleeps for a specified duration
 * @param {string} agentName - Name of the test agent
 * @param {number} sleepSeconds - How long the agent should sleep
 */
async function createTestAgent(agentName, sleepSeconds) {
  const agentDir = path.join(__dirname, "..", ".claude", "agents", "test");
  const agentPath = path.join(agentDir, `${agentName}.md`);

  // Ensure directory exists
  await fs.mkdir(agentDir, { recursive: true });

  const agentContent = `---
name: ${agentName}
description: Test agent that sleeps for ${sleepSeconds} seconds
model: haiku
color: gray
tools:
  - Bash
---

# Test Agent: ${agentName}

You are a test agent designed to simulate work by sleeping for ${sleepSeconds} seconds.

## Your Task
1. Log the start time
2. Sleep for ${sleepSeconds} seconds using the Bash tool
3. Log the completion time
4. Return a summary

## Instructions
When invoked, execute these exact steps:

\`\`\`bash
echo "[$\{agentName}] Starting at $(date '+%H:%M:%S')"
sleep ${sleepSeconds}
echo "[$\{agentName}] Completed at $(date '+%H:%M:%S')"
\`\`\`

Then return: "Task ${agentName} completed after ${sleepSeconds} seconds of simulated work."
`;

  await fs.writeFile(agentPath, agentContent);
  console.log(
    `${colors.green}✓${colors.reset} Created test agent: ${agentName}`,
  );
  return agentPath;
}

/**
 * Clean up test agents after testing
 */
async function cleanupTestAgents() {
  const agentDir = path.join(__dirname, "..", ".claude", "agents", "test");
  try {
    const files = await fs.readdir(agentDir);
    for (const file of files) {
      if (file.startsWith("test-agent-")) {
        await fs.unlink(path.join(agentDir, file));
      }
    }
    console.log(`${colors.green}✓${colors.reset} Cleaned up test agents`);
  } catch (error) {
    // Directory might not exist, that's okay
  }
}

/**
 * Main test function
 */
async function runParallelTest() {
  console.log(
    `${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`,
  );
  console.log(
    `${colors.bright}${colors.blue}  Testing Parallel Task Execution${colors.reset}`,
  );
  console.log(
    `${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}\n`,
  );

  // Clean up any existing test agents
  await cleanupTestAgents();

  // Create 3 test agents
  console.log(`${colors.cyan}Creating test agents...${colors.reset}`);
  const agents = [
    await createTestAgent("test-agent-1", 10),
    await createTestAgent("test-agent-2", 10),
    await createTestAgent("test-agent-3", 10),
  ];

  console.log(`\n${colors.cyan}Test Setup:${colors.reset}`);
  console.log(`• 3 agents, each sleeping for 10 seconds`);
  console.log(`• Expected time if parallel: ~10-15 seconds`);
  console.log(`• Expected time if sequential: ~30-35 seconds`);

  console.log(
    `\n${colors.yellow}⚠️  Note: This test requires manual invocation of the Task tool${colors.reset}`,
  );
  console.log(
    `${colors.yellow}Please invoke the following 3 tasks simultaneously:${colors.reset}\n`,
  );

  console.log(`${colors.bright}Task 1:${colors.reset}`);
  console.log(`Task(
    subagent_type="general-purpose",
    description="Test parallel execution 1",
    prompt="Execute the test-agent-1 agent from .claude/agents/test/test-agent-1.md"
)\n`);

  console.log(`${colors.bright}Task 2:${colors.reset}`);
  console.log(`Task(
    subagent_type="general-purpose",
    description="Test parallel execution 2",
    prompt="Execute the test-agent-2 agent from .claude/agents/test/test-agent-2.md"
)\n`);

  console.log(`${colors.bright}Task 3:${colors.reset}`);
  console.log(`Task(
    subagent_type="general-purpose",
    description="Test parallel execution 3",
    prompt="Execute the test-agent-3 agent from .claude/agents/test/test-agent-3.md"
)\n`);

  // Record the start time for manual timing
  const testStartTime = new Date().toISOString();
  await fs.writeFile(
    path.join(__dirname, "parallel-test-start.txt"),
    testStartTime,
  );

  console.log(
    `${colors.green}Test start time recorded: ${testStartTime}${colors.reset}`,
  );
  console.log(`\n${colors.cyan}After tasks complete, run:${colors.reset}`);
  console.log(
    `${colors.bright}node tests/analyze-parallel-results.js${colors.reset}`,
  );
}

// Run the test
runParallelTest().catch(console.error);

export { createTestAgent, cleanupTestAgents };
