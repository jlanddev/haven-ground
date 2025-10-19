"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { properties as propertiesData } from '../propertiesData';
import { getContactFormText, getSectionHeaders, sanitizePropertyData } from '../propertyConfig';

// Dynamic Property Map Component - Acres.com Style
function PropertyMap({ property }) {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!property?.propertyDetails?.location?.coordinates) return;

    const mapId = `leaflet-map-${property.slug}`;

    if (window.L) {
      initializeMap();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = initializeMap;
    document.head.appendChild(script);

    function initializeMap() {
      setTimeout(() => {
        if (!document.getElementById(mapId)) return;

        const L = window.L;
        const coords = property.propertyDetails.location.coordinates;
        const lat = coords.lat;
        const lng = coords.lng;

        try {
          const map = L.map(mapId, {
            scrollWheelZoom: false,
            zoomControl: true
          }).setView([lat, lng], 15);

          // Esri satellite imagery - no country flags
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: false,
            maxZoom: 20
          }).addTo(map);

          // Remove Leaflet attribution and add custom text
          map.attributionControl.setPrefix('');
          map.attributionControl.addAttribution('Property boundaries displayed for reference only');

          // Acres.com style - cyan boundary (#00FFFF)
          const boundaryStyle = {
            color: '#00FFFF',
            weight: 3,
            opacity: 0.9,
            fillColor: '#00FFFF',
            fillOpacity: 0.1
          };

          // Draw actual boundary polygon(s) if available, otherwise circle
          if (property.boundary && Array.isArray(property.boundary)) {
            // Check if it's multiple polygons (array of arrays of arrays) or single polygon (array of arrays)
            const isMultiPolygon = Array.isArray(property.boundary[0][0]);

            if (isMultiPolygon) {
              // Multiple polygons (multiple parcels)
              const allBounds = [];
              property.boundary.forEach(polygonCoords => {
                const polygon = L.polygon(polygonCoords, boundaryStyle).addTo(map);
                allBounds.push(...polygonCoords);
              });
              // Fit map to show all polygons
              const bounds = L.latLngBounds(allBounds);
              map.fitBounds(bounds, { padding: [50, 50] });
            } else {
              // Single polygon
              const polygon = L.polygon(property.boundary, boundaryStyle).addTo(map);
              map.fitBounds(polygon.getBounds(), { padding: [50, 50] });
            }
          } else {
            // Fallback to circle for properties without boundary data
            const radius = 200; // meters
            L.circle([lat, lng], {
              ...boundaryStyle,
              radius: radius
            }).addTo(map);
          }

          // Property marker at center
          L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'property-marker',
              html: '<div style="background: #00FFFF; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,255,255,0.8);"></div>',
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })
          }).addTo(map);

          map.zoomControl.setPosition('topright');

          setMapLoaded(true);
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }, 100);
    }

    return () => {
      if (document.getElementById(mapId)) {
        const mapContainer = document.getElementById(mapId);
        if (mapContainer && mapContainer._leaflet_id) {
          mapContainer._leaflet = null;
        }
        mapContainer.innerHTML = '';
      }
    };
  }, [property]);

  const mapId = `leaflet-map-${property.slug}`;

  return (
    <div className="relative">
      <div
        id={mapId}
        className="w-full h-[500px] rounded-lg"
        style={{ background: '#f0f0f0' }}
      >
        {!mapLoaded && (
          <div className="flex items-center justify-center h-full text-[#7D6B58]">Loading satellite map...</div>
        )}
      </div>
    </div>
  );
}

