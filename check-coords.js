const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://snfttvopjrpzsypteiby.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZnR0dm9wanJwenN5cHRlaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzY4MTcsImV4cCI6MjA3ODg1MjgxN30.25Xa4OB3sRBcD3ryG3y62dGSSPv3iRSwtOiaZ9ydkYE'
);

async function checkCoords() {
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('team_id', '6670fe56-266f-4665-9eba-0caa6d16bb76');

  console.log('Checking coordinates for all leads:\n');

  leads?.forEach(lead => {
    console.log(lead.full_name || lead.name);
    console.log('  latitude:', lead.latitude);
    console.log('  longitude:', lead.longitude);
    console.log('  Has geometry:', !!lead.parcel_geometry);
    console.log('');
  });

  // Calculate centroids for leads missing coords
  console.log('\n--- FIXING MISSING COORDINATES ---\n');

  for (const lead of leads || []) {
    if (!lead.latitude && lead.parcel_geometry) {
      const coords = lead.parcel_geometry.coordinates[0];
      const lats = coords.map(c => c[1]);
      const lngs = coords.map(c => c[0]);
      const lat = lats.reduce((a, b) => a + b) / lats.length;
      const lng = lngs.reduce((a, b) => a + b) / lngs.length;

      console.log(`Updating ${lead.full_name || lead.name} with lat: ${lat}, lng: ${lng}`);

      await supabase
        .from('leads')
        .update({ latitude: lat, longitude: lng })
        .eq('id', lead.id);
    }
  }

  console.log('\n✅ Done!');
}

checkCoords();
