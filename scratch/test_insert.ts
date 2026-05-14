import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://gcxsrvvmfhhvbxwhknau.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjeHNydnZtZmhodmJ4d2hrbmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Njk0NTcsImV4cCI6MjA3OTI0NTQ1N30.zf9v_4vobD_kwINjA28Ceyed4MUeqYdiKp9P_5QQjYc"
);

async function testInsertOrg() {
  const { data, error } = await supabase
    .from('organizations')
    .insert([
      { name: 'Test Org ' + Date.now(), nit: '123456789' }
    ]);
    
  if (error) {
    console.error('Error inserting organization:', error);
    return;
  }
  
  console.log('Success inserting organization:', data);
}

testInsertOrg();
