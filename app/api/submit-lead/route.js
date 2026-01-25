import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Send SMS notification via Telnyx
async function sendLeadNotification(leadData) {
  const message = `New Lead 🏡

Acreage Range: ${leadData.acres || 'N/A'} acres
Seller Name: ${leadData.fullName}
County: ${leadData.propertyCounty}
State: ${leadData.propertyState}

Seller Contact Info
Phone: ${leadData.phone}
Email: ${leadData.email}`;

  try {
    const response = await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '+18336323257',
        to: '+17139315872',
        text: message
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Telnyx SMS error:', data);
    }
    return response.ok;
  } catch (error) {
    console.error('SMS notification error:', error);
    return false;
  }
}

export async function POST(request) {
  try {
    const leadData = await request.json();

    // Insert lead into ParcelReach database
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        // User info
        full_name: leadData.fullName,
        name: leadData.fullName, // For backwards compatibility
        email: leadData.email,
        phone: leadData.phone,
        names_on_deed: leadData.namesOnDeed,

        // Property info
        street_address: leadData.streetAddress,
        address: leadData.streetAddress, // For backwards compatibility
        property_county: leadData.propertyCounty,
        county: leadData.propertyCounty, // For backwards compatibility
        property_state: leadData.propertyState,
        state: leadData.propertyState, // For backwards compatibility
        acres: parseFloat(leadData.acres) || null,
        acreage: parseFloat(leadData.acres) || null, // For backwards compatibility

        // Regrid parcel data (if available)
        parcel_id: leadData.parcelId,
        regrid_data: leadData.regridData,

        // SMS verification
        sms_consent: leadData.smsConsent || false,
        sms_verified: leadData.smsVerified || false,

        // Source tracking
        source: 'haven-ground',
        status: 'new',

        // Metadata
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Send SMS notification (don't block on failure)
    sendLeadNotification(leadData);

    return NextResponse.json({
      success: true,
      leadId: data[0].id,
      message: 'Lead submitted successfully'
    });

  } catch (error) {
    console.error('Submit lead error:', error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
