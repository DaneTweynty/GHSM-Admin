// Test script to verify database connection and tables
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkddbolfivqhhkvdmacr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZGRib2xmaXZxaGhrdmRtYWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDY4NjAsImV4cCI6MjA3MDc4Mjg2MH0.Oz7oGUYrKNihCYsQhtIxrOH5-U9x5Db-XwDMKoWxHnw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  const tables = ['students', 'instructors', 'billings', 'lessons'];
  
  for (const table of tables) {
    try {
      console.log(`\n📋 Testing ${table} table...`);
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`   💡 Solution: Execute database/complete-schema.sql in Supabase`);
        }
      } else {
        console.log(`✅ ${table}: Table exists (${count || 0} records)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  console.log('\n🎯 Next steps:');
  console.log('1. If you see "relation does not exist" errors:');
  console.log('   - Go to: https://supabase.com/dashboard/project/zkddbolfivqhhkvdmacr/sql');
  console.log('   - Execute: database/complete-schema.sql');
  console.log('   - Execute: database/teacher-app-functions.sql');
  console.log('2. Restart your dev server: npm run dev');
}

testDatabaseConnection().catch(console.error);
