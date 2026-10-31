"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const property = searchParams.get('property') || 'General Inquiry';

  useEffect(() => {
    // Facebook Pixel Lead Conversion Tracking
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: property,
        content_category: 'Property Inquiry',
        value: 0,
        currency: 'USD'
      });
      console.log('✅ Facebook Lead event tracked for:', property);
    }

    // Google Ads receives this conversion via the GA4 import, NOT a separate AW- tag.
    // The GA4 "Qualified_Lead" key event (imported into Google Ads account 2875216984)
    // is the conversion. The hashed email/phone set as user_data in the GA script below
    // (before config) rides along with it as enhanced-conversions-for-leads data, so a
    // lead can be matched to its ad click even without a gclid. Nothing to fire here.
    // Clear the enhanced-conversions stash so it can't attach to a later visit.
    try { sessionStorage.removeItem('hg_ec'); } catch (e) {}
  }, [property]);

  return (
    <>
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-KRZH94TT88"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          // Enhanced conversions for leads: pass the seller's email/phone (stashed by
          // the form on submit) as user-provided data BEFORE config, so the Qualified_Lead
          // conversion (imported from this GA4 property into Google Ads) carries hashed
          // contact data and can be matched to the ad click even when there's no gclid.
          // Normalize per Google's spec first (email: trim + lowercase; phone: E.164) —
          // gtag does the SHA-256 hashing itself, but only hashes what we hand it.
          try {
            var __ec = JSON.parse(sessionStorage.getItem('hg_ec') || 'null');
            if (__ec && (__ec.email || __ec.phone)) {
              var __email = String(__ec.email || '').trim().toLowerCase();
              var __phone = String(__ec.phone || '').replace(/[^\d+]/g, '');
              if (__phone && __phone.charAt(0) !== '+') __phone = '+' + __phone;
              gtag('set', 'user_data', {
                email: __email || undefined,
                phone_number: __phone || undefined
              });
            }
          } catch (e) {}
          gtag('config', 'G-KRZH94TT88');
        `}
      </Script>
    <div className="flex flex-col min-h-screen font-serif bg-[#F5EFD9]">
      {/* Navigation */}
      <header className="bg-[#F5EFD9] border-b border-[#D2C6B2] py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-center items-center">
          <a href="/">
            <img
              src="/images/Haven LOGO Use.png"
              alt="Haven Ground Logo"
              className="h-16 sm:h-20 w-auto hover:opacity-90 transition-opacity duration-300"
            />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-[#2F4F33] rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-[#F5EFD9]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Thank You Message */}
          <h1 className="text-3xl md:text-4xl font-serif text-[#2F4F33] mb-4">
            Thank You!
          </h1>

          <p className="text-lg text-[#3A4045] mb-6">
            We've received your property information and one of our land specialists will reach out to you shortly.
          </p>

          <div className="bg-[#F5EFD9] rounded-lg p-6 mb-8">
            <h2 className="text-xl font-serif text-[#2F4F33] mb-3">What Happens Next?</h2>
            <ul className="text-left space-y-3 text-[#3A4045]">
              <li className="flex items-start">
                <span className="text-[#2F4F33] mr-2">1.</span>
                <span>We'll review your property details within 24 hours</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#2F4F33] mr-2">2.</span>
                <span>A land specialist will call you to discuss your options</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#2F4F33] mr-2">3.</span>
                <span>If it's a good fit, we'll make you a fair cash offer</span>
              </li>
            </ul>
          </div>


          <a
            href="/"
            className="inline-block bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Return Home
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#2F4F33] text-[#F5EFD9] py-6 px-6 text-center">
        <p className="text-sm">© 2026 Haven Ground. All rights reserved.</p>
      </footer>
    </div>
    </>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}
