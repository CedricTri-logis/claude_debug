# File: /Users/cedriclajoie/Project/Claude_debug/CLAUDE.md

# Project Instructions for Claude Code

## Sub-Agent System

All specialized sub-agents are defined in `.claude/agents/` directory. Each agent has specific responsibilities and must be used for their designated tasks.

### Task Tool Execution Model

**IMPORTANT**: The Task tool executes subagents **sequentially**, not in parallel:
- Multiple Task invocations in a single message are queued and processed one at a time
- Each subagent completes its full workflow before the next begins
- Typical overhead: 8-10 seconds per subagent initialization

#### Performance Implications:
- 3 subagent tasks = ~3x execution time (not concurrent)
- Consider combining related operations into a single subagent invocation
- Use orchestrator patterns for complex multi-step workflows

#### Best Practices:
1. **Batch Operations**: Instead of multiple subagents, use one subagent for related tasks
2. **Orchestrator Pattern**: Create orchestrator agents that coordinate multiple operations internally
3. **Sequential Planning**: Design workflows acknowledging sequential execution

## CRITICAL: Code Analysis Enforcement

**⚠️ MANDATORY WORKFLOW ⚠️** for ALL code operations:

### 1. Code Creation (ENFORCED):
- **MUST use code-analyzer FIRST** - NO EXCEPTIONS
- **MUST document Sourcegraph/Serena results** in code comments
- **MUST justify** if creating new code vs reusing existing
- **ABORT if duplicates found** unless analyzer approves creation

### 2. Code Modification (ENFORCED):
- **MUST analyze existing patterns** before changes
- **MUST maintain consistency** with codebase patterns
- **MUST update all related code** if pattern changes

### 3. Debugging (ENFORCED):
- **MUST use code-analyzer** to understand structure
- **MUST check for similar bugs** across codebase
- **MUST apply fixes consistently** to all occurrences

**FAILURE TO FOLLOW = CRITICAL ERROR**
- System will BLOCK code creation without analysis
- Violations will be logged and reported
- Code without analysis documentation will be rejected

## Code Writing Delegation

**MANDATORY**: When writing new code, implementing features, or refactoring existing code, you MUST use the Task tool to delegate to a specialized sub-agent.

### Code Writer Sub-Agent (WITH MANDATORY ANALYSIS)

For ANY code creation task:

1. Read the full instructions from `.claude/agents/development/_main.code-writer.md`
2. **NOTE**: Code-writer MUST use code-analyzer before writing ANY code
3. Use the Task tool with those instructions plus the specific task
4. Let the sub-agent handle all code generation WITH analysis
5. **VERIFY** analysis was performed by checking for documentation comments

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

## Specialized High-Permission Agents Delegation

**⚠️ WARNING**: These agents have dangerous permissions and implement strict guardrails. They will ALWAYS ask for confirmation before destructive operations.

### Supabase Database Architect Sub-Agent

For ANY database schema operations, migrations, or Supabase-specific tasks:

1. Read the full instructions from `.claude/agents/specialized/_main.supabase-architect.md`
2. Use the Task tool with those instructions plus the specific database task
3. The agent will categorize operation risk and require appropriate confirmation

### When to Use:
- Creating, modifying, or dropping database tables
- Managing indexes, views, or functions
- Setting up Row Level Security (RLS) policies
- Performing data migrations or bulk operations
- Optimizing database performance
- Any SQL DDL or DML operations on Supabase

### Example:
```
When asked to modify database schema:
1. Read .claude/agents/specialized/_main.supabase-architect.md for the full instructions
2. Use: Task(
     subagent_type="general-purpose",
     description="Database schema operation",
     prompt="[Contents of supabase-architect.md] + TASK: [specific database operation]"
   )
```

The supabase-architect will:
- Assess operation risk level (SAFE/MODERATE/DANGEROUS/CRITICAL)
- Verify backup status before dangerous operations
- Generate migration files with rollback scripts
- Require explicit confirmation for destructive operations
- Log all operations for audit trail
- Prevent SQL injection and validate syntax

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

## Documentation and Organization Delegation

**PROACTIVE**: For ANY documentation, repository structure analysis, or organization tasks, you MUST use the Task tool to delegate to the documentation-orchestrator.

### Documentation Orchestrator

For documentation and organization tasks:

1. Read the full instructions from `.claude/agents/documentation/_main.documentation-orchestrator.md`
2. Use the Task tool with those instructions plus the specific documentation task
3. The orchestrator will coordinate between its four specialized sub-agents

### When to Use:
- Creating or updating repository documentation
- Analyzing repository structure
- Reorganizing folder hierarchy
- Generating or updating PRDs
- After ANY code changes (automatic PRD update)

### Sub-Agents Coordinated:
1. **architecture-documenter** - Creates ARCHITECTURE.md with complete repo structure
2. **repo-organizer** - Restructures repository following depth-over-width principles
3. **path-validator** - Validates all references after reorganization
4. **prd-maintainer** - Maintains living PRD that updates with code changes

### Example:
```
When asked to document the repository:
1. Read .claude/agents/documentation/_main.documentation-orchestrator.md for the full instructions
2. Use: Task(
     subagent_type="general-purpose",
     description="Document repository structure",
     prompt="[Contents of documentation-orchestrator.md] + TASK: [specific documentation request]"
   )
```

### Automatic PRD Updates:
**CRITICAL**: The documentation-orchestrator MUST be automatically invoked after:
- code-writer completes ANY feature implementation
- debugger completes ANY bug fix
- Any significant code changes are made

This ensures the PRD.md stays synchronized with the actual codebase, maintaining living documentation that allows complete application recreation.

The documentation-orchestrator will:
- Analyze repository structure and create comprehensive documentation
- Reorganize repositories for better clarity (depth over width)
- Validate all path changes to prevent broken references
- Maintain living PRD with incremental updates after code changes
- Generate documentation that both humans and AI can understand

---

*Never write code directly. Always delegate code writing to the code-writer sub-agent (which MUST use code-analyzer first), debugging to the debugger sub-agent (which MUST use code-analyzer for context), agent creation to the agent-architect sub-agent, repository initialization to the repo-initializer sub-agent, and documentation/organization to the documentation-orchestrator.*

## Code Analysis Integration

**The code-analyzer agent is the MANDATORY gatekeeper for all code operations:**
- Located at: `.claude/agents/development/code-analyzer.md`
- Uses Sourcegraph API via `lib/sourcegraph.js`
- Uses mcp__serena tools for semantic analysis
- Returns structured analysis with REUSE/EXTEND/CREATE_NEW recommendations
- code-writer and debugger agents MUST use it before operations