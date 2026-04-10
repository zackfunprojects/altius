-- ═══════════════════════════════════════════════════════════
-- ALTIUS v5.0 - Full Schema
-- Run this in the Supabase SQL Editor after the clean slate reset.
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- ENUM Types
-- ───────────────────────────────────────────────────────────

CREATE TYPE trek_difficulty AS ENUM ('day_hike', 'weekend_trek', 'expedition', 'siege');
CREATE TYPE trek_status AS ENUM ('proposed', 'active', 'paused', 'completed', 'abandoned');
CREATE TYPE camp_status AS ENUM ('locked', 'active', 'completed');
CREATE TYPE section_status AS ENUM ('locked', 'active', 'completed', 'skipped');
CREATE TYPE section_type AS ENUM ('concept', 'exercise', 'demonstration', 'guided_analysis', 'project_step', 'reflection', 'tool_tutorial', 'branching_scenario', 'parallel_route');
CREATE TYPE exercise_type AS ENUM ('multiple_choice', 'short_answer', 'drag_sequence', 'code_editor', 'timeline_editor', 'canvas_layout', 'writing_prompt', 'file_upload', 'voice_response', 'conversation_sim');
CREATE TYPE modality AS ENUM ('fireside', 'trail_sketch', 'demonstration', 'practice_ledge', 'over_the_shoulder', 'branching_scenario', 'parallel_route', 'guided_analysis', 'multimodal_input');
CREATE TYPE elevation_source AS ENUM ('lesson_completed', 'exercise_passed', 'camp_reached', 'summit_completed', 'journal_note', 'event_bonus');
CREATE TYPE event_type AS ENUM ('trek_started', 'camp_reached', 'summit_attempted', 'summit_completed', 'weather', 'narrative', 'morning_question');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro');

-- ───────────────────────────────────────────────────────────
-- Tables
-- ───────────────────────────────────────────────────────────

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  current_elevation INTEGER DEFAULT 0,
  subscription_tier subscription_tier DEFAULT 'free',
  total_treks_completed INTEGER DEFAULT 0,
  expedition_origin TEXT,
  expedition_vision TEXT,
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Treks
CREATE TABLE treks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  skill_description TEXT NOT NULL,
  trek_name TEXT NOT NULL,
  difficulty trek_difficulty NOT NULL,
  status trek_status DEFAULT 'proposed',
  estimated_duration TEXT,
  summit_challenge JSONB NOT NULL,
  summit_deliverable_url TEXT,
  summit_entry TEXT,
  skill_badge JSONB,
  terrain_params JSONB,
  prerequisite_answers JSONB,
  tool_recommendations JSONB,
  total_camps INTEGER DEFAULT 0,
  completed_camps INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_treks_user ON treks(user_id, status);

-- Camps
CREATE TABLE camps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id UUID REFERENCES treks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  camp_number INTEGER NOT NULL,
  camp_name TEXT NOT NULL,
  learning_objectives JSONB NOT NULL,
  checkpoint_definition JSONB,
  status camp_status DEFAULT 'locked',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trek_id, camp_number)
);
CREATE INDEX idx_camps_trek ON camps(trek_id, camp_number);

-- Trail Sections
CREATE TABLE trail_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id UUID REFERENCES camps(id) ON DELETE CASCADE NOT NULL,
  trek_id UUID REFERENCES treks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  section_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  section_type section_type NOT NULL,
  modalities modality[] NOT NULL,
  content JSONB,
  exercise_spec JSONB,
  status section_status DEFAULT 'locked',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(camp_id, section_number)
);
CREATE INDEX idx_sections_camp ON trail_sections(camp_id, section_number);
CREATE INDEX idx_sections_trek ON trail_sections(trek_id);

-- Exercise Responses
CREATE TABLE exercise_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES trail_sections(id) ON DELETE CASCADE NOT NULL,
  trek_id UUID REFERENCES treks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  response JSONB NOT NULL,
  evaluation JSONB,
  passed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_responses_section ON exercise_responses(section_id, attempt_number);

-- Trek Journal
CREATE TABLE trek_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id UUID REFERENCES treks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  section_id UUID REFERENCES trail_sections(id),
  camp_id UUID REFERENCES camps(id),
  body TEXT NOT NULL,
  is_camp_reflection BOOLEAN DEFAULT false,
  sherpa_response TEXT,
  expedition_day INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_journal_trek ON trek_journal(trek_id, created_at DESC);

-- Trek Notebook
CREATE TABLE trek_notebook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  trek_id UUID REFERENCES treks(id) NOT NULL,
  skill_name TEXT NOT NULL,
  skill_badge JSONB NOT NULL,
  summit_date INTEGER NOT NULL,
  summit_entry TEXT NOT NULL,
  key_concepts JSONB NOT NULL,
  time_invested_minutes INTEGER,
  summit_deliverable_url TEXT,
  last_refreshed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, trek_id)
);
CREATE INDEX idx_notebook_user ON trek_notebook(user_id, created_at DESC);

-- Elevation Log
CREATE TABLE elevation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  delta INTEGER NOT NULL,
  total_after INTEGER NOT NULL,
  source_type elevation_source NOT NULL,
  source_id UUID,
  trek_id UUID REFERENCES treks(id),
  logged_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_elevation_user ON elevation_log(user_id, logged_at DESC);

-- Expedition Events
CREATE TABLE expedition_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  trek_id UUID REFERENCES treks(id),
  event_type event_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  elevation_bonus INTEGER DEFAULT 0,
  metadata JSONB,
  fired_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_events_user ON expedition_events(user_id, fired_at DESC);

-- ───────────────────────────────────────────────────────────
-- Row Level Security
-- ───────────────────────────────────────────────────────────

-- Profiles: users can read and update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- All other tables: users can CRUD their own rows
ALTER TABLE treks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own rows" ON treks
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE camps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own rows" ON camps
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE trail_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own rows" ON trail_sections
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE exercise_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own rows" ON exercise_responses
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE trek_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own rows" ON trek_journal
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE trek_notebook ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own rows" ON trek_notebook
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE elevation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own rows" ON elevation_log
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE expedition_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own rows" ON expedition_events
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────
-- Auto-create profile on signup
-- ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, current_elevation, subscription_tier)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''), 0, 'free');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
