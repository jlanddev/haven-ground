"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';

function ThankDispoContent() {
  const searchParams = useSearchParams();
  const property = searchParams.get('property') || 'our property';

  useEffect(() => {
    // Facebook Pixel Schedule Conversion Tracking
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Schedule', {
        content_name: property,
        content_category: 'Visit Scheduled',
        value: 0,
        currency: 'USD'
      });
      console.log('✅ Facebook Schedule event tracked for:', property);
    }

    // Google Ads conversion tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        'send_to': 'AW-XXXXXXXXX/XXXXXXXXX', // Replace with your Google Ads conversion ID
        'value': 1.0,
        'currency': 'USD'
      });
      console.log('🎯 Google Ads conversion event tracked');
    }
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
          gtag('config', 'G-KRZH94TT88');
        `}
      </Script>

    <div className="flex flex-col min-h-screen font-serif bg-[#F5EFD9]">
      {/* Navigation */}
      <header className="bg-[#2F4F33] text-[#F5EFD9] py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="/" className="flex items-center">
            <span className="text-2xl sm:text-3xl font-serif text-[#F5EFD9] font-bold italic">Haven Ground</span>
          </a>
          <a href="/" className="text-[#F5EFD9] hover:text-white transition-colors">
            ← Back to Home
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          {/* Thank You Message */}
          <h1 className="text-3xl md:text-4xl font-serif text-[#2F4F33] mb-4">
            Visit Scheduled!
          </h1>

          <p className="text-lg text-[#3A4045] mb-6">
            Thank you! We look forward to seeing you out at <strong className="text-[#2F4F33]">{property}</strong>.
          </p>

          <div className="bg-[#F5EFD9] rounded-lg p-6 mb-8">
            <h2 className="text-xl font-serif text-[#2F4F33] mb-3">What Happens Next?</h2>
            <ul className="text-left space-y-3 text-[#3A4045]">
              <li className="flex items-start">
                <span className="text-[#2F4F33] mr-2">1.</span>
                <span>Check your email for visit confirmation and directions</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#2F4F33] mr-2">2.</span>
                <span>We'll send you a text reminder before your visit</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#2F4F33] mr-2">3.</span>
                <span>We'll meet you out there</span>
              </li>
            </ul>
          </div>

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

export default function ThankDispoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ThankDispoContent />
    </Suspense>
  );
}
