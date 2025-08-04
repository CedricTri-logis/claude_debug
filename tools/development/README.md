# Development Scripts

This directory contains **temporary development and testing scripts** used during development phases. These scripts are **not permanent** and can be safely deleted once they've served their purpose.

## 🧪 Purpose: Development & Testing Only

**These scripts are temporary tools created for specific development tasks and testing scenarios.**

## Current Scripts

### 🔍 Database Development Tools

- **`test-products-table.js`** - One-time products table testing (created for initial table validation)
- **`database-info.js`** - Database inspection utility for development
- **`list-tables.js`** - List all database tables (development aid)
- **`list-user-tables.js`** - List user-created tables (development aid)

## Usage

### Table Testing

```bash
# Test products table functionality
npm run test:products
# or directly:
node dev-scripts/test-products-table.js
```

### Database Inspection

```bash
# Get database information
node dev-scripts/database-info.js

# List all tables
node dev-scripts/list-tables.js

# List user tables only
node dev-scripts/list-user-tables.js
```

## Lifecycle Management

### ✅ Safe to Delete When:

- Development phase is complete
- Testing objectives have been met
- Similar functionality exists in production tools
- Scripts haven't been used in 30+ days

### 🔄 Cleanup Process

Periodically review and remove obsolete scripts:

1. **Check last usage date**
2. **Verify no active references** in documentation or other scripts
3. **Confirm functionality is covered** by production tools
4. **Remove obsolete scripts** and update any references

## Development vs Production

| Aspect             | Dev Scripts                          | Production Scripts                |
| ------------------ | ------------------------------------ | --------------------------------- |
| **Purpose**        | Testing, exploration, one-time tasks | Operations, CI/CD, infrastructure |
| **Lifespan**       | Temporary (weeks/months)             | Permanent                         |
| **Error Handling** | Basic                                | Comprehensive                     |
| **Documentation**  | Minimal                              | Extensive                         |
| **Safety Checks**  | Limited                              | Robust                            |
| **Dependencies**   | Development only                     | Production-ready                  |

## Best Practices

### Creating New Dev Scripts

1. **Clear naming** - Include purpose in filename
2. **Add creation date** in comments
3. **Document purpose** and expected lifespan
4. **Include cleanup reminder** after 30 days

### Before Deleting

1. **Check git history** for usage patterns
2. **Search codebase** for references
3. **Verify testing coverage** exists elsewhere
4. **Update documentation** if referenced

## Archive Strategy

Instead of deleting valuable scripts immediately:

```bash
# Create archive directory
mkdir -p dev-scripts/archive

# Move old scripts
mv dev-scripts/old-script.js dev-scripts/archive/
```

## Integration with Testing Framework

Some dev scripts may graduate to the formal testing framework:

- Move useful tests to `/tests` directory
- Integrate with test runner in `/tests/parallel/runner.js`
- Update package.json test scripts accordingly

## Environment

Dev scripts typically use the same environment as production scripts but may:

- Have **less strict validation**
- Include **debug output**
- **Skip safety checks** for speed
- Use **development databases** when available
