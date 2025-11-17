import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const apn = searchParams.get('apn');

    if (!address && !apn) {
      return NextResponse.json({
        success: false,
        message: 'Address or APN is required'
      }, { status: 400 });
    }

    // Build query - use APN if provided, otherwise use address
    const query = apn || address;

    // Call Regrid API with correct endpoint
    const response = await fetch(
      `https://app.regrid.com/api/v1/search.json?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.REGRID_TOKEN || process.env.NEXT_PUBLIC_REGRID_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Regrid API error: ${response.status}`);
    }

    const data = await response.json();

    // Return results in the format expected by frontend
    if (data.results && data.results.length > 0) {
      const results = data.results.slice(0, 10).map(result => ({
        properties: {
          address: result.properties?.fields?.address || '',
          city: result.properties?.fields?.city || result.properties?.fields?.scity || '',
          state: result.properties?.fields?.state2 || '',
          zip: result.properties?.fields?.szip5 || result.properties?.fields?.szip || '',
          county: result.properties?.fields?.county || '',
          acres: result.properties?.fields?.ll_gisacre || result.properties?.fields?.gisacre || '',
          apn: result.properties?.fields?.parcelnumb || result.properties?.fields?.alt_parcelnumb1 || '',
          owner: result.properties?.fields?.owner || ''
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
