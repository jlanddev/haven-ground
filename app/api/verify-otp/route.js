export async function POST(request) {
  const { phone, code } = await request.json();

  // Format phone to E.164 if needed
  let formattedPhone = phone.replace(/\D/g, '');
  if (!formattedPhone.startsWith('1')) {
    formattedPhone = '1' + formattedPhone;
  }
  formattedPhone = '+' + formattedPhone;

  console.log('Verifying OTP for:', formattedPhone, 'code:', code);

  try {
    const response = await fetch(
      `https://api.telnyx.com/v2/verifications/by_phone_number/${encodeURIComponent(formattedPhone)}/actions/verify`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          verify_profile_id: process.env.TELNYX_VERIFY_PROFILE_ID
        })
      }
    );

    const data = await response.json();
    console.log('Telnyx verify response:', JSON.stringify(data, null, 2));

    // Check multiple possible success conditions
    const isAccepted =
      data.data?.response_code === 'accepted' ||
      data.response_code === 'accepted' ||
      response.ok;

    if (isAccepted && !data.errors) {
      return Response.json({ success: true, verified: true });
    } else {
      console.error('Telnyx verify failed:', data);
      return Response.json({
        success: false,
        verified: false,
        error: data.errors?.[0]?.detail || data.message || 'Invalid code'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    return Response.json({ success: false, verified: false, error: error.message }, { status: 500 });
  }
}
