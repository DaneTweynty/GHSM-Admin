#!/bin/bash

# Quick Database Setup for Console Errors Fix
echo "🔧 Creating database tables to fix console errors..."

# Check if we have the schema files
if [ ! -f "database/complete-schema.sql" ]; then
    echo "❌ Schema file not found! Run from project root."
    exit 1
fi

echo "📋 Database setup options:"
echo "1. Manual setup (recommended):"
echo "   - Go to: https://supabase.com/dashboard/project/zkddbolfivqhhkvdmacr/sql"
echo "   - Copy contents of database/complete-schema.sql"
echo "   - Paste and execute in SQL Editor"
echo "   - Copy contents of database/teacher-app-functions.sql"  
echo "   - Paste and execute in SQL Editor"
echo ""
echo "2. Automatic setup (requires database password):"
echo "   - We would need your Supabase database password"
echo "   - This is more complex to set up"

echo ""
echo "🎯 To fix the console errors quickly:"
echo "1. Open: https://supabase.com/dashboard/project/zkddbolfivqhhkvdmacr/sql"
echo "2. Copy and execute database/complete-schema.sql"
echo "3. Copy and execute database/teacher-app-functions.sql"
echo "4. Restart your dev server: npm run dev"

echo ""
echo "📁 Schema files to execute:"
echo "  - database/complete-schema.sql"
echo "  - database/teacher-app-functions.sql"
