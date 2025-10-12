"use client";

import { useState } from 'react';

export default function CommunityPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    photos: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      photos: e.target.files
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send to GHL webhook
      const webhookData = {
        firstName: formData.firstName,
        email: formData.email,
        lead_source: 'Website - Community Stories Form',
        submitted_at: new Date().toISOString()
      };

      const response = await fetch('https://services.leadconnectorhq.com/hooks/wLaNbf44RqmPNhV1IEev/webhook-trigger/d3e7ef0e-d618-4ce3-8eec-996d3ca52c5c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });

      if (response.ok) {
        alert('Thank you for sharing your Haven Community adventure! We appreciate your submission.');
        setFormData({ firstName: '', email: '', photos: null });
      } else {
        alert('Thank you for your submission! We\'ll be in touch soon.');
        setFormData({ firstName: '', email: '', photos: null });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Thank you for your submission! We\'ll be in touch soon.');
      setFormData({ firstName: '', email: '', photos: null });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="flex flex-col min-h-screen font-serif bg-gradient-to-br from-[#F5EFD9] to-[#D2C6B2]">
      {/* Navigation */}
      <nav className="bg-[#F5EFD9] py-4 border-b border-[#D2C6B2] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center relative z-20">
              <a href="/" className="relative">
                <img 
                  src="/images/Haven LOGO Use.png" 
                  alt="Haven Ground Logo" 
                  className="h-16 sm:h-20 md:h-24 w-auto hover:opacity-90 transition-opacity duration-300"
                />
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8 lg:space-x-10">
              
              <a href="/properties" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Properties</a>
              <a href="/development" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Development</a>
              <a href="/sell-your-land" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Sell Us Land</a>
              <a href="/community" className="text-[#2F4F33] text-lg font-medium border-b-2 border-[#2F4F33] transition-colors duration-200">Community</a>
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
              
              <a href="/properties" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#2F4F33]">Properties</a>
              <a href="/development" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#2F4F33]">Development</a>
              <a href="/sell-your-land" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#2F4F33]">Sell Us Land</a>
              <a href="/community" className="block text-[#2F4F33] font-medium text-lg py-3 bg-[#D2C6B2] rounded-lg px-4 border-l-4 border-[#2F4F33]">Community</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Community Content */}
      <div className="flex-1 px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-[#2F4F33] font-serif font-bold mb-6">
              Community Stories
            </h1>
            <p className="text-xl text-[#3A4045] mb-8 leading-relaxed">
              Share your favorite memories at a Haven property.
            </p>
          </div>

          {/* Form Section */}
          <div className="bg-white p-8 md:p-12 rounded-lg shadow-lg border border-[#D2C6B2] max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl text-[#2F4F33] font-serif font-bold mb-4 text-center">
              Share Your Memories
            </h2>
            
            {/* Haven Ground in cursive */}
            <div className="text-center mb-6">
              <h3 className="text-4xl text-[#2F4F33] italic mb-4" style={{fontFamily: "'Dancing Script', cursive"}}>
                Haven Ground
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload - First */}
              <div>
                <div className="border-2 border-dashed border-[#D2C6B2] rounded-md p-6 text-center hover:border-[#2F4F33] transition-colors duration-200">
                  <input
                    type="file"
                    id="photos"
                    name="photos"
                    onChange={handleFileChange}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <label
                    htmlFor="photos"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <div className="w-12 h-12 bg-[#F5EFD9] rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-lg text-[#2F4F33] font-medium">
                      Click to upload photos
                    </span>
                    <span className="text-sm text-[#7D6B58]">
                      Upload multiple photos of your Haven property memories
                    </span>
                  </label>
                  {formData.photos && (
                    <div className="mt-4 text-sm text-[#2F4F33]">
                      {formData.photos.length} photo(s) selected
                    </div>
                  )}
                </div>
              </div>

              {/* First Name - No Label */}
              <div>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-[#D2C6B2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F4F33] focus:border-transparent transition-all duration-200 text-lg"
                  placeholder="First Name *"
                />
              </div>

              {/* Email - No Label */}
              <div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-[#D2C6B2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F4F33] focus:border-transparent transition-all duration-200 text-lg"
                  placeholder="Email Address *"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 px-6 rounded-md font-serif text-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ${
                    isSubmitting 
                      ? 'bg-[#7D6B58] text-[#F5EFD9] cursor-not-allowed' 
                      : 'bg-[#2F4F33] text-[#F5EFD9] hover:bg-[#1a2e1c] active:bg-[#1a2e1c]'
                  }`}
                >
                  {isSubmitting ? 'Sharing Your Memories...' : 'Share Your Memories'}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-[#7D6B58]">
                Your stories help build our community. Thank you for sharing your Haven Ground experience!
              </p>
            </div>
          </div>
        </div>
      </div>

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
                <button
                  onClick={() => setShowFooterContactModal(true)}
                  className="inline-block bg-[#F5EFD9] text-[#2F4F33] px-4 py-2 rounded-md hover:bg-[#D2C6B2] active:bg-[#D2C6B2] transition-all duration-200 text-sm font-medium transform hover:scale-105 active:scale-95"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-[#7D6B58] text-center">
            <p className="text-[#D2C6B2] text-sm">
              &copy; {new Date().getFullYear()} Haven Ground. All rights reserved. 
              <span className="mx-2">|</span>
              Serving land owners from our heart.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}