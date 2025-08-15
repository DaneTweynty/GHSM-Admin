# GHSM Teacher App - Detailed Setup Guide

This comprehensive guide walks you through setting up the GHSM Teacher Mobile App from scratch.

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 16.0 or higher
- **npm**: Version 7.0 or higher (comes with Node.js)
- **Git**: For version control
- **Code Editor**: VS Code recommended with TypeScript extensions

### Supabase Requirements
- Active Supabase project
- Database access with admin privileges
- Supabase CLI (optional but recommended)

### Verify Prerequisites
```bash
# Check Node.js version
node --version  # Should be 16.0+

# Check npm version
npm --version   # Should be 7.0+

# Check Git
git --version
```

## 🚀 Step-by-Step Setup

### Step 1: Project Preparation

1. **Navigate to your project directory:**
   ```bash
   cd /path/to/GHSM-Admin
   ```

2. **Verify project structure:**
   ```bash
   # Check if package.json exists
   ls -la package.json
   
   # If not found, you're in the wrong directory
   ```

3. **Install base dependencies:**
   ```bash
   npm install
   ```

### Step 2: Environment Configuration

1. **Create environment file:**
   ```bash
   cp .env.example .env
   # OR create manually
   touch .env
   ```

2. **Configure environment variables:**
   ```bash
   # Edit .env file with your preferred editor
   nano .env
   ```

3. **Add the following configuration:**
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

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
   ```

### Step 3: Database Setup

1. **Access your Supabase dashboard:**
   - Go to https://app.supabase.com
   - Select your project
   - Navigate to SQL Editor

2. **Execute the complete schema:**
   ```sql
   -- Copy and paste the contents of database/complete-schema.sql
   -- Execute the entire script
   ```

3. **Execute teacher app functions:**
   ```sql
   -- Copy and paste the contents of database/teacher-app-functions.sql
   -- Execute the entire script
   ```

4. **Verify database setup:**
   ```sql
   -- Check if tables were created
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';

   -- Check if functions were created
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public';
   ```

### Step 4: TypeScript Configuration

1. **Update tsconfig.json (if needed):**
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "lib": ["ES2020", "DOM", "DOM.Iterable"],
       "module": "ESNext",
       "skipLibCheck": true,
       "moduleResolution": "bundler",
       "allowImportingTsExtensions": true,
       "resolveJsonModule": true,
       "isolatedModules": true,
       "noEmit": true,
       "jsx": "react-jsx",
       "strict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noFallthroughCasesInSwitch": true
     },
     "include": ["src", "vite-env.d.ts", "hooks", "services", "types", "utils"],
     "references": [{ "path": "./tsconfig.node.json" }]
   }
   ```

2. **Ensure vite-env.d.ts exists:**
   ```typescript
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
   ```

### Step 5: Dependencies Installation

1. **Install required dependencies:**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Install development dependencies:**
   ```bash
   npm install -D @types/node
   ```

3. **Verify installation:**
   ```bash
   npm list @supabase/supabase-js
   ```

### Step 6: File Structure Verification

1. **Check required directories:**
   ```bash
   ls -la database/ services/ hooks/ types/ utils/
   ```

2. **Verify key files exist:**
   ```bash
   # Database files
   ls -la database/complete-schema.sql
   ls -la database/teacher-app-functions.sql

   # Service files
   ls -la services/teacherService.ts
   ls -la services/authService.ts

   # Hook files
   ls -la hooks/useTeacherAuth.ts
   ls -la hooks/useTeacherSchedule.ts
   ls -la hooks/useTeacherStudents.ts
   ls -la hooks/useTeacherSessionSummaries.ts
   ls -la hooks/useTeacherAttendance.ts
   ls -la hooks/useTeacherDashboard.ts
   ls -la hooks/useTeacherChat.ts

   # Type definitions
   ls -la types/database.types.ts

   # Utilities
   ls -la utils/validationUtils.ts
   ```

### Step 7: Supabase Configuration

1. **Set up Row Level Security policies:**
   ```sql
   -- Verify RLS is enabled on all tables
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **Create test instructor user:**
   ```sql
   -- Insert a test instructor (replace with actual data)
   INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
   VALUES (
     gen_random_uuid(),
     'teacher@example.com',
     crypt('password123', gen_salt('bf')),
     NOW(),
     NOW(),
     NOW()
   );

   -- Add to user_profiles
   INSERT INTO user_profiles (id, role, email, full_name, is_active)
   SELECT id, 'instructor', email, 'Test Teacher', true
   FROM auth.users 
   WHERE email = 'teacher@example.com';

   -- Add to instructors table
   INSERT INTO instructors (id, specialties, status)
   SELECT id, ARRAY['Piano', 'Guitar'], 'active'
   FROM user_profiles 
   WHERE email = 'teacher@example.com';
   ```

3. **Configure Supabase storage (for file uploads):**
   ```sql
   -- Create storage bucket for chat files
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('chat-files', 'chat-files', false);

   -- Set up storage policies
   CREATE POLICY "Teachers can upload files" ON storage.objects 
   FOR INSERT WITH CHECK (bucket_id = 'chat-files');

   CREATE POLICY "Teachers can view their files" ON storage.objects 
   FOR SELECT USING (bucket_id = 'chat-files');
   ```

### Step 8: Testing the Setup

1. **Run TypeScript compilation:**
   ```bash
   npx tsc --noEmit
   ```

2. **Run linting:**
   ```bash
   npx eslint . --ext .ts,.tsx
   ```

3. **Test build process:**
   ```bash
   npm run build
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Test authentication:**
   - Open browser to http://localhost:5173
   - Try logging in with test credentials
   - Verify teacher profile loads correctly

