import { createClient } from '@supabase/supabase-js';

// Dedicated Supabase client for the listings CMS (admin backend + public
// property reads). This points at the project that holds the properties table,
// listings, and the admin login. It is SEPARATE from the site's default client
// (lib/supabase.js), so the lead intake / forms are never affected by anything
// here. A distinct auth storageKey keeps the admin session from colliding with
// the site's own Supabase auth.
const CMS_URL = 'https://pfbftxsixtzphhvdekhs.supabase.co';
const CMS_KEY = 'sb_publishable_OcIQPLjKLI8YicumXVRf3g_6SUgXU82';

export const supabaseCms = createClient(CMS_URL, CMS_KEY, {
  auth: {
    storageKey: 'haven-cms-auth',
    persistSession: true,
    autoRefreshToken: true,
  },
});
