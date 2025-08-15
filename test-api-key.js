// API Key Tester - Run this after updating your .env file
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔑 API Key Validation Test\n');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);
console.log('Key length:', supabaseKey?.length);
console.log('Key preview:', supabaseKey?.substring(0, 50) + '...\n');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables!');
  console.log('Make sure your .env file has:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testApiKey() {
  console.log('🧪 Testing API Key...\n');
  
  // Test 1: Basic connection
  try {
    const { data, error } = await supabase.from('students').select('id').limit(1);
    
    if (error) {
      if (error.message.includes('Invalid API key')) {
        console.log('❌ API Key is INVALID');
        console.log('🔧 SOLUTION:');
        console.log('1. Go to: https://supabase.com/dashboard/project/zkddbolfivqhhkvdmacr/settings/api');
        console.log('2. Copy the anon/public key');
        console.log('3. Update VITE_SUPABASE_ANON_KEY in .env file');
        console.log('4. Restart: npm run dev');
        return;
      } else {
        console.log('✅ API Key is VALID');
        console.log(`ℹ️  Database response: ${error.message}`);
      }
    } else {
      console.log('✅ API Key is VALID');
      console.log(`✅ Database connected successfully (${data?.length || 0} records)`);
    }
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
  }
  
  // Test 2: Test each table that was failing
  console.log('\n📋 Testing Problem Tables...');
  
  const tables = ['students', 'instructors', 'lessons', 'billings'];
  let allGood = true;
  
  for (const table of tables) {
    try {
      const { error, status } = await supabase.from(table).select('id').limit(1);
      
      if (error && error.message.includes('Invalid API key')) {
        console.log(`❌ ${table}: API Key Invalid`);
        allGood = false;
      } else if (error) {
        console.log(`⚠️  ${table}: ${error.message} (but API key is valid)`);
      } else {
        console.log(`✅ ${table}: Access OK`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      allGood = false;
    }
  }
  
  console.log('\n🎯 Summary:');
  if (allGood) {
    console.log('✅ API Key is working! Your console errors should be fixed.');
    console.log('🚀 Restart your dev server: npm run dev');
  } else {
    console.log('❌ API Key issues detected. Update your .env file.');
  }
}

testApiKey().catch(console.error);
