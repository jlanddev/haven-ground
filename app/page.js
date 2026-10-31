"use client";

import { useState } from 'react';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Footer Contact Modal states
  const [showFooterContactModal, setShowFooterContactModal] = useState(false);
  const [footerOtpSent, setFooterOtpSent] = useState(false);
  const [footerOtpCode, setFooterOtpCode] = useState(false);
  const [footerOtpVerified, setFooterOtpVerified] = useState(false);
  const [footerOtpError, setFooterOtpError] = useState('');
  const [footerIsLoading, setFooterIsLoading] = useState(false);
  const [footerE164Phone, setFooterE164Phone] = useState('');
  const [footerFormPhone, setFooterFormPhone] = useState('');
  const [showFooterThankYou, setShowFooterThankYou] = useState(false);
  const [savedFooterFormData, setSavedFooterFormData] = useState(null);

  // Phone formatting function
  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  // Footer contact form SMS functions
  const sendFooterOTP = async (formDataObj) => {
    setFooterIsLoading(true);
    setFooterOtpError('');
    setSavedFooterFormData(formDataObj);

    const e164 = '+1' + footerFormPhone.replace(/\D/g, '');
    setFooterE164Phone(e164);

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164 })
      });

      const data = await response.json();

      if (data.success) {
        setFooterOtpSent(true);
      } else {
        setFooterOtpError(data.error || 'Failed to send verification code');
      }
    } catch (error) {
      setFooterOtpError('Failed to send code. Please try again.');
    } finally {
      setFooterIsLoading(false);
    }
  };

  const verifyFooterOTP = async () => {
    setFooterIsLoading(true);
    setFooterOtpError('');

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: footerE164Phone, code: footerOtpCode })
      });

      const data = await response.json();

      if (data.verified) {
        setFooterOtpVerified(true);
        await submitFooterToGHL(savedFooterFormData, footerE164Phone);
        setShowFooterContactModal(false);
        setShowFooterThankYou(true);

        // Reset form
        setTimeout(() => {
          setFooterOtpSent(false);
          setFooterOtpCode('');
          setFooterOtpVerified(false);
          setFooterFormPhone('');
          setSavedFooterFormData(null);
        }, 100);

        // Facebook Pixel event
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', 'Lead', {
            content_name: 'Footer Contact Request',
            content_category: 'General Inquiry'
          });
        }
      } else {
        setFooterOtpError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setFooterOtpError('Verification failed. Please try again.');
    } finally {
      setFooterIsLoading(false);
    }
  };

  const submitFooterToGHL = async (formDataObj, phone) => {
    try {
      await fetch('https://services.leadconnectorhq.com/hooks/wLaNbf44RqmPNhV1IEev/webhook-trigger/d3e7ef0e-d618-4ce3-8eec-996d3ca52c5c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formDataObj.name,
          email: formDataObj.email,
          phone: phone,
          message: formDataObj.message,
          lead_source: 'Website - Footer Contact Request',
          phone_verified: true,
          submitted_at: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Webhook error:', error);
    }
  };

  // Coming Soon Page Component
  const ComingSoonPage = () => (
    <div className="flex flex-col min-h-screen font-serif relative overflow-hidden">
      {/* Navigation */}
      <nav className="bg-[#F5EFD9] py-4 border-b border-[#D2C6B2] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center relative z-20">
              <a href="/" className="relative">
                <img
                  src="/images/haven-logo-2026.png"
                  alt="Haven Ground Logo"
                  className="h-12 sm:h-14 md:h-16 w-auto hover:opacity-90 transition-opacity duration-300"
                />
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8 lg:space-x-10">
              <a href="/properties" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Properties</a>
              <a href="/development" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Development</a>
              <a href="/sell-your-land" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Sell Us Land</a>
              <a href="/community" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Community</a>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden relative z-20 p-2 rounded-md text-[#2F4F33] hover:text-[#7D6B58] hover:bg-[#D2C6B2] focus:outline-none focus:ring-2 focus:ring-[#7D6B58] transition-colors duration-200"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`md:hidden absolute top-full left-0 right-0 bg-[#F5EFD9] border-b border-[#D2C6B2] shadow-lg transform transition-all duration-300 ease-in-out origin-top ${mobileMenuOpen ? 'translate-y-0 opacity-100 scale-y-100' : '-translate-y-2 opacity-0 scale-y-95 pointer-events-none'}`}>
            <div className="px-4 py-4 space-y-2">
              <a href="/properties" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#7D6B58]">Properties</a>
              <a href="/development" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#7D6B58]">Development</a>
              <a href="/sell-your-land" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#7D6B58]">Sell Us Land</a>
              <a href="/community" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#7D6B58]">Community</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero — hand-drawn: subdivision plat draws across the top, pencil land
          draws in from the bottom-right, on a light cream ground */}
      <section
        className="relative flex-1 min-h-[88vh] flex flex-col justify-center overflow-hidden"
        style={{ background: 'linear-gradient(to bottom, #F7F1DC 0%, #F5EFD9 55%, #EFE7CD 100%)' }}
      >
        {/* Subdivision plat drawing across the top */}
        <svg
          className="hg-plat absolute top-0 inset-x-0 w-full h-[30%] pointer-events-none"
          viewBox="0 0 1440 300" fill="none" preserveAspectRatio="xMidYMin slice"
          style={{ opacity: 0.5 }}
        >
          <g stroke="#6F7A55" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path pathLength="1" d="M 110 60 L 1330 60" style={{ animationDelay: '0.15s' }} />
            <path pathLength="1" d="M 110 60 L 92 168" style={{ animationDelay: '0.3s' }} />
            <path pathLength="1" d="M 1330 60 L 1348 150" style={{ animationDelay: '0.3s' }} />
            <path pathLength="1" d="M 92 168 C 470 146, 940 186, 1348 150" style={{ animationDelay: '0.5s' }} />
            <path pathLength="1" d="M 96 192 C 470 172, 940 210, 1352 174" style={{ animationDelay: '0.62s' }} />
            <path pathLength="1" d="M 280 60 L 272 161" style={{ animationDelay: '0.8s' }} />
            <path pathLength="1" d="M 460 60 L 452 166" style={{ animationDelay: '0.9s' }} />
            <path pathLength="1" d="M 640 60 L 634 172" style={{ animationDelay: '1.0s' }} />
            <path pathLength="1" d="M 820 60 L 817 178" style={{ animationDelay: '1.1s' }} />
            <path pathLength="1" d="M 1000 60 L 1001 174" style={{ animationDelay: '1.2s' }} />
            <path pathLength="1" d="M 1180 60 L 1184 160" style={{ animationDelay: '1.3s' }} />
          </g>
        </svg>

        {/* Pencil landscape drawing in from the bottom-right; multiply drops the
            white paper so the lines sit on the cream ground */}
        <div
          className="hg-draw-br absolute inset-x-0 bottom-0 h-[60%] pointer-events-none"
          style={{
            backgroundImage: "url('/images/Homepage hero design.png')",
            backgroundSize: '1500px auto',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
            mixBlendMode: 'multiply',
          }}
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center pb-16">
          <p className="hg-reveal font-ui text-xs md:text-sm font-medium tracking-[0.34em] uppercase text-[#7D6B58] mb-6" style={{ animationDelay: '0.15s' }}>
            Land&nbsp;&middot;&nbsp;Community&nbsp;&middot;&nbsp;Legacy
          </p>
          <h1 className="hg-reveal font-display font-semibold text-[#2F4F33] leading-[0.94] tracking-[-0.02em] text-5xl md:text-7xl lg:text-[5.5rem]" style={{ animationDelay: '0.28s' }}>
            Our Land is<br />Your Haven
          </h1>
          <p className="hg-reveal font-display italic text-[#5c5240] text-xl md:text-2xl mt-6" style={{ animationDelay: '0.44s' }}>
            Integrity, Honor, and Heart
          </p>
          <div className="hg-reveal mt-10" style={{ animationDelay: '0.6s' }}>
            <a
              href="/properties"
              className="hg-cta group inline-flex items-center gap-2.5 font-ui font-semibold tracking-wide text-[#F5EFD9] bg-[#2F4F33] hover:bg-[#25401f] px-8 py-4 rounded-full shadow-[0_12px_30px_-10px_rgba(47,79,51,0.55)] transition-all duration-300"
            >
              Browse Available Properties
              <svg className="hg-arrow w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2F4F33] text-[#F5EFD9] py-16 border-t border-[#7D6B58]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <h3 className="text-3xl font-bold text-[#F5EFD9] italic font-serif">Haven Ground</h3>
              </div>
              <p className="text-[#D2C6B2] text-lg mb-4 leading-relaxed">
                Land and community, one meaningful handshake at a time.
              </p>
              <img src="/images/isaiah-58-10-banner.png" alt="Isaiah 58:10 - If you pour yourself out for the hungry" className="h-20 md:h-24 lg:h-28 w-auto" />
            </div>

            {/* Quick Links */}
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

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold text-[#F5EFD9] mb-4">Get in Touch</h4>
              <div className="space-y-3">
                <p className="text-[#D2C6B2] text-sm ">Find your homesite that feels the most like home</p>
                <a
                  href="/sell-your-land#contact-form"
                  className="inline-block bg-[#F5EFD9] text-[#2F4F33] px-4 py-2 rounded-md hover:bg-[#D2C6B2] active:bg-[#D2C6B2] transition-all duration-200 text-sm font-medium transform hover:scale-105 active:scale-95"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
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

    {/* Footer Contact Modal */}
    {showFooterContactModal && (
      <div className="fixed inset-0 bg-[#2F4F33] bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 relative">
          <button
            onClick={() => {
              setShowFooterContactModal(false);
              setFooterOtpSent(false);
              setFooterOtpCode('');
              setFooterOtpError('');
              setFooterFormPhone('');
            }}
            className="absolute top-4 right-4 text-[#7D6B58] hover:text-[#2F4F33] text-2xl"
          >
            ×
          </button>

          <h3 className="text-2xl font-serif font-bold text-[#2F4F33] mb-6">
            Get in Touch
          </h3>

          {!footerOtpSent ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const formDataObj = {
                name: formData.get('name'),
                email: formData.get('email'),
                message: formData.get('message')
              };
              sendFooterOTP(formDataObj);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2F4F33] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-2 border border-[#D2C6B2] rounded-md focus:ring-2 focus:ring-[#2F4F33] focus:border-[#2F4F33]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2F4F33] mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-2 border border-[#D2C6B2] rounded-md focus:ring-2 focus:ring-[#2F4F33] focus:border-[#2F4F33]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2F4F33] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={footerFormPhone}
                    onChange={(e) => setFooterFormPhone(formatPhoneNumber(e.target.value))}
                    placeholder="(555) 123-4567"
                    required
                    className="w-full px-4 py-2 border border-[#D2C6B2] rounded-md focus:ring-2 focus:ring-[#2F4F33] focus:border-[#2F4F33]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2F4F33] mb-1">
                    How can we help you?
                  </label>
                  <textarea
                    name="message"
                    rows="4"
                    className="w-full px-4 py-2 border border-[#D2C6B2] rounded-md focus:ring-2 focus:ring-[#2F4F33] focus:border-[#2F4F33]"
                  />
                </div>

                {footerOtpError && (
                  <p className="text-red-600 text-sm">{footerOtpError}</p>
                )}

                <button
                  type="submit"
                  disabled={footerIsLoading}
                  className="w-full py-3 bg-[#2F4F33] text-[#F5EFD9] hover:bg-[#1a2e1c] transition duration-300 font-medium disabled:opacity-50"
                >
                  {footerIsLoading ? 'Sending...' : 'Contact Us'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <p className="text-[#3A4045]">
                We sent a verification code to {footerFormPhone}. Please enter it below:
              </p>

              <div>
                <label className="block text-sm font-medium text-[#2F4F33] mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={footerOtpCode}
                  onChange={(e) => setFooterOtpCode(e.target.value)}
                  maxLength="6"
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-2 border border-[#D2C6B2] rounded-md focus:ring-2 focus:ring-[#2F4F33] focus:border-[#2F4F33] text-center text-2xl tracking-widest"
                />
              </div>

              {footerOtpError && (
                <p className="text-red-600 text-sm">{footerOtpError}</p>
              )}

              <button
                onClick={verifyFooterOTP}
                disabled={footerIsLoading || footerOtpCode.length !== 6}
                className="w-full py-3 bg-[#2F4F33] text-[#F5EFD9] hover:bg-[#1a2e1c] transition duration-300 font-medium disabled:opacity-50"
              >
                {footerIsLoading ? 'Verifying...' : 'Verify & Submit'}
              </button>

              <button
                onClick={() => {
                  setFooterOtpSent(false);
                  setFooterOtpCode('');
                  setFooterOtpError('');
                }}
                className="w-full py-2 text-[#7D6B58] hover:text-[#2F4F33] transition duration-300 text-sm"
              >
                ← Back to form
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Footer Thank You Modal */}
    {showFooterThankYou && (
      <div className="fixed inset-0 bg-[#2F4F33] bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#2F4F33] rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#F5EFD9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#2F4F33] mb-4">
              Thank You!
            </h3>
            <p className="text-[#3A4045] mb-6 leading-relaxed">
              We received your request. One of our team members will reach out to you shortly!
            </p>
            <button
              onClick={() => setShowFooterThankYou(false)}
              className="w-full py-3 bg-[#2F4F33] text-[#F5EFD9] hover:bg-[#1a2e1c] transition duration-300 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

    </div>
  );

  return <ComingSoonPage />;
}