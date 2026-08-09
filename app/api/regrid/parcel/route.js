import { NextResponse } from 'next/server';

// Admin parcel lookup that RETURNS THE BOUNDARY geometry (the public lookup
// route strips it). Used by the listings backend to map a parcel: search by
// address or APN, return the top matches with their GeoJSON geometry so the
// editor can save the boundary polygon and center point.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || searchParams.get('address') || searchParams.get('apn');
    if (!query) {
      return NextResponse.json({ success: false, message: 'query (address or APN) is required' }, { status: 400 });
    }

    const token = process.env.REGRID_TOKEN || process.env.NEXT_PUBLIC_REGRID_TOKEN;
    const res = await fetch(
      `https://app.regrid.com/api/v1/search.json?query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`Regrid API error: ${res.status}`);
    const data = await res.json();

    const results = (data.results || []).slice(0, 8).map((r) => {
      const f = r.properties?.fields || {};
      return {
        label: [f.address, f.scity || f.city, f.state2].filter(Boolean).join(', '),
        apn: f.parcelnumb || f.alt_parcelnumb1 || '',
        county: f.county || '',
        acres: f.ll_gisacre || f.gisacre || '',
        geometry: r.geometry || null, // GeoJSON Polygon / MultiPolygon (lng,lat)
      };
    });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Regrid parcel lookup error:', error);
    return NextResponse.json({ success: false, message: error.message, results: [] }, { status: 500 });
  }
}
