-- =============================================
-- AGGRESSIVE FIX FOR RLS INFINITE RECURSION
-- Completely disable RLS to stop all recursion issues
-- =============================================

-- Disable RLS on ALL tables to stop the recursion
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS instructors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS billings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS session_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies that might be causing recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to select profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to view profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile access" ON profiles;
DROP POLICY IF EXISTS "Simple profile access" ON profiles;

DROP POLICY IF EXISTS "Users can view students" ON students;
DROP POLICY IF EXISTS "Users can view instructors" ON instructors;
DROP POLICY IF EXISTS "Users can view lessons" ON lessons;
DROP POLICY IF EXISTS "Allow all on students" ON students;
DROP POLICY IF EXISTS "Allow all on instructors" ON instructors;
DROP POLICY IF EXISTS "Allow all on lessons" ON lessons;
DROP POLICY IF EXISTS "Allow all on billings" ON billings;

-- Drop any policy that might reference profiles table
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON students;
DROP POLICY IF EXISTS "Enable read access for all users" ON students;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON students;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON students;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON instructors;
DROP POLICY IF EXISTS "Enable read access for all users" ON instructors;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON instructors;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON instructors;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON lessons;
DROP POLICY IF EXISTS "Enable read access for all users" ON lessons;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON lessons;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON lessons;

-- Grant permissions to allow access without RLS
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant specific permissions on tables we know exist
GRANT ALL ON profiles TO anon, authenticated;
GRANT ALL ON students TO anon, authenticated;
GRANT ALL ON instructors TO anon, authenticated;
GRANT ALL ON lessons TO anon, authenticated;
GRANT ALL ON billings TO anon, authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
