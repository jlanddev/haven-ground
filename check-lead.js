const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://snfttvopjrpzsypteiby.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZnR0dm9wanJwenN5cHRlaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzY4MTcsImV4cCI6MjA3ODg1MjgxN30.25Xa4OB3sRBcD3ryG3y62dGSSPv3iRSwtOiaZ9ydkYE'
);

async function checkLead() {
  console.log('Checking all leads in database...\n');

  // Get ALL leads to see the full picture
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${leads?.length || 0} total leads (showing last 20):\n`);

  leads?.forEach(lead => {
    console.log('---');
    console.log('Name:', lead.full_name || lead.name);
    console.log('Email:', lead.email);
    console.log('County:', lead.property_county || lead.county);
    console.log('State:', lead.property_state || lead.state);
    console.log('Acres:', lead.acres || lead.acreage);
    console.log('Parcel ID:', lead.parcel_id);
    console.log('Team ID:', lead.team_id);
    console.log('Deal Type:', lead.dealtype);
    console.log('Status:', lead.status);
    console.log('Source:', lead.source);
    console.log('Created:', lead.created_at);
    console.log('Has Geometry:', !!lead.parcel_geometry);
    console.log('');
  });

  // Get Haven Ground team info
  console.log('\n--- Haven Ground Team Info ---');
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .or('domain.ilike.%haven%,name.ilike.%haven%');

  if (teams && teams.length > 0) {
    teams.forEach(team => {
      console.log('Team ID:', team.id);
      console.log('Team Name:', team.name);
      console.log('Domain:', team.domain);
      console.log('');
    });
  } else {
    console.log('No Haven team found, checking all teams...');
    const { data: allTeams } = await supabase
      .from('teams')
      .select('*');

    console.log('\nAll teams:');
    allTeams?.forEach(team => {
      console.log('Team ID:', team.id);
      console.log('Team Name:', team.name);
      console.log('Domain:', team.domain);
      console.log('');
    });
  }
}

checkLead();
