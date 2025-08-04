# Repository Architecture

## Overview

Claude_debug is a sophisticated Node.js debugging and infrastructure project that implements a comprehensive agent-based architecture system for Claude Code. The repository provides production-ready debugging infrastructure with Sentry error tracking, Logflare logging, database integration via Supabase, and advanced code analysis through Sourcegraph integration. At its core is a modular sub-agent system that orchestrates specialized agents for development, documentation, initialization, and specialized database operations.

## Technology Stack

### Languages

- **JavaScript**: ES2020+ (Node.js 18+) - Main application language with ES modules
- **SQL**: PostgreSQL dialect - Database schema and migrations
- **Shell**: Bash - Automation and deployment scripts

### Frameworks & Libraries

- **@sentry/node**: ^7.99.0 - Error tracking and performance monitoring
- **@sentry/tracing**: ^7.99.0 - Distributed tracing support
- **pino**: ^8.17.2 - High-performance structured logging
- **@supabase/supabase-js**: ^2.39.3 - Supabase database client
- **axios**: ^1.6.5 - HTTP client for Sourcegraph API integration
- **pg**: ^8.11.3 - PostgreSQL database driver
- **uuid**: ^9.0.1 - UUID generation for correlation tracking
- **dotenv**: ^16.4.1 - Environment variable management

### Build Tools & Infrastructure

- **Jest**: ^29.7.0 - Testing framework with coverage reporting
- **ESLint**: ^8.56.0 - Code linting and quality enforcement
- **Prettier**: ^3.2.4 - Code formatting
- **TypeScript**: ^5.3.3 - Type definitions for development
- **GitHub Actions** - CI/CD pipeline for database synchronization

## Repository Structure

```
claude-debug/
├── .claude/                           # Agent system configuration
│   ├── agents/                        # Specialized sub-agents
│   │   ├── development/               # Code development agents
│   │   │   ├── _main.code-writer.md   # Main code writer agent
│   │   │   ├── _main.debugger.md      # Main debugger agent
│   │   │   └── code-analyzer.md       # Code analysis agent
│   │   ├── documentation/             # Documentation orchestration
│   │   │   ├── _main.documentation-orchestrator.md
│   │   │   ├── architecture-documenter.md
│   │   │   ├── repo-organizer.md
│   │   │   ├── path-validator.md
│   │   │   └── prd-maintainer.md
│   │   ├── initialization/            # Repository setup agents
│   │   │   ├── _main.repo-initializer.md
│   │   │   ├── sourcegraph-connector.md
│   │   │   └── supabase-connector.md
│   │   ├── meta/                      # Meta-agent architecture
│   │   │   ├── _main.agent-architect.md
│   │   │   └── instruction-writer.md
│   │   ├── specialized/               # High-permission specialized agents
│   │   │   ├── _main.supabase-architect.md
│   │   │   ├── db_operations_log.json
│   │   │   └── README.md
│   │   └── test/                      # Test agents
│   │       ├── test-agent-1.md
│   │       ├── test-agent-2.md
│   │       └── test-agent-3.md
│   └── settings.local.json            # Local agent settings
├── config/                            # Infrastructure configuration
│   ├── logflare.config.js            # Logflare logging setup
│   └── sentry.config.js              # Sentry error tracking setup
├── database/                          # Database schema management
│   ├── migrations/                    # Database migration files
│   │   ├── 001_create_products_table.sql
│   │   └── 001_create_products_table_rollback.sql
│   ├── schema.sql                     # Complete database schema
│   ├── schema_documentation.md        # Schema documentation
│   ├── data_samples.sql              # Sample data for testing
│   ├── table_inventory.txt           # Table inventory tracking
│   └── last_export.txt               # Last export timestamp
├── examples/                          # Usage examples
│   ├── api-example.js                # API integration example
│   └── database-example.js           # Database usage example
├── lib/                              # Core utility libraries
│   ├── debugger.js                   # Debug session management
│   ├── logger.js                     # Structured logging utilities
│   └── sourcegraph.js                # Sourcegraph API client
├── tools/                           # All development and production tools
│   ├── database-info.js              # Database information queries
│   ├── export-schema.js              # Schema export automation
│   ├── list-tables.js                # Table listing utilities
│   ├── list-user-tables.js          # User table inventory
│   ├── manual-db-export.sh           # Manual database export
│   ├── run-migration-pg.js           # PostgreSQL migration runner
│   ├── run-migration.js              # Generic migration runner
│   ├── setup-github-secrets.sh       # GitHub secrets configuration
│   ├── setup-supabase-secrets.sh     # Supabase secrets setup
│   ├── test-products-table.js        # Product table testing
│   └── validate-initialization.sh    # Initialization validation
├── src/                              # Main application source
│   └── index.js                      # Application entry point
├── [moved to tools/testing]          # Test suite relocated
│   └── logger.test.js                # Logger unit tests
├── CLAUDE.md                         # Project instructions for Claude Code
├── INITIALIZATION_GUIDE.md           # Setup and initialization guide
├── README.md                         # Project documentation
├── package.json                      # Node.js project configuration
[moved to tools/]                    # All tools now organized under /tools
    ├── production/                  # Production infrastructure
    ├── development/                 # Development aids
    └── testing/                     # Testing framework
```

