import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({
        success: false,
        message: 'Address is required'
      }, { status: 400 });
    }

    // Call Regrid API
    const response = await fetch(
      `https://app.regrid.com/api/v1/search/parcels?query=${encodeURIComponent(address)}&limit=10`,
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

    // Return results in the format expected by frontend
    if (data.parcels && data.parcels.length > 0) {
      const results = data.parcels.map(parcel => ({
        properties: {
          address: parcel.address || '',
          city: parcel.fields?.city || '',
          state: parcel.fields?.state || '',
          zip: parcel.fields?.zip || '',
          county: parcel.fields?.county || '',
          acres: parcel.fields?.acres || '',
          apn: parcel.fields?.apn || ''
        }
      }));

      return NextResponse.json({
        success: true,
        results
      });
    } else {
      return NextResponse.json({
        success: true,
        results: []
      });
    }
  } catch (error) {
    console.error('Regrid lookup error:', error);
    return NextResponse.json({
      success: false,
      message: error.message,
      results: []
    }, { status: 500 });
  }
}
