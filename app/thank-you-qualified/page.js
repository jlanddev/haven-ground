'use client';

import { useEffect } from 'react';

export default function ThankYouQualified() {
  useEffect(() => {
    // Facebook Pixel Conversion Event
    // Replace with your actual Facebook Pixel ID
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead');
    }

    // Google Ads Conversion Event
    // Replace with your actual Google Ads conversion ID and label
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        'send_to': 'AW-XXXXXXXXX/XXXXXXXXXXXXX' // Replace with your conversion ID/label
      });
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F5EFD9] to-white">
      {/* Header */}
      <header className="bg-[#2F4F33] text-white py-6 shadow-md">
        <div className="container mx-auto px-4">
          <a href="/">
            <img
              src="/images/Haven LOGO Use.png"
              alt="Haven Ground Logo"
              className="h-12 sm:h-14 w-auto hover:opacity-90 transition-opacity duration-300"
            />
          </a>
        </div>
      </header>

      {/* Thank You Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-[#2F4F33] rounded-full mx-auto flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#2F4F33] mb-6">
            Thank You!
          </h1>

          <p className="text-xl text-[#3A4045] mb-8 leading-relaxed">
            We've received your information and we're excited to learn more about your property.
          </p>

          {/* What's Next Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-left">
            <h2 className="text-2xl font-serif font-bold text-[#2F4F33] mb-6 text-center">
              What Happens Next?
            </h2>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-[#2F4F33] text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#2F4F33] mb-2">We'll Review Your Property</h3>
                  <p className="text-[#3A4045]">
                    Our team will carefully review the information you provided and research your property.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-[#2F4F33] text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#2F4F33] mb-2">We'll Reach Out Within 24 Hours</h3>
                  <p className="text-[#3A4045]">
                    Expect a call or email from our team to discuss your property and answer any questions you may have.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-[#2F4F33] text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#2F4F33] mb-2">No Pressure, Just Honest Conversation</h3>
                  <p className="text-[#3A4045]">
                    We'll have a straightforward discussion about your property, your timeline, and how we might be able to help.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-[#F5EFD9] rounded-lg p-6">
            <p className="text-[#3A4045] mb-2">
              Have questions in the meantime?
            </p>
            <p className="text-lg">
              <a href="mailto:support@havenground.com" className="text-[#2F4F33] font-semibold hover:underline">
                support@havenground.com
              </a>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-8">
            <a
              href="/"
              className="inline-block bg-[#2F4F33] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#3d6543] transition-colors duration-200"
            >
              Return to Homepage
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#2F4F33] text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">&copy; 2025 Haven Ground. All rights reserved.</p>
          <div className="text-sm">
            <a href="/privacy-policy" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200 underline">Privacy Policy</a>
            <span className="mx-2">|</span>
            <a href="/terms-of-use" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200 underline">Terms of Use</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
