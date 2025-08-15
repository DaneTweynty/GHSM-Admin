// Advanced diagnostic script to identify the exact database issues
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkddbolfivqhhkvdmacr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZGRib2xmaXZxaGhrdmRtYWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDY4NjAsImV4cCI6MjA3MDc4Mjg2MH0.Oz7oGUYrKNihCYsQhtIxrOH5-U9x5Db-XxDMKoWxHnw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDatabaseIssues() {
  console.log('🔍 Advanced Database Diagnostics\n');
  
  // Test 1: Simple select on each table
  console.log('📋 Test 1: Basic Table Access');
  const tables = ['students', 'instructors', 'lessons', 'billings'];
  
  for (const table of tables) {
    try {
      const { data, error, status } = await supabase
        .from(table)
        .select('id')
        .limit(1);
        
      if (error) {
        console.log(`❌ ${table}: ${error.message} (Status: ${status})`);
        console.log(`   Details: ${error.details || 'No details'}`);
        console.log(`   Hint: ${error.hint || 'No hint'}`);
      } else {
        console.log(`✅ ${table}: OK (${data?.length || 0} records)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  console.log('\n📋 Test 2: Complex Queries (like your app)');
  
  // Test 2: The exact failing queries from your console
  const failingQueries = [
    {
      name: 'Students with Order',
      test: () => supabase.from('students').select('*').order('name')
    },
    {
      name: 'Instructors with Order', 
      test: () => supabase.from('instructors').select('*').order('name')
    },
    {
      name: 'Billings with Students Join',
      test: () => supabase.from('billings').select('*, students(id, name, guardian_name)').order('due_date')
    },
    {
      name: 'Lessons with Joins',
      test: () => supabase.from('lessons').select('*, instructors(id, name), students(id, name)').order('date')
    }
  ];
  
  for (const query of failingQueries) {
    try {
      const { data, error, status } = await query.test();
      
      if (error) {
        console.log(`❌ ${query.name}: ${error.message}`);
        console.log(`   Status: ${status}`);
        console.log(`   Details: ${error.details || 'No details'}`);
        
        // Specific error analysis
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.log(`   🔧 SOLUTION: Column name mismatch - check schema`);
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`   🔧 SOLUTION: Table doesn't exist`);
        } else if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          console.log(`   🔧 SOLUTION: RLS policy issue`);
        } else if (error.message.includes('foreign key')) {
          console.log(`   🔧 SOLUTION: Foreign key constraint issue`);
        }
      } else {
        console.log(`✅ ${query.name}: OK (${data?.length || 0} records)`);
      }
    } catch (err) {
      console.log(`❌ ${query.name}: ${err.message}`);
    }
  }
  
  console.log('\n📋 Test 3: Schema Validation');
  
  // Test 3: Check if specific columns exist
  const columnChecks = [
    { table: 'students', column: 'name', expected: true },
    { table: 'students', column: 'guardian_name', expected: true },
    { table: 'instructors', column: 'name', expected: true },
    { table: 'lessons', column: 'start_time', expected: false }, // This might be 'date' instead
    { table: 'lessons', column: 'date', expected: true },
    { table: 'billings', column: 'due_date', expected: true }
  ];
  
  for (const check of columnChecks) {
    try {
      const { error } = await supabase
        .from(check.table)
        .select(check.column)
        .limit(1);
        
      if (error && error.message.includes('column')) {
        console.log(`❌ ${check.table}.${check.column}: Column doesn't exist`);
      } else {
        console.log(`✅ ${check.table}.${check.column}: Column exists`);
      }
    } catch (err) {
      console.log(`❌ ${check.table}.${check.column}: ${err.message}`);
    }
  }
  
  console.log('\n🎯 Summary and Next Steps:');
  console.log('Based on the errors above, we can create a targeted fix.');
}

diagnoseDatabaseIssues().catch(console.error);