## Directory Descriptions

### /.claude

**Purpose**: Agent system configuration and specialized sub-agents
**Key Files**:

- `settings.local.json`: Local agent configuration settings
  **Patterns**: Hierarchical agent organization with main agents (`_main.*.md`) and supporting agents

### /config

**Purpose**: Infrastructure configuration for logging and monitoring
**Key Files**:

- `sentry.config.js`: Sentry error tracking initialization
- `logflare.config.js`: Logflare structured logging setup
  **Patterns**: Configuration modules with environment-based settings

### /database

**Purpose**: Database schema management and version control
**Key Files**:

- `schema.sql`: Complete PostgreSQL database schema
- `migrations/`: Versioned database migration files
- `schema_documentation.md`: Human-readable schema documentation
  **Patterns**: Forward and rollback migration pairs, automated schema exports

### /lib

**Purpose**: Core utility libraries and integrations
**Key Files**:

- `sourcegraph.js`: Comprehensive Sourcegraph API client with caching
- `debugger.js`: Debug session management and error analysis
- `logger.js`: Structured logging with correlation tracking
  **Patterns**: Singleton patterns, comprehensive error handling, structured logging

### /scripts

**Purpose**: Automation, migration, and utility scripts
**Key Files**:

- `run-migration*.js`: Database migration execution
- `export-schema.js`: Automated schema export
- `setup-*-secrets.sh`: Environment setup automation
  **Patterns**: Database operation scripts, environment setup utilities

### /src

**Purpose**: Main application source code
**Key Files**:

- `index.js`: Application entry point with demonstration flows
  **Patterns**: Comprehensive error handling, structured logging, graceful shutdown

## Key Components

### Sourcegraph Integration Client

- **Location**: `/lib/sourcegraph.js`
- **Purpose**: Code analysis, duplicate detection, and symbol search via Sourcegraph API
- **Dependencies**:
  - `axios`: HTTP client for API requests
  - `@sentry/node`: Error tracking
  - `uuid`: Correlation ID generation
- **Exports**:
  - `SourcegraphClient`: Main client class
  - `getSourcegraphClient()`: Singleton instance getter
  - `performMandatoryAnalysis()`: Code analysis enforcement
- **Used By**:
  - Code-writer agents for duplicate detection
  - Code-analyzer agent for symbol analysis
  - Debugger agents for context understanding

### Logger Infrastructure

- **Location**: `/lib/logger.js`
- **Purpose**: Structured logging with correlation tracking and specialized log types
- **Dependencies**:
  - `pino`: High-performance logging
  - `uuid`: Correlation ID generation
- **Exports**:
  - `createLogger()`: Logger factory function
  - Database query logging
  - API call logging
  - Performance measurement utilities
- **Used By**:
  - All application components for structured logging
  - Debug session tracking
  - Error correlation

### Agent System Architecture

- **Location**: `/.claude/agents/`
- **Purpose**: Modular sub-agent system for specialized tasks
- **Dependencies**:
  - Agent-specific tool configurations
  - Orchestration patterns
- **Exports**:
  - Development agents (code-writer, debugger, code-analyzer)
  - Documentation agents (orchestrator, architecture-documenter)
  - Initialization agents (repo-initializer, connectors)
  - Specialized agents (supabase-architect)
- **Used By**:
  - Claude Code main agent for task delegation
  - Cross-agent orchestration workflows

### Database Schema Management

- **Location**: `/database/`
- **Purpose**: Version-controlled database schema with migration support
- **Dependencies**:
  - PostgreSQL/Supabase
  - Migration runner scripts
- **Exports**:
  - Complete schema definitions
  - Migration files with rollback support
  - Schema documentation
- **Used By**:
  - Supabase-architect agent for schema operations
  - Migration runner scripts
  - GitHub Actions for automated exports

## Entry Points

1. **Main Application**: `/src/index.js`
   - Description: Demonstrates complete infrastructure with logging, error tracking, and debug session management
   - Environment Setup: Requires Sentry DSN, Logflare configuration, and optional Supabase/Sourcegraph tokens

