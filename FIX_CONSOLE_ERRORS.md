# 🚀 Fix Console Errors - Database Setup

The console errors you're seeing are because the database tables don't exist yet in your Supabase project. Here's how to fix them:

## Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/zkddbolfivqhhkvdmacr/sql

### Step 2: Execute Database Schema
1. Open the file `database/complete-schema.sql`
2. Copy all the contents (Ctrl+A, Ctrl+C)
3. Paste into the Supabase SQL Editor
4. Click "RUN" to execute

### Step 3: Execute Database Functions  
1. Open the file `database/teacher-app-functions.sql`
2. Copy all the contents (Ctrl+A, Ctrl+C)
3. Paste into the Supabase SQL Editor
4. Click "RUN" to execute

### Step 4: Restart Development Server
```bash
npm run dev
```

## What This Fixes

After executing the database schema, these tables will exist:
- ✅ `students` (fixes 500 errors)
- ✅ `instructors` (fixes 500 errors) 
- ✅ `billings` (fixes 500 errors)
- ✅ `lessons` (fixes 400 errors)
- ✅ `user_profiles`, `attendance_records`, `payments`, etc.

## Expected Result

Console errors should change from:
- ❌ `500 Internal Server Error` 
- ❌ `400 Bad Request`

To:
- ✅ `200 OK` responses (or empty data arrays if no data exists yet)

## If You Need Sample Data

After the schema is set up, you can add sample data through the Supabase dashboard Table Editor or by running additional SQL scripts.

---

**Need help?** The database schema files are located in:
- `database/complete-schema.sql` - Main tables and structure
- `database/teacher-app-functions.sql` - Database functions
- `database/setup-instructions.md` - Detailed setup guide
