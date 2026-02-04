const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://snfttvopjrpzsypteiby.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZnR0dm9wanJwenN5cHRlaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzY4MTcsImV4cCI6MjA3ODg1MjgxN30.25Xa4OB3sRBcD3ryG3y62dGSSPv3iRSwtOiaZ9ydkYE'
);

async function checkUsers() {
  console.log('Checking users and team_members...\n');

  // Get all users
  const { data: users } = await supabase.auth.admin.listUsers();
  console.log('Users:', users?.users?.map(u => ({ email: u.email, id: u.id })));

  // Get all team members
  const { data: members } = await supabase
    .from('team_members')
    .select('*');

  console.log('\nTeam members:', members);

  // Check if jordan@havenground.com exists and what team they're on
  const jordan = users?.users?.find(u => u.email?.includes('jordan') || u.email?.includes('haven'));
  if (jordan) {
    const jordanTeam = members?.find(m => m.user_id === jordan.id);
    console.log('\nJordan user:', jordan.email, '- ID:', jordan.id);
    console.log('Jordan team:', jordanTeam?.team_id || 'No team found');
    console.log('Expected team:', '6670fe56-266f-4665-9eba-0caa6d16bb76');
  }
}

checkUsers();
