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
      // Fallback to PASS if API key not configured
      return NextResponse.json({ result: 'PASS' });
    }

    const systemPrompt = `You are a lead qualification assistant for Haven Ground, a land buying company. A potential seller just answered the question 'What's your reason for selling?' Read their response and determine if they have any real motivation to sell their property. If they have any legitimate reason at all, even a vague one, respond with PASS. If they are clearly a wholesaler or investor trying to use our system to move their own deals, respond with WHOLESALER. If they have zero motivation to sell and are just looking for a free valuation, being combative about pricing, or telling us not to contact them with real offers, respond with TIRE_KICKER. If they just described their property features with absolutely no reason for selling mentioned, respond with DESCRIPTION_ONLY. When in doubt always PASS. We would rather talk to a questionable lead than miss a real seller. Respond with only one word: PASS, WHOLESALER, TIRE_KICKER, or DESCRIPTION_ONLY.`;

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
      console.error('Claude API error:', response.status);
      // Fallback to PASS on API error
      return NextResponse.json({ result: 'PASS' });
    }

    const data = await response.json();
    const result = data.content?.[0]?.text?.trim().toUpperCase() || 'PASS';

    // Validate the result is one of the expected values
    const validResults = ['PASS', 'WHOLESALER', 'TIRE_KICKER', 'DESCRIPTION_ONLY'];
    if (!validResults.includes(result)) {
      return NextResponse.json({ result: 'PASS' });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Validation error:', error);
    // Fallback to PASS on any error
    return NextResponse.json({ result: 'PASS' });
  }
}
