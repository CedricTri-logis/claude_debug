# Deployment & Infrastructure Tools

Production deployment and infrastructure management tools for system setup, configuration, and maintenance.

## 🎯 Purpose

These tools handle production infrastructure setup, schema exports, environment configuration, and system validation. They are critical for deployment and operational maintenance.

## 🛠️ Available Tools

### Schema & Export Tools

#### `export-schema.js` - Automated Schema Export

**Exports database schema for CI/CD integration**

```bash
node tools/production/deployment/export-schema.js
```

**Features**:

- Supabase client-based export
- Structured schema documentation
- Data samples export
- Export summary generation
- CI/CD integration ready

**Outputs**:

- `database/schema/schema.sql` - Complete schema
- `database/samples/data_samples.json` - Sample data
- `database/exports/export_summary.json` - Export metadata

#### `manual-db-export.sh` - Manual Database Backup

**Manual database export for backup purposes**

```bash
./tools/production/deployment/manual-db-export.sh
```

**Features**:

- pg_dump-based export
- Schema and data separation
- Table inventory generation
- Export timestamp recording
- Git integration guidance

**Outputs**:

- `database/schema/schema.sql` - Schema only
- `database/samples/data_samples.sql` - Data only
- `database/exports/table_inventory.txt` - Table listing
- `database/exports/last_export.txt` - Export timestamp

### Environment Setup Tools

#### `setup-github-secrets.sh` - GitHub Actions Configuration

**Configure GitHub Actions secrets for CI/CD**

```bash
./tools/production/deployment/setup-github-secrets.sh
```

**Requirements**:

- GitHub CLI (`gh`) installed and authenticated
- Repository access permissions
- Supabase project credentials

**Configured Secrets**:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_DB_HOST`
- `SUPABASE_DB_PORT`
- `SUPABASE_DB_NAME`

#### `setup-supabase-secrets.sh` - Supabase Environment Setup

**Configure local Supabase environment variables**

```bash
./tools/production/deployment/setup-supabase-secrets.sh
```

**Features**:

- Interactive credential collection
- Environment file generation
- Connection validation
- Security best practices

**Outputs**:

- Updated `.env` file
- Connection validation report
- Security recommendations

#### `validate-initialization.sh` - System Validation

**Validate complete system initialization**

```bash
./tools/production/deployment/validate-initialization.sh
```

**Validation Checks**:

- Environment variables
- Database connectivity
- Schema integrity
- GitHub Actions setup
- Required dependencies

## 🔧 Usage Patterns

### Initial Setup Workflow

```bash
# 1. Configure Supabase environment
./tools/production/deployment/setup-supabase-secrets.sh

# 2. Set up GitHub Actions
./tools/production/deployment/setup-github-secrets.sh

# 3. Validate complete setup
./tools/production/deployment/validate-initialization.sh

# 4. Export initial schema
node tools/production/deployment/export-schema.js
```

### Regular Maintenance

```bash
# Weekly manual backup
./tools/production/deployment/manual-db-export.sh

# After schema changes
node tools/production/deployment/export-schema.js

# Before major deployments
./tools/production/deployment/validate-initialization.sh
```

### CI/CD Integration

```bash
# Automated in GitHub Actions
node tools/production/deployment/export-schema.js
# Runs after migrations
# Commits changes back to repository
```

## 🔒 Security Considerations

### Secrets Management

- **Never commit secrets** to version control
- **Use GitHub Secrets** for CI/CD credentials
- **Rotate credentials** regularly
- **Audit access** to sensitive tools

### Environment Separation

- **Development**: Use test databases
- **Staging**: Mirror production setup
- **Production**: Full security validation

### Access Control

- **GitHub Actions**: Require write permissions
- **Database**: Use service role keys
- **Scripts**: Validate user permissions

## 📋 Environment Requirements

### Required Environment Variables

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_DB_PASSWORD=your-db-password

# Database Connection
DATABASE_URL=postgresql://postgres:password@host:port/db

# GitHub Actions (if using manual setup)
GITHUB_TOKEN=ghp_...
```

### Required Dependencies

- **Node.js 18+** - For JavaScript tools
- **PostgreSQL client** - For pg_dump tools
- **GitHub CLI** - For secrets management
- **Supabase CLI** - For advanced operations

## 🚨 Production Safety

### Pre-Deployment

1. **Validate environment** - Run validation script
2. **Backup database** - Create manual backup
3. **Test in staging** - Verify tools work
4. **Review credentials** - Check secret rotation

### During Deployment

1. **Monitor exports** - Watch schema export process
2. **Validate outputs** - Check generated files
3. **Test connectivity** - Verify database access
4. **Check GitHub Actions** - Ensure CI/CD works

### Post-Deployment

1. **Verify schema** - Confirm schema accuracy
2. **Test application** - Check app functionality
3. **Monitor CI/CD** - Ensure automation works
4. **Document changes** - Update deployment log

## 🔄 Integration Points

### GitHub Actions Workflow

```yaml
name: Export Schema
on:
  push:
    paths: ["database/migrations/**"]
jobs:
  export:
    steps:
      - run: node tools/production/deployment/export-schema.js
```

### NPM Scripts (if needed)

```json
{
  "export:schema": "node tools/production/deployment/export-schema.js",
  "backup:manual": "./tools/production/deployment/manual-db-export.sh",
  "validate:init": "./tools/production/deployment/validate-initialization.sh"
}
```

### Database Migration Integration

1. Migration runs via migration tools
2. Schema export triggers automatically
3. Changes committed to repository
4. CI/CD pipeline updates

## 🆘 Troubleshooting

### Export Failures

- **Check credentials** - Verify Supabase keys
- **Database access** - Test connection manually
- **Permissions** - Ensure service role access
- **File system** - Check directory permissions

### GitHub Secrets Issues

- **CLI authentication** - Re-run `gh auth login`
- **Repository access** - Verify permissions
- **Secret names** - Check exact naming
- **Token expiry** - Refresh GitHub token

### Validation Failures

- **Environment variables** - Check .env file
- **Database connection** - Test connectivity
- **Dependencies** - Install missing tools
- **Permissions** - Check file access rights

## 📊 Monitoring & Logging

### Export Monitoring

- Schema export frequency
- File size trends
- Export success/failure rates
- Performance metrics

### Security Monitoring

- Secret access patterns
- Failed authentication attempts
- Credential rotation schedules
- Access audit logs

### Operational Monitoring

- Script execution times
- Resource usage patterns
- Error frequencies
- Deployment success rates

## 📝 Best Practices

1. **Regular exports** - Schedule periodic schema exports
2. **Credential rotation** - Rotate secrets quarterly
3. **Environment validation** - Validate before deployments
4. **Backup strategy** - Maintain regular backups
5. **Security audits** - Review access regularly
6. **Documentation** - Keep setup docs current
7. **Testing** - Test tools in staging first
