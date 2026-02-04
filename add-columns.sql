-- Add missing columns to leads table for Haven Ground form integration

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS form_data JSONB;

-- Add index on source for faster PPC Inflow queries
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- Enable RLS insert for anonymous users (for form submissions)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (form submissions from Haven Ground)
CREATE POLICY IF NOT EXISTS "Allow anonymous inserts" ON leads
FOR INSERT TO anon
WITH CHECK (true);

-- Allow authenticated users to read all leads
CREATE POLICY IF NOT EXISTS "Allow authenticated reads" ON leads
FOR SELECT TO authenticated
USING (true);
