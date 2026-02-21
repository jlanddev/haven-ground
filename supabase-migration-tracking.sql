-- ============================================================
-- Session Analytics: Tables, Storage, RLS, Realtime
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. tracking_sessions — one row per visitor session
CREATE TABLE IF NOT EXISTS tracking_sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  visitor_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Form progress
  max_step_reached INTEGER NOT NULL DEFAULT 1,
  final_step INTEGER,
  completed BOOLEAN NOT NULL DEFAULT false,
  disqualified BOOLEAN NOT NULL DEFAULT false,
  disqualified_at_step INTEGER,
  disqualified_reason TEXT,

  -- Device / browser
  user_agent TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  referrer TEXT,
  device_type TEXT, -- desktop / mobile / tablet

  -- UTM
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,

  -- Link to lead on completion
  lead_id UUID REFERENCES leads(id),

  -- Recording metadata
  recording_storage_path TEXT,
  recording_size_bytes BIGINT DEFAULT 0,
  recording_event_count INTEGER DEFAULT 0
);

CREATE INDEX idx_tracking_sessions_visitor ON tracking_sessions(visitor_id);
CREATE INDEX idx_tracking_sessions_started ON tracking_sessions(started_at DESC);
CREATE INDEX idx_tracking_sessions_active ON tracking_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_tracking_sessions_lead ON tracking_sessions(lead_id) WHERE lead_id IS NOT NULL;

-- 2. tracking_step_events — one row per step enter/exit/disqualify
CREATE TABLE IF NOT EXISTS tracking_step_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES tracking_sessions(session_id),
  step_number INTEGER NOT NULL,
  step_label TEXT,
  action TEXT NOT NULL CHECK (action IN ('enter', 'exit', 'disqualify')),
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exited_at TIMESTAMPTZ,
  time_on_step_seconds NUMERIC(10,2),
  selection_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_step_events_session ON tracking_step_events(session_id);
CREATE INDEX idx_step_events_step ON tracking_step_events(step_number);

-- 3. tracking_click_events — one row per click
CREATE TABLE IF NOT EXISTS tracking_click_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES tracking_sessions(session_id),
  step_number INTEGER NOT NULL,
  x_percent NUMERIC(6,3),
  y_percent NUMERIC(6,3),
  x_pixel INTEGER,
  y_pixel INTEGER,
  element_tag TEXT,
  element_text TEXT,
  element_selector TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_click_events_session ON tracking_click_events(session_id);
CREATE INDEX idx_click_events_step ON tracking_click_events(step_number);

-- 4. tracking_daily_stats — pre-aggregated daily metrics
CREATE TABLE IF NOT EXISTS tracking_daily_stats (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_completions INTEGER NOT NULL DEFAULT 0,
  total_disqualifications INTEGER NOT NULL DEFAULT 0,
  step_reach_counts JSONB NOT NULL DEFAULT '{}',
  disqualifications_by_step JSONB NOT NULL DEFAULT '{}',
  device_breakdown JSONB NOT NULL DEFAULT '{}',
  avg_session_duration_seconds NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Storage bucket for rrweb recording chunks
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-recordings', 'session-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS Policies
-- ============================================================

-- tracking_sessions
ALTER TABLE tracking_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_sessions" ON tracking_sessions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_sessions" ON tracking_sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_sessions" ON tracking_sessions
  FOR SELECT TO authenticated USING (true);

-- tracking_step_events
ALTER TABLE tracking_step_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_step_events" ON tracking_step_events
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_step_events" ON tracking_step_events
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_step_events" ON tracking_step_events
  FOR SELECT TO authenticated USING (true);

-- tracking_click_events
ALTER TABLE tracking_click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_click_events" ON tracking_click_events
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "authenticated_read_click_events" ON tracking_click_events
  FOR SELECT TO authenticated USING (true);

-- tracking_daily_stats
ALTER TABLE tracking_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_upsert_daily_stats" ON tracking_daily_stats
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_daily_stats" ON tracking_daily_stats
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_daily_stats" ON tracking_daily_stats
  FOR SELECT TO authenticated USING (true);

-- Storage RLS: anon can upload to session-recordings
CREATE POLICY "anon_upload_recordings" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'session-recordings');

CREATE POLICY "authenticated_read_recordings" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'session-recordings');

-- ============================================================
-- Enable Realtime on tracking_sessions for live feed
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE tracking_sessions;
