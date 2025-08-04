# Database Migration Tools

Production-grade database migration tools for managing schema changes safely.

## 🎯 Purpose

These tools handle database schema migrations with comprehensive safety checks, rollback capabilities, and audit logging. They are essential for production database management.

## 🛠️ Available Tools

### `run-migration.js` - Main Migration Runner

**Primary migration tool with comprehensive safety features**

```bash
# Run a migration
node tools/production/migrations/run-migration.js database/migrations/001_create_products_table.sql

# Rollback a migration
node tools/production/migrations/run-migration.js database/migrations/001_create_products_table.sql --rollback

# Or use rollback file directly
node tools/production/migrations/run-migration.js database/migrations/001_create_products_table_rollback.sql
```

**Features**:

- SQL command parsing with dollar-quote support
- Safety warnings for production instances
- Comprehensive error handling
- Migration file discovery and listing
- Rollback support

### `run-migration-pg.js` - PostgreSQL-Specific Runner

**Specialized migration runner optimized for PostgreSQL**

```bash
# PostgreSQL-optimized migration
node tools/production/migrations/run-migration-pg.js database/migrations/001_create_products_table.sql
```

**Features**:

- PostgreSQL-specific optimizations
- Enhanced transaction handling
- PostgreSQL error code interpretation
- Performance monitoring

## 🔒 Safety Features

### Pre-Migration Checks

- Environment variable validation
- Database connection verification
- Migration file syntax validation
- Backup status confirmation

### During Migration

- Transaction wrapping
- Progress logging
- Error capture and reporting
- Rollback preparation

### Post-Migration

- Success verification
- Schema export trigger
- Audit log creation
- Notification dispatch

## 📋 Migration File Requirements

### Naming Convention

```
001_descriptive_name.sql           # Forward migration
001_descriptive_name_rollback.sql  # Rollback migration
```

### File Structure

```sql
-- Migration: 001_create_products_table.sql
-- Description: Create products table with RLS policies
-- Author: [name]
-- Date: [date]

BEGIN;

-- Forward migration SQL here
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0)
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

COMMIT;
```

### Rollback Structure

```sql
-- Rollback: 001_create_products_table_rollback.sql
-- Rolls back: 001_create_products_table.sql

BEGIN;

-- Rollback SQL (reverse order)
DROP TABLE IF EXISTS products;

COMMIT;
```

## 🚨 Production Safety Guidelines

### Before Running Migrations

1. **Backup the database** - Always create a backup
2. **Test in staging** - Verify migration works in staging environment
3. **Review SQL carefully** - Check for potential data loss
4. **Prepare rollback** - Ensure rollback script is ready
5. **Schedule maintenance** - Plan for potential downtime

### During Migration

1. **Monitor closely** - Watch logs for errors
2. **Be ready to rollback** - Have rollback command ready
3. **Check performance** - Monitor database performance
4. **Verify data integrity** - Spot-check critical data

### After Migration

1. **Verify success** - Check that migration completed
2. **Test application** - Ensure app functionality works
3. **Monitor for issues** - Watch for post-migration problems
4. **Document completion** - Log successful migration

## ⚠️ Common Pitfalls

### SQL Syntax Issues

- **Dollar quotes**: Use `$$` for function definitions
- **Semicolons**: Properly separate commands
- **Comments**: Use `--` for comments, not `#`

### Data Loss Risks

- **Column drops**: Always backup before dropping columns
- **Type changes**: Be careful with data type conversions
- **Constraint additions**: May fail on existing data

### Performance Impact

- **Large tables**: Consider chunked migrations
- **Indexes**: Create indexes during low-traffic periods
- **Locks**: Be aware of table locking implications

## 🔄 Rollback Procedures

### Automatic Rollback

```bash
# Use --rollback flag
node tools/production/migrations/run-migration.js migration.sql --rollback
```

### Manual Rollback

```bash
# Run rollback file directly
node tools/production/migrations/run-migration.js migration_rollback.sql
```

### Emergency Rollback

1. Stop the application to prevent further writes
2. Run the rollback migration immediately
3. Verify data integrity
4. Restart application
5. Investigate the issue

## 📊 Integration Points

### NPM Scripts

```json
{
  "migrate:up": "node tools/production/migrations/run-migration.js",
  "migrate:down": "node tools/production/migrations/run-migration.js --rollback"
}
```

### CI/CD Pipeline

- Migrations run automatically on deployment
- Database schema exported after successful migration
- Rollback triggered on deployment failure

### Monitoring

- Migration events logged to Sentry
- Performance metrics tracked
- Success/failure notifications sent

## 📝 Best Practices

1. **One change per migration** - Keep migrations focused
2. **Descriptive names** - Use clear, descriptive filenames
3. **Test rollbacks** - Always test rollback scripts
4. **Version control** - Commit migrations with code changes
5. **Documentation** - Comment complex migrations thoroughly

## 🆘 Troubleshooting

### Migration Fails

1. Check error logs for SQL syntax issues
2. Verify database permissions
3. Ensure migration dependencies are met
4. Check for data conflicts

### Rollback Fails

1. Manual rollback may be required
2. Check for data dependencies
3. May need to restore from backup

### Performance Issues

1. Monitor query execution times
2. Check for blocking locks
3. Consider chunking large operations
