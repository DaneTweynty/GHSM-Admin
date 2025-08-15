#!/bin/bash

# =============================================
# GHSM Teacher Mobile App Setup Script
# Automated setup for teacher mobile app functionality
# =============================================

set -e  # Exit on any error

echo "🚀 Setting up GHSM Teacher Mobile App..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the GHSM-Admin root directory."
    exit 1
fi

print_status "Checking current directory..."
print_success "Found package.json - proceeding with setup"

# =============================================
# 1. ENVIRONMENT SETUP
# =============================================

print_status "Checking environment variables..."

if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating template..."
    cat > .env << EOL
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration
VITE_APP_NAME=GHSM Teacher App
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development

# Feature Flags
VITE_ENABLE_CHAT=true
VITE_ENABLE_ATTENDANCE=true
VITE_ENABLE_SESSION_SUMMARIES=true
VITE_ENABLE_OFFLINE_MODE=false

# File Upload Configuration
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,audio/mpeg,audio/wav,application/pdf

# Debug Configuration
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
EOL
    print_warning "Please update .env file with your actual Supabase credentials"
else
    print_success ".env file found"
fi

# =============================================
# 2. DEPENDENCIES CHECK
# =============================================

print_status "Checking dependencies..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

# Check for required packages
REQUIRED_PACKAGES=(
    "@supabase/supabase-js"
    "react"
    "react-dom"
    "typescript"
    "vite"
)

print_status "Verifying required packages..."
for package in "${REQUIRED_PACKAGES[@]}"; do
    if npm list "$package" > /dev/null 2>&1; then
        print_success "✓ $package"
    else
        print_error "✗ $package is not installed"
        print_status "Installing $package..."
        npm install "$package"
    fi
done

# =============================================
# 3. TYPESCRIPT CONFIGURATION
# =============================================

print_status "Checking TypeScript configuration..."

if [ ! -f "tsconfig.json" ]; then
    print_warning "tsconfig.json not found. This might cause TypeScript issues."
else
    print_success "TypeScript configuration found"
fi

# Check for vite-env.d.ts
if [ ! -f "vite-env.d.ts" ]; then
    print_status "Creating vite-env.d.ts..."
    cat > vite-env.d.ts << 'EOL'
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENVIRONMENT: string;
  readonly VITE_ENABLE_CHAT: string;
  readonly VITE_ENABLE_ATTENDANCE: string;
  readonly VITE_ENABLE_SESSION_SUMMARIES: string;
  readonly VITE_ENABLE_OFFLINE_MODE: string;
  readonly VITE_MAX_FILE_SIZE: string;
  readonly VITE_ALLOWED_FILE_TYPES: string;
  readonly VITE_DEBUG_MODE: string;
  readonly VITE_LOG_LEVEL: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
EOL
    print_success "Created vite-env.d.ts"
fi

# =============================================
# 4. DIRECTORY STRUCTURE VERIFICATION
# =============================================

print_status "Verifying directory structure..."

REQUIRED_DIRS=(
    "database"
    "services"
    "hooks"
    "types"
    "utils"
    "components"
    "pages"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_success "✓ $dir/"
    else
        print_error "✗ $dir/ directory missing"
        mkdir -p "$dir"
        print_status "Created $dir/ directory"
    fi
done

# =============================================
# 5. FILE VERIFICATION
# =============================================

print_status "Verifying required files..."

REQUIRED_FILES=(
    "database/complete-schema.sql"
    "database/teacher-app-functions.sql"
    "services/teacherService.ts"
    "services/authService.ts"
    "types/database.types.ts"
    "hooks/useTeacherAuth.ts"
    "hooks/useTeacherSchedule.ts"
    "hooks/useTeacherStudents.ts"
    "hooks/useTeacherSessionSummaries.ts"
    "hooks/useTeacherAttendance.ts"
    "hooks/useTeacherDashboard.ts"
    "hooks/useTeacherChat.ts"
    "utils/validationUtils.ts"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file"
    else
        print_error "✗ $file missing"
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    print_error "Missing files detected. Please ensure all required files are present."
    print_status "Missing files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
fi

# =============================================
# 6. LINTING AND TYPE CHECKING
# =============================================

print_status "Running TypeScript type checking..."

if npx tsc --noEmit; then
    print_success "TypeScript compilation successful"
else
    print_warning "TypeScript compilation has issues. Please review the errors above."
fi

print_status "Running ESLint..."

if npx eslint . --ext .ts,.tsx --quiet; then
    print_success "ESLint passed"
else
    print_warning "ESLint found issues. Run 'npm run lint' for details."
fi

# =============================================
# 7. SUPABASE SETUP VERIFICATION
# =============================================

print_status "Checking Supabase configuration..."

if grep -q "your_supabase_url_here" .env 2>/dev/null; then
    print_warning "Supabase URL not configured in .env file"
    SUPABASE_CONFIGURED=false
else
    print_success "Supabase URL configured"
    SUPABASE_CONFIGURED=true
fi

if grep -q "your_supabase_anon_key_here" .env 2>/dev/null; then
    print_warning "Supabase anon key not configured in .env file"
    SUPABASE_CONFIGURED=false
else
    print_success "Supabase anon key configured"
fi

# =============================================
# 8. BUILD TEST
# =============================================

print_status "Testing build process..."

if npm run build > /dev/null 2>&1; then
    print_success "Build test successful"
    # Clean up build artifacts
    rm -rf dist 2>/dev/null || true
else
    print_warning "Build test failed. Please check your configuration."
fi

# =============================================
# 9. SETUP SUMMARY
# =============================================

echo ""
echo "=========================================="
echo "🎉 SETUP COMPLETE!"
echo "=========================================="
echo ""

print_success "Teacher Mobile App setup finished!"
echo ""

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    print_success "✓ All required files are present"
else
    print_warning "⚠ Some files are missing (see above)"
fi

if [ "$SUPABASE_CONFIGURED" = true ]; then
    print_success "✓ Supabase is configured"
else
    print_warning "⚠ Supabase configuration needed"
fi

echo ""
echo "Next steps:"
echo "1. Update .env file with your Supabase credentials"
echo "2. Run the database schema in your Supabase project:"
echo "   - Execute database/complete-schema.sql"
echo "   - Execute database/teacher-app-functions.sql"
echo "3. Start the development server: npm run dev"
echo "4. Test the teacher authentication and features"
echo ""

print_status "For detailed documentation, see:"
echo "  - README-TEACHER-APP.md"
echo "  - docs/TEACHER_APP_SETUP.md"
echo "  - docs/API_DOCUMENTATION.md"
echo ""

if [ ${#MISSING_FILES[@]} -gt 0 ] || [ "$SUPABASE_CONFIGURED" = false ]; then
    print_warning "Setup completed with warnings. Please address the issues above before proceeding."
    exit 1
else
    print_success "Setup completed successfully! 🚀"
    exit 0
fi
