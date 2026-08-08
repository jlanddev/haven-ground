import { supabase } from './supabase';
import { properties as staticProperties } from '../app/properties/propertiesData';

// Data access for property listings. The static file (propertiesData.js) is the
// permanent fallback and the instant first paint: pages render it immediately,
// then refresh from Supabase. If the database is ever slow or unreachable, the
// static data stays on screen, so the public property pages can never hang or
// break (important: the ad funnel and the site must stay fast).

export { staticProperties };

// All published listings, ordered for the listings page. Falls back to static.
export async function fetchProperties() {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('data, sort_order')
      .eq('published', true)
      .order('sort_order', { ascending: true });
    if (error || !Array.isArray(data) || data.length === 0) return staticProperties;
    return data.map((r) => r.data).filter(Boolean);
  } catch {
    return staticProperties;
  }
}

// One published listing by slug. Falls back to the static match (or null).
export async function fetchPropertyBySlug(slug) {
  const staticMatch = staticProperties.find((p) => p.slug === slug) || null;
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('data')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();
    if (error || !data || !data.data) return staticMatch;
    return data.data;
  } catch {
    return staticMatch;
  }
}
