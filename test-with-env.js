// Test with environment variables from your .env file
import { createClient } from '@supabase/supabase-js';

// Use your actual environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zkddbolfivqhhkvdmacr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZGRib2xmaXZxaGhrdmRtYWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDY4NjAsImV4cCI6MjA3MDc4Mjg2MH0.Oz7oGUYrKNihCYsQhtIxrOH5-U9x5Db-XxDMKoWxHnw';

console.log('Environment check:');
console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_KEY exists:', !!supabaseKey);
console.log('SUPABASE_KEY length:', supabaseKey?.length);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithEnvVars() {
  console.log('\n🔍 Testing with Environment Variables\n');
  
  // Test the exact same queries your app is making
  const appQueries = [
    {
      name: 'Students Query (app)',
      path: '/rest/v1/students?select=*&order=name.asc',
      test: () => supabase.from('students').select('*').order('name', { ascending: true })
    },
    {
      name: 'Instructors Query (app)', 
      path: '/rest/v1/instructors?select=*&order=name.asc',
      test: () => supabase.from('instructors').select('*').order('name', { ascending: true })
    },
    {
      name: 'Billings Query (app)',
      path: '/rest/v1/billings?select=*%2Cstudents%28id%2Cname%2Cguardian_name%29&order=due_date.asc',
      test: () => supabase.from('billings').select('*, students(id, name, guardian_name)').order('due_date', { ascending: true })
    },
    {
      name: 'Lessons Query (app)',
      path: '/rest/v1/lessons?select=*%2Cinstructors%28id%2Cname%29%2Cstudents%28id%2Cname%29&order=start_time.asc',
      test: () => supabase.from('lessons').select('*, instructors(id, name), students(id, name)').order('start_time', { ascending: true })
    }
  ];
  
  for (const query of appQueries) {
    console.log(`📋 Testing: ${query.name}`);
    console.log(`   URL: ${supabaseUrl}${query.path}`);
    
    try {
      const { data, error, status, statusText } = await query.test();
      
      if (error) {
        console.log(`❌ Status: ${status} ${statusText}`);
        console.log(`❌ Error: ${error.message}`);
        console.log(`   Code: ${error.code || 'N/A'}`);
        console.log(`   Details: ${error.details || 'N/A'}`);
        console.log(`   Hint: ${error.hint || 'N/A'}`);
        
        // Analyze specific errors
        if (error.code === 'PGRST116') {
          console.log('   🔧 SOLUTION: Column does not exist - schema mismatch');
        } else if (error.code === 'PGRST106') {
          console.log('   🔧 SOLUTION: Table does not exist');
        } else if (error.code === 'PGRST301') {
          console.log('   🔧 SOLUTION: RLS policy preventing access');
        } else if (status === 401) {
          console.log('   🔧 SOLUTION: API key or authentication issue');
        } else if (status === 400) {
          console.log('   🔧 SOLUTION: Malformed query or constraint violation');
        } else if (status === 500) {
          console.log('   🔧 SOLUTION: Server error - likely RLS or foreign key issue');
        }
      } else {
        console.log(`✅ Success: ${data?.length || 0} records found`);
        if (data && data.length > 0) {
          console.log(`   Sample data keys: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (err) {
      console.log(`❌ Network Error: ${err.message}`);
    }
    console.log('');
  }
}

testWithEnvVars().catch(console.error);
