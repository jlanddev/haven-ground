// Session/visitor ID generation, device detection, UTM parsing, step labels

export const STEP_LABELS = {
  1: 'Relationship to Property',
  2: 'Acreage',
  3: 'Home on Property',
  4: 'Listed with Realtor',
  5: 'Inherited Property',
  6: 'Owned 4+ Years',
  7: 'Honest Statement',
  8: 'Why Selling',
  9: 'Property State',
  10: 'Property County',
  11: 'Street Address',
  12: 'Full Name',
  13: 'Names on Deed',
  14: 'Email',
  15: 'Phone Number',
  16: 'OTP Verification',
};

export function generateSessionId() {
  return 'ses_' + crypto.randomUUID();
}

export function getOrCreateVisitorId() {
  const key = 'hg_visitor_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'vis_' + crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function getDeviceType() {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    referrer: document.referrer || null,
    deviceType: getDeviceType(),
  };
}

export function parseUTMParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
    utmTerm: params.get('utm_term'),
    utmContent: params.get('utm_content'),
  };
}
