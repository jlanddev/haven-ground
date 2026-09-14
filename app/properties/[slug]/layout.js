import { supabaseCms } from '../../../lib/supabase-cms';
import { properties as staticProperties } from '../propertiesData';

// Listings live in the CMS and can be added at any time, so a slug that did not
// exist at build time must still render (this was `false`, which 404'd every
// newly-added listing until a code redeploy). `true` renders unknown slugs on
// demand; the client page then loads the listing from Supabase.
export const dynamicParams = true;

// Pre-render the currently published listings for SEO/speed, straight from the
// CMS (falls back to the static file if the CMS is briefly unreachable at build).
export async function generateStaticParams() {
  try {
    const { data } = await supabaseCms.from('properties').select('slug').eq('published', true);
    if (Array.isArray(data) && data.length) return data.map((p) => ({ slug: p.slug }));
  } catch { /* fall back to static */ }
  return staticProperties.map((property) => ({ slug: property.slug }));
}

export default function PropertyLayout({ children }) {
  return children;
}
