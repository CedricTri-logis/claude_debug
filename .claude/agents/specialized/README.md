# Specialized High-Permission Agents

## ⚠️ WARNING: DANGEROUS ZONE
This directory contains specialized agents with elevated permissions that can perform potentially destructive operations. These agents implement multiple layers of guardrails to prevent accidental data loss or system damage.

## Guardrail System Overview

### Multi-Layer Protection Architecture

```
User Request
    ↓
Layer 1: Risk Assessment
    ├── SAFE Operations (auto-proceed)
    ├── MODERATE Operations (require explanation)
    ├── DANGEROUS Operations (require confirmation)
    └── CRITICAL Operations (require typed confirmation)
    ↓
Layer 2: Pre-Operation Checks
    ├── Backup verification
    ├── Dependency analysis
    ├── Impact assessment
    └── Syntax validation
    ↓
Layer 3: Operation Logging
    ├── SQL statement logging
    ├── Timestamp recording
    ├── User confirmation tracking
    └── Rollback script generation
    ↓
Layer 4: Post-Operation
    ├── Schema export
    ├── Migration file creation
    ├── Verification queries
    └── Audit trail update
```

## Risk Categories

### 🟢 SAFE Operations
- **No confirmation required**
- Examples: SELECT, DESCRIBE, SHOW TABLES
- INSERT (single records)
- CREATE TABLE (new tables)

### 🟡 MODERATE Operations
- **Requires explanation of impact**
- UPDATE with WHERE clause
- DELETE with WHERE clause limiting scope
- ALTER TABLE ADD COLUMN
- CREATE INDEX

### 🔴 DANGEROUS Operations
- **Requires explicit YES/NO confirmation**
- DROP TABLE
- TRUNCATE TABLE
- DELETE without WHERE clause
- ALTER TABLE DROP COLUMN
- CASCADE operations

### ⚫ CRITICAL Operations
- **Requires typed confirmation matching operation**
- DROP DATABASE
- DROP SCHEMA
- Mass deletion (>1000 rows)
- Operations affecting system tables
- Disabling Row Level Security

## Confirmation Flow

### Standard Confirmation (DANGEROUS)
```
┌─────────────────────────────────────────┐
│ ⚠️  DANGEROUS OPERATION DETECTED        │
├─────────────────────────────────────────┤
│ Operation: DROP TABLE user_profiles     │
│ Impact: Will permanently delete:        │
│   - Table: user_profiles (4,523 rows)   │
│   - Indexes: 3 indexes will be removed  │
│   - Dependencies: 2 views will break    │
│                                          │
│ Backup Status: ✅ Last backup 2h ago    │
│ Rollback Script: ✅ Generated           │
│                                          │
│ Type 'YES' to proceed or 'NO' to cancel │
└─────────────────────────────────────────┘
```

### Typed Confirmation (CRITICAL)
```
┌─────────────────────────────────────────┐
│ 🚨 CRITICAL OPERATION - EXTREME CAUTION │
├─────────────────────────────────────────┤
│ Operation: DROP SCHEMA public CASCADE   │
│ Impact: WILL DELETE ENTIRE DATABASE     │
│   - Tables: 47 tables                   │
│   - Total Rows: ~2.3M records           │
│   - Functions: 23 stored procedures     │
│   - THIS CANNOT BE UNDONE               │
│                                          │
│ To proceed, type exactly:               │
│ "CONFIRM DROP SCHEMA public"            │
└─────────────────────────────────────────┘
```

## Agent Directory

### 1. Supabase Database Architect (`_main.supabase-architect.md`)
**Purpose**: Complete database schema management with full DDL/DML capabilities

**Capabilities**:
- Create, modify, and delete database objects
- Execute complex migrations
- Manage Row Level Security policies
- Perform data imports/exports
- Handle database optimization

**Guardrails**:
- Automatic backup verification before destructive operations
- Migration file generation for all schema changes
- Rollback script creation
- SQL injection prevention
- Operation audit logging

## Operation Logging

All operations are logged to `.claude/agents/specialized/db_operations_log.json`:

```json
{
  "timestamp": "2024-01-20T10:30:00Z",
  "agent": "supabase-architect",
  "operation_type": "DROP_TABLE",
  "risk_level": "DANGEROUS",
  "sql": "DROP TABLE user_profiles CASCADE",
  "user_confirmed": true,
  "confirmation_text": "YES",
  "backup_verified": true,
  "rollback_script": "migrations/rollback_20240120_103000.sql",
  "execution_time_ms": 145,
  "rows_affected": 4523,
  "success": true
}
```

## Safety Features

### 1. Automatic Backup Verification
- Checks last backup timestamp before DANGEROUS/CRITICAL operations
- Warns if backup is older than 24 hours
- Can trigger manual backup if needed

### 2. Dependency Analysis
- Identifies all dependent objects before deletion
- Shows cascade impact
- Prevents breaking production systems

### 3. Migration Management
- Generates timestamped migration files
- Creates corresponding rollback scripts
- Maintains migration history

### 4. Dry Run Mode
- Test SQL execution without committing
- Preview affected rows
- Validate syntax and permissions

### 5. Rate Limiting
- Prevents rapid successive dangerous operations
- Requires cooldown between critical operations
- Protects against automation errors

## Best Practices

1. **Always review the impact assessment** before confirming operations
2. **Ensure recent backups exist** for production databases
3. **Test operations on development database first** when possible
4. **Keep migration files in version control** for team visibility
5. **Review operation logs regularly** to audit database changes
6. **Use dry-run mode** for complex or unfamiliar operations
7. **Set up monitoring alerts** for critical operations

## Emergency Procedures

### If an operation goes wrong:

1. **DON'T PANIC** - Most operations have rollback scripts
2. **Check the operation log** for the rollback script location
3. **Execute the rollback script** if available
4. **Restore from backup** if rollback fails
5. **Document the incident** in the operation log

### Rollback Script Location:
```
.claude/agents/specialized/migrations/
├── rollback_[timestamp].sql
├── migration_[timestamp].sql
└── operation_log_[timestamp].json
```

## Adding New Specialized Agents

When adding new high-permission agents to this directory:

1. **Implement ALL guardrail layers** described above
2. **Define clear risk categories** for operations
3. **Create confirmation templates** appropriate to risk level
4. **Add operation logging** with complete audit trail
5. **Generate rollback mechanisms** where possible
6. **Update this README** with agent documentation
7. **Test guardrails extensively** before production use

## Configuration

Guardrail behavior can be customized in `.claude/agents/specialized/config.json`:

```json
{
  "require_backup_check": true,
  "max_backup_age_hours": 24,
  "enable_dry_run": true,
  "operation_cooldown_seconds": 30,
  "max_rows_without_confirmation": 1000,
  "log_retention_days": 90,
  "auto_generate_rollback": true
}
```

---

**Remember**: With great power comes great responsibility. These agents are powerful tools that require careful use and respect for the data they manage.