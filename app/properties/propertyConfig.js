// Property Configuration Template System
// This file defines templates for different property types to prevent cross-contamination

export const propertyTypes = {
  COMMUNITY: 'community',
  RAW_LAND: 'raw_land',
  SUBDIVISION: 'subdivision'
};

// Template for contact forms based on property type
export const getContactFormText = (property) => {
  switch(property.type) {
    case propertyTypes.COMMUNITY:
      return {
        heading: `Interested in ${property.title}?`,
        subheading: `Connect with our sales team to learn more about homes in ${property.location}. ${property.status === 'COMING SOON' ? 'Be first to know when reservations open.' : 'Schedule a visit today.'}`,
        buttonText: "Learn More About This Community",
        timelineText: "When are you looking to move?"
      };
    
    case propertyTypes.RAW_LAND:
      return {
        heading: `Interested in This Land?`,
        subheading: `Talk to our land specialist who knows every acre of this ${property.acres || 'property'}. We'll help you understand the potential and possibilities.`,
        buttonText: "Inquire About This Land",
        timelineText: "How soon are you looking to purchase?"
      };
    
    case propertyTypes.SUBDIVISION:
      return {
        heading: `Interested in ${property.title}?`,
        subheading: `Explore available lots in ${property.location}. Our team will help you find the perfect homesite for your custom home.`,
        buttonText: "View Available Lots",
        timelineText: "When do you plan to build?"
      };
    
    default:
      return {
        heading: "Interested in This Property?",
        subheading: "Get in touch with our team to learn more.",
        buttonText: "Contact Us",
        timelineText: "How can we help you?"
      };
  }
};

// Template for property descriptions based on type
export const getPropertyDescription = (property) => {
  // Always use the property's own description if available
  if (property.detailedDescription) {
    return property.detailedDescription;
  }
  
  if (property.description) {
    return property.description;
  }
  
  // Fallback generic descriptions by type
  switch(property.type) {
    case propertyTypes.COMMUNITY:
      return `${property.title} offers quality homes in ${property.location}. Contact us to learn more about this community.`;
    
    case propertyTypes.RAW_LAND:
      return `${property.acres} acres of prime land in ${property.location}. Explore the possibilities for development or investment.`;
    
    case propertyTypes.SUBDIVISION:
      return `${property.title} features ${property.lots} in ${property.location}. Build your custom home in this premier development.`;
    
    default:
      return `Learn more about this property opportunity in ${property.location}.`;
  }
};

// Template for section headers
export const getSectionHeaders = (property) => {
  switch(property.type) {
    case propertyTypes.COMMUNITY:
      return {
        mainSection: `${property.title}: Community Overview`,
        featuresSection: "Community Features",
        locationSection: "Neighborhood Benefits",
        ctaSection: "Reserve Your Home"
      };
    
    case propertyTypes.RAW_LAND:
      return {
        mainSection: `${property.title}: Land Details`,
        featuresSection: "Land Features",
        locationSection: "Location Benefits",
        ctaSection: "Make an Offer"
      };
    
    case propertyTypes.SUBDIVISION:
      return {
        mainSection: `${property.title}: Available Lots`,
        featuresSection: "Development Features",
        locationSection: "Location Advantages",
        ctaSection: "Choose Your Lot"
      };
    
    default:
      return {
        mainSection: `${property.title}: Property Details`,
        featuresSection: "Property Features",
        locationSection: "Location",
        ctaSection: "Get Started"
      };
  }
};

// Ensure property data integrity - NO CROSS-CONTAMINATION
export const sanitizePropertyData = (property) => {
  // Create a deep copy to prevent mutations
  const clean = JSON.parse(JSON.stringify(property));
  
  // Ensure all fields come from THIS property only
  return {
    id: clean.id,
    title: clean.title,
    location: clean.location,
    description: clean.description,
    detailedDescription: clean.detailedDescription,
    images: clean.images || [],
    features: clean.features || [],
    type: clean.type || propertyTypes.RAW_LAND,
    status: clean.status || 'AVAILABLE',
    price: clean.price,
    priceRange: clean.priceRange,
    pricePerAcre: clean.pricePerAcre,
    acres: clean.acres,
    lots: clean.lots,
    homeTypes: clean.homeTypes,
    address: clean.address,
    county: clean.county,
    targetBuyer: clean.targetBuyer,
    communityHighlights: clean.communityHighlights || [],
    homeFeatures: clean.homeFeatures || [],
    lotTable: clean.lotTable || [],
    mapEmbed: clean.mapEmbed,
    specifications: clean.specifications
  };
};