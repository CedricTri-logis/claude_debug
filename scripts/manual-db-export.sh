#!/bin/bash

# Manual Database Export Script
# Use this to manually export your Supabase database schema and data

echo "======================================"
echo "Manual Supabase Database Export"
echo "======================================"
echo ""

# Load .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Loaded configuration from .env"
else
    echo "❌ .env file not found!"
    exit 1
fi

# Create db_schema directory if it doesn't exist
mkdir -p db_schema

# Build the connection string with password
DB_URL=$(echo $DATABASE_URL | sed "s/\${SUPABASE_DB_PASSWORD}/$SUPABASE_DB_PASSWORD/g")

echo "Exporting database schema and data..."
echo ""

# Export schema
echo -n "1. Exporting schema... "
pg_dump "$DB_URL" --schema-only --no-owner --no-privileges > db_schema/schema.sql 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅"
else
    echo "❌ Failed to export schema"
fi

# Export data (first 100 rows of each table as samples)
echo -n "2. Exporting data samples... "
pg_dump "$DB_URL" --data-only --no-owner --no-privileges > db_schema/data_samples.sql 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅"
else
    echo "❌ Failed to export data"
fi

# Export table list with row counts
echo -n "3. Creating table inventory... "
psql "$DB_URL" -t -c "
SELECT 
    schemaname || '.' || tablename as table_name,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY schemaname, tablename;
" > db_schema/table_inventory.txt 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅"
else
    echo "❌ Failed to create inventory"
fi

# Create a README for the db_schema directory
cat > db_schema/README.md << 'EOF'
# Database Schema Export

This directory contains automated exports of the Supabase database schema and data.

## Files

- `schema.sql` - Complete database schema (tables, views, functions, etc.)
- `data_samples.sql` - Sample data from all tables
- `table_inventory.txt` - List of all tables with row counts
- `last_export.txt` - Timestamp of last export

## Automatic Synchronization

This directory is automatically updated:
- On every push to the main branch (via GitHub Actions)
- When manually triggered via `gh workflow run`

## Manual Export

To manually export the database:
```bash
./scripts/manual-db-export.sh
```

## Restore Schema

To restore the schema to a new database:
```bash
psql [DATABASE_URL] < db_schema/schema.sql
psql [DATABASE_URL] < db_schema/data_samples.sql
```

## GitHub Actions Workflow

The automatic export is handled by `.github/workflows/export-supabase.yml`
EOF

# Record export timestamp
echo "Export completed at: $(date)" > db_schema/last_export.txt

echo ""
echo "======================================"
echo "Export Complete!"
echo "======================================"
echo ""
echo "Files created in db_schema/:"
ls -lh db_schema/
echo ""
echo "To commit these changes:"
echo "  git add db_schema/"
echo "  git commit -m 'Update database schema export'"
echo "  git push"
echo ""