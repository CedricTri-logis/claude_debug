# Production Scripts

This directory contains **production-ready operational scripts** that are permanent parts of the infrastructure. These scripts are connected to APIs, used in CI/CD workflows, and essential for project operations.

## ⚠️ WARNING: Production Scripts

**These scripts are mission-critical and should NOT be deleted or modified without careful consideration.**

## Categories

### 🏗️ Infrastructure Setup

- **`setup-github-secrets.sh`** - Configure GitHub Actions secrets
- **`setup-supabase-secrets.sh`** - Configure Supabase environment variables
- **`validate-initialization.sh`** - Validate project setup and configuration

### 🗄️ Database Operations

- **`run-migration.js`** - Database migration runner with safety checks
- **`run-migration-pg.js`** - PostgreSQL-specific migration runner
- **`export-schema.js`** - Automated schema export for CI/CD
- **`manual-db-export.sh`** - Manual database backup and export process

## Usage

### Migration Scripts

```bash
# Run a database migration
node scripts/run-migration.js database/migrations/001_create_products_table.sql

# Rollback a migration
node scripts/run-migration.js database/migrations/001_create_products_table.sql --rollback
```

### Setup Scripts

```bash
# Set up GitHub secrets (requires GitHub CLI)
./scripts/setup-github-secrets.sh

# Set up Supabase configuration
./scripts/setup-supabase-secrets.sh

# Validate project initialization
./scripts/validate-initialization.sh
```

### Export Scripts

```bash
# Export database schema (automated)
node scripts/export-schema.js

# Manual database export
./scripts/manual-db-export.sh
```

## Integration Points

### GitHub Actions

- `export-schema.js` is used in `.github/workflows/export-supabase.yml`
- Triggered on database migrations and daily schedule

### Package.json Scripts

- `migrate:up` → `run-migration.js`
- `migrate:down` → `run-migration.js --rollback`

### Environment Dependencies

All scripts require proper environment configuration:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_PASSWORD`
- `DATABASE_URL`

## Maintenance Notes

- These scripts are designed for **long-term use**
- They include **error handling** and **safety checks**
- They are **version controlled** and **documented**
- They support **production environments**

## Safety Guidelines

1. **Test in development** before running in production
2. **Backup databases** before running migrations
3. **Verify environment** variables are correct
4. **Review logs** after script execution
5. **Never modify** without understanding dependencies
