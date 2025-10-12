export async function POST(request) {
  const { phone } = await request.json();

  try {
    const response = await fetch(
      'https://verify.twilio.com/v2/Services/VAd757ec84f669072e193dc6bbb87330f3/Verifications',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from('AC9b195544dc974c5c95dee7b71549a9fc:694f23afdc3ab3d35eaea4502c91d876').toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phone,
          Channel: 'sms'
        })
      }
    );

    const data = await response.json();

    if (response.ok) {
      return Response.json({ success: true });
    } else {
      return Response.json({ success: false, error: data.message }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
