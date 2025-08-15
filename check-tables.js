// Check what tables actually exist in the database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkddbolfivqhhkvdmacr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZGRib2xmaXZxaGhrdmRtYWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDY4NjAsImV4cCI6MjA3MDc4Mjg2MH0.Oz7oGUYrKNihCYsQhtIxrOH5-U9x5Db-XwDMKoWxHnw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExistingTables() {
  console.log('🔍 Checking what tables exist in your Supabase database...\n');
  
  // Test common table names that might exist
  const possibleTables = [
    'students', 'instructors', 'lessons', 'billings', 'payments',
    'user_profiles', 'attendance_records', 'session_summaries',
    'chat_conversations', 'chat_messages',
    // Also test potential old table names
    'Students', 'Instructors', 'Lessons', 'Billings'
  ];
  
  const existingTables = [];
  
  for (const table of possibleTables) {
    try {
      const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' });
      if (!error) {
        existingTables.push(table);
        console.log(`✅ ${table}`);
      }
    } catch (err) {
      // Table doesn't exist
    }
  }
  
  if (existingTables.length === 0) {
    console.log('❌ No tables found! Database schema needs to be set up.');
  } else {
    console.log(`\n📊 Found ${existingTables.length} existing tables:`, existingTables);
  }
  
  console.log('\n🎯 To fix the console errors:');
  console.log('1. Go to: https://supabase.com/dashboard/project/zkddbolfivqhhkvdmacr/sql');
  console.log('2. Execute the complete schema: database/complete-schema.sql');
  console.log('3. This will create all missing tables');
}

checkExistingTables().catch(console.error);
