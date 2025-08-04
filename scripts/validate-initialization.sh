#!/bin/bash

# Validation script for repository initialization
# Checks all components are properly configured

set -e

echo "=========================================="
echo "Repository Initialization Validation"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ALL_GOOD=true

# Function to check a condition
check() {
    local description=$1
    local command=$2
    
    echo -n "Checking $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Passed${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        ALL_GOOD=false
        return 1
    fi
}

# Function to check file exists
check_file() {
    local description=$1
    local file=$2
    
    echo -n "Checking $description... "
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ Exists${NC}"
        return 0
    else
        echo -e "${RED}✗ Missing${NC}"
        ALL_GOOD=false
        return 1
    fi
}

# Function to check secret exists
check_secret() {
    local secret_name=$1
    
    echo -n "  - $secret_name... "
    
    if gh secret list | grep -q "$secret_name"; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        ALL_GOOD=false
        return 1
    fi
}

echo "1. GitHub Repository Configuration"
echo "-----------------------------------"
check "GitHub CLI authentication" "gh auth status"
check "GitHub repository connection" "gh repo view --json name"
echo ""

echo "2. GitHub Actions Workflow"
echo "-----------------------------------"
check_file "Export Supabase workflow" ".github/workflows/export-supabase.yml"
echo ""

echo "3. GitHub Secrets Configuration"
echo "-----------------------------------"
echo "Checking required secrets:"
check_secret "SUPABASE_ACCESS_TOKEN"
check_secret "SUPABASE_PROJECT_ID"
check_secret "SUPABASE_DB_PASSWORD"
check_secret "SUPABASE_DB_USER"
check_secret "SUPABASE_DB_HOST"
check_secret "SUPABASE_DB_PORT"
check_secret "SUPABASE_DB_NAME"
echo ""

echo "4. Local Configuration"
echo "-----------------------------------"
check_file "Environment template" ".env.example"
if [ -f ".env" ]; then
    echo -e "Local .env file... ${GREEN}✓ Exists${NC}"
else
    echo -e "Local .env file... ${YELLOW}⚠ Not created (optional for CI/CD)${NC}"
fi
echo ""

echo "5. Project Structure"
echo "-----------------------------------"
check_file "Package.json" "package.json"
check_file "Initialization guide" "INITIALIZATION_GUIDE.md"
if [ -d "db_schema" ]; then
    echo -e "Database schema directory... ${GREEN}✓ Exists${NC}"
    if [ -f "db_schema/schema.sql" ]; then
        echo -e "  - Schema export... ${GREEN}✓ Found${NC}"
    else
        echo -e "  - Schema export... ${YELLOW}⚠ Not yet exported${NC}"
    fi
else
    echo -e "Database schema directory... ${YELLOW}⚠ Will be created on first workflow run${NC}"
fi
echo ""

echo "=========================================="
if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}VALIDATION PASSED${NC}"
    echo "All components are properly configured!"
    echo ""
    echo "You can now:"
    echo "1. Push to main branch to trigger automatic export"
    echo "2. Or manually trigger: gh workflow run 'Export Supabase Schema and Data'"
else
    echo -e "${RED}VALIDATION FAILED${NC}"
    echo "Some components need configuration."
    echo ""
    echo "To fix:"
    echo "1. Run: ./scripts/setup-supabase-secrets.sh"
    echo "2. Follow the INITIALIZATION_GUIDE.md"
fi
echo "=========================================="