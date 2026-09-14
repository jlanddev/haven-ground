import { supabaseCms as supabase } from './supabase-cms';
import { properties as staticProperties } from '../app/properties/propertiesData';

// Data access for property listings. The static file (propertiesData.js) is the
// permanent fallback and the instant first paint: pages render it immediately,
// then refresh from Supabase. If the database is ever slow or unreachable, the
// static data stays on screen, so the public property pages can never hang or
// break (important: the ad funnel and the site must stay fast).

export { staticProperties };

// PostgREST returns a transient error ("Could not find the table in the schema
// cache", or a network/5xx blip) for a few seconds when its schema cache
// reloads or the project wakes from idle. It recovers on its own, so we retry
// the read before ever falling back to the (possibly stale) static data.
function isTransient(error) {
  if (!error) return false;
  const m = (error.message || '').toLowerCase();
  return error.code === 'PGRST205'
    || m.includes('schema cache')
    || m.includes('fetch') || m.includes('network') || m.includes('timeout')
    || m.includes('502') || m.includes('503') || m.includes('520') || m.includes('econn');
}
async function readWithRetry(build, tries = 5) {
  let res;
  for (let i = 0; i < tries; i++) {
    try { res = await build(); }
    catch (e) { res = { data: null, error: e }; }
    if (!res.error || !isTransient(res.error)) return res;
    await new Promise((r) => setTimeout(r, 400 * (i + 1))); // 400,800,1200,1600ms
  }
  return res;
}

// All published listings, ordered for the listings page. Falls back to static
// only if the CMS truly can't be reached after retries.
export async function fetchProperties() {
  const { data, error } = await readWithRetry(() => supabase
    .from('properties')
    .select('data, sort_order')
    .eq('published', true)
    .order('sort_order', { ascending: true }));
  if (error || !Array.isArray(data) || data.length === 0) return staticProperties;
  return data.map((r) => r.data).filter(Boolean);
}

// One published listing by slug. Falls back to the static match (or null).
export async function fetchPropertyBySlug(slug) {
  const staticMatch = staticProperties.find((p) => p.slug === slug) || null;
  const { data, error } = await readWithRetry(() => supabase
    .from('properties')
    .select('data')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle());
  if (error || !data || !data.data) return staticMatch;
  return data.data;
}
