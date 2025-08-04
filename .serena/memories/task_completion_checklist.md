# Task Completion Checklist

## When Completing a Coding Task

### 1. Code Quality Checks
- [ ] Ensure all new code includes Sentry error tracking integration
- [ ] Add appropriate Logflare logging with correlation IDs
- [ ] Include debugging comments for complex logic
- [ ] Verify proper error handling with try-catch blocks
- [ ] Check that async operations use async/await pattern

### 2. Testing
- [ ] Run tests: `npm test`
- [ ] Check test coverage if applicable: `npm run test:coverage`
- [ ] Write new tests for added functionality
- [ ] Ensure all existing tests still pass

### 3. Code Formatting (Note: No linting config found yet)
- [ ] If ESLint is configured: `npx eslint src/ lib/ tests/`
- [ ] If Prettier is configured: `npx prettier --check .`
- [ ] Follow existing code style patterns in the codebase

### 4. Environment and Configuration
- [ ] Update .env.example if new environment variables added
- [ ] Document any new configuration requirements
- [ ] Ensure sensitive data is not hardcoded

### 5. Agent System Compliance
- [ ] For code writing: Use _main.code-writer.md agent via Task tool
- [ ] For debugging: Use _main.debugger.md agent via Task tool
- [ ] Never write code directly - always delegate to appropriate agent

### 6. Documentation
- [ ] Update relevant documentation if APIs changed
- [ ] Add examples if new features introduced
- [ ] Ensure CLAUDE.md instructions are followed

### 7. Final Verification
- [ ] Run the application: `npm start`
- [ ] Test any modified features manually
- [ ] Check Sentry dashboard for any new errors
- [ ] Verify Logflare logs are being generated correctly

## Important Notes
- Always use the Task tool to delegate code writing to specialized agents
- Include comprehensive logging and error tracking in all new code
- Follow the existing patterns in the codebase
- Test thoroughly before considering task complete