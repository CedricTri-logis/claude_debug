# Tools Directory

This directory contains **all development and production tools** organized by purpose and lifecycle. The unified structure makes it clear what each tool does and how important it is to the project.

## 🎯 Organization Principle

Tools are organized by **lifecycle and purpose** rather than being scattered across the repository:

```
tools/
├── production/          # 🏗️ Mission-critical operational tools
├── development/         # 🧪 Temporary development aids
└── testing/            # 🧪 Comprehensive testing framework
```

## 📁 Directory Structure

### 🏗️ **`/production`** - Production Infrastructure

**Purpose**: Critical operational tools that keep the system running

- **Lifecycle**: Permanent - never delete these
- **Usage**: Production deployments, CI/CD, database operations
- **Safety**: High - includes extensive error handling and validation

**Subdirectories**:

- **`migrations/`** - Database migration tools
- **`deployment/`** - Setup, export, and deployment automation

### 🧪 **`/development`** - Development Tools

**Purpose**: Aids for development tasks and exploration

- **Lifecycle**: Temporary - can be cleaned up when no longer needed
- **Usage**: Development phases, debugging, exploration
- **Safety**: Basic - focuses on speed over comprehensive validation

**Subdirectories**:

- **`database/`** - Database inspection and testing tools
- **`diagnostics/`** - Simple diagnostic utilities

### 🧪 **`/testing`** - Testing Framework

**Purpose**: Comprehensive automated testing infrastructure

- **Lifecycle**: Permanent - part of quality assurance
- **Usage**: Automated testing, CI/CD, regression testing
- **Safety**: Systematic - structured test patterns with reporting

**Subdirectories**:

- **`suites/`** - Test suites and individual tests
- **`runners/`** - Test execution engines
- **`utils/`** - Testing utilities and setup
- **`config/`** - Test environment configuration

## 🚀 Quick Access

### Most Common Commands

```bash
# Run all tests
npm test

# Database migration
npm run migrate:up

# Test database connection
npm run test:products

# Manual database export
./tools/production/deployment/manual-db-export.sh
```

### Direct Tool Access

```bash
# Production tools
node tools/production/migrations/run-migration.js <migration-file>
node tools/production/deployment/export-schema.js

# Development tools
node tools/development/database/database-info.js
node tools/development/diagnostics/test-connection.js

# Testing tools
node tools/testing/runners/parallel-runner.js
node tools/testing/suites/connection.test.js
```

## 📋 Tool Categories by Function

### Database Tools

| Tool             | Location                 | Purpose             | Lifecycle   |
| ---------------- | ------------------------ | ------------------- | ----------- |
| Migration Runner | `production/migrations/` | Execute migrations  | Production  |
| Schema Export    | `production/deployment/` | Export for CI/CD    | Production  |
| Database Info    | `development/database/`  | Inspect database    | Development |
| Table Listing    | `development/database/`  | List tables         | Development |
| Products Test    | `development/database/`  | Test specific table | Development |
| Connection Test  | `testing/suites/`        | Test connectivity   | Testing     |

### Infrastructure Tools

| Tool           | Location                 | Purpose               | Lifecycle  |
| -------------- | ------------------------ | --------------------- | ---------- |
| GitHub Setup   | `production/deployment/` | Configure secrets     | Production |
| Supabase Setup | `production/deployment/` | Configure environment | Production |
| Validation     | `production/deployment/` | Validate setup        | Production |
| Manual Export  | `production/deployment/` | Manual backup         | Production |

### Testing Tools

| Tool              | Location                             | Purpose               | Lifecycle |
| ----------------- | ------------------------------------ | --------------------- | --------- |
| Parallel Runner   | `testing/runners/`                   | Execute test suites   | Testing   |
| Connection Tests  | `testing/suites/`                    | Database connectivity | Testing   |
| Logger Tests      | `testing/suites/`                    | Unit testing          | Testing   |
| Parallel Analysis | `testing/suites/parallel-execution/` | Parallel testing      | Testing   |
| Test Setup        | `testing/utils/`                     | Test environment      | Testing   |

## 🔧 Maintenance Guidelines

### Production Tools

- **Never delete** without understanding dependencies
- **Test thoroughly** before making changes
- **Document changes** and update version control
- **Backup first** for database operations
- **Review logs** after execution

### Development Tools

- **Review regularly** (monthly) for obsolete tools
- **Delete safely** when development phase complete
- **Archive valuable** tools instead of deleting
- **Update references** when removing tools

### Testing Tools

- **Maintain actively** as part of CI/CD
- **Update regularly** with new features
- **Monitor performance** of test execution
- **Expand coverage** as codebase grows

## 🛠️ Adding New Tools

### For Production Tools

1. Place in appropriate `production/` subdirectory
2. Include comprehensive error handling
3. Add logging for audit trail
4. Create rollback procedures
5. Document in README
6. Test thoroughly before deployment

### For Development Tools

1. Place in appropriate `development/` subdirectory
2. Include creation date in comments
3. Document expected lifespan
4. Add cleanup reminder
5. Keep minimal documentation

### For Testing Tools

1. Follow testing framework patterns
2. Place in appropriate `testing/` subdirectory
3. Include setup/teardown procedures
4. Integrate with parallel runner
5. Update package.json scripts

## 🗂️ Migration from Old Structure

This directory replaces the previous scattered structure:

| Old Location    | New Location                      | Notes                      |
| --------------- | --------------------------------- | -------------------------- |
| `/scripts/`     | `/tools/production/`              | Mission-critical tools     |
| `/dev-scripts/` | `/tools/development/database/`    | Development database tools |
| `/utilities/`   | `/tools/development/diagnostics/` | Diagnostic utilities       |
| `/tests/`       | `/tools/testing/`                 | Complete testing framework |

All references have been updated in:

- `package.json` scripts
- Documentation files
- Import statements
- GitHub Actions workflows

## 📚 Further Reading

- **[Production Tools](production/README.md)** - Operational infrastructure
- **[Development Tools](development/README.md)** - Development aids and lifecycle
- **[Testing Framework](testing/README.md)** - Comprehensive testing guide

---

_The unified tools directory provides clear organization by purpose and lifecycle, making it easy to find, use, and maintain all project tools._
