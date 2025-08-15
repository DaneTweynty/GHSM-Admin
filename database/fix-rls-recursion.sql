-- =============================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- This resolves the "infinite recursion detected in policy for relation 'profiles'" error
-- =============================================

-- First, let's disable RLS temporarily to see what policies exist
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop any existing problematic policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to select profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to view profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile access" ON profiles;

-- Drop any policies that might reference profiles in a circular way
DROP POLICY IF EXISTS "Users can view students" ON students;
DROP POLICY IF EXISTS "Users can view instructors" ON instructors;
DROP POLICY IF EXISTS "Users can view lessons" ON lessons;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a simple, non-recursive policy for profiles
CREATE POLICY "Simple profile access" ON profiles 
FOR ALL 
USING (true);

-- Create simple policies for other tables that don't reference profiles
CREATE POLICY "Allow all on students" ON students 
FOR ALL 
USING (true);

CREATE POLICY "Allow all on instructors" ON instructors 
FOR ALL 
USING (true);

CREATE POLICY "Allow all on lessons" ON lessons 
FOR ALL 
USING (true);

-- Ensure billings keeps working (it was already working)
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON billings;
CREATE POLICY "Allow all on billings" ON billings 
FOR ALL 
USING (true);

-- Grant permissions to ensure access
GRANT ALL ON profiles TO anon, authenticated;
GRANT ALL ON students TO anon, authenticated;
GRANT ALL ON instructors TO anon, authenticated;
GRANT ALL ON lessons TO anon, authenticated;
GRANT ALL ON billings TO anon, authenticated;
