const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://snfttvopjrpzsypteiby.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZnR0dm9wanJwenN5cHRlaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzY4MTcsImV4cCI6MjA3ODg1MjgxN30.25Xa4OB3sRBcD3ryG3y62dGSSPv3iRSwtOiaZ9ydkYE'
);

async function deleteDuplicateTeam() {
  console.log('Deleting duplicate team 2d170337-b41e-45e6-8bca-9d542e3ebbd6...\n');

  // Delete the duplicate team
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', '2d170337-b41e-45e6-8bca-9d542e3ebbd6');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✅ Deleted duplicate team!');
  console.log('\nNow there is only ONE team and all future lead assignments will go to the correct place.');
}

deleteDuplicateTeam();
