# Agent Delegation Patterns

## Overview
This project uses a specialized sub-agent system where Claude delegates specific tasks to specialized agents rather than performing them directly.

## Key Delegation Rules (from CLAUDE.md)

### 1. Code Writing - MANDATORY Delegation
**Never write code directly!** Always delegate to the code-writer agent:
- Agent: `.claude/agents/development/_main.code-writer.md`
- When: ANY code creation, feature implementation, or refactoring
- How: 
  ```
  1. Read the full instructions from _main.code-writer.md
  2. Use Task tool with subagent_type="general-purpose"
  3. Include both agent instructions + specific task
  ```
- Ensures: Sentry integration, Logflare logging, debugging comments, production observability

### 2. Debugging - MANDATORY Delegation  
**Never debug directly!** Always delegate to the debugger agent:
- Agent: `.claude/agents/development/_main.debugger.md`
- When: Debugging issues, analyzing errors, fixing bugs
- How:
  ```
  1. Read the full instructions from _main.debugger.md
  2. Use Task tool with subagent_type="general-purpose"
  3. Include agent instructions + debugging context (logs, errors)
  ```
- Provides: Sentry analysis, Logflare parsing, log correlation, root cause analysis

### 3. Agent Creation - MANDATORY Delegation
**Never create agents directly!** Always delegate to agent-architect:
- Agent: `.claude/agents/meta/_main.agent-architect.md`
- When: Creating new agents, modifying agents, updating configurations
- How:
  ```
  1. Read the full instructions from _main.agent-architect.md
  2. Use Task tool with subagent_type="general-purpose"
  3. Include agent instructions + requirements
  ```
- Handles: Requirements gathering, model selection, prompt optimization, validation

## Agent Organization
```
.claude/agents/
├── meta/                    # Meta-agents (create other agents)
│   ├── _main.agent-architect.md    # Creates/modifies agents
│   └── instruction-writer.md       # Optimizes instructions (internal)
└── development/             # Development agents
    ├── _main.code-writer.md        # Writes production code
    └── _main.debugger.md           # Debugs and fixes issues
```

## Important Notes
- Only delegate to `_main.` prefixed agents
- Supporting agents (no prefix) are used internally by main agents
- Always read the full agent instructions before delegating
- Include both agent instructions AND specific task in the prompt
- The delegation is MANDATORY - never bypass it