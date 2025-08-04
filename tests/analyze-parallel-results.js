#!/usr/bin/env node

/**
 * Analyze Results of Parallel Task Execution Test
 * 
 * This script analyzes the results after running the parallel task test
 * to determine if tasks executed in parallel or sequentially.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

async function analyzeResults() {
    console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}  Parallel Task Execution Analysis${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);

    try {
        // Read the start time
        const startTimeFile = path.join(__dirname, 'parallel-test-start.txt');
        const startTimeStr = await fs.readFile(startTimeFile, 'utf8');
        const startTime = new Date(startTimeStr);
        
        // Get current time as end time
        const endTime = new Date();
        
        // Calculate duration in seconds
        const durationMs = endTime - startTime;
        const durationSeconds = Math.round(durationMs / 1000);
        
        console.log(`${colors.cyan}Test Results:${colors.reset}`);
        console.log(`• Start time: ${startTime.toLocaleTimeString()}`);
        console.log(`• End time: ${endTime.toLocaleTimeString()}`);
        console.log(`• Total duration: ${colors.bright}${durationSeconds} seconds${colors.reset}`);
        
        console.log(`\n${colors.cyan}Analysis:${colors.reset}`);
        
        if (durationSeconds <= 15) {
            console.log(`${colors.green}✓ PARALLEL EXECUTION CONFIRMED${colors.reset}`);
            console.log(`  Tasks executed in parallel (~10s expected, ${durationSeconds}s actual)`);
            console.log(`  All 3 tasks ran simultaneously!`);
            
            console.log(`\n${colors.green}Implications:${colors.reset}`);
            console.log(`• Multiple Task invocations CAN run in parallel`);
            console.log(`• Batch Task calls for better performance`);
            console.log(`• Update documentation to reflect this capability`);
            
        } else if (durationSeconds >= 25 && durationSeconds <= 40) {
            console.log(`${colors.red}✗ SEQUENTIAL EXECUTION DETECTED${colors.reset}`);
            console.log(`  Tasks executed sequentially (~30s expected, ${durationSeconds}s actual)`);
            console.log(`  Each task waited for the previous to complete.`);
            
            console.log(`\n${colors.yellow}Implications:${colors.reset}`);
            console.log(`• Task invocations are processed sequentially`);
            console.log(`• Consider combining multiple operations into single Task`);
            console.log(`• Document this limitation in CLAUDE.md`);
            
        } else {
            console.log(`${colors.yellow}⚠ INCONCLUSIVE RESULTS${colors.reset}`);
            console.log(`  Duration of ${durationSeconds}s doesn't clearly indicate parallel or sequential`);
            console.log(`  This could indicate partial parallelism or other factors.`);
            
            console.log(`\n${colors.yellow}Possible explanations:${colors.reset}`);
            console.log(`• Partial parallelism (2 parallel, 1 sequential)`);
            console.log(`• System delays or throttling`);
            console.log(`• Test agents didn't execute as expected`);
        }
        
        // Clean up test file
        await fs.unlink(startTimeFile);
        console.log(`\n${colors.green}✓${colors.reset} Cleaned up test files`);
        
        // Generate recommendation
        console.log(`\n${colors.bright}${colors.cyan}Recommendations:${colors.reset}`);
        if (durationSeconds <= 15) {
            console.log(`1. Update CLAUDE.md to document parallel Task execution`);
            console.log(`2. Create patterns for efficient multi-agent workflows`);
            console.log(`3. Use batched Task calls for related operations`);
        } else {
            console.log(`1. Document sequential Task execution in CLAUDE.md`);
            console.log(`2. Design agents to handle multiple operations when possible`);
            console.log(`3. Consider using orchestrator patterns for complex workflows`);
        }
        
    } catch (error) {
        console.error(`${colors.red}Error analyzing results:${colors.reset}`, error.message);
        console.log(`\n${colors.yellow}Make sure you ran the test first:${colors.reset}`);
        console.log(`  node tests/test-parallel-tasks.js`);
    }
}

// Run analysis
analyzeResults().catch(console.error);