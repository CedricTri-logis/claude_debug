# Repository Initialization Guide

## Step 1: Gather Supabase Credentials

You need to collect the following credentials from your Supabase project:

### From Supabase Dashboard (https://app.supabase.com):

1. **SUPABASE_ACCESS_TOKEN**: 
   - Go to Account Settings → Access Tokens
   - Create a new personal access token
   - Copy the token (you won't see it again)

2. **SUPABASE_PROJECT_ID**:
   - Go to your project dashboard
   - Settings → General
   - Copy the "Reference ID" (looks like: xyzabc123def)

3. **Database Credentials**:
   - Go to Settings → Database
   - Under "Connection string" section:
     - **SUPABASE_DB_HOST**: The host URL (e.g., db.xyzabc123def.supabase.co)
     - **SUPABASE_DB_PORT**: Usually 5432
     - **SUPABASE_DB_NAME**: Usually "postgres"
     - **SUPABASE_DB_USER**: Usually "postgres"
     - **SUPABASE_DB_PASSWORD**: Your database password (set during project creation)

## Step 2: Set GitHub Secrets

Run these commands to set up your GitHub secrets:

```bash
# Set each secret (you'll be prompted to enter the value)
gh secret set SUPABASE_ACCESS_TOKEN
gh secret set SUPABASE_PROJECT_ID
gh secret set SUPABASE_DB_PASSWORD
gh secret set SUPABASE_DB_USER
gh secret set SUPABASE_DB_HOST
gh secret set SUPABASE_DB_PORT
gh secret set SUPABASE_DB_NAME
```

Alternatively, set them all at once:

```bash
# Replace the values with your actual credentials
echo "your-access-token" | gh secret set SUPABASE_ACCESS_TOKEN
echo "your-project-id" | gh secret set SUPABASE_PROJECT_ID
echo "your-db-password" | gh secret set SUPABASE_DB_PASSWORD
echo "postgres" | gh secret set SUPABASE_DB_USER
echo "db.your-project.supabase.co" | gh secret set SUPABASE_DB_HOST
echo "5432" | gh secret set SUPABASE_DB_PORT
echo "postgres" | gh secret set SUPABASE_DB_NAME
```

## Step 3: Create Local Environment File

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values:

```bash
# Supabase configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Add your Sentry and Logflare credentials as well
```

## Step 4: Verify Setup

After setting up all secrets, verify they're configured:

```bash
# List all secrets (won't show values)
gh secret list

# Trigger the workflow manually
gh workflow run "Export Supabase Schema and Data"

# Watch the workflow execution
gh run watch
```

## Step 5: Sourcegraph Indexing

1. Go to your Sourcegraph instance (https://sourcegraph.com or your company instance)
2. Add repository: Settings → Repositories → Add repositories
3. Search for: `github.com/CedricTri-logis/claude_debug`
4. Enable indexing and code intelligence

## Validation Checklist

- [ ] All 7 Supabase secrets configured in GitHub
- [ ] .env file created with local credentials
- [ ] GitHub Actions workflow created (.github/workflows/export-supabase.yml)
- [ ] First workflow run successful
- [ ] db_schema/ directory created after first run
- [ ] Repository indexed in Sourcegraph

## Troubleshooting

### Workflow Fails with Authentication Error
- Verify SUPABASE_ACCESS_TOKEN is valid
- Check token hasn't expired
- Ensure token has necessary permissions

### Database Connection Failed
- Verify database password is correct
- Check if database host allows external connections
- Confirm port 5432 is correct (some projects use 6543)

### Schema Export is Empty
- Ensure your Supabase project has tables created
- Check database user has read permissions
- Verify connection string format

## Next Steps

Once initialization is complete:
1. Push to main branch to trigger automatic schema export
2. Check Actions tab for workflow status
3. Review exported schema in db_schema/ directory
4. Start using the debugging infrastructure with Sentry and Logflare integration