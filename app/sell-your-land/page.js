"use client";

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';

export default function SellYourLandPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formFocused, setFormFocused] = useState(false);
  const [showDisqualifiedModal, setShowDisqualifiedModal] = useState(false);
  const [formData, setFormData] = useState({
    position: '',
    firstName: '',
    lastName: '',
    propertyState: '',
    propertyCounty: '',
    streetAddress: '',
    zipCode: '',
    nameOnTitle: '',
    parcelId: '',
    homeOnProperty: '',
    propertyListed: '',
    ownershipLength: '',
    email: '',
    phone: '',
    smsConsent: false
  });
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [e164Phone, setE164Phone] = useState('');

  // Property location states
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [locatingProperty, setLocatingProperty] = useState(false);
  const [locateError, setLocateError] = useState('');

  // Lock body scroll when modal is open OR form is focused
  useEffect(() => {
    if (showDisqualifiedModal || formFocused) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDisqualifiedModal, formFocused]);

  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setFormData({
        ...formData,
        [name]: formatted
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Locate property using Regrid API
  const locateProperty = async () => {
    setLocateError('');

    // Validate required fields
    if (!formData.propertyState || !formData.propertyCounty) {
      setLocateError('Please provide both state and county.');
      return;
    }

    // Check that at least one optional field is filled
    if (!formData.streetAddress && !formData.zipCode && !formData.nameOnTitle && !formData.parcelId) {
      setLocateError('Please provide at least one: address, zip code, name on title, or parcel ID.');
      return;
    }

    setLocatingProperty(true);

    try {
      // Build query string with available data
      const queryParts = [];
      if (formData.streetAddress) queryParts.push(formData.streetAddress);
      if (formData.propertyCounty) queryParts.push(formData.propertyCounty);
      if (formData.propertyState) queryParts.push(formData.propertyState);
      if (formData.zipCode) queryParts.push(formData.zipCode);

      const query = queryParts.join(', ');

      // Build URL with query params
      const params = new URLSearchParams();
      if (query) params.append('address', query);
      if (formData.parcelId) params.append('apn', formData.parcelId);

      const response = await fetch(`/api/regrid/lookup?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.results && data.results.length > 0) {
        const parcel = data.results[0];
        setSelectedParcel({
          acres: parcel.properties.acres || 'Unknown',
          owner: parcel.properties.owner || formData.nameOnTitle || 'Unknown',
          address: parcel.properties.address || formData.streetAddress || 'Unknown',
          county: parcel.properties.county || formData.propertyCounty,
          state: parcel.properties.state || formData.propertyState,
          apn: parcel.properties.apn || formData.parcelId || 'Unknown'
        });
        setLocateError('');
      } else {
        setLocateError('Property not found. Please verify your information and try again.');
      }
    } catch (error) {
      console.error('Error locating property:', error);
      setLocateError('Error locating property. Please try again.');
    } finally {
      setLocatingProperty(false);
    }
  };

  const handleNext = () => {
    // Check if user selected realtor or wholesaler on step 1
    if (currentStep === 1 && (formData.position === 'realtor' || formData.position === 'wholesaler')) {
      setShowDisqualifiedModal(true);
      return;
    }
    setCurrentStep(currentStep + 1);
    window.scrollTo({ top: document.getElementById('contact-form')?.offsetTop - 100 || 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    // If going back from step 5, clear selected parcel
    if (currentStep === 5) {
      setSelectedParcel(null);
      setLocateError('');
    }
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: document.getElementById('contact-form')?.offsetTop - 100 || 0, behavior: 'smooth' });
  };

  const handleFormFocus = () => {
    setFormFocused(true);
  };

  const sendOTP = async () => {
    setIsLoading(true);
    setOtpError('');

    // Convert formatted phone to E.164 format for Twilio
    const e164 = '+1' + formData.phone.replace(/\D/g, '');
    setE164Phone(e164);

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164 })
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        // Stay on step 9, just show OTP input
      } else {
        setOtpError(data.error || 'Failed to send code');
      }
    } catch (error) {
      setOtpError('Failed to send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    setIsLoading(true);
    setOtpError('');

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164Phone, code: otpCode })
      });

      const data = await response.json();

      if (data.verified) {
        setOtpVerified(true);
        setIsLoading(false);
        // Submit to GHL (this will handle redirect)
        await submitToGHL();
      } else {
        setOtpError('Invalid code. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      setOtpError('Verification failed. Please try again.');
      setIsLoading(false);
    }
  };

  const submitToGHL = async () => {
    console.log('🚀 Starting submitToGHL...');

    // Prepare data for GHL webhook
    const webhookData = {
      full_name: `${formData.firstName} ${formData.lastName}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: e164Phone,
      position: formData.position,
      home_on_property: formData.homeOnProperty,
      property_listed: formData.propertyListed,
      ownership_length: formData.ownershipLength,
      property_state: formData.propertyState,
      street_address: formData.streetAddress || selectedParcel?.address || '',
      property_county: formData.propertyCounty,
      zip_code: formData.zipCode,
      name_on_title: formData.nameOnTitle,
      parcel_id: formData.parcelId || selectedParcel?.apn || '',
      acres: selectedParcel?.acres || '',
      phone_verified: true,
      lead_source: 'Website - Sell Your Land Form',
      submitted_at: new Date().toISOString()
    };

    console.log('📦 Webhook data:', webhookData);

    try {
      console.log('📡 Sending webhook to GHL...');
      const response = await fetch('https://services.leadconnectorhq.com/hooks/wLaNbf44RqmPNhV1IEev/webhook-trigger/32643373-57f4-47c1-9b89-c4ecf9143beb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });

      console.log('✅ Response status:', response.status);
      const responseData = await response.json();
      console.log('✅ Response data:', responseData);

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      console.log('⏳ Waiting 1 second before redirect...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to thank you page
      // Qualified leads: no home + not listed
      const isQualified = (
        formData.homeOnProperty === 'no' &&
        formData.propertyListed === 'no'
      );
      console.log('🎯 Redirecting to:', isQualified ? '/thank-you' : '/thank-you-dq');
      window.location.href = isQualified ? '/thank-you' : '/thank-you-dq';
    } catch (error) {
      console.error('❌ Webhook error:', error);
      // Still redirect even if webhook fails
      const isQualified = (
        formData.homeOnProperty === 'no' &&
        formData.propertyListed === 'no'
      );
      console.log('🎯 Redirecting anyway to:', isQualified ? '/thank-you' : '/thank-you-dq');
      window.location.href = isQualified ? '/thank-you' : '/thank-you-dq';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Form submission is now handled by OTP verification
  };

  return (
    <div className="flex flex-col min-h-screen font-serif relative">
      {/* Darkened overlay when form is focused */}
      {formFocused && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-500"
          onClick={() => setFormFocused(false)}
        ></div>
      )}

      {/* Disqualified Modal */}
      {showDisqualifiedModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-fadeIn my-8">
            <button
              onClick={() => setShowDisqualifiedModal(false)}
              className="absolute top-4 right-4 text-[#3A4045] hover:text-[#2F4F33] text-2xl"
            >
              ×
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#2F4F33] rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#F5EFD9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h3 className="text-2xl font-serif font-bold text-[#2F4F33] mb-4">
                Thanks for Your Interest
              </h3>

              <p className="text-[#3A4045] mb-6 leading-relaxed">
                We appreciate you reaching out. For professional inquiries, please send your potential deal information directly to our acquisitions team:
              </p>

              <div className="bg-[#F5EFD9] rounded-lg p-6 mb-6">
                <div className="mb-4">
                  <p className="text-sm text-[#3A4045] mb-2">Email us at:</p>
                  <a href="mailto:acquisitions@havenground.com" className="text-lg font-semibold text-[#2F4F33] hover:underline">
                    acquisitions@havenground.com
                  </a>
                </div>
                <div className="border-t border-[#D2C6B2] pt-4">
                  <p className="text-sm text-[#3A4045] mb-2">Or call us:</p>
                  <a href="tel:555-555-5555" className="text-lg font-semibold text-[#2F4F33] hover:underline">
                    (469) 640-3864
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowDisqualifiedModal(false)}
                  className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-6 py-3 rounded-lg font-semibold hover:bg-[#F5EFD9] transition-colors duration-200"
                >
                  Exit Form
                </button>
                <a
                  href="/"
                  className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-6 py-3 rounded-lg font-semibold hover:bg-[#1a2e1c] transition-colors duration-200 text-center"
                >
                  Continue to Site
                </a>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Navigation */}
      <nav className="bg-[#F5EFD9] py-4 border-b border-[#D2C6B2] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center relative z-20">
              <a href="/" className="relative">
                <img src="/images/Haven LOGO Use.png" alt="Haven Ground Logo" className="h-16 sm:h-20 md:h-24 w-auto hover:opacity-90 transition-opacity duration-300"/>
              </a>
            </div>
            <div className="hidden md:flex items-center space-x-8 lg:space-x-10">
              <a href="/properties" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Properties</a>
              <a href="/development" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Development</a>
              <a href="/sell-your-land" className="text-[#2F4F33] text-lg font-medium border-b-2 border-[#2F4F33] transition-colors duration-200">Sell Us Land</a>
              <a href="/community" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Community</a>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden relative z-20 p-2 rounded-md text-[#2F4F33] hover:text-[#7D6B58] hover:bg-[#D2C6B2] focus:outline-none focus:ring-2 focus:ring-[#7D6B58] transition-colors duration-200">
              <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
            </button>
          </div>
          <div className={`md:hidden absolute top-full left-0 right-0 bg-[#F5EFD9] border-b border-[#D2C6B2] shadow-lg transform transition-all duration-300 ease-in-out origin-top ${mobileMenuOpen ? 'translate-y-0 opacity-100 scale-y-100' : '-translate-y-2 opacity-0 scale-y-95 pointer-events-none'}`}>
            <div className="px-4 py-4 space-y-2">
              <a href="/properties" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#7D6B58]">Properties</a>
              <a href="/development" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#7D6B58]">Development</a>
              <a href="/sell-your-land" className="block text-[#2F4F33] font-medium text-lg py-3 bg-[#D2C6B2] rounded-lg px-4 border-l-4 border-[#2F4F33]">Sell Us Land</a>
              <a href="/community" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#7D6B58]">Community</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-[#2F4F33] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2F4F33] to-[#1a2e1c] opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-[#F5EFD9] font-serif font-light mb-6 leading-tight">
              Ready to Sell Your Land?
            </h1>
            <p className="text-xl md:text-2xl text-[#D2C6B2] max-w-3xl mx-auto leading-relaxed mb-8">
              Whether life's thrown you a curveball or you're just ready to move on, we're here to help make it straightforward.
            </p>
            <a href="#contact-form" className="inline-block bg-[#D4A574] text-white px-10 py-4 text-lg font-bold hover:bg-[#C69A65] transition-all duration-300 shadow-lg shadow-orange-500/50 hover:shadow-xl hover:shadow-orange-500/70 transform hover:scale-105 rounded-md border-2 border-[#E8B86D]">
              CLICK FOR MY OFFER
            </a>
          </div>
        </div>
      </div>

      {/* Trust Builders */}
      <div className="py-16 bg-gradient-to-br from-[#F5EFD9] to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl text-[#2F4F33] font-serif font-light mb-4">Why Landowners Choose Us</h2>
            <p className="text-lg text-[#3A4045] max-w-2xl mx-auto">
              We've been doing this long enough to know what works and what doesn't. Here's what sets us apart.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="p-8 bg-white rounded-lg shadow-lg border-t-4 border-[#2F4F33] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-3">We Know Land</h3>
                  <p className="text-[#3A4045] leading-relaxed">
                    Mountain properties, working ranches, development tracts, commercial land. Simple closings and complicated ones with tax issues, title questions, or scattered family members who all need to sign. We've handled it all and know how to get deals closed.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white rounded-lg shadow-lg border-t-4 border-[#2F4F33] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-3">We Actually Close</h3>
                  <p className="text-[#3A4045] leading-relaxed">
                    No surprises at the closing table. No last-minute renegotiations. When we make an offer and you accept it, we follow through. Our reputation depends on it, and we've built that reputation one handshake at a time.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white rounded-lg shadow-lg border-t-4 border-[#2F4F33] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-3">Straightforward Process</h3>
                  <p className="text-[#3A4045] leading-relaxed">
                    We handle the paperwork, take care of closing costs, and work on your timeline. If you need time to move equipment or settle estate matters, we understand. This is your land and your decision.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white rounded-lg shadow-lg border-t-4 border-[#2F4F33] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-3">Respect for Your Legacy</h3>
                  <p className="text-[#3A4045] leading-relaxed">
                    We know this land likely means something to you. Maybe it's been in your family. Maybe you built something here. We're not just buying dirt, we're continuing a story. That matters to us.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Life Situations */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl text-[#2F4F33] font-serif font-light mb-4">Whatever Your Reason</h2>
            <p className="text-lg text-[#3A4045] max-w-2xl mx-auto">
              Life happens. We've worked with landowners in all kinds of situations, and we understand that every story is different.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <div className="text-center p-6 bg-[#F5EFD9] rounded-lg hover:bg-[#D2C6B2] transition-colors duration-300">
              <h3 className="text-lg text-[#2F4F33] font-semibold mb-2">Estate Settlements</h3>
              <p className="text-[#3A4045] text-sm">Inherited land you don't need or can't maintain</p>
            </div>
            <div className="text-center p-6 bg-[#F5EFD9] rounded-lg hover:bg-[#D2C6B2] transition-colors duration-300">
              <h3 className="text-lg text-[#2F4F33] font-semibold mb-2">Relocation</h3>
              <p className="text-[#3A4045] text-sm">Moving and need to sell before you go</p>
            </div>
            <div className="text-center p-6 bg-[#F5EFD9] rounded-lg hover:bg-[#D2C6B2] transition-colors duration-300">
              <h3 className="text-lg text-[#2F4F33] font-semibold mb-2">Financial Changes</h3>
              <p className="text-[#3A4045] text-sm">Need to free up cash or reduce obligations</p>
            </div>
            <div className="text-center p-6 bg-[#F5EFD9] rounded-lg hover:bg-[#D2C6B2] transition-colors duration-300">
              <h3 className="text-lg text-[#2F4F33] font-semibold mb-2">Retirement Planning</h3>
              <p className="text-[#3A4045] text-sm">Simplifying assets as you plan ahead</p>
            </div>
            <div className="text-center p-6 bg-[#F5EFD9] rounded-lg hover:bg-[#D2C6B2] transition-colors duration-300">
              <h3 className="text-lg text-[#2F4F33] font-semibold mb-2">Property Challenges</h3>
              <p className="text-[#3A4045] text-sm">Tax burdens, maintenance, or access issues</p>
            </div>
            <div className="text-center p-6 bg-[#F5EFD9] rounded-lg hover:bg-[#D2C6B2] transition-colors duration-300">
              <h3 className="text-lg text-[#2F4F33] font-semibold mb-2">Just Ready to Sell</h3>
              <p className="text-[#3A4045] text-sm">Sometimes you're just ready to move on</p>
            </div>
          </div>

          <div className="text-center mt-10">
            <p className="text-lg text-[#3A4045] max-w-2xl mx-auto font-light italic">
              No matter your situation, we approach every conversation with respect and understanding. This is about helping you, not pushing a sale.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-gradient-to-b from-[#F5EFD9] to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl text-[#2F4F33] font-serif font-light mb-4">Simple Process</h2>
            <p className="text-lg text-[#3A4045]">
              No games. No pressure. Just an honest process from start to finish.
            </p>
          </div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute left-6 top-6 bottom-6 w-0.5 bg-[#D2C6B2]"></div>

            <div className="space-y-8">
              <div className="flex gap-6 items-start relative">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#2F4F33] text-[#F5EFD9] flex items-center justify-center text-2xl font-bold shadow-lg z-10">1</div>
                <div className="bg-white p-6 rounded-lg shadow-md flex-1 border-l-4 border-[#2F4F33]">
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-2">Tell Us About Your Property</h3>
                  <p className="text-[#3A4045] leading-relaxed">
                    Fill out the form below or give us a call. We'll ask about your land, your timeline, and what you're hoping to accomplish.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start relative">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#2F4F33] text-[#F5EFD9] flex items-center justify-center text-2xl font-bold shadow-lg z-10">2</div>
                <div className="bg-white p-6 rounded-lg shadow-md flex-1 border-l-4 border-[#2F4F33]">
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-2">We Do Our Homework</h3>
                  <p className="text-[#3A4045] leading-relaxed">
                    We'll research your property, review surveys and access, understand the market, and figure out what it's truly worth. This takes a few days, not weeks.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start relative">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#2F4F33] text-[#F5EFD9] flex items-center justify-center text-2xl font-bold shadow-lg z-10">3</div>
                <div className="bg-white p-6 rounded-lg shadow-md flex-1 border-l-4 border-[#2F4F33]">
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-2">You Get a Fair Offer</h3>
                  <p className="text-[#3A4045] leading-relaxed">
                    We'll present our offer and explain how we got there. You take your time deciding. No pressure, no tactics. Accept it or don't.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start relative">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#2F4F33] text-[#F5EFD9] flex items-center justify-center text-2xl font-bold shadow-lg z-10">4</div>
                <div className="bg-white p-6 rounded-lg shadow-md flex-1 border-l-4 border-[#2F4F33]">
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-2">We Handle Everything</h3>
                  <p className="text-[#3A4045] leading-relaxed">
                    Title work, surveys if needed, closing costs—we take care of it. You show up to closing, sign papers, and get paid. That's it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div id="contact-form" className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl text-[#2F4F33] font-serif font-light mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-[#3A4045]">
              Tell us about your property and we'll be in touch within 24 hours.
            </p>
          </div>

          {/* Beautiful 9-Step Form */}
          <form
            onSubmit={handleSubmit}
            onClick={handleFormFocus}
            className={`bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12 max-w-2xl mx-auto transition-all duration-500 ${
              formFocused ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 scale-105 max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto' : ''
            }`}
          >
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-[#2F4F33]">Step {currentStep} of 9</span>
                <span className="text-sm font-medium text-[#2F4F33]">{Math.round((currentStep / 9) * 100)}%</span>
              </div>
              <div className="w-full bg-[#D2C6B2] rounded-full h-2">
                <div
                  className="bg-[#2F4F33] h-2 rounded-full transition-all duration-500"
                  style={{width: `${(currentStep / 9) * 100}%`}}
                ></div>
              </div>
            </div>

            {/* Step 1: Position Qualifier */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  What's your relationship to this property?
                </h3>

                <div className="grid gap-3">
                  {[
                    {value: 'sole-owner', label: 'Sole Owner'},
                    {value: 'co-owner', label: 'Co-Owner'},
                    {value: 'family-member', label: 'Family Member, POA, or Friend Assisting Sale'},
                    {value: 'realtor', label: 'Realtor'},
                    {value: 'wholesaler', label: 'Wholesaler'}
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({...formData, position: option.value})}
                      className={`w-full p-5 border-2 rounded-lg text-left transition-all transform hover:scale-102 ${
                        formData.position === option.value
                          ? 'border-[#2F4F33] bg-[#F5EFD9] text-[#2F4F33] font-semibold shadow-lg'
                          : 'border-[#D2C6B2] hover:border-[#2F4F33] text-[#3A4045] hover:bg-[#F5EFD9]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          formData.position === option.value ? 'border-[#2F4F33] bg-[#2F4F33]' : 'border-[#D2C6B2]'
                        }`}>
                          {formData.position === option.value && (
                            <div className="w-3 h-3 bg-[#F5EFD9] rounded-full"></div>
                          )}
                        </div>
                        <span className="text-lg">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!formData.position}
                  className="w-full bg-[#D4A574] text-white px-8 py-4 sm:py-5 text-base sm:text-lg font-bold hover:bg-[#C69A65] transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed mt-6 rounded-lg active:scale-95"
                >
                  Continue →
                </button>
              </div>
            )}

            {/* Step 2: First Name */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  What is your first name?
                </h3>

                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors"
                  autoFocus
                />

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300 rounded-lg">
                    ← Back
                  </button>
                  <button type="button" onClick={handleNext} disabled={!formData.firstName} className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed rounded-lg">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Last Name */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  What is your last name?
                </h3>

                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors"
                  autoFocus
                />

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300 rounded-lg">
                    ← Back
                  </button>
                  <button type="button" onClick={handleNext} disabled={!formData.lastName} className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed rounded-lg">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Let's Locate Your Land */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  Let's Locate Your Land
                </h3>

                <div className="space-y-4">
                  {/* State - Required */}
                  <div>
                    <label className="block text-sm font-medium text-[#2F4F33] mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="propertyState"
                      value={formData.propertyState}
                      onChange={handleChange}
                      className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-white text-[#3A4045] transition-colors"
                    >
                      <option value="">Select State</option>
                      <option value="Alabama">Alabama</option>
                      <option value="Alaska">Alaska</option>
                      <option value="Arizona">Arizona</option>
                      <option value="Arkansas">Arkansas</option>
                      <option value="California">California</option>
                      <option value="Colorado">Colorado</option>
                      <option value="Connecticut">Connecticut</option>
                      <option value="Delaware">Delaware</option>
                      <option value="Florida">Florida</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Hawaii">Hawaii</option>
                      <option value="Idaho">Idaho</option>
                      <option value="Illinois">Illinois</option>
                      <option value="Indiana">Indiana</option>
                      <option value="Iowa">Iowa</option>
                      <option value="Kansas">Kansas</option>
                      <option value="Kentucky">Kentucky</option>
                      <option value="Louisiana">Louisiana</option>
                      <option value="Maine">Maine</option>
                      <option value="Maryland">Maryland</option>
                      <option value="Massachusetts">Massachusetts</option>
                      <option value="Michigan">Michigan</option>
                      <option value="Minnesota">Minnesota</option>
                      <option value="Mississippi">Mississippi</option>
                      <option value="Missouri">Missouri</option>
                      <option value="Montana">Montana</option>
                      <option value="Nebraska">Nebraska</option>
                      <option value="Nevada">Nevada</option>
                      <option value="New Hampshire">New Hampshire</option>
                      <option value="New Jersey">New Jersey</option>
                      <option value="New Mexico">New Mexico</option>
                      <option value="New York">New York</option>
                      <option value="North Carolina">North Carolina</option>
                      <option value="North Dakota">North Dakota</option>
                      <option value="Ohio">Ohio</option>
                      <option value="Oklahoma">Oklahoma</option>
                      <option value="Oregon">Oregon</option>
                      <option value="Pennsylvania">Pennsylvania</option>
                      <option value="Rhode Island">Rhode Island</option>
                      <option value="South Carolina">South Carolina</option>
                      <option value="South Dakota">South Dakota</option>
                      <option value="Tennessee">Tennessee</option>
                      <option value="Texas">Texas</option>
                      <option value="Utah">Utah</option>
                      <option value="Vermont">Vermont</option>
                      <option value="Virginia">Virginia</option>
                      <option value="Washington">Washington</option>
                      <option value="West Virginia">West Virginia</option>
                      <option value="Wisconsin">Wisconsin</option>
                      <option value="Wyoming">Wyoming</option>
                    </select>
                  </div>

                  {/* County - Required */}
                  <div>
                    <label className="block text-sm font-medium text-[#2F4F33] mb-2">
                      County <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="propertyCounty"
                      value={formData.propertyCounty}
                      onChange={handleChange}
                      placeholder="e.g., Dallas County"
                      className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors"
                    />
                  </div>

                  {/* Address - Optional */}
                  <div>
                    <label className="block text-sm font-medium text-[#3A4045] mb-2">
                      Address (optional)
                    </label>
                    <input
                      type="text"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleChange}
                      placeholder="123 Main St"
                      className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors"
                    />
                  </div>

                  {/* Zip Code - Optional */}
                  <div>
                    <label className="block text-sm font-medium text-[#3A4045] mb-2">
                      Zip Code (optional)
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      placeholder="75001"
                      className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors"
                    />
                  </div>

                  {/* Name on Title - Optional */}
                  <div>
                    <label className="block text-sm font-medium text-[#3A4045] mb-2">
                      Name on Title (optional)
                    </label>
                    <input
                      type="text"
                      name="nameOnTitle"
                      value={formData.nameOnTitle}
                      onChange={handleChange}
                      placeholder="Name as it appears on deed"
                      className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors"
                    />
                  </div>

                  {/* Parcel ID or APN - Optional */}
                  <div>
                    <label className="block text-sm font-medium text-[#3A4045] mb-2">
                      Parcel ID or APN (optional)
                    </label>
                    <input
                      type="text"
                      name="parcelId"
                      value={formData.parcelId}
                      onChange={handleChange}
                      placeholder="1234-567-890"
                      className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors"
                    />
                  </div>
                </div>

                {/* Locate Error */}
                {locateError && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {locateError}
                  </div>
                )}

                {/* Locate Property Button */}
                {!selectedParcel && (
                  <button
                    type="button"
                    onClick={locateProperty}
                    disabled={locatingProperty}
                    className="w-full bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-semibold hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-3"
                  >
                    {locatingProperty ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Locating...
                      </>
                    ) : (
                      'Locate Property'
                    )}
                  </button>
                )}

                {/* Property Confirmation Card */}
                {selectedParcel && (
                  <div className="bg-[#F5EFD9] border-2 border-[#2F4F33] rounded-lg p-6 animate-fadeIn">
                    <div className="flex items-start gap-3 mb-4">
                      <svg className="w-6 h-6 text-[#2F4F33] flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-serif text-lg text-[#2F4F33] font-semibold mb-3">Property Found!</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[#3A4045]">Address:</span>
                            <span className="font-medium text-[#2F4F33]">{selectedParcel.address}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#3A4045]">County:</span>
                            <span className="font-medium text-[#2F4F33]">{selectedParcel.county}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#3A4045]">State:</span>
                            <span className="font-medium text-[#2F4F33]">{selectedParcel.state}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#3A4045]">Acreage:</span>
                            <span className="font-medium text-[#2F4F33]">{selectedParcel.acres} acres</span>
                          </div>
                          {selectedParcel.owner !== 'Unknown' && (
                            <div className="flex justify-between">
                              <span className="text-[#3A4045]">Owner:</span>
                              <span className="font-medium text-[#2F4F33]">{selectedParcel.owner}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-semibold hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl rounded-lg"
                    >
                      Confirm Property →
                    </button>
                  </div>
                )}

                {/* Back Button */}
                {!selectedParcel && (
                  <div className="flex gap-4 mt-6">
                    <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300 rounded-lg">
                      ← Back
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Home on Property */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  Is there a home on the property?
                </h3>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, homeOnProperty: 'no'})}
                    className={`p-5 sm:p-6 border-2 rounded-lg text-center transition-all active:scale-95 ${
                      formData.homeOnProperty === 'no'
                        ? 'border-[#2F4F33] bg-[#F5EFD9] text-[#2F4F33] font-semibold shadow-lg'
                        : 'border-[#D2C6B2] hover:border-[#2F4F33] text-[#3A4045]'
                    }`}
                  >
                    <span className="text-3xl sm:text-4xl font-bold">No</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, homeOnProperty: 'yes'})}
                    className={`p-5 sm:p-6 border-2 rounded-lg text-center transition-all active:scale-95 ${
                      formData.homeOnProperty === 'yes'
                        ? 'border-[#2F4F33] bg-[#F5EFD9] text-[#2F4F33] font-semibold shadow-lg'
                        : 'border-[#D2C6B2] hover:border-[#2F4F33] text-[#3A4045]'
                    }`}
                  >
                    <span className="text-3xl sm:text-4xl font-bold">Yes</span>
                  </button>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300 rounded-lg"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!formData.homeOnProperty}
                    className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 6: Property Listed */}
            {currentStep === 6 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  Is the property currently listed with a realtor?
                </h3>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, propertyListed: 'no'})}
                    className={`p-6 border-2 rounded-lg text-center transition-all ${
                      formData.propertyListed === 'no'
                        ? 'border-[#2F4F33] bg-[#F5EFD9] text-[#2F4F33] font-semibold shadow-lg'
                        : 'border-[#D2C6B2] hover:border-[#2F4F33] text-[#3A4045]'
                    }`}
                  >
                    <span className="text-4xl font-bold">No</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, propertyListed: 'yes'})}
                    className={`p-6 border-2 rounded-lg text-center transition-all ${
                      formData.propertyListed === 'yes'
                        ? 'border-[#2F4F33] bg-[#F5EFD9] text-[#2F4F33] font-semibold shadow-lg'
                        : 'border-[#D2C6B2] hover:border-[#2F4F33] text-[#3A4045]'
                    }`}
                  >
                    <span className="text-4xl font-bold">Yes</span>
                  </button>
                </div>

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300 rounded-lg">
                    ← Back
                  </button>
                  <button type="button" onClick={handleNext} disabled={!formData.propertyListed} className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed rounded-lg">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 7: Ownership Length */}
            {currentStep === 7 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  How long have you owned it?
                </h3>

                <input
                  type="text"
                  name="ownershipLength"
                  value={formData.ownershipLength}
                  onChange={handleChange}
                  placeholder="e.g., 5 years, 18 months"
                  className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors"
                  autoFocus
                />

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300 rounded-lg">
                    ← Back
                  </button>
                  <button type="button" onClick={handleNext} disabled={!formData.ownershipLength} className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed rounded-lg">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 8: Email */}
            {currentStep === 8 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  What is your email address?
                </h3>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors"
                  autoFocus
                />

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300 rounded-lg">
                    ← Back
                  </button>
                  <button type="button" onClick={handleNext} disabled={!formData.email} className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed rounded-lg">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 9: Phone + SMS Consent + OTP */}
            {currentStep === 9 && (
              <div className="space-y-6 animate-fadeIn">
                {!otpSent ? (
                  <>
                    <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                      What is your phone number?
                    </h3>

                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(469) 640-3864"
                      className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors"
                      autoFocus
                    />

                    <div className="bg-[#F5EFD9] p-4 rounded-lg">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="smsConsent"
                          checked={formData.smsConsent}
                          onChange={(e) => setFormData({...formData, smsConsent: e.target.checked})}
                          className="mt-1 w-5 h-5 text-[#2F4F33] border-[#D2C6B2] rounded focus:ring-[#2F4F33]"
                        />
                        <span className="text-sm text-[#3A4045]">
                          By continuing, you agree to receive SMS updates about your property inquiry. Message and data rates may apply.
                        </span>
                      </label>
                    </div>

                    {otpError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {otpError}
                      </div>
                    )}

                    <div className="flex gap-4 mt-6">
                      <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300 rounded-lg">
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={sendOTP}
                        disabled={!formData.phone || !formData.smsConsent || isLoading}
                        className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                      >
                        {isLoading ? 'Sending...' : 'Send Verification Code →'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                      Enter verification code
                    </h3>

                    <p className="text-[#3A4045] mb-4">
                      We sent a 6-digit code to <strong>{formData.phone}</strong>
                    </p>

                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="000000"
                      maxLength="6"
                      className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors text-center tracking-widest font-bold"
                      autoFocus
                    />

                    {otpError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {otpError}
                      </div>
                    )}

                    <div className="flex gap-4 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode('');
                          setOtpError('');
                        }}
                        className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300 rounded-lg"
                      >
                        ← Change Number
                      </button>
                      <button
                        type="button"
                        onClick={verifyOTP}
                        disabled={otpCode.length !== 6 || isLoading}
                        className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                      >
                        {isLoading ? 'Verifying...' : 'Verify & Submit →'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={sendOTP}
                      disabled={isLoading}
                      className="w-full text-[#2F4F33] underline hover:text-[#7D6B58] transition-colors"
                    >
                      Didn't receive code? Resend
                    </button>
                  </>
                )}
              </div>
            )}
          </form>

          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-out;
            }
          `}</style>
        </div>
      </div>

      {/* Final Trust Section */}
      <div className="py-16 bg-[#2F4F33]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl text-[#F5EFD9] font-serif font-light mb-6">No Pressure, Just Honest Conversation</h2>
          <p className="text-xl text-[#D2C6B2] mb-8 leading-relaxed">
            We know selling land is a big decision. Take your time, ask questions, and make the choice that's right for you. We'll be here either way.
          </p>
          <p className="text-lg text-[#D2C6B2]">
            Prefer to talk? Call us at <a href="tel:469-640-3864" className="text-[#E8B86D] font-bold underline hover:text-[#D4A574] transition-colors">(469) 640-3864</a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#2F4F33] text-[#F5EFD9] py-16 border-t border-[#7D6B58]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="mb-4">
                <h3 className="text-3xl font-bold text-[#F5EFD9] italic font-serif">Haven Ground</h3>
              </div>
              <p className="text-[#D2C6B2] text-lg mb-4 leading-relaxed">Land and community, one meaningful handshake at a time.</p>
              <img src="/images/isaiah-58-10-banner.png" alt="Isaiah 58:10 - If you pour yourself out for the hungry" className="h-20 md:h-24 lg:h-28 w-auto" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[#F5EFD9] mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Home</a></li>
                <li><a href="/properties" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Properties</a></li>
                <li><a href="/development" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Development</a></li>
                <li><a href="/sell-your-land" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Sell Us Land</a></li>
                <li><a href="/community" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[#F5EFD9] mb-4">Get in Touch</h4>
              <div className="space-y-3">
                <p className="text-[#D2C6B2] text-sm">Find your homesite that feels the most like home</p>
                <a href="/sell-your-land#contact-form" className="inline-block bg-[#F5EFD9] text-[#2F4F33] px-4 py-2 rounded-md hover:bg-[#D2C6B2] active:bg-[#D2C6B2] transition-all duration-200 text-sm font-medium transform hover:scale-105 active:scale-95">Contact Us</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-[#7D6B58] text-center">
            <p className="text-[#D2C6B2] text-sm">
              &copy; {new Date().getFullYear()} Haven Ground. All rights reserved.
              <span className="mx-2">|</span>
              Serving land owners from our heart.
              <span className="mx-2">|</span>
              <a href="/privacy-policy" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200 underline">Privacy Policy</a>
              <span className="mx-2">|</span>
              <a href="/terms-of-use" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200 underline">Terms of Use</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
