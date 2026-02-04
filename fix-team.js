const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://snfttvopjrpzsypteiby.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZnR0dm9wanJwenN5cHRlaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzY4MTcsImV4cCI6MjA3ODg1MjgxN30.25Xa4OB3sRBcD3ryG3y62dGSSPv3iRSwtOiaZ9ydkYE'
);

async function fixTeams() {
  console.log('Moving all leads to team 6670fe56-266f-4665-9eba-0caa6d16bb76...\n');

  // Update all leads to the same team
  const { data, error } = await supabase
    .from('leads')
    .update({ team_id: '6670fe56-266f-4665-9eba-0caa6d16bb76' })
    .neq('team_id', '6670fe56-266f-4665-9eba-0caa6d16bb76')
    .select();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`✅ Updated ${data?.length || 0} leads to the correct team`);
  data?.forEach(lead => {
    console.log(`  - ${lead.full_name || lead.name}`);
  });

  console.log('\n✅ All leads are now on the same team and should appear on the dashboard!');
}

fixTeams();
