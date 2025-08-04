#!/bin/bash

# Setup GitHub Secrets for Supabase Database Export
# This script configures all necessary GitHub secrets for automatic database synchronization

echo "======================================"
echo "GitHub Secrets Setup for Supabase"
echo "======================================"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Please install it first: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub."
    echo "Please run: gh auth login"
    exit 1
fi

# Load .env file to get values
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Loaded values from .env file"
else
    echo "❌ .env file not found!"
    exit 1
fi

echo ""
echo "Setting up GitHub secrets..."
echo ""

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$secret_value" ] || [[ "$secret_value" == *"your-"* ]]; then
        echo "❌ $secret_name is not configured in .env"
        return 1
    fi
    
    echo -n "Setting $secret_name... "
    echo "$secret_value" | gh secret set "$secret_name" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅"
    else
        echo "❌ Failed"
        return 1
    fi
}

# Get Supabase project reference from URL
SUPABASE_PROJECT_ID=$(echo $SUPABASE_URL | sed -n 's/https:\/\/\([^.]*\)\.supabase\.co/\1/p')

# Get database host from DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')

# Set all required secrets
echo "1. Setting SUPABASE_ACCESS_TOKEN..."
echo "   ⚠️  You need to get this from: https://supabase.com/dashboard/account/tokens"
echo "   Please enter your Supabase Access Token (or press Enter to skip):"
read -s SUPABASE_ACCESS_TOKEN
if [ ! -z "$SUPABASE_ACCESS_TOKEN" ]; then
    set_secret "SUPABASE_ACCESS_TOKEN" "$SUPABASE_ACCESS_TOKEN"
else
    echo "   Skipped - you'll need to set this manually"
fi

echo ""
set_secret "SUPABASE_PROJECT_ID" "$SUPABASE_PROJECT_ID"
set_secret "SUPABASE_DB_PASSWORD" "$SUPABASE_DB_PASSWORD"
set_secret "SUPABASE_DB_USER" "postgres"
set_secret "SUPABASE_DB_HOST" "$DB_HOST"
set_secret "SUPABASE_DB_PORT" "5432"
set_secret "SUPABASE_DB_NAME" "postgres"

echo ""
echo "======================================"
echo "Verification"
echo "======================================"
echo ""

# List all secrets
echo "Current GitHub secrets:"
gh secret list

echo ""
echo "======================================"
echo "Next Steps"
echo "======================================"
echo ""
echo "1. If you haven't set SUPABASE_ACCESS_TOKEN:"
echo "   - Go to: https://supabase.com/dashboard/account/tokens"
echo "   - Create a new access token"
echo "   - Run: gh secret set SUPABASE_ACCESS_TOKEN"
echo ""
echo "2. Trigger the workflow:"
echo "   - Commit and push to main branch, OR"
echo "   - Manually trigger: gh workflow run 'Export Supabase Schema and Data'"
echo ""
echo "3. Check workflow status:"
echo "   - gh run list"
echo "   - gh run watch"
echo ""