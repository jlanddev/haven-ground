import { NextResponse } from 'next/server';

// POST /api/ai/listing-draft
// Takes the owner's freeform notes about a property and returns a structured
// draft that fills the listing editor fields. It NEVER invents facts: anything
// not stated in the notes is left out. The description is written in the Haven
// Ground voice with no em dashes.
export async function POST(request) {
  try {
    const { notes, existing } = await request.json();
    if (!notes || !String(notes).trim()) {
      return NextResponse.json({ ok: false, error: 'Add some notes about the property first.' }, { status: 400 });
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'AI is not configured (missing key).' }, { status: 500 });
    }

    const system = [
      'You draft land listings for Haven Ground, a rural land company.',
      'You are given the owner\'s rough notes about ONE property. Return a single JSON object that fills the listing fields.',
      '',
      'HARD RULES:',
      '- Use ONLY facts stated or clearly implied in the notes. Never invent acreage, price, county, flood zone, utilities, road names, or features. If a field is unknown, omit it.',
      '- NO em dashes anywhere. Use periods and commas. Hyphens in ranges like 6-12 are fine.',
      '- Never use the phrases "live anywhere" or "owners anywhere". If relevant, say "out-of-state owners".',
      '- Voice: warm, grounded, honest expert. No hype, no exclamation points, no fluff.',
      '',
      'DESCRIPTION: 3 to 6 short paragraphs, MLS style, only facts from the notes. Lead with the headline fact (acreage + location or road frontage).',
      '',
      'LOTS/TRACTS: Only build lotTable if the notes state how many lots or tracts there are. Return one row per lot. Fill size like "5.23 acres" and price like "$151,670". If each size is given, use it; if only a total acreage and a count are given, split the acreage evenly; if a per-lot price or a price-per-acre is given, set price (price = size_acres * price_per_acre, rounded to the dollar); if no per-lot price can be derived, leave price "". Default status "Available". Pick lotUnit: "Tracts" for ranchette/acreage parcels, "Lots" for subdivision lots. If the notes do not give a lot count, omit lotTable entirely.',
      '',
      'Return ONLY this JSON (omit any key you cannot fill from the notes):',
      '{',
      '  "title": string,                     // short listing name',
      '  "location": string,                  // "City, ST"',
      '  "status": "Available"|"Sold Out"|"coming-soon"|"Engineering & Planning",',
      '  "type": "single"|"community",        // community = multiple lots/tracts',
      '  "priceRange": string,                // e.g. "From the $140s"',
      '  "price": number,                     // single asking price if one number',
      '  "pricePerAcre": number,',
      '  "acres": string,                     // e.g. "11.15" or "5-11"',
      '  "lots": string,                      // acreage label, e.g. "5-11 Acres"',
      '  "homeTypes": string,',
      '  "availableLots": number,',
      '  "targetBuyer": string,',
      '  "featured": boolean,                 // only if the notes clearly say to feature it',
      '  "description": string,',
      '  "features": string[],                // short chips, e.g. "Paved Frontage", "Outside FEMA Flood Zone"',
      '  "communityHighlights": string[],',
      '  "lotUnit": "Lots"|"Tracts",          // Tracts for larger ranchette/acreage parcels, Lots for subdivision lots',
      '  "lotTable": [ { "lot": string, "size": string, "price": string, "status": "Available"|"Pending"|"Sold" } ],',
      '  "propertyDetails": {',
      '    "location": { "address": string, "county": string, "parcelId": string },',
      '    "features": { "access": string, "power": string, "water": string, "sewer": string, "topography": string }',
      '  }',
      '}',
    ].join('\n');

    const user = [
      existing && (existing.title || existing.location)
        ? `Current draft (fill gaps, do not overwrite good values unless the notes correct them): ${JSON.stringify({ title: existing.title, location: existing.location, county: existing.propertyDetails?.location?.county })}`
        : '',
      'Owner notes:',
      String(notes).trim(),
    ].filter(Boolean).join('\n\n');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1800,
        temperature: 0.3,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error('[listing-draft] Claude error', res.status, t);
      return NextResponse.json({ ok: false, error: 'AI request failed. Try again.' }, { status: 502 });
    }
    const data = await res.json();
    const text = (data.content || []).map((b) => b.text || '').join('').trim();
    // Pull the JSON object out of the response (it may have stray prose around it).
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return NextResponse.json({ ok: false, error: 'AI did not return a usable draft.' }, { status: 502 });
    }
    let draft;
    try {
      draft = JSON.parse(text.slice(start, end + 1));
    } catch {
      return NextResponse.json({ ok: false, error: 'Could not parse the AI draft.' }, { status: 502 });
    }
    // Belt-and-suspenders: strip any em dashes the model slipped into text fields.
    const deDash = (v) => (typeof v === 'string' ? v.replace(/\s*[—–]\s*/g, ', ') : v);
    for (const k of Object.keys(draft)) {
      if (typeof draft[k] === 'string') draft[k] = deDash(draft[k]);
      if (Array.isArray(draft[k])) draft[k] = draft[k].map(deDash);
    }
    return NextResponse.json({ ok: true, draft });
  } catch (e) {
    console.error('[listing-draft]', e);
    return NextResponse.json({ ok: false, error: e.message || 'Draft failed' }, { status: 500 });
  }
}
