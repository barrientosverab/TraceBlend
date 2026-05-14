import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkTriggers() {
  const { data, error } = await supabase.rpc('get_triggers', { table_name: 'users', schema_name: 'auth' });
    
  if (error) {
    console.error('Error fetching triggers (maybe RPC doesnt exist):', error);
    // Try a raw query if possible, but anon key usually doesn't allow it.
    return;
  }
  
  console.log('Triggers on auth.users:', data);
}

checkTriggers();
