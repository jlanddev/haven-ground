const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://snfttvopjrpzsypteiby.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZnR0dm9wanJwenN5cHRlaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzY4MTcsImV4cCI6MjA3ODg1MjgxN30.25Xa4OB3sRBcD3ryG3y62dGSSPv3iRSwtOiaZ9ydkYE'
);

async function checkFields() {
  console.log('🔍 Checking lead fields...\n');

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('team_id', '6670fe56-266f-4665-9eba-0caa6d16bb76')
    .order('created_at', { ascending: false })
    .limit(1);

  if (leads && leads.length > 0) {
    const lead = leads[0];
    console.log('📋 Sample lead:', lead.full_name || lead.name);
    console.log('\n📝 Available fields:');
    console.log(JSON.stringify(lead, null, 2));
  }
}

checkFields();