2. **Agent System**: `/.claude/agents/_main.*.md`
   - Description: Main orchestration agents that coordinate specialized sub-agents
   - Environment Setup: Agent-specific configuration in settings.local.json

3. **Database Operations**: `/tools/production/migrations/run-migration*.js`
   - Description: Database migration and schema management entry points
   - Environment Setup: Requires Supabase connection string and credentials

## Data Flow

```
User Request → Claude Code Main Agent
                    ↓
            Task Analysis & Routing
                    ↓
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
Code Writer    Debugger    Documentation
Agent          Agent       Orchestrator
     │              │              │
     ▼              ▼              ▼
Code Analyzer  Error Analysis  Sub-Agents
     │              │              │
     ▼              ▼              ▼
Sourcegraph ←→ Sentry/Logflare ←→ File System
API              Integration       Operations
     │              │              │
     ▼              ▼              ▼
Analysis    ←→  Correlation  ←→  Documentation
Results         Tracking         Updates
                    ↓
             Consolidated Response
```

## Critical Paths

### Code Creation Workflow

1. `/CLAUDE.md` - Enforces mandatory analysis workflow
2. `/.claude/agents/development/code-analyzer.md` - Performs code analysis
3. `/lib/sourcegraph.js` - Executes duplicate detection and symbol analysis
4. `/.claude/agents/development/_main.code-writer.md` - Writes code with analysis documentation
5. `/.claude/agents/documentation/_main.documentation-orchestrator.md` - Updates documentation

### Debugging Workflow

1. `/src/index.js` - Application error occurs
2. `/config/sentry.config.js` - Captures error in Sentry
3. `/lib/logger.js` - Logs structured error details to Logflare
4. `/.claude/agents/development/_main.debugger.md` - Analyzes error context
5. `/lib/sourcegraph.js` - Searches for similar issues in codebase
6. `/lib/debugger.js` - Correlates logs and provides analysis

### Database Management Workflow

1. `/.claude/agents/specialized/_main.supabase-architect.md` - Receives database operation request
2. `/database/migrations/` - Creates versioned migration files
3. `/tools/production/migrations/run-migration*.js` - Executes migrations with validation
4. `/tools/production/deployment/export-schema.js` - Exports updated schema
5. GitHub Actions - Automatically syncs schema to repository

## Configuration

### Environment Variables

- `SENTRY_DSN`: Sentry project DSN for error tracking (required)
- `LOGFLARE_API_KEY`: Logflare API key for log aggregation (required)
- `LOGFLARE_SOURCE_TOKEN`: Logflare source token (required)
- `SOURCEGRAPH_INSTANCE_URL`: Sourcegraph instance URL (optional, defaults to sourcegraph.com)
- `SOURCEGRAPH_ACCESS_TOKEN`: Sourcegraph API access token (required for code analysis)
- `SUPABASE_URL`: Supabase project URL (required for database operations)
- `SUPABASE_ANON_KEY`: Supabase anonymous key (required)
- `DATABASE_URL`: PostgreSQL connection string (required for migrations)
- `NODE_ENV`: Environment setting (development/production)

### Configuration Files

- `config/sentry.config.js`: Sentry initialization with performance monitoring
- `config/logflare.config.js`: Logflare logging configuration with structured formatting
- `.claude/settings.local.json`: Local agent system settings
- `package.json`: Node.js project configuration with scripts and dependencies

## Development Patterns

### File Naming Conventions

- Agent files: `_main.agent-name.md` for main agents, `agent-name.md` for sub-agents
- Utilities: `camelCase.js` for library files
- Scripts: `kebab-case.js` for automation scripts
- Migrations: `001_description.sql` with corresponding `_rollback.sql`
- Tests: `*.test.js` in `/tools/testing/` directory

### Code Organization Patterns

- **Agent Delegation**: Main Claude Code agent delegates to specialized sub-agents
- **Mandatory Analysis**: All code creation enforced through code-analyzer agent
- **Structured Logging**: Comprehensive correlation tracking across all operations
- **Error Handling**: Centralized error capture with Sentry and detailed logging
- **Resource Management**: Graceful shutdown and cleanup patterns

## Dependencies Graph

```
Main Application (src/index.js)
├── Infrastructure Layer
│   ├── Sentry Error Tracking
│   ├── Logflare Logging
│   └── Environment Configuration
├── Core Libraries (lib/)
│   ├── Sourcegraph Client
│   │   ├── Axios HTTP Client
│   │   ├── Caching Layer
│   │   └── Analysis Engine
│   ├── Logger System
│   │   ├── Pino Core
│   │   ├── Correlation Tracking
│   │   └── Structured Formatting
│   └── Debugger Utilities
│       ├── Session Management
│       ├── Error Analysis
│       └── Log Correlation
├── Agent System (.claude/agents/)
│   ├── Development Agents
│   │   ├── Code Writer
│   │   ├── Debugger
│   │   └── Code Analyzer
│   ├── Documentation Agents
│   │   ├── Orchestrator
│   │   ├── Architecture Documenter
│   │   ├── Repo Organizer
│   │   └── PRD Maintainer
│   └── Specialized Agents
│       ├── Supabase Architect
│       └── Repository Initializer
└── Database Layer (database/)
    ├── PostgreSQL/Supabase
    ├── Migration System
    └── Schema Management
```