### Step 9: Feature Testing

1. **Test each hook:**
   ```typescript
   // Create a test component to verify hooks work
   import { useTeacherAuth } from './hooks/useTeacherAuth';
   import { useTeacherSchedule } from './hooks/useTeacherSchedule';

   function TestComponent() {
     const { isAuthenticated, profile } = useTeacherAuth();
     const { lessons, isLoading } = useTeacherSchedule();

     return (
       <div>
         <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
         <p>Profile: {profile?.full_name || 'Loading...'}</p>
         <p>Lessons: {lessons.length}</p>
       </div>
     );
   }
   ```

2. **Test database functions:**
   ```sql
   -- Test instructor profile function
   SELECT * FROM get_instructor_profile('test-instructor-id');

   -- Test lessons function
   SELECT * FROM get_instructor_lessons('test-instructor-id');
   ```

## 🔧 Advanced Configuration

### Environment-Specific Settings

#### Development
```env
VITE_ENVIRONMENT=development
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

#### Staging
```env
VITE_ENVIRONMENT=staging
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
```

#### Production
```env
VITE_ENVIRONMENT=production
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
VITE_ENABLE_OFFLINE_MODE=true
```

### Performance Optimization

1. **Enable React Query (optional):**
   ```bash
   npm install @tanstack/react-query
   ```

2. **Configure bundle optimization:**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom'],
             supabase: ['@supabase/supabase-js']
           }
         }
       }
     }
   });
   ```

### Security Hardening

1. **Content Security Policy:**
   ```html
   <!-- Add to index.html -->
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; 
                  connect-src 'self' https://*.supabase.co;">
   ```

2. **Environment variable validation:**
   ```typescript
   // utils/envValidation.ts
   export function validateEnv() {
     const required = [
       'VITE_SUPABASE_URL',
       'VITE_SUPABASE_ANON_KEY'
     ];

     for (const key of required) {
       if (!import.meta.env[key]) {
         throw new Error(`Missing required environment variable: ${key}`);
       }
     }
   }
   ```

## 🐛 Troubleshooting

### Common Setup Issues

1. **"Module not found" errors:**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **TypeScript compilation errors:**
   ```bash
   # Check tsconfig.json paths
   # Verify all imports are correct
   # Run tsc with verbose output
   npx tsc --noEmit --listFiles
   ```

3. **Supabase connection issues:**
   ```bash
   # Test connection manually
   curl -H "apikey: YOUR_ANON_KEY" \
        "https://YOUR_PROJECT.supabase.co/rest/v1/"
   ```

4. **Database function errors:**
   ```sql
   -- Check function exists
   SELECT routine_name, routine_definition 
   FROM information_schema.routines 
   WHERE routine_name = 'get_instructor_profile';
   ```

### Performance Issues

1. **Slow initial load:**
   - Check bundle size: `npm run build -- --analyze`
   - Implement code splitting
   - Enable compression

2. **Database query performance:**
   - Check query execution plans
   - Verify indexes are created
   - Monitor Supabase metrics

### Security Issues

1. **RLS policy errors:**
   ```sql
   -- Debug RLS policies
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

2. **Authentication failures:**
   - Verify user roles in database
   - Check auth token validity
   - Review browser network requests

## ✅ Setup Verification Checklist

- [ ] Node.js 16+ installed
- [ ] Project dependencies installed
- [ ] Environment variables configured
- [ ] Database schema executed
- [ ] Database functions created
- [ ] Test user created
- [ ] TypeScript compilation passes
- [ ] ESLint checks pass
- [ ] Build process succeeds
- [ ] Development server starts
- [ ] Authentication works
- [ ] All hooks function correctly
- [ ] Database queries execute
- [ ] File uploads work (if enabled)
- [ ] Real-time updates function

## 📞 Getting Help

If you encounter issues during setup:

1. **Check the troubleshooting section** in this document
2. **Review the error messages** carefully
3. **Check browser console** for JavaScript errors
4. **Verify Supabase logs** in the dashboard
5. **Create a GitHub issue** with detailed error information
6. **Join our Discord** for community support

## 🎉 Next Steps

After successful setup:

1. **Read the API documentation** (`docs/API_DOCUMENTATION.md`)
2. **Explore the example components** in the codebase
3. **Customize the UI** to match your requirements
4. **Set up monitoring** and error tracking
5. **Plan your deployment** strategy
6. **Train your teachers** on the new system

Congratulations! Your GHSM Teacher Mobile App is now ready for development and testing.
