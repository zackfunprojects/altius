-- Add authorization checks to SECURITY DEFINER RPCs.
-- These functions are called from the client via supabase-js,
-- so we verify the caller owns the resource.

CREATE OR REPLACE FUNCTION public.increment_completed_camps(p_trek_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the caller owns this trek
  IF NOT EXISTS (
    SELECT 1 FROM treks WHERE id = p_trek_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to modify this trek';
  END IF;

  UPDATE treks SET completed_camps = completed_camps + 1 WHERE id = p_trek_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_treks_completed(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the caller is updating their own profile
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to modify this profile';
  END IF;

  UPDATE profiles SET total_treks_completed = total_treks_completed + 1 WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_elevation(
  p_user_id UUID,
  p_delta INTEGER,
  p_source_type elevation_source,
  p_source_id UUID DEFAULT NULL,
  p_trek_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_total INTEGER;
BEGIN
  -- Verify the caller is awarding elevation to themselves
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to modify this profile';
  END IF;

  UPDATE profiles
  SET current_elevation = current_elevation + p_delta,
      last_active = now()
  WHERE id = p_user_id
  RETURNING current_elevation INTO v_new_total;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  INSERT INTO elevation_log (user_id, delta, total_after, source_type, source_id, trek_id)
  VALUES (p_user_id, p_delta, v_new_total, p_source_type, p_source_id, p_trek_id);

  RETURN v_new_total;
END;
$$;
