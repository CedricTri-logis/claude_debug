# Suggested Development Commands

## Package Management
- `npm install` - Install all dependencies
- `npm ci` - Clean install from package-lock.json (for CI/CD)

## Running the Application
- `npm start` - Run the main application (src/index.js)
- `npm run dev` - Run with file watching for development
- `npm run example:api` - Run API integration examples
- `npm run example:database` - Run database integration examples

## Testing
- `npm test` - Run all tests with Jest
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Generate test coverage report

## Code Quality (Note: No linting/formatting configs found yet)
- `npx eslint src/ lib/ tests/` - Run ESLint (if configured)
- `npx prettier --write .` - Format code with Prettier (if configured)

## Git Commands (Darwin/macOS)
- `git status` - Check current changes
- `git diff` - View uncommitted changes
- `git add .` - Stage all changes
- `git commit -m "message"` - Commit changes
- `git log --oneline -10` - View recent commits
- `git branch -a` - List all branches

## System Utilities (Darwin/macOS)
- `ls -la` - List files with details
- `find . -name "*.js"` - Find JavaScript files
- `grep -r "pattern" .` - Search for pattern in files
- `rg "pattern"` - Faster search with ripgrep
- `open .` - Open current directory in Finder

## Environment Setup
- Copy `.env.example` to `.env` and configure:
  - Sentry DSN and settings
  - Logflare API credentials
  - Database connection strings
  - Feature flags and monitoring settings

## Debugging
- Use the IntegratedLogger for comprehensive logging
- Check correlation IDs for request tracing
- Monitor Sentry dashboard for errors
- Review Logflare for detailed logs