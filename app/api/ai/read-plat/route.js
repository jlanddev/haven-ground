import { NextResponse } from 'next/server';

export const maxDuration = 60;

// POST /api/ai/read-plat
// Body: { fileBase64, mediaType, filename }
// Reads a plat/survey (PDF or image) with Claude vision and returns the lot/tract
// table it can read: { unit, lots: [{ lot, acres }] }. It never invents a lot:
// anything it cannot read is left out or set null. Pricing is computed client-side.
const IMG = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request) {
  try {
    const { fileBase64, mediaType, filename } = await request.json();
    if (!fileBase64 || !mediaType) {
      return NextResponse.json({ ok: false, error: 'No file received.' }, { status: 400 });
    }
    const isPdf = mediaType === 'application/pdf';
    if (!isPdf && !IMG.includes(mediaType)) {
      return NextResponse.json({ ok: false, error: 'Upload a PDF or a JPG/PNG image of the plat (not HEIC).' }, { status: 400 });
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: 'AI is not configured (missing key).' }, { status: 500 });

    const system = [
      'You read land plats and surveys. Extract the subdivided lots or tracts into JSON.',
      'Return ONLY this JSON: { "unit": "Lots"|"Tracts", "lots": [ { "lot": string, "acres": number|null } ] }.',
      '- One entry per lot/tract shown on the plat. Use the lot/tract label exactly as drawn (e.g. "Tract 3", "Lot 12").',
      '- acres is the area for that lot as a number. If the plat gives square feet, convert (sqft / 43560) and round to 2 decimals. If a lot area is not legible, set acres to null. Never guess or invent an area.',
      '- "unit": use "Tracts" for large acreage/ranchette parcels, "Lots" for subdivision lots.',
      '- Ignore right-of-way, road, drainage, and common-area parcels unless they are clearly numbered sellable lots.',
      'If the image is not a readable plat, return { "unit": "Tracts", "lots": [] }.',
    ].join('\n');

    const fileBlock = isPdf
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } }
      : { type: 'image', source: { type: 'base64', media_type: mediaType, data: fileBase64 } };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        temperature: 0,
        system,
        messages: [{ role: 'user', content: [fileBlock, { type: 'text', text: `Read every lot/tract and its acreage from this plat${filename ? ` (${filename})` : ''}. Return the JSON only.` }] }],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error('[read-plat] Claude error', res.status, t);
      return NextResponse.json({ ok: false, error: 'Could not read the plat. Try a clearer PDF or image.' }, { status: 502 });
    }
    const data = await res.json();
    const text = (data.content || []).map((b) => b.text || '').join('').trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return NextResponse.json({ ok: false, error: 'No lots could be read from that file.' }, { status: 502 });
    }
    let parsed;
    try {
      parsed = JSON.parse(text.slice(start, end + 1));
    } catch {
      return NextResponse.json({ ok: false, error: 'Could not parse the plat reading.' }, { status: 502 });
    }
    const unit = parsed.unit === 'Lots' ? 'Lots' : 'Tracts';
    const lots = Array.isArray(parsed.lots) ? parsed.lots.map((l) => ({
      lot: typeof l.lot === 'string' ? l.lot : '',
      acres: (typeof l.acres === 'number' && isFinite(l.acres)) ? l.acres : null,
    })) : [];
    return NextResponse.json({ ok: true, unit, lots });
  } catch (e) {
    console.error('[read-plat]', e);
    return NextResponse.json({ ok: false, error: e.message || 'Plat read failed' }, { status: 500 });
  }
}
