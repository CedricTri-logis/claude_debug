# Project Structure

## Directory Layout
```
claude_debug/
├── src/                    # Main application source
│   └── index.js           # Main entry point with demo functions
├── lib/                    # Core library modules
│   ├── logger.js          # IntegratedLogger class - main logging system
│   └── debugger.js        # DebuggerUtility class - debugging utilities
├── config/                 # Configuration files
│   ├── sentry.config.js  # Sentry error tracking configuration
│   └── logflare.config.js # Logflare logging configuration
├── tests/                  # Test files
│   └── logger.test.js     # Tests for logger functionality
├── examples/               # Example usage files
│   ├── api-example.js     # API integration examples
│   └── database-example.js # Database integration examples
├── .claude/agents/         # Claude AI sub-agent system
│   ├── meta/              # Agents for creating/modifying agents
│   │   ├── _main.agent-architect.md
│   │   └── instruction-writer.md
│   └── development/       # Agents for code development
│       ├── _main.code-writer.md
│       └── _main.debugger.md
├── package.json           # Node.js project configuration
├── .env.example          # Environment variables template
├── CLAUDE.md             # Claude AI instructions
└── README.md             # Project documentation

## Key Components
1. **IntegratedLogger** (lib/logger.js): Central logging class with methods for different log levels, performance tracking, API/DB logging
2. **DebuggerUtility** (lib/debugger.js): Debugging utilities for enhanced error handling
3. **Configuration**: Modular config files for Sentry and Logflare setup
4. **Agent System**: Specialized AI agents for code writing and debugging with specific delegation patterns