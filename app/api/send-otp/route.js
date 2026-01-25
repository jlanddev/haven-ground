export async function POST(request) {
  const { phone } = await request.json();

  // Format phone to E.164 if needed
  let formattedPhone = phone.replace(/\D/g, '');
  if (!formattedPhone.startsWith('1')) {
    formattedPhone = '1' + formattedPhone;
  }
  formattedPhone = '+' + formattedPhone;

  try {
    const response = await fetch(
      'https://api.telnyx.com/v2/verifications/sms',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: formattedPhone,
          verify_profile_id: process.env.TELNYX_VERIFY_PROFILE_ID
        })
      }
    );

    const data = await response.json();

    if (response.ok) {
      return Response.json({ success: true });
    } else {
      console.error('Telnyx error:', data);
      return Response.json({ success: false, error: data.errors?.[0]?.detail || 'Failed to send code' }, { status: 400 });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