## Testing Structure

- **Unit Tests**: `/tools/testing/suites/logger.test.js` - Core library testing
- **Integration Tests**: `/examples/` - API and database integration examples
- **Migration Tests**: `/tools/development/database/test-products-table.js` - Database operation validation
- **Test Coverage**: Configured via Jest with coverage reporting to `/coverage/`

## Build & Deployment

### Build Process

1. `npm install` - Install dependencies
2. `npm run test` - Execute test suite with coverage
3. Environment validation via `/tools/production/deployment/validate-initialization.sh`
4. Database migration execution via migration runner scripts

### Deployment Structure

- **Production Runtime**: Node.js 18+ with ES modules support
- **Database**: PostgreSQL via Supabase with automated schema synchronization
- **Monitoring**: Sentry error tracking and Logflare log aggregation
- **CI/CD**: GitHub Actions for automated database schema exports

## Quick Start Guide

1. **Prerequisites**:
   - Node.js 18+
   - PostgreSQL or Supabase account
   - Sentry account for error tracking
   - Logflare account for log aggregation

2. **Installation**:

   ```bash
   npm install
   cp .env.example .env  # Configure environment variables
   ```

3. **Configuration**:
   - Set up Sentry DSN in `.env`
   - Configure Logflare API keys
   - Add Supabase connection details
   - Optional: Configure Sourcegraph token for code analysis

4. **Running locally**:
   ```bash
   npm run dev          # Development mode with hot reload
   npm start           # Production mode
   npm run test        # Run test suite
   ```

## Architecture Decisions

### Pattern: Modular Agent System with Orchestration

**Reasoning**: Enables specialized task handling while maintaining centralized coordination. Each agent has specific responsibilities and tools, reducing complexity and improving maintainability.

### Pattern: Mandatory Code Analysis Enforcement

**Reasoning**: Prevents code duplication and ensures consistency by requiring analysis before any code creation. Integrates with Sourcegraph for comprehensive codebase understanding.

### Pattern: Comprehensive Observability

**Reasoning**: Production-ready monitoring with structured logging, error tracking, and correlation IDs enables effective debugging and performance monitoring.

### Key Design Decisions

- **ES Modules**: Modern JavaScript module system for better tree-shaking and compatibility
- **Structured Logging**: JSON-formatted logs with correlation tracking for effective debugging
- **Agent Delegation**: Task-specific agents with appropriate tools and permissions
- **Database Version Control**: Migration-based schema management with automated exports
- **Singleton Patterns**: Shared instances for database connections and API clients

## Maintenance Notes

- **Last Updated**: 2025-08-04
- **Major Changes**:
  - Implemented comprehensive agent system architecture
  - Added mandatory code analysis enforcement
  - Integrated Sourcegraph for code analysis
  - Created specialized database architect agent
  - Added automated schema synchronization

- **Technical Debt**:
  - Agent system could benefit from more comprehensive testing
  - Sourcegraph integration needs fallback for offline scenarios
  - Database migration rollback testing needs automation
  - Agent orchestration patterns could be further standardized

## Agent System Architecture

The `.claude/agents/` directory implements a sophisticated multi-tier agent architecture:

### **Main Orchestration Agents** (`_main.*.md`)

- **documentation-orchestrator**: Coordinates all documentation tasks
- **code-writer**: Handles all code creation with mandatory analysis
- **debugger**: Manages error analysis and debugging workflows
- **supabase-architect**: High-permission database operations
- **repo-initializer**: Repository setup and external service integration
- **agent-architect**: Creates and manages other agents

### **Specialized Sub-Agents**

- **code-analyzer**: Mandatory code analysis using Sourcegraph and Serena tools
- **architecture-documenter**: Creates comprehensive repository documentation
- **repo-organizer**: Restructures repositories for better organization
- **path-validator**: Validates path changes after reorganization
- **prd-maintainer**: Maintains living product requirements documentation

### **Integration Connectors**

- **sourcegraph-connector**: Sourcegraph service integration
- **supabase-connector**: Supabase database service setup
- **instruction-writer**: Optimized agent instruction generation

This architecture ensures specialized task handling while maintaining coordination and preventing operational conflicts.
