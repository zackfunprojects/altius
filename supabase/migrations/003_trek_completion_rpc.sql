-- Atomic trek completion function.
-- Marks trek as completed, creates notebook entry, increments profile counter,
-- and awards summit elevation - all in one transaction.

CREATE OR REPLACE FUNCTION public.complete_trek(
  p_trek_id UUID,
  p_user_id UUID,
  p_skill_name TEXT,
  p_skill_badge JSONB,
  p_summit_date INTEGER,
  p_summit_entry TEXT,
  p_key_concepts JSONB,
  p_summit_deliverable_url TEXT DEFAULT NULL,
  p_difficulty trek_difficulty DEFAULT 'weekend_trek'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_delta INTEGER;
  v_new_elevation INTEGER;
BEGIN
  -- Idempotency: only complete if currently active
  UPDATE treks
  SET status = 'completed', completed_at = now()
  WHERE id = p_trek_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN; -- Already completed or not active
  END IF;

  -- Create notebook entry
  INSERT INTO trek_notebook (user_id, trek_id, skill_name, skill_badge, summit_date, summit_entry, key_concepts, summit_deliverable_url)
  VALUES (p_user_id, p_trek_id, p_skill_name, p_skill_badge, p_summit_date, p_summit_entry, p_key_concepts, p_summit_deliverable_url)
  ON CONFLICT (user_id, trek_id) DO NOTHING;

  -- Increment treks completed
  UPDATE profiles
  SET total_treks_completed = total_treks_completed + 1
  WHERE id = p_user_id;

  -- Calculate summit elevation
  v_delta := CASE p_difficulty
    WHEN 'day_hike' THEN 200
    WHEN 'weekend_trek' THEN 500
    WHEN 'expedition' THEN 1000
    WHEN 'siege' THEN 2000
    ELSE 200
  END;

  -- Award elevation atomically
  UPDATE profiles
  SET current_elevation = current_elevation + v_delta, last_active = now()
  WHERE id = p_user_id
  RETURNING current_elevation INTO v_new_elevation;

  INSERT INTO elevation_log (user_id, delta, total_after, source_type, source_id, trek_id)
  VALUES (p_user_id, v_delta, v_new_elevation, 'summit_completed', p_trek_id, p_trek_id);
END;
$$;

-- Helper to increment treks_completed atomically (used as fallback)
CREATE OR REPLACE FUNCTION public.increment_treks_completed(p_user_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE profiles SET total_treks_completed = total_treks_completed + 1 WHERE id = p_user_id;
$$;
