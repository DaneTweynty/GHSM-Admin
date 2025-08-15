-- =============================================
-- DIAGNOSTIC: Check existing RLS policies
-- Run this in Supabase SQL Editor to see what policies exist
-- =============================================

-- Check what RLS policies exist on each table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check RLS status on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check if any policies reference the profiles table specifically
SELECT 
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND (qual LIKE '%profiles%' OR with_check LIKE '%profiles%')
ORDER BY tablename, policyname;
