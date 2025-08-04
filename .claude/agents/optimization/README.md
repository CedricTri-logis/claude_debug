# Optimization Agents

This folder contains the comprehensive optimization subagent system designed to analyze, optimize, and maintain repository efficiency through coordinated efforts.

## Agent Overview

### 1. Optimization Orchestrator (`_main.optimization-orchestrator.md`)

- **Purpose**: Master coordinator for all repository optimization activities
- **Model**: opus - Complex analysis and strategic coordination
- **Color**: purple - Architecture design and performance analysis
- **Auto-triggers**: Repository efficiency issues, optimization requests, code duplication detection
- **Key Features**:
  - Comprehensive repository analysis using Serena tools
  - Strategic optimization planning and prioritization
  - Delegates to specialized sub-agents
  - Coordinates interdependent optimization efforts
  - Integrates with Sourcegraph for advanced search capabilities

### 2. Code Optimizer (`code-optimizer.md`)

- **Purpose**: Specialized code-level optimization and duplication elimination
- **Model**: opus - Complex code analysis and optimization
- **Color**: blue - Development and code creation
- **Delegates from**: optimization-orchestrator
- **Key Features**:
  - Eliminates code duplication while preserving functionality
  - Optimizes algorithms and data structures
  - Improves code performance with measurable metrics
  - Safe code transformation with rollback capabilities
  - Comprehensive reference tracking using Serena tools

### 3. Repository Optimizer (`repository-optimizer.md`)

- **Purpose**: Repository structure and file management specialist
- **Model**: sonnet - Pattern execution and structural improvements
- **Color**: gray - Utility and file operations
- **Delegates from**: optimization-orchestrator
- **Key Features**:
  - Cleans up unused files and dependencies
  - Optimizes folder structure and organization
  - Manages file migrations and reorganization
  - Removes artifacts while preserving build functionality
  - Systematic cleanup with safety verification

## Usage Patterns

### Automatic Invocation

The optimization system will be automatically invoked when:

- Repository inefficiencies are detected
- Code duplication patterns are identified
- Structural improvements are needed
- Performance optimization is requested
- Repository cleanup is required

### Manual Invocation

```markdown
> Use the optimization-orchestrator to analyze and optimize the repository
> Use the code-optimizer to consolidate duplicate functions in utils/
> Use the repository-optimizer to clean up unused assets and reorganize structure
```

### Workflow Integration

1. **Analysis Phase**: optimization-orchestrator performs comprehensive repository analysis
2. **Planning Phase**: Creates prioritized optimization plan with impact assessment
3. **Execution Phase**: Delegates specific tasks to specialized sub-agents
4. **Coordination Phase**: Manages interdependent optimizations to prevent conflicts
5. **Validation Phase**: Verifies all changes maintain functionality and achieve goals

## Integration with Other Systems

### Serena Tools Integration

- Uses semantic code analysis for thorough understanding
- Leverages symbol tracking for safe refactoring
- Employs pattern matching for duplication detection
- Utilizes reference analysis for impact assessment

### Sourcegraph Integration

- Advanced search capabilities for large codebases
- Cross-repository optimization opportunities
- Pattern analysis across multiple projects
- Historical change impact analysis

### Safety Features

- Comprehensive usage analysis before any changes
- Rollback capabilities for all operations
- Functionality preservation validation
- Test execution verification
- Import/reference integrity checks

## Expected Outcomes

### Code Optimization

- 30-70% reduction in duplicate code
- Improved algorithmic efficiency
- Better performance metrics
- Enhanced maintainability
- Reduced technical debt

### Repository Optimization

- Significant space savings through cleanup
- Improved project organization
- Faster build and deployment processes
- Better developer experience
- Reduced maintenance overhead

### Process Improvements

- Systematic optimization approach
- Measurable improvement metrics
- Safe transformation practices
- Coordinated multi-agent workflows
- Comprehensive validation procedures

## Quality Assurance

All optimization agents follow strict quality guidelines:

- Thorough analysis before any modifications
- Preservation of existing functionality
- Comprehensive testing and validation
- Clear documentation of all changes
- Measurable success criteria
- Safety-first approach to all operations

## Next Steps

1. Test the optimization system with: `> Use the optimization-orchestrator to analyze the repository`
2. Monitor optimization results and impact metrics
3. Refine agents based on performance and feedback
4. Expand optimization capabilities based on identified patterns
5. Document successful optimization strategies for future reference
