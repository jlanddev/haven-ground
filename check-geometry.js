const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://snfttvopjrpzsypteiby.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZnR0dm9wanJwenN5cHRlaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzY4MTcsImV4cCI6MjA3ODg1MjgxN30.25Xa4OB3sRBcD3ryG3y62dGSSPv3iRSwtOiaZ9ydkYE'
);

async function checkGeometry() {
  console.log('Checking geometry data format...\n');

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('team_id', '6670fe56-266f-4665-9eba-0caa6d16bb76')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${leads?.length || 0} leads\n`);

  leads?.forEach(lead => {
    console.log('---');
    console.log('Name:', lead.full_name || lead.name);
    console.log('Has parcel_geometry:', !!lead.parcel_geometry);

    if (lead.parcel_geometry) {
      console.log('Geometry type:', lead.parcel_geometry.type);
      console.log('Coordinates:', lead.parcel_geometry.coordinates ?
        `${lead.parcel_geometry.coordinates[0]?.length || 0} points` : 'none');

      // Sample first 2 coordinate pairs
      if (lead.parcel_geometry.coordinates && lead.parcel_geometry.coordinates[0]) {
        console.log('First 2 coords:', lead.parcel_geometry.coordinates[0].slice(0, 2));
      }
    }
    console.log('');
  });
}

checkGeometry();
