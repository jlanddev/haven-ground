"use client";

import { useState, useEffect, useRef } from 'react';
import { properties as propertiesData } from './propertiesData';

export default function PropertiesPage() {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [hasNavigated, setHasNavigated] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [filters, setFilters] = useState({
    search: '',
    minAcres: '',
    maxAcres: '',
    minPrice: '',
    maxPrice: '',
    state: 'all',
    location: 'all',
    sortBy: 'featured',
    showMobileFilters: false
  });

  const [loadingProperty, setLoadingProperty] = useState(null);

  // Help Modal states
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpOtpSent, setHelpOtpSent] = useState(false);
  const [helpOtpCode, setHelpOtpCode] = useState('');
  const [helpOtpVerified, setHelpOtpVerified] = useState(false);
  const [helpOtpError, setHelpOtpError] = useState('');
  const [helpIsLoading, setHelpIsLoading] = useState(false);
  const [helpE164Phone, setHelpE164Phone] = useState('');
  const [helpFormPhone, setHelpFormPhone] = useState('');
  const [showHelpThankYou, setShowHelpThankYou] = useState(false);
  const [savedHelpFormData, setSavedHelpFormData] = useState(null);

  // Land List Modal states
  const [showLandListModal, setShowLandListModal] = useState(false);
  const [landListOtpSent, setLandListOtpSent] = useState(false);
  const [landListOtpCode, setLandListOtpCode] = useState('');
  const [landListOtpVerified, setLandListOtpVerified] = useState(false);
  const [landListOtpError, setLandListOtpError] = useState('');
  const [landListIsLoading, setLandListIsLoading] = useState(false);
  const [landListE164Phone, setLandListE164Phone] = useState('');
  const [landListFormPhone, setLandListFormPhone] = useState('');
  const [showLandListThankYou, setShowLandListThankYou] = useState(false);
  const [savedLandListFormData, setSavedLandListFormData] = useState(null);

  // Import properties from centralized data file
  const properties = propertiesData;

  // Filter properties based on current filters
  const filteredProperties = properties.filter(property => {
    // Search filter
    if (filters.search && !property.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !property.location.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // State filter (applies to all properties)
    if (filters.state !== 'all') {
      let propertyState = 'Texas'; // default
      if (property.location.includes('MS')) propertyState = 'Mississippi';
      else if (property.location.includes('Nashville') || property.location.includes('TN')) propertyState = 'Tennessee';
      else if (property.location.includes('MO')) propertyState = 'Missouri';

      if (propertyState !== filters.state) return false;
    }

    // County filter (applies to all properties)
    if (filters.location !== 'all' && property.propertyDetails?.location?.county) {
      if (property.propertyDetails.location.county !== filters.location) return false;
    }

    // Acres and price filters (only for properties with numeric values)
    if (filters.minAcres && property.acres && parseFloat(property.acres) < parseFloat(filters.minAcres)) return false;
    if (filters.maxAcres && property.acres && parseFloat(property.acres) > parseFloat(filters.maxAcres)) return false;
    if (filters.minPrice && property.price && property.price < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && property.price && property.price > parseFloat(filters.maxPrice)) return false;

    return true;
  });

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (filters.sortBy) {
      case 'priceLow':
        if (a.type === 'community' && b.type === 'community') return 0;
        if (a.type === 'community') return 1;
        if (b.type === 'community') return -1;
        return (a.price || 0) - (b.price || 0);
      case 'priceHigh':
        if (a.type === 'community' && b.type === 'community') return 0;
        if (a.type === 'community') return 1;
        if (b.type === 'community') return -1;
        return (b.price || 0) - (a.price || 0);
      case 'acresLow':
        if (a.type === 'community' && b.type === 'community') return 0;
        if (a.type === 'community') return 1;
        if (b.type === 'community') return -1;
        return (parseFloat(a.acres) || 0) - (parseFloat(b.acres) || 0);
      case 'acresHigh':
        if (a.type === 'community' && b.type === 'community') return 0;
        if (a.type === 'community') return 1;
        if (b.type === 'community') return -1;
        return (parseFloat(b.acres) || 0) - (parseFloat(a.acres) || 0);
      case 'featured':
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });

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

  // Help form SMS functions
  const sendHelpOTP = async (formDataObj) => {
    setHelpIsLoading(true);
    setHelpOtpError('');
    setSavedHelpFormData(formDataObj);

    const e164 = '+1' + helpFormPhone.replace(/\D/g, '');
    setHelpE164Phone(e164);

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164 })
      });

      const data = await response.json();

      if (data.success) {
        setHelpOtpSent(true);
      } else {
        setHelpOtpError(data.error || 'Failed to send verification code');
      }
    } catch (error) {
      setHelpOtpError('Failed to send code. Please try again.');
    } finally {
      setHelpIsLoading(false);
    }
  };

  const verifyHelpOTP = async () => {
    setHelpIsLoading(true);
    setHelpOtpError('');

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: helpE164Phone, code: helpOtpCode })
      });

      const data = await response.json();

      if (data.verified) {
        setHelpOtpVerified(true);
        await submitHelpToGHL(savedHelpFormData, helpE164Phone);
        setShowHelpModal(false);
        setShowHelpThankYou(true);

        // Reset form
        setTimeout(() => {
          setHelpOtpSent(false);
          setHelpOtpCode('');
          setHelpOtpVerified(false);
          setHelpFormPhone('');
          setSavedHelpFormData(null);
        }, 100);

        // Facebook Pixel event
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', 'Lead', {
            content_name: 'Property Help Request',
            content_category: 'Property Inquiry'
          });
        }
      } else {
        setHelpOtpError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setHelpOtpError('Verification failed. Please try again.');
    } finally {
      setHelpIsLoading(false);
    }
  };

  const submitHelpToGHL = async (formDataObj, phone) => {
    try {
      await fetch('https://services.leadconnectorhq.com/hooks/wLaNbf44RqmPNhV1IEev/webhook-trigger/d3e7ef0e-d618-4ce3-8eec-996d3ca52c5c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formDataObj.name,
          email: formDataObj.email,
          phone: phone,
          message: formDataObj.message,
          lead_source: 'Website - Property Help Request',
          phone_verified: true,
          submitted_at: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Webhook error:', error);
    }
  };

  // Land List form SMS functions
  const sendLandListOTP = async (formDataObj) => {
    setLandListIsLoading(true);
    setLandListOtpError('');
    setSavedLandListFormData(formDataObj);

    const e164 = '+1' + landListFormPhone.replace(/\D/g, '');
    setLandListE164Phone(e164);

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164 })
      });

      const data = await response.json();

      if (data.success) {
        setLandListOtpSent(true);
      } else {
        setLandListOtpError(data.error || 'Failed to send verification code');
      }
    } catch (error) {
      setLandListOtpError('Failed to send code. Please try again.');
    } finally {
      setLandListIsLoading(false);
    }
  };

  const verifyLandListOTP = async () => {
    setLandListIsLoading(true);
    setLandListOtpError('');

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: landListE164Phone, code: landListOtpCode })
      });

      const data = await response.json();

      if (data.verified) {
        setLandListOtpVerified(true);
        await submitLandListToGHL(savedLandListFormData, landListE164Phone);
        setShowLandListModal(false);
        setShowLandListThankYou(true);

        // Reset form
        setTimeout(() => {
          setLandListOtpSent(false);
          setLandListOtpCode('');
          setLandListOtpVerified(false);
          setLandListFormPhone('');
          setSavedLandListFormData(null);
        }, 100);

        // Facebook Pixel event
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', 'Lead', {
            content_name: 'Land List Signup',
            content_category: 'Newsletter'
          });
        }
      } else {
        setLandListOtpError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setLandListOtpError('Verification failed. Please try again.');
    } finally {
      setLandListIsLoading(false);
    }
  };

  const submitLandListToGHL = async (formDataObj, phone) => {
    try {
      await fetch('https://services.leadconnectorhq.com/hooks/wLaNbf44RqmPNhV1IEev/webhook-trigger/d3e7ef0e-d618-4ce3-8eec-996d3ca52c5c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formDataObj.name,
          email: formDataObj.email,
          phone: phone,
          lead_source: 'Website - Land List Signup',
          phone_verified: true,
          submitted_at: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Webhook error:', error);
    }
  };

  // Initialize bulk map when Map View is selected
  useEffect(() => {
    if (viewMode !== 'map' || typeof window === 'undefined') return;
    if (mapInstanceRef.current) return; // Already initialized

    setMapLoaded(false); // Reset loading state

    // Check if Leaflet is already loaded
    if (window.L) {
      initializeBulkMap();
      return;
    }

    // Load Leaflet CSS if not already loaded
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS if not already loaded
    if (!document.querySelector('script[src*="leaflet.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        // Small delay to ensure CSS is fully loaded
        setTimeout(initializeBulkMap, 100);
      };
      document.head.appendChild(script);
    } else {
      setTimeout(initializeBulkMap, 100);
    }

    function initializeBulkMap() {
      const L = window.L;
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      // Get all properties with coordinates
      const propertiesWithCoords = sortedProperties.filter(
        p => p.propertyDetails?.location?.coordinates
      );

      if (propertiesWithCoords.length === 0) return;

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        scrollWheelZoom: false, // Disable scroll zoom to prevent page scroll conflicts
        zoomControl: true,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true
      }).setView([37.5, -95], 5); // Center of US

      mapInstanceRef.current = map;

      // Enable scroll wheel zoom only when map is focused
      map.on('focus', () => map.scrollWheelZoom.enable());
      map.on('blur', () => map.scrollWheelZoom.disable());

      // Add message to click map to enable scroll zoom
      const scrollHint = L.control({ position: 'topleft' });
      scrollHint.onAdd = function() {
        const div = L.DomUtil.create('div', 'scroll-zoom-hint');
        div.innerHTML = `
          <div style="
            background: rgba(47, 79, 51, 0.9);
            color: #F5EFD9;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-family: Georgia, serif;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            margin: 10px;
          ">
            Click map to enable scroll zoom
          </div>
        `;
        return div;
      };
      scrollHint.addTo(map);

      // Remove hint after first click
      map.once('click', () => {
        map.scrollWheelZoom.enable();
        scrollHint.remove();
      });

      // Esri satellite imagery
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: false,
        maxZoom: 20
      }).addTo(map);

      // Custom attribution - no Leaflet logo or flags
      map.attributionControl.setPrefix('');
      map.attributionControl.addAttribution('Property locations displayed for reference only');

      // Add markers and boundaries for each property
      const allBounds = [];

      propertiesWithCoords.forEach(property => {
        const coords = property.propertyDetails.location.coordinates;
        const latLng = [coords.lat, coords.lng];
        allBounds.push(latLng);

        // Create custom cyan marker
        const marker = L.marker(latLng, {
          icon: L.divIcon({
            html: `
              <div style="position: relative;">
                <div style="
                  background: #00FFFF;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 0 12px rgba(0,255,255,0.9), 0 2px 8px rgba(0,0,0,0.4);
                  cursor: pointer;
                "></div>
                <div style="
                  position: absolute;
                  top: 24px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: rgba(47, 79, 51, 0.95);
                  color: #F5EFD9;
                  padding: 4px 8px;
                  border-radius: 4px;
                  white-space: nowrap;
                  font-size: 11px;
                  font-weight: 600;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  pointer-events: none;
                  font-family: Georgia, serif;
                ">${property.title}</div>
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            className: 'custom-property-marker'
          })
        }).addTo(map);

        // Create popup content
        const popupContent = `
          <div style="font-family: Georgia, serif; min-width: 200px;">
            <h3 style="color: #2F4F33; font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">${property.title}</h3>
            <p style="color: #7D6B58; font-size: 13px; margin: 0 0 8px 0;">${property.location}</p>
            <p style="color: #3A4045; font-size: 12px; margin: 0 0 12px 0; line-height: 1.4;">${property.description}</p>
            <div style="margin-bottom: 12px;">
              <div style="font-size: 11px; color: #7D6B58; font-weight: 500;">Price Range</div>
              <div style="font-size: 15px; color: #2F4F33; font-weight: bold;">${property.priceRange}</div>
            </div>
            <a
              href="/properties/${property.slug}"
              style="
                display: block;
                background: #2F4F33;
                color: #F5EFD9;
                text-align: center;
                padding: 8px 16px;
                text-decoration: none;
                font-weight: 600;
                font-size: 13px;
                border-radius: 4px;
                transition: background 0.3s;
              "
              onmouseover="this.style.background='#1a2e1c'"
              onmouseout="this.style.background='#2F4F33'"
            >View Details</a>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 280,
          className: 'custom-property-popup'
        });

        // Draw boundary if available
        if (property.boundary && Array.isArray(property.boundary)) {
          const boundaryStyle = {
            color: '#00FFFF',
            weight: 3,
            opacity: 0.9,
            fillColor: '#00FFFF',
            fillOpacity: 0.15
          };

          const isMultiPolygon = Array.isArray(property.boundary[0][0]);

          if (isMultiPolygon) {
            // Multiple parcels
            property.boundary.forEach(polygonCoords => {
              L.polygon(polygonCoords, boundaryStyle).addTo(map);
              allBounds.push(...polygonCoords);
            });
          } else {
            // Single parcel
            L.polygon(property.boundary, boundaryStyle).addTo(map);
            allBounds.push(...property.boundary);
          }
        }
      });

      // Fit map to show all properties
      if (allBounds.length > 0) {
        map.fitBounds(L.latLngBounds(allBounds), {
          padding: [50, 50],
          maxZoom: 14
        });
      }

      // Invalidate size to ensure proper rendering
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      setMapLoaded(true);
    }

    return () => {
      // Cleanup on unmount or view change
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapLoaded(false);
      }
    };
  }, [viewMode, sortedProperties]);

  return (
    <>
      {/* Loading Screen */}
      {loadingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2F4F33]">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl text-[#F5EFD9] font-serif font-bold mb-4">
              {loadingProperty.title}
            </h1>
            <div className="mb-6">
              <div className="inline-flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#F5EFD9] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#F5EFD9] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-[#F5EFD9] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
            <p className="text-xl text-[#F5EFD9] font-serif italic">
              Loading a place to call home
            </p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col min-h-screen font-serif bg-[#F5EFD9]">
      {/* Navigation */}
      <nav className="bg-[#F5EFD9] py-4 border-b border-[#D2C6B2] sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
              <a href="/properties" className="text-[#2F4F33] text-lg font-medium border-b-2 border-[#2F4F33] transition-colors duration-200">Properties</a>
              <a href="/development" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Development</a>
              <a href="/sell-your-land" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Sell Us Land</a>
              <a href="/community" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Community</a>
            </div>

            {/* Mobile Hamburger Button */}
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

      {/* Page Header */}
      <div className="bg-[#D2C6B2] pt-16 pb-12 border-b border-[#F5EFD9] relative overflow-hidden">
        {/* Map background with organic fade-in from bottom */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute bottom-0 left-0 w-full h-full opacity-30"
            style={{
              backgroundImage: `url('/images/Map Header graphic.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center bottom',
              backgroundRepeat: 'no-repeat',
              mask: `linear-gradient(to top, 
                black 0%, 
                black 20%, 
                rgba(0,0,0,0.8) 35%, 
                rgba(0,0,0,0.4) 50%, 
                rgba(0,0,0,0.2) 65%, 
                transparent 75%, 
                transparent 100%)`,
              WebkitMask: `linear-gradient(to top, 
                black 0%, 
                black 20%, 
                rgba(0,0,0,0.8) 35%, 
                rgba(0,0,0,0.4) 50%, 
                rgba(0,0,0,0.2) 65%, 
                transparent 75%, 
                transparent 100%)`
            }}
          ></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0">
            <div>
              <h1 className="text-4xl text-[#2F4F33] font-light mb-2">Available Properties</h1>
              <p className="text-[#3A4045]">Browse our current developments and let us know which feels the most like home</p>
            </div>
            
            {/* Email Signup - Hidden on mobile */}
            <div className="hidden md:block bg-[#D2C6B2] border-2 border-[#2F4F33] p-4 rounded-lg max-w-md">
              <h3 className="text-lg text-[#2F4F33] font-medium mb-2">Join Our Land List</h3>
              <p className="text-xs text-[#3A4045] mb-3">Be first to know about new properties</p>
              <button
                onClick={() => setShowLandListModal(true)}
                className="w-full bg-[#2F4F33] text-[#F5EFD9] py-2 px-4 hover:bg-[#1a2e1c] transition duration-300 font-medium text-sm"
              >
                Join Our Land List
              </button>
            </div>
          </div>
        </div>
        
      </div>


      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Mobile Toggle */}
          <div className="lg:block w-full lg:w-80 flex-shrink-0">
            {/* Mobile Filter Toggle */}
            <button
              className="lg:hidden w-full mb-4 p-3 bg-[#2F4F33] text-[#F5EFD9] rounded-lg flex items-center justify-center gap-2"
              onClick={() => setFilters(prev => ({ ...prev, showMobileFilters: !prev.showMobileFilters }))}
            >
              <span>Filter & Sort</span>
              <span className={`transform transition-transform ${
                filters.showMobileFilters ? 'rotate-180' : ''
              }`}>▼</span>
            </button>
            <div className="lg:sticky lg:top-32 lg:self-start">
            <div className={`bg-white p-6 rounded-lg shadow-sm border border-[#D2C6B2] ${
              filters.showMobileFilters ? 'block' : 'hidden lg:block'
            }`}>
              <h2 className="text-2xl text-[#2F4F33] font-medium mb-6">Refine Your Search</h2>
              
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#2F4F33] mb-2">
                  Search by keyword
                </label>
                <input
                  type="text"
                  placeholder="Location, property name..."
                  className="w-full px-4 py-2 border border-[#D2C6B2] rounded-md focus:ring-[#7D6B58] focus:border-[#2F4F33]"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>

              {/* Acres Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#2F4F33] mb-2">
                  Acres
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-1/2 px-3 py-2 border border-[#D2C6B2] rounded-md focus:ring-[#7D6B58] focus:border-[#2F4F33]"
                    value={filters.minAcres}
                    onChange={(e) => setFilters({...filters, minAcres: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-1/2 px-3 py-2 border border-[#D2C6B2] rounded-md focus:ring-[#7D6B58] focus:border-[#2F4F33]"
                    value={filters.maxAcres}
                    onChange={(e) => setFilters({...filters, maxAcres: e.target.value})}
                  />
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#2F4F33] mb-2">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-1/2 px-3 py-2 border border-[#D2C6B2] rounded-md focus:ring-[#7D6B58] focus:border-[#2F4F33]"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-1/2 px-3 py-2 border border-[#D2C6B2] rounded-md focus:ring-[#7D6B58] focus:border-[#2F4F33]"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  />
                </div>
              </div>

              {/* State Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#2F4F33] mb-2">
                  State
                </label>
                <select
                  className="w-full px-4 py-2 border border-[#D2C6B2] rounded-md focus:ring-[#7D6B58] focus:border-[#2F4F33]"
                  value={filters.state}
                  onChange={(e) => setFilters({...filters, state: e.target.value})}
                >
                  <option value="all">All States</option>
                  <option value="Texas">Texas</option>
                  <option value="Mississippi">Mississippi</option>
                  <option value="Tennessee">Tennessee</option>
                  <option value="Missouri">Missouri</option>
                </select>
              </div>

              {/* County Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#2F4F33] mb-2">
                  County
                </label>
                <select
                  className="w-full px-4 py-2 border border-[#D2C6B2] rounded-md focus:ring-[#7D6B58] focus:border-[#2F4F33]"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                >
                  <option value="all">All Counties</option>
                  <option value="Washington County">Washington County, TX</option>
                  <option value="Burleson County">Burleson County, TX</option>
                  <option value="Hill County">Hill County, TX</option>
                  <option value="Ector County">Ector County, TX</option>
                  <option value="Bell County">Bell County, TX</option>
                  <option value="Panola County">Panola County, MS</option>
                  <option value="Davidson County">Davidson County, TN</option>
                  <option value="Cass County">Cass County, MO</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => setFilters({
                  search: '',
                  minAcres: '',
                  maxAcres: '',
                  minPrice: '',
                  maxPrice: '',
                  state: 'all',
                  location: 'all',
                  sortBy: 'featured',
                  showMobileFilters: false
                })}
                className="w-full py-2 px-4 bg-[#F5EFD9] text-[#2F4F33] border border-[#2F4F33] hover:bg-[#2F4F33] hover:text-[#F5EFD9] transition duration-300"
              >
                Clear All Filters
              </button>
            </div>

            {/* Contact CTA - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:block bg-[#2F4F33] text-[#F5EFD9] p-6 rounded-lg mt-6">
              <h3 className="text-xl font-medium mb-3">Need Some Help Finding the Right Property?</h3>
              <p className="text-sm mb-4">Talk to our dedicated team.</p>
              <button
                onClick={() => setShowHelpModal(true)}
                className="w-full py-2 px-4 bg-[#F5EFD9] text-[#2F4F33] hover:bg-[#D2C6B2] transition duration-300"
              >
                Contact Us
              </button>
            </div>
            </div>
          </div>

          {/* Properties Grid/Map */}
          <div className="flex-1">
            {/* Sort and View Controls */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="text-[#7D6B58]">{sortedProperties.length} properties found</span>
                <select
                  className="px-4 py-2 border border-[#D2C6B2] rounded-md focus:ring-[#7D6B58] focus:border-[#2F4F33]"
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                >
                  <option value="featured">Featured First</option>
                  <option value="priceLow">Price: Low to High</option>
                  <option value="priceHigh">Price: High to Low</option>
                  <option value="acresLow">Acres: Low to High</option>
                  <option value="acresHigh">Acres: High to Low</option>
                </select>
              </div>
              <div className="flex gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 sm:px-4 py-2 text-sm sm:text-base ${viewMode === 'grid' ? 'bg-[#2F4F33] text-[#F5EFD9]' : 'bg-[#F5EFD9] text-[#2F4F33] border border-[#2F4F33]'}`}
                >
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 sm:px-4 py-2 text-sm sm:text-base ${viewMode === 'map' ? 'bg-[#2F4F33] text-[#F5EFD9]' : 'bg-[#F5EFD9] text-[#2F4F33] border border-[#2F4F33]'}`}
                >
                  Map View
                </button>
              </div>
            </div>

            {/* Properties Display */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedProperties.map((property) => {
                  const currentIndex = currentImageIndex[property.id] || 0;
                  const nextImage = () => {
                    setHasNavigated(prev => ({ ...prev, [property.id]: true }));
                    setCurrentImageIndex(prev => ({
                      ...prev,
                      [property.id]: (currentIndex + 1) % property.images.length
                    }));
                  };
                  const prevImage = () => {
                    setHasNavigated(prev => ({ ...prev, [property.id]: true }));
                    setCurrentImageIndex(prev => ({
                      ...prev,
                      [property.id]: currentIndex === 0 ? property.images.length - 1 : currentIndex - 1
                    }));
                  };

                  return (
                    <div key={property.id} className="bg-[#F8F6F0] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group relative transform hover:-translate-y-1">
                      {/* Keep these corner border elements */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-[#2F4F33] opacity-20 group-hover:opacity-40 transition-opacity z-10"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-[#2F4F33] opacity-20 group-hover:opacity-40 transition-opacity z-10"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-[#2F4F33] opacity-20 group-hover:opacity-40 transition-opacity z-10"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-[#2F4F33] opacity-20 group-hover:opacity-40 transition-opacity z-10"></div>
                      <div className="relative group overflow-hidden">
                        {property.images[currentIndex].endsWith('.mp4') ? (
                          <div className="relative">
                            <video 
                              src={property.images[currentIndex]}
                              poster="/images/Oak Hill/Oak Hill Reserve/IMG_8202.jpg"
                              className="w-full h-64 object-cover object-center"
                              controls
                              muted
                              loop
                              playsInline
                              webkit-playsinline="true"
                              controlsList="nodownload nofullscreen noremoteplaybook"
                              disablePictureInPicture
                              onPlay={() => {
                                setHasNavigated(prev => ({ ...prev, [property.id]: true }));
                              }}
                            />
                            {/* GREEN OVERLAY ON VIDEO BEFORE PLAYING */}
                            {currentIndex === 0 && !hasNavigated[property.id] && (
                              <div 
                                className="absolute inset-0 flex flex-col justify-center items-center text-center z-10 pointer-events-none"
                                style={{ 
                                  backgroundColor: 'rgba(47, 79, 51, 0.9)'
                                }}
                              >
                                {property.slug === 'the-ranches' ? (
                                  <div className="text-center">
                                    <p
                                      className="text-xl font-serif text-white italic mb-6 px-4 tracking-wide"
                                      style={{
                                        textShadow: '4px 4px 8px rgba(0,0,0,1)',
                                        fontFamily: 'Georgia, serif'
                                      }}
                                    >
                                      The Ranches
                                    </p>
                                    <div className="w-32 h-1 bg-white shadow-xl mx-auto mb-6"></div>
                                    <p
                                      className="text-3xl font-serif text-white font-light tracking-widest px-4"
                                      style={{
                                        textShadow: '4px 4px 8px rgba(0,0,0,1)',
                                        fontFamily: 'Georgia, serif',
                                        letterSpacing: '0.3em'
                                      }}
                                    >
                                      WHITNEY
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    <h3
                                      className="text-4xl font-serif text-white font-bold mb-3 px-4"
                                      style={{
                                        textShadow: '4px 4px 8px rgba(0,0,0,1)'
                                      }}
                                    >
                                      {property.title}
                                    </h3>
                                    <div className="w-32 h-1 bg-white shadow-xl"></div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              src={property.images[currentIndex]}
                              alt={`${property.title} - Image ${currentIndex + 1}`}
                              className="w-full h-64 object-cover object-center"
                              style={{ imageRendering: 'crisp-edges' }}
                            />
                            {/* STRONG GREEN OVERLAY ON FIRST IMAGE ONLY - BEFORE NAVIGATION */}
                            {currentIndex === 0 && !hasNavigated[property.id] && (
                              <div 
                                className="absolute inset-0 flex flex-col justify-center items-center text-center z-10"
                                style={{ 
                                  backgroundColor: 'rgba(47, 79, 51, 0.9)'
                                }}
                              >
                                {property.slug === 'the-ranches' ? (
                                  <div className="text-center">
                                    <p
                                      className="text-xl font-serif text-white italic mb-6 px-4 tracking-wide"
                                      style={{
                                        textShadow: '4px 4px 8px rgba(0,0,0,1)',
                                        fontFamily: 'Georgia, serif'
                                      }}
                                    >
                                      The Ranches
                                    </p>
                                    <div className="w-32 h-1 bg-white shadow-xl mx-auto mb-6"></div>
                                    <p
                                      className="text-3xl font-serif text-white font-light tracking-widest px-4"
                                      style={{
                                        textShadow: '4px 4px 8px rgba(0,0,0,1)',
                                        fontFamily: 'Georgia, serif',
                                        letterSpacing: '0.3em'
                                      }}
                                    >
                                      WHITNEY
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    <h3
                                      className="text-4xl font-serif text-white font-bold mb-3 px-4"
                                      style={{
                                        textShadow: '4px 4px 8px rgba(0,0,0,1)'
                                      }}
                                    >
                                      {property.title}
                                    </h3>
                                    <div className="w-32 h-1 bg-white shadow-xl"></div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Navigation Arrows - Always visible - ABOVE OVERLAY */}
                        {property.images.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-[#F5EFD9] bg-opacity-80 text-[#2F4F33] p-3 rounded-full hover:bg-opacity-100 transition-all duration-300 text-xl font-bold shadow-lg z-20"
                            >
                              &#8249;
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#F5EFD9] bg-opacity-80 text-[#2F4F33] p-3 rounded-full hover:bg-opacity-100 transition-all duration-300 text-xl font-bold shadow-lg z-20"
                            >
                              &#8250;
                            </button>
                          </>
                        )}

                        {/* Image Counter - ABOVE OVERLAY */}
                        {property.images.length > 1 && (
                          <div className="absolute top-4 right-4 bg-[#F5EFD9] bg-opacity-80 text-[#2F4F33] px-3 py-1 text-sm rounded-full font-medium shadow-lg z-20">
                            {currentIndex + 1} / {property.images.length}
                          </div>
                        )}

                        {/* Featured/Coming Soon Badge - ABOVE OVERLAY */}
                        {property.status === 'Sold Out' ? (
                          <span className="absolute top-4 left-4 bg-red-600 text-white px-4 py-1.5 text-sm font-bold rounded-full shadow-lg z-20">
                            SOLD OUT
                          </span>
                        ) : property.status === 'Engineering & Planning' ? (
                          <span className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-1.5 text-sm font-bold rounded-full shadow-lg z-20">
                            In Engineering Phase
                          </span>
                        ) : property.status === 'coming-soon' ? (
                          <span className="absolute top-4 left-4 bg-[#7D6B58] text-white px-3 py-1 text-sm font-medium rounded-full shadow-lg z-20">
                            COMING SOON
                          </span>
                        ) : property.featured ? (
                          <span className="absolute top-4 left-4 bg-[#2F4F33] text-white px-4 py-1.5 text-sm font-bold rounded-full shadow-lg z-20">
                            {property.homeTypes?.toLowerCase().includes('ranchette') || property.lots?.toLowerCase().includes('tract')
                              ? 'Tracts Available'
                              : 'Lots Available'}
                          </span>
                        ) : null}

                        {/* Image Dots - ABOVE OVERLAY */}
                        {property.images.length > 1 && (
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                            {property.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(prev => ({ ...prev, [property.id]: index }))}
                                className={`w-2 h-2 rounded-full ${
                                  index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                          <div className="p-6">
                            <h3 className="text-xl sm:text-2xl text-[#2F4F33] font-medium mb-2 break-words leading-tight text-wrap">{property.title}</h3>
                            <p className="text-[#7D6B58] mb-4">{property.location}</p>
                            
                            {property.type === 'community' || property.type === 'subdivision' ? (
                              /* Community/Subdivision Details */
                              <div className="space-y-3 mb-4">
                                <div className="grid grid-cols-1 gap-2">
                                  <div>
                                    <p className="text-sm text-[#7D6B58] font-medium">
                                      {property.homeTypes?.toLowerCase().includes('ranchette') || property.lots?.toLowerCase().includes('tract')
                                        ? 'Tract Sizes'
                                        : 'Lot Sizes'}
                                    </p>
                                    <p className="text-lg text-[#2F4F33] font-bold">{property.lots}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-[#7D6B58] font-medium">Home Types</p>
                                    <p className="text-lg text-[#2F4F33] font-bold">{property.homeTypes}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-[#7D6B58] font-medium">Price Range</p>
                                    <p className="text-2xl text-[#2F4F33] font-bold">{property.priceRange}</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Regular Property Details */
                              <div className="flex justify-between items-center mb-4">
                                <div>
                                  <p className="text-3xl text-[#2F4F33] font-light">${property.price.toLocaleString()}</p>
                                  <p className="text-sm text-[#7D6B58]">${property.pricePerAcre.toLocaleString()}/acre</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl text-[#2F4F33]">{property.acres} acres</p>
                                  <p className="text-sm text-[#7D6B58]">{property.county}</p>
                                </div>
                              </div>
                            )}

                      <p className="text-[#2F4F33] mb-4 line-clamp-2">{property.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {property.features.slice(0, 3).map((feature, index) => (
                          <span key={index} className="bg-[#F5EFD9] text-[#2F4F33] px-3 py-1 text-sm">
                            {feature}
                          </span>
                        ))}
                        {property.features.length > 3 && (
                          <span className="text-[#7D6B58] text-sm py-1">
                            +{property.features.length - 3} more
                          </span>
                        )}
                      </div>

                      {property.status === 'coming-soon' ? (
                        <div className="block w-full py-3 bg-[#7D6B58] text-[#F5EFD9] text-center cursor-not-allowed opacity-80">
                          COMING SOON
                        </div>
                      ) : (
                        <a
                          href={`/properties/${property.slug}`}
                          className="block w-full py-3 bg-[#2F4F33] text-[#F5EFD9] hover:bg-[#1a2e1c] transition duration-300 text-center"
                          onClick={(e) => {
                            e.preventDefault();
                            setLoadingProperty(property);
                            setTimeout(() => {
                              window.location.href = `/properties/${property.slug}`;
                            }, 3000);
                          }}
                        >
                          View Details
                        </a>
                      )}
                    </div>
                  </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-[#D2C6B2] sticky top-32">
                <div className="bg-[#2F4F33] text-[#F5EFD9] p-4">
                  <h2 className="text-xl font-serif font-bold">All Properties Map View</h2>
                  <p className="text-sm text-[#D2C6B2] mt-1">
                    Satellite view showing all {sortedProperties.length} properties with boundaries
                  </p>
                </div>
                <div className="w-full relative" style={{ height: 'calc(100vh - 280px)', minHeight: '500px', maxHeight: '700px' }}>
                  {!mapLoaded && (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#F5EFD9] z-10">
                      <div className="text-center">
                        <div className="inline-flex items-center space-x-2 mb-4">
                          <div className="w-3 h-3 bg-[#00FFFF] rounded-full animate-bounce"></div>
                          <div className="w-3 h-3 bg-[#00FFFF] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-3 h-3 bg-[#00FFFF] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <p className="text-[#2F4F33] font-serif text-lg">Loading satellite map...</p>
                      </div>
                    </div>
                  )}
                  <div
                    ref={mapContainerRef}
                    id="bulk-properties-map"
                    className="w-full h-full"
                    style={{
                      visibility: mapLoaded ? 'visible' : 'hidden',
                      opacity: mapLoaded ? 1 : 0,
                      transition: 'opacity 0.3s ease-in'
                    }}
                  />
                </div>
                <div className="bg-[#F5EFD9] p-4 border-t border-[#D2C6B2]">
                  <div className="flex items-center gap-4 text-sm text-[#2F4F33]">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#00FFFF] border-2 border-white shadow-lg"></div>
                      <span>Property Location</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-1 bg-[#00FFFF]"></div>
                      <span>Property Boundary</span>
                    </div>
                    <div className="ml-auto text-[#7D6B58] italic">
                      Click markers for details
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Contact CTA - Mobile only, shown after properties */}
        <div className="lg:hidden bg-[#2F4F33] text-[#F5EFD9] p-6 rounded-lg mt-8 mx-4">
          <h3 className="text-xl font-medium mb-3">Need Some Help Finding the Right Property?</h3>
          <p className="text-sm mb-4">Talk to our dedicated team.</p>
          <button
            onClick={() => setShowHelpModal(true)}
            className="w-full py-2 px-4 bg-[#F5EFD9] text-[#2F4F33] hover:bg-[#D2C6B2] transition duration-300"
          >
            Contact Us
          </button>
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
                  onClick={() => setShowHelpModal(true)}
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

    {/* Help Modal */}
    {showHelpModal && (
      <div className="fixed inset-0 bg-[#2F4F33] bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 relative">
          <button
            onClick={() => {
              setShowHelpModal(false);
              setHelpOtpSent(false);
              setHelpOtpCode('');
              setHelpOtpError('');
              setHelpFormPhone('');
            }}
            className="absolute top-4 right-4 text-[#7D6B58] hover:text-[#2F4F33] text-2xl"
          >
            ×
          </button>

          <h3 className="text-lg font-serif font-bold text-[#2F4F33] mb-6 leading-tight">
            Need Help Finding the Right Property?
          </h3>

          {!helpOtpSent ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const formDataObj = {
                name: formData.get('name'),
                email: formData.get('email'),
                message: formData.get('message')
              };
              sendHelpOTP(formDataObj);
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
                    value={helpFormPhone}
                    onChange={(e) => setHelpFormPhone(formatPhoneNumber(e.target.value))}
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

                {helpOtpError && (
                  <p className="text-red-600 text-sm">{helpOtpError}</p>
                )}

                <button
                  type="submit"
                  disabled={helpIsLoading}
                  className="w-full py-3 bg-[#2F4F33] text-[#F5EFD9] hover:bg-[#1a2e1c] transition duration-300 font-medium disabled:opacity-50"
                >
                  {helpIsLoading ? 'Sending...' : 'Contact Us'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <p className="text-[#3A4045]">
                We sent a verification code to {helpFormPhone}. Please enter it below:
              </p>

              <div>
                <label className="block text-sm font-medium text-[#2F4F33] mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={helpOtpCode}
                  onChange={(e) => setHelpOtpCode(e.target.value)}
                  maxLength="6"
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-2 border border-[#D2C6B2] rounded-md focus:ring-2 focus:ring-[#2F4F33] focus:border-[#2F4F33] text-center text-2xl tracking-widest"
                />
              </div>

              {helpOtpError && (
                <p className="text-red-600 text-sm">{helpOtpError}</p>
              )}

              <button
                onClick={verifyHelpOTP}
                disabled={helpIsLoading || helpOtpCode.length !== 6}
                className="w-full py-3 bg-[#2F4F33] text-[#F5EFD9] hover:bg-[#1a2e1c] transition duration-300 font-medium disabled:opacity-50"
              >
                {helpIsLoading ? 'Verifying...' : 'Verify & Submit'}
              </button>

              <button
                onClick={() => {
                  setHelpOtpSent(false);
                  setHelpOtpCode('');
                  setHelpOtpError('');
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

    {/* Help Thank You Modal */}
    {showHelpThankYou && (
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
              We received your request. One of our team members will reach out to you shortly to help you find the perfect property!
            </p>
            <button
              onClick={() => setShowHelpThankYou(false)}
              className="w-full py-3 bg-[#2F4F33] text-[#F5EFD9] hover:bg-[#1a2e1c] transition duration-300 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Land List Modal */}
    {showLandListModal && (
      <div className="fixed inset-0 bg-[#2F4F33] bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 relative">
          <button
            onClick={() => {
              setShowLandListModal(false);
              setLandListOtpSent(false);
              setLandListOtpCode('');
              setLandListOtpError('');
              setLandListFormPhone('');
            }}
            className="absolute top-4 right-4 text-[#7D6B58] hover:text-[#2F4F33] text-2xl"
          >
            ×
          </button>

          <h3 className="text-2xl font-serif font-bold text-[#2F4F33] mb-2">
            Join Our Land List
          </h3>
          <p className="text-sm text-[#3A4045] mb-6">Be the first to know about new properties</p>

          {!landListOtpSent ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const formDataObj = {
                name: formData.get('name'),
                email: formData.get('email')
              };
              sendLandListOTP(formDataObj);
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
                    value={landListFormPhone}
                    onChange={(e) => setLandListFormPhone(formatPhoneNumber(e.target.value))}
                    placeholder="(555) 123-4567"
                    required
                    className="w-full px-4 py-2 border border-[#D2C6B2] rounded-md focus:ring-2 focus:ring-[#2F4F33] focus:border-[#2F4F33]"
                  />
                </div>

                {landListOtpError && (
                  <p className="text-red-600 text-sm">{landListOtpError}</p>
                )}

                <button
                  type="submit"
                  disabled={landListIsLoading}
                  className="w-full py-3 bg-[#2F4F33] text-[#F5EFD9] hover:bg-[#1a2e1c] transition duration-300 font-medium disabled:opacity-50"
                >
                  {landListIsLoading ? 'Sending...' : 'Join Land List'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <p className="text-[#3A4045]">
                We sent a verification code to {landListFormPhone}. Please enter it below:
              </p>

              <div>
                <label className="block text-sm font-medium text-[#2F4F33] mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={landListOtpCode}
                  onChange={(e) => setLandListOtpCode(e.target.value)}
                  maxLength="6"
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-2 border border-[#D2C6B2] rounded-md focus:ring-2 focus:ring-[#2F4F33] focus:border-[#2F4F33] text-center text-2xl tracking-widest"
                />
              </div>

              {landListOtpError && (
                <p className="text-red-600 text-sm">{landListOtpError}</p>
              )}

              <button
                onClick={verifyLandListOTP}
                disabled={landListIsLoading || landListOtpCode.length !== 6}
                className="w-full py-3 bg-[#2F4F33] text-[#F5EFD9] hover:bg-[#1a2e1c] transition duration-300 font-medium disabled:opacity-50"
              >
                {landListIsLoading ? 'Verifying...' : 'Verify & Join'}
              </button>

              <button
                onClick={() => {
                  setLandListOtpSent(false);
                  setLandListOtpCode('');
                  setLandListOtpError('');
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

    {/* Land List Thank You Modal */}
    {showLandListThankYou && (
      <div className="fixed inset-0 bg-[#2F4F33] bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#2F4F33] rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#F5EFD9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#2F4F33] mb-4">
              Welcome!
            </h3>
            <p className="text-[#3A4045] mb-6 leading-relaxed">
              Get ready for some exciting updates about new properties and opportunities coming your way!
            </p>
            <button
              onClick={() => setShowLandListThankYou(false)}
              className="w-full py-3 bg-[#2F4F33] text-[#F5EFD9] hover:bg-[#1a2e1c] transition duration-300 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}