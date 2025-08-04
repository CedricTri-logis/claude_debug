#!/bin/bash

# Setup script for Supabase GitHub secrets
# This script helps you configure all required secrets for the Supabase integration

set -e

echo "=========================================="
echo "Supabase GitHub Secrets Configuration"
echo "=========================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Please install it first: https://cli.github.com/"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository."
    echo "Please run this script from your repository root."
    exit 1
fi

# Check GitHub authentication
if ! gh auth status > /dev/null 2>&1; then
    echo "❌ Not authenticated with GitHub."
    echo "Please run: gh auth login"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""
echo "Please have your Supabase credentials ready."
echo "You can find them at: https://app.supabase.com"
echo ""
echo "Press Enter to continue..."
read

# Function to set a secret
set_secret() {
    local secret_name=$1
    local description=$2
    local example=$3
    
    echo ""
    echo "----------------------------------------"
    echo "Setting: $secret_name"
    echo "Description: $description"
    if [ -n "$example" ]; then
        echo "Example: $example"
    fi
    echo "----------------------------------------"
    echo "Enter value for $secret_name:"
    read -s secret_value
    echo ""
    
    if [ -z "$secret_value" ]; then
        echo "⚠️  Warning: Empty value provided for $secret_name"
        echo "Do you want to skip this secret? (y/n)"
        read skip
        if [ "$skip" != "y" ]; then
            set_secret "$secret_name" "$description" "$example"
            return
        fi
    else
        echo "$secret_value" | gh secret set "$secret_name"
        echo "✅ $secret_name configured"
    fi
}

# Collect and set all secrets
echo "Let's configure your Supabase secrets:"

set_secret "SUPABASE_ACCESS_TOKEN" \
    "Personal access token from Account Settings → Access Tokens" \
    "sbp_abc123def456..."

set_secret "SUPABASE_PROJECT_ID" \
    "Project Reference ID from Settings → General" \
    "xyzabc123def"

set_secret "SUPABASE_DB_PASSWORD" \
    "Database password (set during project creation)" \
    ""

set_secret "SUPABASE_DB_USER" \
    "Database username (usually 'postgres')" \
    "postgres"

set_secret "SUPABASE_DB_HOST" \
    "Database host from Settings → Database" \
    "db.xyzabc123def.supabase.co"

set_secret "SUPABASE_DB_PORT" \
    "Database port (usually 5432)" \
    "5432"

set_secret "SUPABASE_DB_NAME" \
    "Database name (usually 'postgres')" \
    "postgres"

echo ""
echo "=========================================="
echo "Configuration Summary"
echo "=========================================="
echo ""
echo "Configured secrets:"
gh secret list

echo ""
echo "✅ All secrets have been configured!"
echo ""
echo "Next steps:"
echo "1. Push to main branch to trigger the workflow"
echo "2. Check GitHub Actions tab for workflow status"
echo "3. Verify db_schema/ directory is created after first run"
echo ""
echo "To manually trigger the workflow:"
echo "  gh workflow run 'Export Supabase Schema and Data'"
echo ""
echo "To watch the workflow:"
echo "  gh run watch"