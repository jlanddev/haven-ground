import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { address, city, state, county } = await request.json();

    // Construct search query
    const query = `${address}, ${city || county}, ${state}`;

    // Call Regrid API - ONLY for this specific address
    const response = await fetch(
      `https://app.regrid.com/api/v1/search/parcels?query=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_REGRID_TOKEN}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Regrid API error: ${response.status}`);
    }

    const data = await response.json();

    // Return ONLY the first matching parcel (not all results)
    if (data.parcels && data.parcels.length > 0) {
      const parcel = data.parcels[0];

      return NextResponse.json({
        success: true,
        parcel: {
          id: parcel.id,
          address: parcel.address,
          county: parcel.fields.county,
          state: parcel.fields.state,
          acres: parcel.fields.acres,
          apn: parcel.fields.apn,
          owner: parcel.fields.owner,
          geometry: parcel.geometry, // GeoJSON for map display
          center: parcel.geometry.coordinates[0][0] // Center point for map
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No parcel found for this address'
      });
    }
  } catch (error) {
    console.error('Regrid lookup error:', error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
