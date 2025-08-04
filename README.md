# Claude Debug Infrastructure

> **Complete debugging infrastructure with Sentry and Logflare integration**

A sophisticated Node.js debugging and infrastructure project that implements a comprehensive agent-based architecture system for Claude Code. This repository provides production-ready debugging infrastructure with Sentry error tracking, Logflare logging, database integration via Supabase, and advanced code analysis through Sourcegraph integration.

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase project (for database)
- Sentry project (for error tracking)
- Logflare account (for logging)

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd Claude_debug

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your credentials

# Run the application
npm start
```

## Features

🤖 **Agent-Based Architecture**
- Specialized sub-agents for different tasks
- Code writing with mandatory analysis
- Database operations with safety guardrails
- Documentation orchestration

🔍 **Production Debugging**
- Sentry error tracking and performance monitoring
- Logflare structured logging with correlation IDs
- Automated log correlation and analysis
- Sourcegraph code search integration

🗄️ **Database Management**
- Supabase PostgreSQL integration
- Automated schema synchronization
- Migration system with rollback support
- Row Level Security (RLS) policies

📊 **Testing Infrastructure**
- Parallel test execution
- Agent-based test orchestration
- Database connection testing
- Performance benchmarking

## Repository Structure

```
├── docs/                     # 📚 All documentation
│   ├── README.md            # This file
│   ├── ARCHITECTURE.md      # System architecture
│   ├── CLAUDE.md           # Claude Code instructions
│   └── INITIALIZATION_GUIDE.md
├── database/                # 🗄️ Database management
│   ├── schema/             # Schema definitions
│   ├── samples/            # Sample data
│   ├── exports/            # Export artifacts
│   └── migrations/         # Version-controlled migrations
├── src/                     # 💻 Source code
├── tests/                   # 🧪 Test suites
├── scripts/                 # 🔧 Utility scripts
├── utilities/              # 🛠️ Standalone tools
└── .claude/agents/         # 🤖 Agent system
```

## Core Components

### Agent System
- **Code Writer**: Production code with logging and error tracking
- **Debugger**: Log correlation and error analysis
- **Supabase Architect**: Database operations with safety guardrails
- **Documentation Orchestrator**: Living documentation maintenance

### Debugging Infrastructure
- **Sentry Integration**: Error tracking with context and correlation
- **Logflare Logging**: Structured logs with searchable metadata
- **Correlation System**: Link errors across services and timeframes

### Database Layer
- **Migration System**: Version-controlled schema changes
- **Auto-Export**: GitHub Actions sync schema to repository
- **Connection Testing**: Validate database connectivity and permissions

## Usage Examples

### Running Tests
```bash
# Run all tests in parallel
npm test

# Run specific test suites
npm run test:database
npm run test:api
npm run test:integration

# Run tests with orchestrator
npm run test:orchestrator
```

### Database Operations
```bash
# Run migrations
npm run migrate:up

# Test database connection
npm run test:connection

# Export schema manually
./scripts/manual-db-export.sh
```

### Development
```bash
# Start development server
npm run dev

# Run examples
npm run example:api
npm run example:database
```

## Configuration

Key environment variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Sentry Configuration
SENTRY_DSN=your_sentry_dsn
SENTRY_ENVIRONMENT=development

# Logflare Configuration
LOGFLARE_API_KEY=your_logflare_key
LOGFLARE_SOURCE_TOKEN=your_source_token
```

## Documentation

- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and components
- **[Claude Instructions](docs/CLAUDE.md)** - Agent system documentation
- **[Setup Guide](docs/INITIALIZATION_GUIDE.md)** - Complete setup instructions
- **[Test Documentation](tests/README.md)** - Testing framework guide

## Contributing

1. **Code Changes**: All code must use the agent system for creation and debugging
2. **Documentation**: Use the documentation orchestrator for updates
3. **Database**: Use the Supabase architect for schema changes
4. **Testing**: Add tests for new functionality

## License

ISC

## Support

For issues and questions:
- Check the [Architecture Guide](docs/ARCHITECTURE.md)
- Review [Test Documentation](tests/README.md)
- Create an issue in the repository