import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { reason } = await request.json();

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json({ result: 'DESCRIPTION_ONLY' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return NextResponse.json({ result: 'PASS', error: 'NO_API_KEY' });
    }

    console.log('Calling Claude API, key length:', apiKey.length);

    const systemPrompt = `You are a lead qualification assistant for Haven Ground, a land buying company. A potential seller just answered the question 'What's your reason for selling?' Your job is to determine if they gave an actual reason for wanting to sell their property. An actual reason means WHY they want to sell, not WHAT the property is. Examples of real reasons: inherited it, getting divorced, need cash, relocating, retiring, can't afford taxes, don't use it, too far away, medical issues, family situation, bought another property, want to move on. If their response contains any real reason for selling, respond PASS. If their response is just a description of the property with no reason for selling, that is not a pass. Describing acreage, barns, driveways, power, land features, that tells us what the property is, not why they want to sell. If they mention lowball, don't lowball, serious offers only, not selling cheap, or anything combative about pricing with no actual reason to sell, that is a TIRE_KICKER. If they are clearly a wholesaler or investor trying to assign contracts or move deals, that is a WHOLESALER. If they only described property features with no reason, that is DESCRIPTION_ONLY. Do not be lenient. The question asked WHY they are selling. If they did not answer why, they did not pass. Respond with only one word: PASS, WHOLESALER, TIRE_KICKER, or DESCRIPTION_ONLY.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 10,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: reason
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return NextResponse.json({ result: 'PASS', error: `API_ERROR_${response.status}`, details: errorText });
    }

    const data = await response.json();
    console.log('Claude response:', JSON.stringify(data));
    const result = data.content?.[0]?.text?.trim().toUpperCase() || 'PASS';

    // Validate the result is one of the expected values
    const validResults = ['PASS', 'WHOLESALER', 'TIRE_KICKER', 'DESCRIPTION_ONLY'];
    if (!validResults.includes(result)) {
      return NextResponse.json({ result: 'PASS', error: 'INVALID_RESPONSE', raw: result });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({ result: 'PASS', error: 'EXCEPTION', message: error.message });
  }
}