export default function PropertyDetailPage() {
  const params = useParams();
  const propertySlug = params.slug;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedLot, setExpandedLot] = useState(null);
  const [selectedLotImage, setSelectedLotImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [modalImages, setModalImages] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);

  // SMS Verification states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [e164Phone, setE164Phone] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [showThankYou, setShowThankYou] = useState(false);
  const [savedFormData, setSavedFormData] = useState(null);

  // Separate states for Schedule Visit form
  const [visitStep, setVisitStep] = useState(1);
  const [visitFormData, setVisitFormData] = useState({
    preferred_date: '',
    preferred_time: '',
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [visitOtpSent, setVisitOtpSent] = useState(false);
  const [visitOtpCode, setVisitOtpCode] = useState('');
  const [visitOtpVerified, setVisitOtpVerified] = useState(false);
  const [visitOtpError, setVisitOtpError] = useState('');
  const [visitIsLoading, setVisitIsLoading] = useState(false);
  const [visitE164Phone, setVisitE164Phone] = useState('');
  const [visitFormPhone, setVisitFormPhone] = useState('');
  const [visitShowThankYou, setVisitShowThankYou] = useState(false);
  const [visitSavedFormData, setVisitSavedFormData] = useState(null);

  // States for embedded contact form
  const [embeddedOtpSent, setEmbeddedOtpSent] = useState(false);
  const [embeddedOtpCode, setEmbeddedOtpCode] = useState('');
  const [embeddedOtpError, setEmbeddedOtpError] = useState('');
  const [embeddedIsLoading, setEmbeddedIsLoading] = useState(false);
  const [embeddedE164Phone, setEmbeddedE164Phone] = useState('');
  const [embeddedFormPhone, setEmbeddedFormPhone] = useState('');
  const [embeddedShowThankYou, setEmbeddedShowThankYou] = useState(false);
  const [embeddedSavedFormData, setEmbeddedSavedFormData] = useState(null);

  // Modal functions
  const openModal = (images, startIndex) => {
    setModalImages(images);
    setModalImageIndex(startIndex);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const nextModalImage = () => {
    setModalImageIndex((modalImageIndex + 1) % modalImages.length);
  };

  const prevModalImage = () => {
    setModalImageIndex(modalImageIndex === 0 ? modalImages.length - 1 : modalImageIndex - 1);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isModalOpen) return;

      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowRight') {
        nextModalImage();
      } else if (e.key === 'ArrowLeft') {
        prevModalImage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isModalOpen, modalImageIndex, modalImages.length]);

  // Import properties from centralized data file
  const properties = propertiesData;

  const property = properties.find(p => p.slug === propertySlug) || properties[0];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => prev === 0 ? property.images.length - 1 : prev - 1);
  };

  const handleShare = () => {
    const shareData = {
      title: `${property.title} - ${property.location}`,
      text: `Check out this beautiful ${property.acres} acre property in ${property.location}`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Property link copied to clipboard!');
      });
    }
  };

  // Phone formatting
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

  // SMS Verification for Get More Info form
  const sendOTP = async (formDataObj) => {
    setIsLoading(true);
    setOtpError('');
    setSavedFormData(formDataObj);

    const e164 = '+1' + formPhone.replace(/\D/g, '');
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
      } else {
        setOtpError(data.error || 'Failed to send code');
      }
    } catch (error) {
      setOtpError('Failed to send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (formDataObj) => {
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
        await submitToGHL(formDataObj, e164Phone);
        // Redirect to thank you page for Google/Facebook conversion tracking
        window.location.href = `/thank-dispo?property=${encodeURIComponent(property.title)}`;
      } else{
        setOtpError('Invalid code. Please try again.');
      }
    } catch (error) {
      setOtpError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // SMS Verification for Schedule Visit form
  const handleVisitNext = () => {
    setVisitStep(visitStep + 1);
  };

  const handleVisitBack = () => {
    setVisitStep(visitStep - 1);
  };

  const sendVisitOTP = async () => {
    setVisitIsLoading(true);
    setVisitOtpError('');

    const e164 = '+1' + visitFormData.phone.replace(/\D/g, '');
    setVisitE164Phone(e164);

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164 })
      });

      const data = await response.json();

      if (data.success) {
        setVisitStep(7); // Move to OTP step
      } else {
        setVisitOtpError(data.error || 'Failed to send code');
      }
    } catch (error) {
      setVisitOtpError('Failed to send code. Please try again.');
    } finally {
      setVisitIsLoading(false);
    }
  };

  const verifyVisitOTP = async () => {
    setVisitIsLoading(true);
    setVisitOtpError('');

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: visitE164Phone, code: visitOtpCode })
      });

      const data = await response.json();

      if (data.verified) {
        setVisitOtpVerified(true);
        await submitVisitToGHL(visitFormData, visitE164Phone);
        // Redirect to thank you page for Google/Facebook conversion tracking
        window.location.href = `/thank-dispo?property=${encodeURIComponent(property.title)}`;
      } else {
        setVisitOtpError('Invalid code. Please try again.');
      }
    } catch (error) {
      setVisitOtpError('Verification failed. Please try again.');
    } finally {
      setVisitIsLoading(false);
    }
  };

  // Submit to GHL webhook
  const submitToGHL = async (formDataObj, phone) => {
    try {
      await fetch('https://services.leadconnectorhq.com/hooks/wLaNbf44RqmPNhV1IEev/webhook-trigger/d3e7ef0e-d618-4ce3-8eec-996d3ca52c5c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formDataObj.name,
          email: formDataObj.email,
          phone: phone,
          when_buying: formDataObj.when_buying,
          building_type: formDataObj.building_type,
          message: formDataObj.message,
          property: property.title,
          city: property.location,
          lead_source: `Website - ${property.title} Inquiry`,
          phone_verified: true,
          submitted_at: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Webhook error:', error);
    }
  };

  const submitVisitToGHL = async (formDataObj, phone) => {
    try {
      await fetch('https://services.leadconnectorhq.com/hooks/wLaNbf44RqmPNhV1IEev/webhook-trigger/d3e7ef0e-d618-4ce3-8eec-996d3ca52c5c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formDataObj.name,
          email: formDataObj.email,
          phone: phone,
          preferred_date: formDataObj.preferred_date,
          preferred_time: formDataObj.preferred_time,
          message: formDataObj.message,
          property: property.title,
          city: property.location,
          lead_source: `Website - ${property.title} Visit Request`,
          phone_verified: true,
          submitted_at: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Webhook error:', error);
    }
  };

  // SMS Verification for Embedded Contact Form
  const sendEmbeddedOTP = async (formDataObj) => {
    setEmbeddedIsLoading(true);
    setEmbeddedOtpError('');
    setEmbeddedSavedFormData(formDataObj);

    const e164 = '+1' + embeddedFormPhone.replace(/\D/g, '');
    setEmbeddedE164Phone(e164);

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164 })
      });

      const data = await response.json();

      if (data.success) {
        setEmbeddedOtpSent(true);
      } else {
        setEmbeddedOtpError(data.error || 'Failed to send code');
      }
    } catch (error) {
      setEmbeddedOtpError('Failed to send code. Please try again.');
    } finally {
      setEmbeddedIsLoading(false);
    }
  };

  const verifyEmbeddedOTP = async () => {
    setEmbeddedIsLoading(true);
    setEmbeddedOtpError('');

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: embeddedE164Phone, code: embeddedOtpCode })
      });

      const data = await response.json();

      if (data.verified) {
        await submitEmbeddedToGHL(embeddedSavedFormData, embeddedE164Phone);
        // Redirect to thank you page for Google/Facebook conversion tracking
        window.location.href = `/thank-dispo?property=${encodeURIComponent(property.title)}`;
      } else {
        setEmbeddedOtpError('Invalid code. Please try again.');
      }
    } catch (error) {
      setEmbeddedOtpError('Verification failed. Please try again.');
    } finally {
      setEmbeddedIsLoading(false);
    }
  };

  const submitEmbeddedToGHL = async (formDataObj, phone) => {
    try {
      await fetch('https://services.leadconnectorhq.com/hooks/wLaNbf44RqmPNhV1IEev/webhook-trigger/d3e7ef0e-d618-4ce3-8eec-996d3ca52c5c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formDataObj.name,
          email: formDataObj.email,
          phone: phone,
          timeline: formDataObj.timeline,
          message: formDataObj.message,
          property: property.title,
          city: property.location,
          lead_source: `Website - ${property.title} Embedded Form`,
          phone_verified: true,
          submitted_at: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Webhook error:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-serif bg-stone-50 max-w-full">
      {/* Navigation */}
      <nav className="bg-[#F5EFD9] py-4 border-b border-[#D2C6B2] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center relative z-20">
              <a href="/" className="relative">
                <img 
                  src="/images/Haven LOGO Use.png" 
                  alt="Haven Ground Logo" 
                  className="h-16 sm:h-20 md:h-24 w-auto hover:opacity-90 transition-opacity duration-300"
                />
              </a>
            </div>

            <div className="hidden md:flex items-center space-x-8 lg:space-x-10">
              <a href="/properties" className="text-[#2F4F33] text-lg font-medium border-b-2 border-[#2F4F33] transition-colors duration-200">Properties</a>
              <a href="/development" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Development</a>
              <a href="/sell-your-land" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Sell Us Land</a>
              <a href="/community" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Community</a>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden relative z-20 p-2 rounded-md text-[#2F4F33] hover:text-[#7D6B58] hover:bg-[#D2C6B2] focus:outline-none focus:ring-2 focus:ring-[#7D6B58] transition-colors duration-200"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`md:hidden absolute top-full left-0 right-0 bg-[#F5EFD9] border-b border-[#D2C6B2] shadow-lg transform transition-all duration-300 ease-in-out origin-top ${isMobileMenuOpen ? 'translate-y-0 opacity-100 scale-y-100' : '-translate-y-2 opacity-0 scale-y-95 pointer-events-none'}`}>
            <div className="px-4 py-4 space-y-2">
              <a href="/properties" className="block text-[#2F4F33] font-medium text-lg py-3 bg-[#D2C6B2] rounded-lg px-4 border-l-4 border-[#2F4F33]">Properties</a>
              <a href="/development" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#2F4F33]">Development</a>
              <a href="/sell-your-land" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#2F4F33]">Sell Us Land</a>
              <a href="/community" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#2F4F33]">Community</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Full Width Photo Grid - Edge to Edge */}
      <div className="w-full mb-8 border-t border-[#2F4F33]">
        {/* Special Image Display */}
        {property.slug === 'desoto-estates' || property.slug === 'the-ranches' ? (
          <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] bg-white">
            <img
              src={property.images[0]}
              alt={`${property.title} Plat`}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <>
        {/* Image/Video Gallery - Grid Layout */}
        <div>
          {/* Photo Grid - Land.com Style */}
          <div className="flex gap-1 h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
            {/* Large Main Image - 75% width with carousel */}
            <div className="flex-1 lg:flex-[3] overflow-hidden relative group bg-white">
              {property.images[currentImageIndex]?.endsWith('.mp4') ? (
                <video
                  src={property.images[currentImageIndex]}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => openModal(property.images, currentImageIndex)}
                  controls
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <img
                  src={property.images[currentImageIndex]}
                  alt={property.title}
                  className={`w-full h-full object-cover cursor-pointer ${
                    property.images[currentImageIndex]?.includes('plat')
                      ? 'filter brightness-150 contrast-125'
                      : ''
                  }`}
                  onClick={() => openModal(property.images, currentImageIndex)}
                />
              )}

              {/* Left Arrow */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(currentImageIndex === 0 ? property.images.length - 1 : currentImageIndex - 1);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-[#2F4F33] p-3 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Right Arrow */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((currentImageIndex + 1) % property.images.length);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-[#2F4F33] p-3 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-sm">
                {currentImageIndex + 1} / {property.images.length}
              </div>
            </div>

            {/* 4 Smaller Images - Hidden on mobile and when only 1 image */}
            {property.images.length > 1 && (
              <div className="hidden lg:grid flex-1 grid-cols-2 grid-rows-2 gap-1">
                {[1, 2, 3, 4].map((imageIndex) => {
                  const image = property.images[imageIndex];
                  return (
                    <div
                      key={imageIndex}
                      className="overflow-hidden cursor-pointer hover:opacity-95 transition-opacity bg-white"
                      onClick={() => openModal(property.images, imageIndex)}
                    >
                      {image && (
                        <>
                          {image.endsWith('.mp4') ? (
                            <video
                              src={image}
                              className="w-full h-full object-cover"
                              muted
                              loop
                            />
                          ) : (
                            <img
                              src={image}
                              alt={`${property.title} ${imageIndex + 1}`}
                              className={`w-full h-full object-cover ${
                                image.includes('plat') ? 'filter brightness-150 contrast-125' : ''
                              }`}
                            />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail Slider - Contained */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-4">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto">
            {property.images.map((image, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 border-[#D2C6B2] hover:border-[#2F4F33] hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
                onClick={() => openModal(property.images, index)}
              >
                {image.endsWith('.mp4') ? (
                  <div className="relative w-full h-full bg-[#F5EFD9] flex items-center justify-center">
                    <video
                      src={image}
                      className="w-full h-full object-cover"
                      muted
                      loop
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white bg-opacity-80 rounded-full p-1">
                        <svg className="w-4 h-4 text-[#2F4F33]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className={`w-full h-full object-cover bg-[#F5EFD9] ${
                      image.includes('plat') ? 'filter brightness-150 contrast-125' : ''
                    }`}
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
          </>
        )}
      </div>

      {/* Two Column Layout - Details and Sidebar */}
      <div className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">

          {/* Left Column - Details */}
          <div className="lg:col-span-2">

            {/* Property Title and Location */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl text-[#2F4F33] font-light mb-2">{property.title}</h1>
              <p className="text-[#7D6B58] text-lg md:text-xl">{property.location}</p>
            </div>

            {/* Call to Action - Contact Info */}
            <div className="bg-gradient-to-r from-[#2F4F33] to-[#1a2e1c] rounded-lg p-6 mb-8 text-center">
              <p className="text-[#F5EFD9] text-lg md:text-xl font-medium mb-2">
                Questions about {property.title}?
              </p>
              <p className="text-[#D2C6B2] text-base md:text-lg">
                Give us a call at <a href="tel:469-640-3864" className="text-[#F5EFD9] font-semibold hover:underline">(469) 640-3864</a>
              </p>
            </div>

            {/* Seller Financing Badge - Only for Longhorn */}
            {property.slug === 'longhorn' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-[#2F4F33] text-[#F5EFD9] rounded-lg p-4 text-center border-2 border-[#7D6B58]">
                  <div className="flex justify-center mb-2">
                    <svg className="w-8 h-8 text-[#F5EFD9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-lg font-semibold">Seller Financing Available</div>
                  <div className="text-sm text-[#D2C6B2] mt-1">Make ownership easier with flexible terms</div>
                </div>
                <div className="bg-[#2F4F33] text-[#F5EFD9] rounded-lg p-4 text-center border-2 border-[#7D6B58]">
                  <div className="flex justify-center mb-2">
                    <svg className="w-8 h-8 text-[#F5EFD9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="text-lg font-semibold">No HOA, No City Taxes</div>
                  <div className="text-sm text-[#D2C6B2] mt-1">True country freedom</div>
                </div>
              </div>
            )}

            {/* Lot Chart - Show for any property with lotTable */}
            {property.lotTable && (
              <div className="bg-white rounded-lg shadow-xl mb-8 overflow-hidden">
                <div className="p-4 bg-[#2F4F33] text-white">
                  <h2 className="text-xl md:text-2xl font-medium leading-tight">
                    {property.type === 'raw_land' ? 'Available Tracts' : 'Available Properties'}
                  </h2>
                  <p className="text-sm opacity-90 mt-1 leading-snug">
                    {property.type === 'raw_land'
                      ? 'Ranchette tracts and acreage parcels'
                      : 'Custom homesites and move-in ready homes'}
                  </p>
                </div>
                {/* Mobile Card Layout */}
                <div className="block sm:hidden">
                  {property.lotTable?.map((lot, index) => (
                    <div key={index} className="border-b border-gray-200 last:border-b-0">
                      <div 
                        className={`p-4 ${lot.hasDetails ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                        onClick={() => {
                          if (lot.hasDetails) {
                            setExpandedLot(expandedLot === index ? null : index);
                            setSelectedLot(lot);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-[#2F4F33] text-lg">{lot.lot}</h3>
                            <p className="text-sm text-gray-600">{lot.size}</p>
                          </div>
                          <div className="text-right ml-4">
                            {lot.status?.toLowerCase() === 'sold' ? (
                              <p className="font-bold text-red-600 text-lg">SOLD</p>
                            ) : (
                              <>
                                <p className="font-semibold text-[#2F4F33]">{lot.price}</p>
                                <p className="text-xs text-gray-600">{lot.status}</p>
                              </>
                            )}
                          </div>
                        </div>
                        {lot.features && lot.features.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {lot.features.map((feature, fIdx) => (
                                <span key={fIdx} className="inline-block bg-[#F5EFD9] text-[#2F4F33] px-2 py-1 rounded-full text-xs">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {lot.hasDetails && (
                          <div className="mt-3 text-center">
                            <span className="text-sm text-[#2F4F33] font-medium">
                              {expandedLot === index ? '▼ Hide Details' : '▶ View Details'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Mobile Expanded Content */}
                      {expandedLot === index && lot.hasDetails && (
                        <div className="bg-[#F5EFD9] p-4">
                          <h4 className="font-bold text-[#2F4F33] mb-3">About This Home</h4>
                          <div className="text-sm text-[#2F4F33] space-y-3 mb-4 leading-relaxed">
                            {lot.description.split('\n\n').map((paragraph, pIdx) => (
                              <p key={pIdx}>{paragraph}</p>
                            ))}
                          </div>
                          <div className="flex flex-col gap-2 mb-4">
                            <button className="w-full bg-[#2F4F33] text-white py-3 rounded font-medium">
                              Schedule a Tour
                            </button>
                            <button className="w-full border-2 border-[#2F4F33] text-[#2F4F33] py-3 rounded font-medium">
                              Request Info
                            </button>
                          </div>
                          {lot.images && lot.images.length > 0 && (
                            <div>
                              <h5 className="font-bold text-[#2F4F33] mb-2">Photos ({lot.images.length})</h5>
                              <div className="grid grid-cols-3 gap-2">
                                {lot.images.slice(0, 6).map((img, imgIdx) => (
                                  <img 
                                    key={imgIdx}
                                    src={img}
                                    alt={`Photo ${imgIdx + 1}`}
                                    className="w-full h-20 object-cover rounded cursor-pointer"
                                    onClick={() => openModal(lot.images, imgIdx)}
                                  />
                                ))}
                              </div>
                              {lot.images.length > 6 && (
                                <button 
                                  className="mt-2 text-sm text-[#2F4F33] underline"
                                  onClick={() => openModal(lot.images, 0)}
                                >
                                  View all {lot.images.length} photos
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F5EFD9]">
                      <tr>
                        <th className="px-6 py-4 text-left text-[#2F4F33] font-bold text-sm uppercase tracking-wide">Lot</th>
                        <th className="px-6 py-4 text-left text-[#2F4F33] font-bold text-sm uppercase tracking-wide">Size</th>
                        <th className="px-6 py-4 text-left text-[#2F4F33] font-bold text-sm uppercase tracking-wide">Price</th>
                        <th className="px-6 py-4 text-left text-[#2F4F33] font-bold text-sm uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {property.lotTable.map((lot, index) => (
                        <React.Fragment key={index}>
                          <tr
                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#F5EFD9]/30'} ${lot.hasDetails ? 'cursor-pointer hover:bg-[#D2C6B2]/20 transition-colors' : ''}`}
                            onClick={() => {
                              if (lot.hasDetails) {
                                setExpandedLot(expandedLot === index ? null : index);
                                setSelectedLot(lot);
                              }
                            }}
                          >
                            <td className="px-6 py-4 text-[#2F4F33] font-bold whitespace-nowrap">
                              <div className="flex items-center">
                                {lot.lot}
                                {lot.hasDetails && (
                                  <span className="ml-2 text-[#7D6B58] text-xs">
                                    {expandedLot === index ? '▲' : '▼'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[#2F4F33] font-semibold">{lot.size}</td>
                            <td className="px-6 py-4 text-[#2F4F33] font-bold text-lg">
                              {lot.status?.toLowerCase() === 'sold' ? (
                                <span className="font-bold text-red-600 text-lg">SOLD</span>
                              ) : (
                                lot.price
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {lot.status?.toLowerCase() !== 'sold' && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  lot.status === 'Available'
                                    ? 'bg-green-100 text-green-800'
                                    : lot.status === 'Move-In Ready'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {lot.status}
                                </span>
                              )}
                            </td>
                          </tr>
                          {expandedLot === index && lot.hasDetails && (
                            <tr>
                              <td colSpan="4" className="p-0">
                                <div className="bg-[#F5EFD9]">
                                  {/* Mobile Layout */}
                                  <div className="block sm:hidden p-4">
                                    <h3 className="text-lg font-bold text-[#2F4F33] mb-3">About This Home</h3>
                                    <div className="text-sm text-[#2F4F33] space-y-3 mb-4">
                                      {lot.description.split('\n\n').map((paragraph, pIndex) => (
                                        <p key={pIndex} className="leading-relaxed">{paragraph}</p>
                                      ))}
                                    </div>
                                    <div className="space-y-2 mb-4">
                                      <button className="w-full bg-[#2F4F33] text-white py-2.5 rounded">
                                        Schedule a Tour
                                      </button>
                                      <button className="w-full border border-[#2F4F33] text-[#2F4F33] py-2.5 rounded">
                                        Request Info
                                      </button>
                                    </div>
                                    {lot.images && lot.images.length > 0 && (
                                      <div>
                                        <h4 className="text-sm font-bold text-[#2F4F33] mb-2">Photos ({lot.images.length})</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                          {lot.images.slice(0, 6).map((img, imgIdx) => (
                                            <img 
                                              key={imgIdx}
                                              src={img}
                                              alt={`Photo ${imgIdx + 1}`}
                                              className="w-full h-20 object-cover rounded"
                                              onClick={() => openModal(lot.images, imgIdx)}
                                            />
                                          ))}
                                        </div>
                                        {lot.images.length > 6 && (
                                          <button 
                                            className="mt-2 text-sm text-[#2F4F33] underline"
                                            onClick={() => openModal(lot.images, 0)}
                                          >
                                            View all {lot.images.length} photos
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Desktop Layout */}
                                  <div className="hidden sm:block p-6 border-t-2 border-[#2F4F33]">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                      <div className="w-full">
                                        <h3 className="text-2xl text-[#2F4F33] font-bold mb-4">About This Home</h3>
                                        <div className="text-[#2F4F33] space-y-4">
                                          {lot.description.split('\n\n').map((paragraph, pIndex) => (
                                            <p key={pIndex} className="text-base leading-relaxed">{paragraph}</p>
                                          ))}
                                        </div>
                                        <div className="flex gap-3 mt-6">
                                          <button className="bg-[#2F4F33] text-white px-6 py-3 rounded hover:bg-[#1a2e1c] transition">
                                            Schedule a Tour
                                          </button>
                                          <button className="border-2 border-[#2F4F33] text-[#2F4F33] px-6 py-3 rounded hover:bg-[#2F4F33] hover:text-white transition">
                                            Request Info
                                          </button>
                                        </div>
                                      </div>
                                      <div className="w-full">
                                        <h3 className="text-xl text-[#2F4F33] font-bold mb-4">Property Photos ({lot.images.length} Total)</h3>
                                        <div className="relative group">
                                          <img 
                                            src={lot.images[selectedLotImage]} 
                                            alt={`${lot.lot} - Photo ${selectedLotImage + 1}`}
                                            className="w-full h-96 object-cover rounded-lg shadow-xl cursor-pointer hover:opacity-95 transition-opacity"
                                            onClick={() => openModal(lot.images, selectedLotImage)}
                                          />
                                          {/* Left Arrow */}
                                          <button 
                                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedLotImage(selectedLotImage === 0 ? lot.images.length - 1 : selectedLotImage - 1);
                                            }}
                                          >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                            </svg>
                                          </button>
                                          {/* Right Arrow */}
                                          <button 
                                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedLotImage((selectedLotImage + 1) % lot.images.length);
                                            }}
                                          >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                          </button>
                                          {/* Photo Counter */}
                                          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg">
                                            {selectedLotImage + 1} / {lot.images.length}
                                          </div>
                                        </div>
                                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                                          {lot.images.map((img, imgIndex) => (
                                            <img 
                                              key={imgIndex}
                                              src={img} 
                                              alt={`Thumbnail ${imgIndex + 1}`}
                                              className={`w-20 h-20 object-cover rounded cursor-pointer transition-all flex-shrink-0 ${
                                                selectedLotImage === imgIndex 
                                                  ? 'ring-4 ring-[#2F4F33] scale-110' 
                                                  : 'hover:scale-105 opacity-70 hover:opacity-100'
                                              }`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (e.shiftKey || e.metaKey || e.ctrlKey) {
                                                  // Open modal when clicking with modifier key
                                                  openModal(lot.images, imgIndex);
                                                } else {
                                                  // Normal thumbnail click - just change main image
                                                  setSelectedLotImage(imgIndex);
                                                }
                                              }}
                                              onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                openModal(lot.images, imgIndex);
                                              }}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Interactive Property Map - Custom Leaflet Map */}
            {property.propertyDetails?.location?.coordinates && (
              <div className="bg-white rounded-lg shadow-xl mb-8 overflow-hidden">
                <div className="p-4 bg-[#2F4F33] text-white">
                  <h2 className="text-xl font-medium">Interactive Property Map</h2>
                  <p className="text-sm opacity-90 mt-1">Satellite view with property boundaries</p>
                </div>
                <div className="p-4">
                  <PropertyMap property={property} />
                </div>
              </div>
            )}

            {/* Property Details Chart - Show for properties with propertyDetails */}
            {property.propertyDetails && (
              <div className="bg-white rounded-lg shadow-xl mb-8 overflow-hidden border border-[#D2C6B2]">
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Left Column - Location */}
                  <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-[#D2C6B2] bg-gradient-to-br from-[#F5EFD9] to-white">
                    <div className="flex items-center mb-8 pb-4 border-b-2 border-[#2F4F33]">
                      <div className="w-12 h-12 bg-[#2F4F33] rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-[#2F4F33]">Location</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-[#2F4F33]/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                          <svg className="w-5 h-5 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-[#7D6B58] font-semibold mb-1">Parcel ID</div>
                          <div className="text-[#2F4F33] font-bold text-lg">{property.propertyDetails.location.parcelId}</div>
                          {property.propertyDetails.location.county && (
                            <div className="text-[#7D6B58] text-sm mt-1">{property.propertyDetails.location.county}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-[#2F4F33]/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                          <svg className="w-5 h-5 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-[#7D6B58] font-semibold mb-1">Coordinates</div>
                          <div className="text-[#2F4F33] font-mono text-sm font-semibold">
                            {property.propertyDetails.location.coordinates.lng} | {property.propertyDetails.location.coordinates.lat}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-[#2F4F33]/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                          <svg className="w-5 h-5 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs uppercase tracking-wider text-[#7D6B58] font-semibold mb-1">Property Address</div>
                          <div className="text-sm sm:text-base text-[#2F4F33] font-semibold break-words">{property.propertyDetails.location.address}</div>
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${property.propertyDetails.location.coordinates.lat},${property.propertyDetails.location.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center mt-6 bg-[#2F4F33] text-white px-8 py-4 rounded-lg hover:bg-[#1a2e1c] transition duration-300 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        Get Directions
                      </a>
                    </div>
                  </div>

                  {/* Right Column - Features */}
                  <div className="p-8 md:p-10 bg-white">
                    <div className="flex items-center mb-8 pb-4 border-b-2 border-[#2F4F33]">
                      <div className="w-12 h-12 bg-[#2F4F33] rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-[#2F4F33]">Features</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-[#2F4F33]/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                          <svg className="w-5 h-5 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M4 6h16M4 18h16" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-[#7D6B58] font-semibold mb-1">Access</div>
                          <div className="text-[#2F4F33] font-semibold">{property.propertyDetails.features.access}</div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-[#2F4F33]/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                          <svg className="w-5 h-5 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-[#7D6B58] font-semibold mb-1">Power</div>
                          <div className="text-[#2F4F33] font-semibold">{property.propertyDetails.features.power}</div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-[#2F4F33]/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                          <svg className="w-5 h-5 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-[#7D6B58] font-semibold mb-1">Water</div>
                          <div className="text-[#2F4F33] font-semibold">{property.propertyDetails.features.water}</div>
                        </div>
                      </div>
                      {property.propertyDetails.features.sewer && (
                        <div className="flex items-start">
                          <div className="w-10 h-10 bg-[#2F4F33]/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                            <svg className="w-5 h-5 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-wider text-[#7D6B58] font-semibold mb-1">Sewer</div>
                            <div className="text-[#2F4F33] font-semibold">{property.propertyDetails.features.sewer}</div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-[#2F4F33]/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                          <svg className="w-5 h-5 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-[#7D6B58] font-semibold mb-1">Topography</div>
                          <div className="text-[#2F4F33] font-semibold">{property.propertyDetails.features.topography}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Surrounding Landscape - Show for properties with surroundingLandscape */}
            {property.surroundingLandscape && (
              <div className="bg-white rounded-lg shadow-xl mb-8 overflow-hidden border border-[#D2C6B2]">
                <div className="bg-gradient-to-r from-[#2F4F33] to-[#1a2e1c] p-6">
                  <div className="flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{property.title}</h2>
                      <div className="text-[#D2C6B2] text-sm font-medium mt-1" style={{ fontFamily: 'cursive' }}>
                        In Summary
                      </div>
                      <div className="text-[#D2C6B2] text-xs mt-1">
                        {property.template === 'high-density'
                          ? `${property.location}${property.propertyDetails?.location?.county ? ', ' + property.propertyDetails.location.county.replace(' County', '') : ''}`
                          : `${property.propertyDetails?.location?.county || property.county || ''}, ${property.location.includes(',') ? property.location.split(',')[1].trim() : 'TX'}`
                        }
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6 md:p-10 bg-gradient-to-br from-[#F5EFD9] to-white">
                  <p className="text-[#2F4F33] leading-relaxed text-sm sm:text-base md:text-lg">
                    {property.surroundingLandscape.description}
                  </p>
                </div>
              </div>
            )}

            {/* Mobile Pricing Section */}
            <div className="sm:hidden bg-white rounded-lg shadow-lg p-6 mb-8 border-2 border-[#2F4F33]">
              <div className="text-center">
                {(property.type === 'community' || property.type === 'subdivision') ? (
                  <>
                    <p className="text-2xl sm:text-3xl md:text-4xl text-[#2F4F33] font-light mb-2 break-words">{property.priceRange}</p>
                    <p className="text-[#7D6B58] mb-1 text-sm md:text-base break-words">{property.lots}</p>
                    <p className="text-lg sm:text-xl md:text-2xl text-[#2F4F33] mb-1 break-words">{property.homeTypes}</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl sm:text-3xl md:text-4xl text-[#2F4F33] font-light mb-2 break-words">${property.price?.toLocaleString()}</p>
                    <p className="text-[#7D6B58] mb-1 text-sm md:text-base break-words">${property.pricePerAcre?.toLocaleString()}/acre</p>
                    <p className="text-lg sm:text-xl md:text-2xl text-[#2F4F33] mb-1 break-words">{property.acres} acres</p>
                  </>
                )}
              </div>
            </div>

            {/* Community Overview */}
            <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl text-[#2F4F33] font-serif font-light mb-3">
                  {property.type === 'community' || property.type === 'subdivision'
                    ? (property.homeTypes?.toLowerCase().includes('ranchette') || property.lots?.toLowerCase().includes('tract')
                      ? 'Residential & Recreational'
                      : 'Acreage Homesites')
                    : property.type === 'raw_land' ? 'Residential & Recreational Property' : 'Commercial Investment Opportunity'}
                </h2>
                <p className="text-[#7D6B58] font-serif italic">
                  {property.type === 'community' || property.type === 'subdivision' ? property.targetBuyer || 'Sweet country living' : property.type === 'raw_land' ? 'Your perfect homesite or weekend retreat' : 'Prime location for your next business venture'}
                </p>
              </div>
              
              <div className="group relative cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className={`bg-gradient-to-br from-[#2F4F33] to-[#1a2e1c] rounded-lg p-8 transform transition-all duration-500 ${isExpanded ? '' : 'hover:scale-105 hover:shadow-2xl'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-2xl sm:text-3xl text-[#F5EFD9] font-serif font-bold mb-2 break-words leading-tight text-wrap">
                        {(property.type === 'community' || property.type === 'subdivision') ? property.title : `${property.acres} Acre Lot`}
                      </h3>
                      <p className="text-[#D2C6B2] text-base sm:text-lg break-words">
                        {property.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 sm:px-3 sm:py-1.5 bg-green-500 text-white rounded-full text-xs sm:text-sm font-bold transition-all duration-300 hover:shadow-lg hover:shadow-green-400/50 hover:scale-110 cursor-pointer">
                        {property.status || 'AVAILABLE'}
                      </span>
                    </div>
                  </div>
                  
                  {(property.type === 'community' || property.type === 'subdivision') ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-[#7D6B58] text-sm mb-1">Starting Price</p>
                        <p className="text-white font-bold text-xl">{property.priceRange}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#7D6B58] text-sm mb-1">Home Type</p>
                        <p className="text-white font-bold text-xl">{property.homeTypes}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#7D6B58] text-sm mb-1">Lot Type</p>
                        <p className="text-white font-bold text-xl">{property.lots}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#7D6B58] text-sm mb-1">Location</p>
                        <p className="text-white font-bold text-xl">{property.location}</p>
                      </div>
                    </div>
                  ) : property.type === 'raw_land' ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-[#7D6B58] text-sm mb-1">Price</p>
                        <p className="text-white font-bold text-xl">${property.price ? Math.round(property.price/1000) : '250'}K</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#7D6B58] text-sm mb-1">Per Acre</p>
                        <p className="text-white font-bold text-xl">${property.pricePerAcre ? Math.round(property.pricePerAcre/1000) : '54'}K</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#7D6B58] text-sm mb-1">Total Acres</p>
                        <p className="text-white font-bold text-xl">{property.acres}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#7D6B58] text-sm mb-1">Location</p>
                        <p className="text-white font-bold text-xl">{property.location}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-[#7D6B58] text-sm mb-1">Price</p>
                        <p className="text-white font-bold text-xl">${property.price ? Math.round(property.price/1000) : '250'}K</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#7D6B58] text-sm mb-1">Per Acre</p>
                        <p className="text-white font-bold text-xl">${property.pricePerAcre ? Math.round(property.pricePerAcre/1000) : '54'}K</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#7D6B58] text-sm mb-1">Traffic</p>
                        <p className="text-white font-bold text-xl">High</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#7D6B58] text-sm mb-1">Zoning</p>
                        <p className="text-white font-bold text-xl">Commercial</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center">
                    <span className={`text-[#7D6B58] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </span>
                    <span className="ml-2 text-[#7D6B58] text-sm">
                      {isExpanded ? 'Click to collapse' : (property.type === 'community' || property.type === 'subdivision') ? 'Click to explore community features' : property.type === 'raw_land' ? 'Click to explore property features' : 'Click to explore investment potential'}
                    </span>
                  </div>
                </div>
                
                <div className={`mt-4 bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[3000px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}`}>
                  <div className="p-8 border-l-4 border-[#2F4F33]">
                    <h4 className="text-2xl text-[#2F4F33] font-serif font-bold mb-6">
                      {property.type === 'community' || property.type === 'subdivision' ? 'Community Highlights' : property.type === 'raw_land' ? 'Property Highlights' : 'Commercial Investment Highlights'}
                    </h4>
                    {(property.type === 'community' || property.type === 'subdivision' || property.type === 'raw_land') ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                          {property.communityHighlights?.slice(0, 3).map((highlight, index) => (
                            <div key={index} className="flex items-start">
                              <div className="w-6 h-6 flex-shrink-0 mr-3 mt-0.5">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-[#2F4F33]">{highlight}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-4">
                          {property.communityHighlights?.slice(3, 6).map((highlight, index) => (
                            <div key={index} className="flex items-start">
                              <div className="w-6 h-6 flex-shrink-0 mr-3 mt-0.5">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-[#2F4F33]">{highlight}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <div className="w-6 h-6 flex-shrink-0 mr-3 mt-0.5">
                              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-[#2F4F33]">Prime Location</p>
                              <p className="text-[#7D6B58] text-sm">Direct I-20 access with high visibility</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="w-6 h-6 flex-shrink-0 mr-3 mt-0.5">
                              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-[#2F4F33]">Development Ready</p>
                              <p className="text-[#7D6B58] text-sm">Level terrain with utilities at site</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="w-6 h-6 flex-shrink-0 mr-3 mt-0.5">
                              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-[#2F4F33]">Multiple Uses</p>
                              <p className="text-[#7D6B58] text-sm">RV park, truck stop, restaurant, retail</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <div className="w-6 h-6 flex-shrink-0 mr-3 mt-0.5">
                              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-[#2F4F33]">Billboard Income</p>
                              <p className="text-[#7D6B58] text-sm">Additional revenue potential</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="w-6 h-6 flex-shrink-0 mr-3 mt-0.5">
                              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-[#2F4F33]">Strategic Position</p>
                              <p className="text-[#7D6B58] text-sm">Between major West Texas cities</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="w-6 h-6 flex-shrink-0 mr-3 mt-0.5">
                              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-[#2F4F33]">Industrial Activity</p>
                              <p className="text-[#7D6B58] text-sm">Refinery & truck facility nearby</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="bg-[#F5EFD9] rounded-lg p-6">
                      <p className="text-[#2F4F33] font-serif leading-relaxed mb-4">
                        {property.detailedDescription ? property.detailedDescription.split('\n\n')[0] : property.description}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowContactForm(true);
                          }}
                          className="flex-1 bg-[#2F4F33] text-[#F5EFD9] py-4 px-6 hover:bg-[#1a2e1c] transition duration-300 font-serif text-lg shadow-lg hover:shadow-xl"
                        >
                          Inquire About This Property
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCalendar(true);
                          }}
                          className="flex-1 border-2 border-[#2F4F33] text-[#2F4F33] py-4 px-6 hover:bg-[#2F4F33] hover:text-white transition duration-300 font-serif"
                        >
                          Schedule Site Visit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-xl border-2 border-[#2F4F33] p-6 sm:p-8 mb-8">
              {embeddedShowThankYou ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-[#2F4F33] rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#F5EFD9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-serif font-bold text-[#2F4F33] mb-4">Thank You!</h3>
                  <p className="text-[#7D6B58] text-lg">We've received your inquiry and will contact you shortly!</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl sm:text-3xl text-[#2F4F33] font-medium mb-3">Interested in This Property?</h2>
                    <p className="text-[#7D6B58] text-base sm:text-lg leading-relaxed">
                      {property.contactFormText || "Get in touch with our team to learn more about this exceptional property opportunity."}
                    </p>
                  </div>

                  {!embeddedOtpSent ? (
                    <form className="space-y-4 sm:space-y-6" onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const formDataObj = {
                        name: formData.get('name'),
                        email: formData.get('email'),
                        timeline: formData.get('timeline'),
                        message: formData.get('message')
                      };
                      sendEmbeddedOTP(formDataObj);
                    }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      placeholder="Your Name *"
                      className="w-full px-4 py-3 sm:py-4 rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:ring-2 focus:ring-[#2F4F33] focus:ring-opacity-20 focus:outline-none transition-all duration-200 shadow-sm"
                      required
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address *"
                      className="w-full px-4 py-3 sm:py-4 rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:ring-2 focus:ring-[#2F4F33] focus:ring-opacity-20 focus:outline-none transition-all duration-200 shadow-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number *"
                      value={embeddedFormPhone}
                      onChange={(e) => setEmbeddedFormPhone(formatPhoneNumber(e.target.value))}
                      className="w-full px-4 py-3 sm:py-4 rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:ring-2 focus:ring-[#2F4F33] focus:ring-opacity-20 focus:outline-none transition-all duration-200 shadow-sm"
                      required
                    />
                  </div>
                  <div className="relative">
                    <select name="timeline" className="w-full px-4 py-3 sm:py-4 rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:ring-2 focus:ring-[#2F4F33] focus:ring-opacity-20 focus:outline-none transition-all duration-200 shadow-sm">
                      <option value="">How soon are you looking?</option>
                      <option value="immediately">Yesterday (but today works)</option>
                      <option value="1-3months">1-3 months</option>
                      <option value="3-6months">3-6 months</option>
                      <option value="6-12months">6-12 months</option>
                      <option value="just-browsing">Just browsing (we don't judge)</option>
                    </select>
                  </div>
                </div>
                
                <div className="relative">
                  <textarea
                    name="message"
                    rows="4"
                    defaultValue={`Hi Haven Team! I came across ${property.title} and would like to learn more about it. Thanks!`}
                    className="w-full px-4 py-3 sm:py-4 rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:ring-2 focus:ring-[#2F4F33] focus:ring-opacity-20 focus:outline-none transition-all duration-200 shadow-sm resize-none"
                  ></textarea>
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={embeddedIsLoading}
                    className="w-full bg-[#2F4F33] text-white py-4 px-6 rounded-lg hover:bg-[#1a2e1c] focus:bg-[#1a2e1c] focus:ring-4 focus:ring-[#2F4F33] focus:ring-opacity-30 transition-all duration-300 font-medium text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {embeddedIsLoading ? 'Submitting...' :
                      property.id === 1
                        ? "Learn More About Nashboro Village"
                        : (property.type === 'community' || property.type === 'subdivision')
                        ? "Let's Talk About Your Future Home"
                        : "Inquire About This Property"
                    }
                  </button>
                </div>
                {embeddedOtpError && <p className="text-red-600 text-sm text-center">{embeddedOtpError}</p>}
              </form>
            ) : (
              <div className="space-y-6">
                <p className="text-[#2F4F33] text-lg text-center">We sent a verification code to {embeddedFormPhone}. Please enter it below:</p>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={embeddedOtpCode}
                  onChange={(e) => setEmbeddedOtpCode(e.target.value)}
                  maxLength="6"
                  className="w-full px-4 py-4 rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:ring-2 focus:ring-[#2F4F33] focus:ring-opacity-20 focus:outline-none transition-all duration-200 shadow-sm text-center text-3xl tracking-widest"
                />
                {embeddedOtpError && <p className="text-red-600 text-sm text-center">{embeddedOtpError}</p>}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEmbeddedOtpSent(false);
                      setEmbeddedOtpCode('');
                      setEmbeddedOtpError('');
                    }}
                    className="flex-1 border-2 border-[#2F4F33] text-[#2F4F33] py-4 px-6 rounded-lg hover:bg-[#F5EFD9] transition duration-300 font-medium text-lg"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={verifyEmbeddedOTP}
                    disabled={embeddedIsLoading || embeddedOtpCode.length !== 6}
                    className="flex-1 bg-[#2F4F33] text-white py-4 px-6 rounded-lg hover:bg-[#1a2e1c] focus:bg-[#1a2e1c] focus:ring-4 focus:ring-[#2F4F33] focus:ring-opacity-30 transition-all duration-300 font-medium text-lg shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {embeddedIsLoading ? 'Verifying...' : 'Verify & Submit'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>



            {/* Nearby Locations */}
            {property.id === 1 ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl text-[#2F4F33] font-medium mb-4">Nearby Locations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "Downtown Nashville", type: "City Center", distance: "8 miles" },
                    { name: "Music Row", type: "Entertainment District", distance: "10 miles" },
                    { name: "Nashville International Airport", type: "Airport", distance: "12 miles" },
                    { name: "The Gulch", type: "Business District", distance: "9 miles" },
                    { name: "Vanderbilt University", type: "University", distance: "11 miles" }
                  ].map((location, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <span className="text-[#2F4F33] font-medium">{location.name}</span>
                        <span className="text-[#7D6B58] text-sm ml-2">({location.type})</span>
                      </div>
                      <span className="text-[#2F4F33] font-medium">{location.distance}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : property.id === 2 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl text-[#2F4F33] font-medium mb-4">Nearby Locations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "Downtown Belton", type: "City Center", distance: "5 miles" },
                    { name: "Temple", type: "Major City", distance: "10 miles" },
                    { name: "Killeen", type: "Major City", distance: "15 miles" },
                    { name: "Fort Hood", type: "Military Base", distance: "20 miles" },
                    { name: "Austin", type: "State Capital", distance: "60 miles" }
                  ].map((location, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <span className="text-[#2F4F33] font-medium">{location.name}</span>
                        <span className="text-[#7D6B58] text-sm ml-2">({location.type})</span>
                      </div>
                      <span className="text-[#2F4F33] font-medium">{location.distance}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-32 space-y-6">
              
              {/* Price Summary */}
              <div className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300">
                <div className="text-center mb-6">
                  {selectedLot ? (
                    <>
                      <h3 className="text-2xl text-[#2F4F33] font-medium mb-1">{selectedLot.lot}</h3>
                      <h4 className="text-3xl text-[#2F4F33] font-light mb-2">{selectedLot.price}</h4>
                      <p className="text-[#7D6B58]">{selectedLot.size}</p>
                      <p className="text-xl text-[#2F4F33] mt-2">{selectedLot.status}</p>
                    </>
                  ) : (property.type === 'community' || property.type === 'subdivision') ? (
                    <>
                      <h3 className="text-3xl text-[#2F4F33] font-light mb-2">{property.priceRange}</h3>
                      <p className="text-[#7D6B58]">Lot Sizes: {property.lots}</p>
                      <p className="text-xl text-[#2F4F33] mt-2">{property.homeTypes}</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-3xl text-[#2F4F33] font-light mb-2">${property.price?.toLocaleString()}</h3>
                      <p className="text-[#7D6B58]">${property.pricePerAcre?.toLocaleString()} per acre</p>
                      <p className="text-xl text-[#2F4F33] mt-2">{property.acres} acres</p>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="w-full bg-[#2F4F33] text-[#F5EFD9] py-3 px-6 hover:bg-[#1a2e1c] transition duration-300 font-medium"
                  >
                    {selectedLot ? `Inquire About ${selectedLot.lot}` : 'Get More Info'}
                  </button>
                  <button
                    onClick={() => setShowCalendar(true)}
                    className="w-full border-2 border-[#2F4F33] text-[#2F4F33] py-3 px-6 hover:bg-[#2F4F33] hover:text-white transition duration-300 font-medium"
                  >
                    {selectedLot ? `Schedule Tour of ${selectedLot.lot}` : 'Schedule a Visit'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full bg-stone-200 text-[#2F4F33] py-3 px-6 hover:bg-stone-300 transition duration-300 font-medium"
                  >
                    Share This Property
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-[#2F4F33] bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl text-[#2F4F33] font-medium">Get More Information</h2>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-[#7D6B58] hover:text-[#7D6B58] text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5EFD9]"
                >
                  ×
                </button>
              </div>
              
              <p className="text-[#7D6B58] mb-6">
                {property.template === "high-density"
                  ? "We respond fast (usually same day) and love answering questions about the community."
                  : "Let's talk land. We respond fast (usually same day) and never judge where you're at in the process."}
              </p>

              {!otpSent ? (
                <form className="space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const formDataObj = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    when_buying: formData.get('when_buying'),
                    building_type: formData.get('building_type'),
                    message: formData.get('message')
                  };
                  sendOTP(formDataObj);
                }}>
                  <input
                    type="text"
                    name="name"
                    placeholder="Name *"
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:ring-2 focus:ring-[#2F4F33] focus:ring-opacity-20 focus:outline-none transition-all duration-200 shadow-sm"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email *"
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:ring-2 focus:ring-[#2F4F33] focus:ring-opacity-20 focus:outline-none transition-all duration-200 shadow-sm"
                    required
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone *"
                    value={formPhone}
                    onChange={(e) => setFormPhone(formatPhoneNumber(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:ring-2 focus:ring-[#2F4F33] focus:ring-opacity-20 focus:outline-none transition-all duration-200 shadow-sm"
                    required
                  />
                  <select name="when_buying" className="w-full px-4 py-3 rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:ring-2 focus:ring-[#2F4F33] focus:ring-opacity-20 focus:outline-none transition-all duration-200 shadow-sm" required>
                    <option value="">When are you looking to buy? *</option>
                    <option value="ready-now">Ready now (have financing/cash)</option>
                    <option value="1-3-months">1-3 months</option>
                    <option value="3-6-months">3-6 months</option>
                    <option value="exploring">Just exploring (that's cool!)</option>
                  </select>
                  {property.template === "rural" && (
                    <select name="building_type" className="w-full px-4 py-3 rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:ring-2 focus:ring-[#2F4F33] focus:ring-opacity-20 focus:outline-none transition-all duration-200 shadow-sm" required>
                      <option value="">What are you building? *</option>
                      <option value="primary-home">Primary home (moving here)</option>
                      <option value="weekend-getaway">Weekend getaway / cabin</option>
                      <option value="barndominium">Barndominium</option>
                      <option value="investment">Investment / hold</option>
                      <option value="not-sure">Not sure yet</option>
                    </select>
                  )}
                  <textarea
                    name="message"
                    rows="3"
                    defaultValue={`Hi Haven Team! I came across ${property.title} and would like to learn more about it. Thanks!`}
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:ring-2 focus:ring-[#2F4F33] focus:ring-opacity-20 focus:outline-none transition-all duration-200 shadow-sm resize-none"
                  ></textarea>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="flex-1 border-2 border-[#D2C6B2] text-[#2F4F33] py-3 px-4 rounded-lg hover:bg-[#F5EFD9] transition duration-300 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-[#2F4F33] text-white py-3 px-4 rounded-lg hover:bg-[#1a2e1c] focus:bg-[#1a2e1c] focus:ring-4 focus:ring-black focus:ring-opacity-30 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      {isLoading ? 'Submitting...' : 'Send Message'}
                    </button>
                  </div>
                  {otpError && <p className="text-red-600 text-sm">{otpError}</p>}
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-[#2F4F33] text-sm">We sent a verification code to {formPhone}. Please enter it below:</p>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength="6"
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:ring-2 focus:ring-[#2F4F33] focus:ring-opacity-20 focus:outline-none transition-all duration-200 shadow-sm text-center text-2xl tracking-widest"
                  />
                  {otpError && <p className="text-red-600 text-sm">{otpError}</p>}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                        setOtpError('');
                      }}
                      className="flex-1 border-2 border-[#D2C6B2] text-[#2F4F33] py-3 px-4 rounded-lg hover:bg-[#F5EFD9] transition duration-300 font-medium"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => verifyOTP(savedFormData)}
                      disabled={isLoading || otpCode.length !== 6}
                      className="flex-1 bg-[#2F4F33] text-white py-3 px-4 rounded-lg hover:bg-[#1a2e1c] focus:bg-[#1a2e1c] focus:ring-4 focus:ring-black focus:ring-opacity-30 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      {isLoading ? 'Verifying...' : 'Verify & Submit'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Visit Modal */}
      {showCalendar && (
        <div className="fixed inset-0 bg-[#2F4F33] bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl text-[#2F4F33] font-medium">Schedule Your Visit</h2>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="text-[#7D6B58] hover:text-[#7D6B58] text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5EFD9]"
                >
                  ×
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-[#2F4F33]">Step {visitStep} of 7</span>
                  <span className="text-sm font-medium text-[#2F4F33]">{Math.round((visitStep / 7) * 100)}%</span>
                </div>
                <div className="w-full bg-[#D2C6B2] rounded-full h-2">
                  <div
                    className="bg-[#2F4F33] h-2 rounded-full transition-all duration-500"
                    style={{width: `${(visitStep / 7) * 100}%`}}
                  ></div>
                </div>
              </div>

              {/* Step 1: Preferred Date */}
              {visitStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-4">
                    When would you like to visit?
                  </h3>
                  <input
                    type="date"
                    value={visitFormData.preferred_date}
                    onChange={(e) => setVisitFormData({...visitFormData, preferred_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 text-lg rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:outline-none transition-all"
                    autoFocus
                  />
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCalendar(false);
                        setVisitStep(1);
                        setVisitFormData({preferred_date: '', preferred_time: '', name: '', email: '', phone: '', message: ''});
                      }}
                      className="flex-1 border-2 border-[#D2C6B2] text-[#2F4F33] py-3 px-4 rounded-lg hover:bg-[#F5EFD9] transition duration-300 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleVisitNext}
                      disabled={!visitFormData.preferred_date}
                      className="flex-1 bg-[#2F4F33] text-white py-3 px-4 rounded-lg hover:bg-[#1a2e1c] transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Preferred Time */}
              {visitStep === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-4">
                    What time works best?
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setVisitFormData({...visitFormData, preferred_time: time})}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          visitFormData.preferred_time === time
                            ? 'border-[#2F4F33] bg-[#F5EFD9] text-[#2F4F33] font-semibold'
                            : 'border-[#D2C6B2] hover:border-[#2F4F33] text-[#3A4045]'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={handleVisitBack} className="flex-1 border-2 border-[#D2C6B2] text-[#2F4F33] py-3 px-4 rounded-lg hover:bg-[#F5EFD9] transition duration-300 font-medium">
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleVisitNext}
                      disabled={!visitFormData.preferred_time}
                      className="flex-1 bg-[#2F4F33] text-white py-3 px-4 rounded-lg hover:bg-[#1a2e1c] transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Name */}
              {visitStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-4">
                    What's your name?
                  </h3>
                  <input
                    type="text"
                    value={visitFormData.name}
                    onChange={(e) => setVisitFormData({...visitFormData, name: e.target.value})}
                    placeholder="How should we address you?"
                    className="w-full px-4 py-3 text-lg rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:outline-none transition-all"
                    autoFocus
                  />
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={handleVisitBack} className="flex-1 border-2 border-[#D2C6B2] text-[#2F4F33] py-3 px-4 rounded-lg hover:bg-[#F5EFD9] transition duration-300 font-medium">
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleVisitNext}
                      disabled={!visitFormData.name}
                      className="flex-1 bg-[#2F4F33] text-white py-3 px-4 rounded-lg hover:bg-[#1a2e1c] transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Email */}
              {visitStep === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-4">
                    What's your email?
                  </h3>
                  <input
                    type="email"
                    value={visitFormData.email}
                    onChange={(e) => setVisitFormData({...visitFormData, email: e.target.value})}
                    placeholder="For confirmation emails"
                    className="w-full px-4 py-3 text-lg rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:outline-none transition-all"
                    autoFocus
                  />
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={handleVisitBack} className="flex-1 border-2 border-[#D2C6B2] text-[#2F4F33] py-3 px-4 rounded-lg hover:bg-[#F5EFD9] transition duration-300 font-medium">
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleVisitNext}
                      disabled={!visitFormData.email}
                      className="flex-1 bg-[#2F4F33] text-white py-3 px-4 rounded-lg hover:bg-[#1a2e1c] transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Phone */}
              {visitStep === 5 && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-4">
                    What's your phone number?
                  </h3>
                  <input
                    type="tel"
                    value={visitFormData.phone}
                    onChange={(e) => setVisitFormData({...visitFormData, phone: e.target.value})}
                    placeholder="(469) 640-3864"
                    className="w-full px-4 py-3 text-lg rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:outline-none transition-all"
                    autoFocus
                  />
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={handleVisitBack} className="flex-1 border-2 border-[#D2C6B2] text-[#2F4F33] py-3 px-4 rounded-lg hover:bg-[#F5EFD9] transition duration-300 font-medium">
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleVisitNext}
                      disabled={!visitFormData.phone}
                      className="flex-1 bg-[#2F4F33] text-white py-3 px-4 rounded-lg hover:bg-[#1a2e1c] transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 6: Message (Optional) */}
              {visitStep === 6 && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-4">
                    Any special requests? (Optional)
                  </h3>
                  <textarea
                    value={visitFormData.message}
                    onChange={(e) => setVisitFormData({...visitFormData, message: e.target.value})}
                    placeholder="Need directions? Have mobility concerns? Let us know!"
                    rows="4"
                    className="w-full px-4 py-3 text-lg rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:outline-none transition-all resize-none"
                    autoFocus
                  />
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={handleVisitBack} className="flex-1 border-2 border-[#D2C6B2] text-[#2F4F33] py-3 px-4 rounded-lg hover:bg-[#F5EFD9] transition duration-300 font-medium">
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={sendVisitOTP}
                      disabled={visitIsLoading}
                      className="flex-1 bg-[#2F4F33] text-white py-3 px-4 rounded-lg hover:bg-[#1a2e1c] transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {visitIsLoading ? 'Sending Code...' : 'Send Verification Code →'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 7: OTP Verification */}
              {visitStep === 7 && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-4">
                    Enter verification code
                  </h3>
                  <p className="text-[#7D6B58] mb-4">
                    We sent a 6-digit code to <strong>{visitFormData.phone}</strong>
                  </p>
                  <input
                    type="text"
                    placeholder="000000"
                    value={visitOtpCode}
                    onChange={(e) => setVisitOtpCode(e.target.value)}
                    maxLength={6}
                    className="w-full px-4 py-3 text-lg rounded-lg border-2 border-[#D2C6B2] text-[#2F4F33] focus:border-[#2F4F33] focus:outline-none transition-all text-center text-2xl tracking-widest font-bold"
                    autoFocus
                  />
                  {visitOtpError && (
                    <p className="text-red-600 text-sm">{visitOtpError}</p>
                  )}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setVisitStep(6)}
                      className="flex-1 border-2 border-[#D2C6B2] text-[#2F4F33] py-3 px-4 rounded-lg hover:bg-[#F5EFD9] transition duration-300 font-medium"
                    >
                      ← Change Number
                    </button>
                    <button
                      type="button"
                      onClick={verifyVisitOTP}
                      disabled={visitIsLoading || visitOtpCode.length !== 6}
                      className="flex-1 bg-[#2F4F33] text-white py-3 px-4 rounded-lg hover:bg-[#1a2e1c] transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {visitIsLoading ? 'Verifying...' : 'Verify & Book 📅'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={sendVisitOTP}
                    disabled={visitIsLoading}
                    className="w-full text-[#2F4F33] underline hover:text-[#7D6B58] transition-colors text-sm"
                  >
                    Didn't receive code? Resend
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Thank You Modal for Get More Info */}
      {showThankYou && (
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
                We received your inquiry about {property.title}. One of our team members will reach out to you shortly!
              </p>
              <button
                onClick={() => setShowThankYou(false)}
                className="bg-[#2F4F33] text-[#F5EFD9] px-8 py-3 rounded-lg font-semibold hover:bg-[#1a2e1c] transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thank You Modal for Schedule Visit */}
      {visitShowThankYou && (
        <div className="fixed inset-0 bg-[#2F4F33] bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2F4F33] rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#F5EFD9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#2F4F33] mb-4">
                Visit Scheduled!
              </h3>
              <p className="text-[#3A4045] mb-6 leading-relaxed">
                Your visit to {property.title} has been scheduled. We'll send you a confirmation shortly with all the details!
              </p>
              <button
                onClick={() => setVisitShowThankYou(false)}
                className="bg-[#2F4F33] text-[#F5EFD9] px-8 py-3 rounded-lg font-semibold hover:bg-[#1a2e1c] transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                  href="/contact" 
                  className="inline-block bg-[#F5EFD9] text-[#2F4F33] px-4 py-2 rounded-md hover:bg-[#D2C6B2] active:bg-[#D2C6B2] transition-all duration-200 text-sm font-medium transform hover:scale-105 active:scale-95"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-[#7D6B58] text-center">
            <p className="text-[#D2C6B2] text-sm mb-3">
              &copy; {new Date().getFullYear()} Haven Ground. All rights reserved.
              <span className="mx-2">|</span>
              Serving land owners from our heart.
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <a href="/privacy-policy" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Privacy Policy</a>
              <span className="text-[#7D6B58]">|</span>
              <a href="/terms-of-use" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Terms of Use</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Full-Screen Photo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white text-4xl z-10 hover:text-gray-300 transition-colors"
            >
              ×
            </button>
            
            {/* Main Image or Video */}
            {modalImages[modalImageIndex]?.endsWith('.mp4') ? (
              <video
                src={modalImages[modalImageIndex]}
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
                loop
              />
            ) : (
              <img
                src={modalImages[modalImageIndex]}
                alt={`Photo ${modalImageIndex + 1}`}
                className={`max-w-full max-h-full object-contain ${
                  modalImages[modalImageIndex]?.includes('plat')
                    ? 'filter brightness-150 contrast-125 bg-white'
                    : ''
                }`}
              />
            )}
            
            {/* Navigation Arrows */}
            <button
              onClick={prevModalImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-6xl hover:text-gray-300 transition-colors z-10"
            >
              ‹
            </button>
            <button
              onClick={nextModalImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-6xl hover:text-gray-300 transition-colors z-10"
            >
              ›
            </button>
            
            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg">
              {modalImageIndex + 1} / {modalImages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}