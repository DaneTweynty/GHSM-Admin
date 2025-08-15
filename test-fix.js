// Test if the lowercase view solution will work
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkddbolfivqhhkvdmacr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZGRib2xmaXZxaGhrdmRtYWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDY4NjAsImV4cCI6MjA3MDc4Mjg2MH0.Oz7oGUYrKNihCYsQhtIxrOH5-U9x5Db-XwDMKoWxHnw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBeforeAndAfterFix() {
  console.log('🔍 Testing database access (simulating your console errors)...\n');
  
  // Test the exact queries that are failing in your console
  const queries = [
    { name: 'Students Query', table: 'students', query: 'select=*&order=name.asc' },
    { name: 'Instructors Query', table: 'instructors', query: 'select=*&order=name.asc' },
    { name: 'Billings Query', table: 'billings', query: 'select=*%2Cstudents%28id%2Cname%2Cguardian_name%29&order=due_date.asc' },
    { name: 'Lessons Query', table: 'lessons', query: 'select=*%2Cinstructors%28id%2Cname%29%2Cstudents%28id%2Cname%29&order=start_time.asc' }
  ];
  
  for (const { name, table } of queries) {
    try {
      console.log(`📋 ${name} (${table})...`);
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        console.log(`❌ ERROR: ${error.message}`);
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`   💡 FIX: Execute database/quick-fix-case-sensitive.sql`);
        }
      } else {
        console.log(`✅ SUCCESS: Found ${data?.length || 0} records`);
      }
    } catch (err) {
      console.log(`❌ ERROR: ${err.message}`);
    }
    console.log('');
  }
  
  console.log('🎯 To fix these errors:');
  console.log('1. Go to: https://supabase.com/dashboard/project/zkddbolfivqhhkvdmacr/sql');
  console.log('2. Execute: database/quick-fix-case-sensitive.sql');
  console.log('3. Or see: QUICK_FIX_CONSOLE_ERRORS.md');
  console.log('4. Restart: npm run dev');
}

testBeforeAndAfterFix().catch(console.error);
