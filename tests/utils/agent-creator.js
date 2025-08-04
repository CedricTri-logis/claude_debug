#!/usr/bin/env node

/**
 * Test Agent Creator
 * 
 * This module provides utilities for creating and managing test agents
 * that can be used for automated testing of multi-agent workflows.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Agent templates for different test scenarios
 */
const agentTemplates = {
    database: {
        name: 'database-test-agent',
        description: 'Tests database operations and queries',
        model: 'haiku',
        color: 'blue',
        tools: ['Bash', 'Read', 'Write'],
        template: `
You are a database testing agent. Your role is to:
1. Connect to the database
2. Execute test queries
3. Validate results
4. Report any issues

When testing, follow these steps:
- Verify connection is established
- Run the specified SQL queries
- Check result counts and data integrity
- Log all operations for debugging
`
    },
    
    api: {
        name: 'api-test-agent',
        description: 'Tests API endpoints and responses',
        model: 'haiku',
        color: 'green',
        tools: ['Bash', 'WebFetch'],
        template: `
You are an API testing agent. Your role is to:
1. Make HTTP requests to endpoints
2. Validate response status codes
3. Check response data structure
4. Measure response times

Test methodology:
- Send requests with various payloads
- Verify HTTP status codes match expectations
- Validate JSON response structure
- Check for required fields and data types
`
    },
    
    performance: {
        name: 'performance-test-agent',
        description: 'Tests system performance and benchmarks',
        model: 'haiku',
        color: 'yellow',
        tools: ['Bash', 'Read'],
        template: `
You are a performance testing agent. Your role is to:
1. Execute performance benchmarks
2. Measure execution times
3. Monitor resource usage
4. Identify bottlenecks

Performance metrics to track:
- Execution time
- Memory usage
- CPU utilization
- I/O operations
`
    },
    
    integration: {
        name: 'integration-test-agent',
        description: 'Tests integration between multiple systems',
        model: 'haiku',
        color: 'purple',
        tools: ['Bash', 'Read', 'Write', 'WebFetch'],
        template: `
You are an integration testing agent. Your role is to:
1. Test communication between services
2. Verify data flow across systems
3. Check error handling
4. Validate end-to-end workflows

Integration test approach:
- Set up initial state
- Trigger integration flow
- Monitor intermediate steps
- Verify final state
`
    },
    
    parallel: {
        name: 'parallel-test-agent',
        description: 'Tests parallel execution capabilities',
        model: 'haiku',
        color: 'cyan',
        tools: ['Bash'],
        template: `
You are a parallel execution test agent. Your role is to:
1. Simulate concurrent operations
2. Test race conditions
3. Verify synchronization
4. Measure parallelism efficiency

Parallel testing tasks:
- Execute multiple operations simultaneously
- Check for data consistency
- Verify proper locking mechanisms
- Measure parallel speedup
`
    }
};

/**
 * Create a test agent with specified configuration
 * @param {Object} config - Agent configuration
 * @param {string} config.name - Agent name
 * @param {string} config.description - Agent description
 * @param {string} config.model - Model to use (haiku, sonnet, opus)
 * @param {string} config.color - Terminal color for output
 * @param {Array} config.tools - List of tools the agent can use
 * @param {string} config.template - Agent instruction template
 * @param {Array} config.tasks - Specific tasks for the agent
 */
export async function createTestAgent(config) {
    const agentDir = path.join(__dirname, '..', '..', '.claude', 'agents', 'test');
    await fs.mkdir(agentDir, { recursive: true });
    
    // Use template if specified
    if (config.templateName && agentTemplates[config.templateName]) {
        config = { ...agentTemplates[config.templateName], ...config };
    }
    
    // Generate agent file name
    const fileName = `${config.name}.md`;
    const filePath = path.join(agentDir, fileName);
    
    // Build tools list
    const toolsList = (config.tools || ['Bash'])
        .map(tool => `  - ${tool}`)
        .join('\n');
    
    // Build tasks section if provided
    const tasksSection = config.tasks && config.tasks.length > 0
        ? `
## Specific Tasks

${config.tasks.map((task, index) => `${index + 1}. ${task}`).join('\n')}
`
        : '';
    
    // Create agent content
    const agentContent = `---
name: ${config.name}
description: ${config.description}
model: ${config.model || 'haiku'}
color: ${config.color || 'gray'}
tools:
${toolsList}
---

# Test Agent: ${config.name}

${config.template || config.description}

${tasksSection}

## Execution Guidelines

1. **Logging**: Log all operations with timestamps
2. **Error Handling**: Capture and report all errors
3. **Validation**: Verify all expected outcomes
4. **Performance**: Track execution times
5. **Cleanup**: Clean up any test data created

## Output Format

Return results in the following format:
- Test Name: [name]
- Status: [PASS/FAIL]
- Duration: [time in ms]
- Details: [specific results or errors]
${config.additionalInstructions || ''}`;
    
    // Write agent file
    await fs.writeFile(filePath, agentContent);
    
    return {
        path: filePath,
        name: config.name,
        relativePath: path.relative(process.cwd(), filePath)
    };
}

