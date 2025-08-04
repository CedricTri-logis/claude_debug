# File: /Users/cedriclajoie/Project/Claude_debug/CLAUDE.md

# Project Instructions for Claude Code

## Sub-Agent System

All specialized sub-agents are defined in `.claude/agents/` directory. Each agent has specific responsibilities and must be used for their designated tasks.

## Code Writing Delegation

**MANDATORY**: When writing new code, implementing features, or refactoring existing code, you MUST use the Task tool to delegate to a specialized sub-agent.

### Code Writer Sub-Agent

For ANY code creation task:

1. Read the full instructions from `.claude/agents/development/_main.code-writer.md`
2. Use the Task tool with those instructions plus the specific task
3. Let the sub-agent handle all code generation

### Example:
```
When asked to write code:
1. Read .claude/agents/development/_main.code-writer.md for the full instructions
2. Use: Task(
     subagent_type="general-purpose",
     description="Write production code with logging",
     prompt="[Contents of code-writer.md] + TASK: [specific user request]"
   )
```

The code-writer sub-agent ensures all code includes:
- Sentry error tracking
- Logflare-compatible logging
- Debugging comments
- Log correlation guidance
- Production-ready observability

## Debugging Delegation

**MANDATORY**: When debugging issues, analyzing errors, or fixing bugs, you MUST use the Task tool to delegate to the specialized debugger sub-agent.

### Debugger Sub-Agent

For ANY debugging task:

1. Read the full instructions from `.claude/agents/development/_main.debugger.md`
2. Use the Task tool with those instructions plus the specific debugging context
3. Let the sub-agent handle all debugging analysis and fixes

### Example:
```
When asked to debug an issue:
1. Read .claude/agents/development/_main.debugger.md for the full instructions
2. Use: Task(
     subagent_type="general-purpose",
     description="Debug and fix production issue",
     prompt="[Contents of debugger.md] + CONTEXT: [error logs, stack traces, issue description]"
   )
```

The debugger sub-agent will:
- Analyze Sentry error logs
- Parse Logflare/database logs
- Correlate logs by timestamp and correlation ID
- Use Sourcegraph for code context
- Provide step-by-step analysis and fixes

## Agent Creation Delegation

**MANDATORY**: When creating new sub-agents or modifying existing agents, you MUST use the Task tool to delegate to the agent-architect sub-agent.

### Agent Architect Sub-Agent

For ANY agent creation or modification task:

1. Read the full instructions from `.claude/agents/meta/_main.agent-architect.md`
2. Use the Task tool with those instructions plus the specific requirements
3. Let the agent-architect handle the complete agent creation process

### When to Use:
- Creating new sub-agents
- Modifying existing sub-agents
- Updating agent configurations
- Designing new agent architectures

### Example:
```
When asked to create a new agent:
1. Read .claude/agents/meta/_main.agent-architect.md for the full instructions
2. Use: Task(
     subagent_type="general-purpose",
     description="Create new [type] agent",
     prompt="[Contents of agent-architect.md] + REQUIREMENTS: [agent specifications]"
   )
```

The agent-architect will:
- Gather requirements and analyze complexity
- Select optimal model, color, and tools
- Delegate to instruction-writer internally for optimized prompts
- Create complete agent file with YAML and instructions
- Validate and test the new agent

## Repository Initialization Delegation

**PROACTIVE**: When detecting a new repository or when asked to set up GitHub, Supabase, or Sourcegraph connections, you MUST use the Task tool to delegate to the repo-initializer agent.

### Repo Initializer Sub-Agent

For repository initialization tasks:

1. Read the full instructions from `.claude/agents/initialization/_main.repo-initializer.md`
2. Use the Task tool with those instructions plus the repository details
3. Let the sub-agent handle complete initialization

### When to Use:
- Setting up new GitHub repositories
- Connecting Supabase databases to repositories
- Indexing repositories in Sourcegraph
- Creating GitHub Actions workflows for Supabase exports
- Checking initialization status of existing repositories

### Example:
```
When asked to initialize a repository:
1. Read .claude/agents/initialization/_main.repo-initializer.md for the full instructions
2. Use: Task(
     subagent_type="general-purpose",
     description="Initialize repository with connections",
     prompt="[Contents of repo-initializer.md] + TASK: Set up [repository-name] with Supabase and Sourcegraph"
   )
```

The repo-initializer will:
- Check for existing initialization to avoid duplication
- Verify GitHub repository configuration
- Delegate to supabase-connector for database setup
- Delegate to sourcegraph-connector for code indexing
- Create GitHub Actions workflow for automatic Supabase exports
- Validate all connections are working

---

*Never write code directly. Always delegate code writing to the code-writer sub-agent, debugging to the debugger sub-agent, agent creation to the agent-architect sub-agent, and repository initialization to the repo-initializer sub-agent.*