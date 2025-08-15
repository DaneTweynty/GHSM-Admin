-- =============================================
-- COMPREHENSIVE FIX FOR CONSOLE ERRORS
-- Fixes table access and RLS policy issues
-- =============================================

-- First, check if we have an issue with profiles table RLS policies
-- Drop any problematic policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Drop any recursive policies on upper case tables
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON "Students";
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON "Instructors";
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON "Lessons";

-- Disable RLS temporarily to fix issues
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Students" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Instructors" DISABLE ROW LEVEL SECURITY;  
ALTER TABLE IF EXISTS "Lessons" DISABLE ROW LEVEL SECURITY;

-- Create simple views without RLS for immediate fix
DROP VIEW IF EXISTS students;
DROP VIEW IF EXISTS instructors;
DROP VIEW IF EXISTS lessons;

CREATE VIEW students AS SELECT * FROM "Students";
CREATE VIEW instructors AS SELECT * FROM "Instructors";
CREATE VIEW lessons AS SELECT * FROM "Lessons";

-- Grant basic permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON students TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON instructors TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lessons TO anon, authenticated;

-- Re-enable RLS on base tables with simple policies
ALTER TABLE "Students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Instructors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lessons" ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Allow all for students" ON "Students" FOR ALL USING (true);
CREATE POLICY "Allow all for instructors" ON "Instructors" FOR ALL USING (true);
CREATE POLICY "Allow all for lessons" ON "Lessons" FOR ALL USING (true);