/**
 * Create multiple test agents from a test suite configuration
 * @param {Array} testSuite - Array of agent configurations
 */
export async function createTestSuite(testSuite) {
    const agents = [];
    
    for (const agentConfig of testSuite) {
        const agent = await createTestAgent(agentConfig);
        agents.push(agent);
    }
    
    return agents;
}

/**
 * Create a test orchestrator agent that coordinates multiple test agents
 * @param {Object} config - Orchestrator configuration
 */
export async function createTestOrchestrator(config) {
    const orchestratorConfig = {
        name: config.name || 'test-orchestrator',
        description: 'Orchestrates and coordinates multiple test agents',
        model: config.model || 'sonnet',
        color: 'magenta',
        tools: ['Task', 'Bash', 'Read', 'Write', 'TodoWrite'],
        template: `
You are a test orchestration agent responsible for coordinating multiple test agents.

## Your Responsibilities

1. **Test Planning**
   - Create a comprehensive test plan
   - Identify which test agents to invoke
   - Determine execution order and dependencies

2. **Test Execution**
   - Invoke test agents in the correct sequence
   - Handle parallel execution where possible
   - Monitor test progress

3. **Result Aggregation**
   - Collect results from all test agents
   - Compile a comprehensive test report
   - Identify failures and their impact

4. **Error Handling**
   - Handle test agent failures gracefully
   - Implement retry logic where appropriate
   - Report critical failures immediately

## Test Agents Available

${config.agents ? config.agents.map(a => `- ${a.name}: ${a.description}`).join('\n') : ''}

## Execution Strategy

${config.strategy || 'Execute tests based on dependencies and optimize for parallel execution where possible.'}

## Reporting

Generate a final report with:
- Overall test status
- Individual test results
- Performance metrics
- Failure analysis
- Recommendations
`,
        additionalInstructions: config.additionalInstructions
    };
    
    return await createTestAgent(orchestratorConfig);
}

/**
 * Load an existing test agent configuration
 * @param {string} agentName - Name of the agent to load
 */
export async function loadTestAgent(agentName) {
    const agentPath = path.join(__dirname, '..', '..', '.claude', 'agents', 'test', `${agentName}.md`);
    
    try {
        const content = await fs.readFile(agentPath, 'utf8');
        
        // Parse YAML frontmatter
        const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!yamlMatch) {
            throw new Error('Invalid agent file format');
        }
        
        const yamlContent = yamlMatch[1];
        const instructions = content.replace(yamlMatch[0], '').trim();
        
        // Parse YAML manually (simple parsing)
        const config = {};
        yamlContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                const value = valueParts.join(':').trim();
                if (key === 'tools') {
                    config.tools = [];
                } else if (key.startsWith('  - ')) {
                    config.tools.push(key.replace('  - ', ''));
                } else {
                    config[key] = value;
                }
            }
        });
        
        config.instructions = instructions;
        
        return config;
    } catch (error) {
        console.error(`Error loading test agent ${agentName}:`, error.message);
        return null;
    }
}

/**
 * Delete a test agent
 * @param {string} agentName - Name of the agent to delete
 */
export async function deleteTestAgent(agentName) {
    const agentPath = path.join(__dirname, '..', '..', '.claude', 'agents', 'test', `${agentName}.md`);
    
    try {
        await fs.unlink(agentPath);
        return true;
    } catch (error) {
        console.error(`Error deleting test agent ${agentName}:`, error.message);
        return false;
    }
}

/**
 * List all test agents
 */
export async function listTestAgents() {
    const agentDir = path.join(__dirname, '..', '..', '.claude', 'agents', 'test');
    
    try {
        const files = await fs.readdir(agentDir);
        const agents = [];
        
        for (const file of files) {
            if (file.endsWith('.md')) {
                const name = file.replace('.md', '');
                const config = await loadTestAgent(name);
                if (config) {
                    agents.push({
                        name,
                        description: config.description,
                        model: config.model,
                        tools: config.tools
                    });
                }
            }
        }
        
        return agents;
    } catch (error) {
        console.error('Error listing test agents:', error.message);
        return [];
    }
}

/**
 * Clean up all test agents
 */
export async function cleanupAllTestAgents() {
    const agentDir = path.join(__dirname, '..', '..', '.claude', 'agents', 'test');
    
    try {
        const files = await fs.readdir(agentDir);
        
        for (const file of files) {
            if (file.endsWith('.md') && (file.startsWith('test-') || file.startsWith('TEST_'))) {
                await fs.unlink(path.join(agentDir, file));
            }
        }
        
        return true;
    } catch (error) {
        // Directory might not exist
        if (error.code !== 'ENOENT') {
            console.error('Error cleaning up test agents:', error.message);
        }
        return false;
    }
}

// Export templates for external use
export { agentTemplates };

// Default export
export default {
    createTestAgent,
    createTestSuite,
    createTestOrchestrator,
    loadTestAgent,
    deleteTestAgent,
    listTestAgents,
    cleanupAllTestAgents,
    agentTemplates
};