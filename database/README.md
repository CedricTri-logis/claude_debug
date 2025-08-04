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
