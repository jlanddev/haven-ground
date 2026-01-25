export async function POST(request) {
  const { phone, code } = await request.json();

  // Format phone to E.164 if needed
  let formattedPhone = phone.replace(/\D/g, '');
  if (!formattedPhone.startsWith('1')) {
    formattedPhone = '1' + formattedPhone;
  }
  formattedPhone = '+' + formattedPhone;

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

    // Telnyx returns 200 OK with response_code "accepted" or "rejected"
    if (data.data?.response_code === 'accepted') {
      return Response.json({ success: true, verified: true });
    } else {
      return Response.json({
        success: false,
        verified: false,
        error: 'Invalid verification code'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    return Response.json({ success: false, verified: false, error: error.message }, { status: 500 });
  }
}
