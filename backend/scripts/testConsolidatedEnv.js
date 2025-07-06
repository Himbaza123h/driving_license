import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

console.log('🔧 Testing consolidated environment configuration...');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment variables:');
console.log('- SUPABASE_URL:', supabaseUrl);
console.log('- SUPABASE_SERVICE_ROLE_KEY present:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test citizen lookup
async function testCitizenLookup() {
  try {
    console.log('🔍 Testing citizen lookup...');
    
    const { data: citizens, error } = await supabase
      .from('citizens')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('❌ Query failed:', error);
      return false;
    }
    
    console.log('✅ Query successful! Found', citizens.length, 'citizens');
    console.log('Sample citizen:', citizens[0]);
    
    // Test specific National ID lookup
    const testNationalId = '1234567890123';
    console.log(`🔍 Testing lookup for National ID: ${testNationalId}`);
    
    const { data: citizen, error: lookupError } = await supabase
      .from('citizens')
      .select('*')
      .eq('national_id', testNationalId)
      .eq('status', 'ACTIVE')
      .single();
    
    if (lookupError) {
      if (lookupError.code === 'PGRST116') {
        console.log('ℹ️ Test National ID not found (expected)');
      } else {
        console.error('❌ Lookup error:', lookupError);
        return false;
      }
    } else {
      console.log('✅ Found citizen:', citizen.full_name);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testCitizenLookup().then(success => {
  if (success) {
    console.log('🎉 All tests passed! Environment configuration is working correctly.');
  } else {
    console.log('❌ Tests failed!');
    process.exit(1);
  }
});
