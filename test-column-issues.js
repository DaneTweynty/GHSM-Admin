// Test specific column issues that might cause 400 errors
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSpecificQueries() {
  console.log('🔍 Testing Specific Query Issues\n');
  
  // Test 1: Check what columns exist in lessons table
  console.log('📋 Test 1: Lessons Table Structure');
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log(`❌ Lessons basic query: ${error.message}`);
    } else {
      if (data && data.length > 0) {
        console.log(`✅ Lessons columns: ${Object.keys(data[0]).join(', ')}`);
      } else {
        console.log('✅ Lessons table accessible but empty');
      }
    }
  } catch (err) {
    console.log(`❌ Lessons error: ${err.message}`);
  }
  
  // Test 2: Check specific ordering issues
  console.log('\n📋 Test 2: Order By Columns');
  
  const orderTests = [
    { table: 'lessons', column: 'start_time', name: 'Lessons by start_time' },
    { table: 'lessons', column: 'date', name: 'Lessons by date' },
    { table: 'lessons', column: 'created_at', name: 'Lessons by created_at' },
    { table: 'students', column: 'name', name: 'Students by name' },
    { table: 'instructors', column: 'name', name: 'Instructors by name' },
    { table: 'billings', column: 'due_date', name: 'Billings by due_date' }
  ];
  
  for (const test of orderTests) {
    try {
      const { data, error } = await supabase
        .from(test.table)
        .select('id')
        .order(test.column, { ascending: true })
        .limit(1);
        
      if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.log(`❌ ${test.name}: Column "${test.column}" doesn't exist`);
        } else {
          console.log(`❌ ${test.name}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${test.name}: OK`);
      }
    } catch (err) {
      console.log(`❌ ${test.name}: ${err.message}`);
    }
  }
  
  // Test 3: Check foreign key relationships
  console.log('\n📋 Test 3: Foreign Key Relationships');
  
  const joinTests = [
    { 
      name: 'Billings with Students',
      test: () => supabase.from('billings').select('id, students(id, name, guardian_name)').limit(1)
    },
    {
      name: 'Lessons with Instructors',
      test: () => supabase.from('lessons').select('id, instructors(id, name)').limit(1)
    },
    {
      name: 'Lessons with Students', 
      test: () => supabase.from('lessons').select('id, students(id, name)').limit(1)
    }
  ];
  
  for (const test of joinTests) {
    try {
      const { data, error } = await test.test();
      
      if (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        if (error.message.includes('foreign key')) {
          console.log(`   💡 HINT: Foreign key relationship issue`);
        } else if (error.message.includes('column')) {
          console.log(`   💡 HINT: Column name mismatch`);
        }
      } else {
        console.log(`✅ ${test.name}: OK`);
      }
    } catch (err) {
      console.log(`❌ ${test.name}: ${err.message}`);
    }
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. If you see "infinite recursion" → Execute database/disable-rls-completely.sql');
  console.log('2. If you see "column does not exist" → Schema mismatch, need to check actual DB structure');
  console.log('3. If you see "foreign key" issues → Relationship problems between tables');
}

testSpecificQueries().catch(console.error);
