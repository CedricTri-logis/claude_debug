# Test Suite Documentation

## Overview
This test suite provides comprehensive testing capabilities including database operations, parallel execution testing, and automated agent testing.

## Test Categories

### 1. Database Tests
- **Migration Tests**: Run and rollback database migrations
- **Table Tests**: Validate table structure and constraints
- **CRUD Operations**: Test Create, Read, Update, Delete operations
- **RLS Policies**: Verify Row Level Security policies

### 2. Parallel Execution Tests
- **Task Parallelism**: Test concurrent agent execution
- **Performance Analysis**: Measure execution timing
- **Resource Management**: Monitor system resource usage

### 3. Integration Tests
- **Supabase Connection**: Verify database connectivity
- **GitHub Actions**: Test CI/CD pipeline
- **Agent Coordination**: Test multi-agent workflows

## Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials
```

### Running Tests

#### Database Tests
```bash
# Test Supabase connection
npm run test:connection

# Run migrations
npm run migrate:up

# Test products table
npm run test:products

# Rollback migrations
npm run migrate:down
```

#### Parallel Execution Tests
```bash
# Create test agents and measure execution time
npm run test:parallel

# Analyze results
npm run test:analyze
```

#### All Tests
```bash
# Run complete test suite
npm test
```

## Test Structure

### File Organization
```
tests/
├── README.md                    # This file
├── database/                    # Database-specific tests
│   ├── connection.test.js       # Connection testing
│   ├── migrations.test.js       # Migration testing
│   └── tables.test.js          # Table structure tests
├── parallel/                    # Parallel execution tests
│   ├── test-parallel-tasks.js  # Agent parallelism testing
│   └── analyze-results.js      # Result analysis
├── integration/                 # Integration tests
│   ├── supabase.test.js       # Supabase integration
│   └── github.test.js         # GitHub Actions tests
└── utils/                      # Test utilities
    ├── setup.js                # Test environment setup
    └── helpers.js              # Helper functions
```

## Environment Variables

Required environment variables for testing:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# GitHub Configuration (for CI/CD tests)
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_repo_name

# Test Environment
NODE_ENV=test
TEST_PARALLEL_AGENTS=true
TEST_DATABASE=true
```

## Test Agent System

### Creating Test Agents

Test agents are specialized sub-agents designed for testing specific functionality:

```javascript
// Example test agent creation
import { createTestAgent } from './utils/agent-creator.js';

await createTestAgent({
    name: 'test-database-agent',
    description: 'Tests database operations',
    model: 'haiku',  // Use fast model for tests
    tools: ['Bash', 'Read', 'Write'],
    tasks: ['connect', 'query', 'validate']
});
```

### Agent Execution Patterns

Based on our testing, the Task tool executes agents with **partial parallelism**:
- Multiple agents can start simultaneously
- Execution may be throttled based on system resources
- Average overhead: 8-10 seconds per agent initialization

**Best Practices:**
1. Batch related tests into single agents
2. Use orchestrator patterns for complex workflows
3. Design agents to handle multiple test scenarios

## Database Testing

### Migration Testing

```javascript
// Test migration forward
await runMigration('001_create_products_table.sql');

// Test rollback
await runMigration('001_create_products_table_rollback.sql');
```

### Table Structure Validation

```javascript
// Validate table exists and has correct columns
const result = await testTableStructure('products', {
    expectedColumns: ['id', 'name', 'price', 'stock_quantity'],
    constraints: ['price_positive', 'stock_non_negative']
});
```

### RLS Policy Testing

```javascript
// Test anonymous access (should fail for writes)
const anonClient = createClient(url, anonKey);
await testRLSPolicy(anonClient, 'products', {
    read: true,   // Should succeed
    write: false  // Should fail
});
```

## Parallel Execution Testing

### Performance Benchmarks

| Test Type | Sequential Time | Parallel Time | Speedup |
|-----------|----------------|---------------|---------|
| 3 Agents (10s each) | ~30s | ~18s | 1.67x |
| 5 Agents (5s each) | ~25s | ~12s | 2.08x |
| 10 Agents (2s each) | ~20s | ~10s | 2.00x |

### Optimization Strategies

1. **Task Batching**: Combine related operations
2. **Resource Pooling**: Reuse connections and clients
3. **Async Operations**: Use Promise.all for independent tasks

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:quick",
      "pre-push": "npm test"
    }
  }
}
```

## Debugging Tests

### Verbose Logging

```bash
# Run with debug output
DEBUG=* npm test

# Run specific test with logging
npm run test:products -- --verbose
```

### Test Isolation

```javascript
// Run single test in isolation
describe.only('Critical Test', () => {
    it('should work in isolation', async () => {
        // Test code
    });
});
```

## Contributing

### Adding New Tests

1. Create test file in appropriate directory
2. Follow naming convention: `*.test.js` or `test-*.js`
3. Include setup and teardown functions
4. Document expected outcomes

### Test Guidelines

- Keep tests atomic and independent
- Use descriptive test names
- Clean up test data after execution
- Mock external dependencies when possible
- Aim for >80% code coverage

## Troubleshooting

### Common Issues

**Connection Timeout**
- Check environment variables
- Verify network connectivity
- Ensure Supabase project is active

**Migration Failures**
- Check SQL syntax
- Verify dependencies exist
- Review rollback scripts

**Parallel Test Failures**
- Check system resources
- Verify agent configurations
- Review execution logs

### Getting Help

- Check test logs in `tests/logs/`
- Run with `DEBUG=*` for verbose output
- Review agent execution in `.claude/agents/test/`

## Performance Optimization

### Database Query Optimization

```javascript
// Use batch operations
const results = await supabase
    .from('products')
    .insert(products)  // Batch insert
    .select();

// Use proper indexing
await supabase.rpc('create_index', {
    table: 'products',
    column: 'name'
});
```

### Test Execution Optimization

```javascript
// Parallel test execution
await Promise.all([
    testConnection(),
    testTableStructure(),
    testRLSPolicies()
]);
```

## Test Reports

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Performance Reports

```bash
# Run performance tests
npm run test:perf

# Generate benchmark report
npm run test:benchmark
```

## Best Practices

1. **Test Early and Often**: Run tests during development
2. **Maintain Test Data**: Keep test data minimal and relevant
3. **Document Failures**: Include error messages and context
4. **Version Control**: Track test changes with code changes
5. **Monitor Performance**: Track test execution times

## Resources

- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#4-testing-and-overall-quality-practices)
- [Parallel Testing Strategies](https://martinfowler.com/articles/parallel-test-execution.html)