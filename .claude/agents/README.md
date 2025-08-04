# Agent Organization Structure

## Overview
This directory contains specialized sub-agents organized by functional category. Each agent has specific responsibilities and follows a clear delegation hierarchy.

## Folder Structure

```
.claude/agents/
├── meta/                              # Agents for creating/modifying agents
│   ├── _main.agent-architect.md      # Main: Creates and configures agents
│   └── instruction-writer.md         # Supporting: Optimizes instructions
│
├── development/                       # Agents for code development
│   ├── _main.code-writer.md         # Main: Writes production code
│   └── _main.debugger.md            # Main: Debugs and fixes issues
│
├── initialization/                    # Agents for repository setup and connections
│   ├── _main.repo-initializer.md    # Main: Orchestrates repo initialization
│   ├── supabase-connector.md        # Supporting: Handles Supabase setup
│   └── sourcegraph-connector.md     # Supporting: Handles Sourcegraph indexing
│
└── README.md                         # This file
```

## Folder Categories

### meta/
**Purpose**: Agents that create, modify, or optimize other agents and instructions.
- **_main.agent-architect.md**: Primary agent for creating new sub-agents
  - Handles requirements gathering
  - Selects models, colors, and tools
  - Delegates to instruction-writer for prompt optimization
  - Validates and tests new agents
- **instruction-writer.md**: Supporting agent for optimizing instructions
  - Used internally by agent-architect
  - Applies Anthropic's prompt engineering best practices
  - Not directly accessible from CLAUDE.md

### development/
**Purpose**: Agents for writing and debugging application code.
- **_main.code-writer.md**: Writes production-ready code
  - Includes Sentry error tracking
  - Implements Logflare-compatible logging
  - Adds debugging comments and correlation IDs
- **_main.debugger.md**: Analyzes and fixes bugs
  - Correlates Sentry and Logflare logs
  - Provides root cause analysis
  - Suggests and implements fixes

### initialization/
**Purpose**: Agents for repository setup, database connections, and code indexing.
- **_main.repo-initializer.md**: Primary agent for repository initialization
  - Orchestrates complete repository setup
  - Checks for existing initialization to avoid duplication
  - Delegates to specialized connectors
  - Creates GitHub Actions workflows
- **supabase-connector.md**: Supporting agent for Supabase integration
  - Sets up Supabase CLI and authentication
  - Configures GitHub Secrets for database access
  - Creates automatic schema export workflows
  - Used internally by repo-initializer
- **sourcegraph-connector.md**: Supporting agent for Sourcegraph indexing
  - Manages Docker container for Sourcegraph
  - Adds repositories to Sourcegraph instance
  - Monitors indexing status
  - Used internally by repo-initializer

## Naming Conventions

### Main Agents
- **Prefix**: `_main.` identifies primary delegation targets
- **Purpose**: These are the entry points for Claude's Task tool delegation
- **Example**: `_main.agent-architect.md`, `_main.code-writer.md`

### Supporting Agents
- **No prefix**: Used internally by main agents
- **Purpose**: Provide specialized functionality to main agents
- **Example**: `instruction-writer.md`

### Folders
- **Named by function**: Clear categorical grouping
- **Current categories**: meta, development, initialization
- **Future categories**: testing, security, deployment, etc.

## Delegation Hierarchy

```
CLAUDE.md
    ├── Delegates to _main.agent-architect.md (agent creation)
    │   └── Internally uses instruction-writer.md
    ├── Delegates to _main.code-writer.md (code writing)
    ├── Delegates to _main.debugger.md (debugging)
    └── Delegates to _main.repo-initializer.md (repository setup)
        ├── Internally uses supabase-connector.md
        └── Internally uses sourcegraph-connector.md
```

## How to Add New Agents

1. **Determine category**: Is it meta, development, or a new category?
2. **Choose type**: Is it a main agent or supporting agent?
3. **Follow naming**: Use `_main.` prefix for primary agents
4. **Update CLAUDE.md**: Add delegation rules for new main agents
5. **Document here**: Update this README with new agent details

## Agent Configuration Format

Each agent file contains:
1. **YAML frontmatter**: Configuration metadata
   - name: Agent identifier
   - description: When to use (includes trigger words)
   - model: opus/sonnet/haiku based on complexity
   - color: Visual category indicator
   - tools: Required tool access
2. **System prompt**: Detailed instructions for the agent

## Best Practices

1. **Main agents only**: Claude delegates only to `_main.` prefixed agents
2. **Clear boundaries**: Each agent has a specific, well-defined purpose
3. **Internal delegation**: Main agents handle their own supporting agents
4. **Documentation**: Keep this README updated with structural changes
5. **Testing**: Validate agent interactions after reorganization