'use client';

import { useEffect } from 'react';

// Capture Google click IDs (gclid/gbraid/wbraid) on EVERY page of the site, not
// just /sell-your-land. An ad can land on the homepage (or any page) and the
// visitor then navigates to the form — so we persist the click ID in a 90-day
// first-party cookie the moment they arrive, and the form reads it on submit.
// This is what ties a lead back to the exact ad click for value-based bidding.
export default function ClickIdCapture() {
  useEffect(() => {
    try {
      const maxAge = 90 * 24 * 60 * 60;
      const params = new URLSearchParams(window.location.search);
      for (const k of ['gclid', 'gbraid', 'wbraid']) {
        const v = params.get(k);
        if (v) document.cookie = `hg_${k}=${encodeURIComponent(v)};path=/;max-age=${maxAge};SameSite=Lax`;
      }
      // Store the FULL first-touch landing URL (with its query string) so a lead
      // can always be traced back to the exact ad click, even if the gclid is
      // only in the URL and not individually parsed. Only set once (first touch).
      if (!/(?:^|; )hg_landing=/.test(document.cookie)) {
        document.cookie = `hg_landing=${encodeURIComponent(window.location.href)};path=/;max-age=${maxAge};SameSite=Lax`;
      }
    } catch { /* no-op */ }
  }, []);
  return null;
}
