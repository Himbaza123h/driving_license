import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listNationalIds() {
  const { data } = await supabase
    .from('citizens')
    .select('national_id, full_name')
    .eq('status', 'ACTIVE');
  
  console.log('Available National IDs for testing:');
  data.forEach(c => console.log(`- ${c.national_id} (${c.full_name})`));
}

listNationalIds();
