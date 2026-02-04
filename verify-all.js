const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://snfttvopjrpzsypteiby.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZnR0dm9wanJwenN5cHRlaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzY4MTcsImV4cCI6MjA3ODg1MjgxN30.25Xa4OB3sRBcD3ryG3y62dGSSPv3iRSwtOiaZ9ydkYE'
);

async function verify() {
  console.log('🔍 Verifying all leads are ready for dashboard...\n');

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('team_id', '6670fe56-266f-4665-9eba-0caa6d16bb76')
    .order('created_at', { ascending: false });

  let allGood = true;

  leads?.forEach(lead => {
    const hasCoords = lead.latitude && lead.longitude;
    const hasGeometry = !!lead.parcel_geometry;
    const hasTeam = !!lead.team_id;
    const hasDealType = !!lead.dealtype;

    const status = hasCoords && hasGeometry && hasTeam && hasDealType ? '✅' : '❌';

    console.log(`${status} ${lead.full_name || lead.name}`);
    console.log(`   Latitude: ${lead.latitude ? '✅' : '❌'}`);
    console.log(`   Longitude: ${lead.longitude ? '✅' : '❌'}`);
    console.log(`   Geometry: ${hasGeometry ? '✅' : '❌'}`);
    console.log(`   Team ID: ${hasTeam ? '✅' : '❌'}`);
    console.log(`   Deal Type: ${hasDealType ? '✅' : '❌'}`);
    console.log('');

    if (!hasCoords || !hasGeometry || !hasTeam || !hasDealType) {
      allGood = false;
    }
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (allGood) {
    console.log('✅ ALL LEADS ARE READY!');
    console.log('✅ Main map will show all parcel boundaries');
    console.log('✅ Mini maps will show parcel previews');
    console.log('\n🎉 GO AHEAD AND REFRESH YOUR DASHBOARD!');
  } else {
    console.log('❌ Some leads are missing data');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

verify();
