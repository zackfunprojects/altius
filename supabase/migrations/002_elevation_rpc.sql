-- Atomic elevation award function.
-- Increments profiles.current_elevation and inserts elevation_log in one transaction.
-- Returns the new total elevation.

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
  -- Atomically increment and return new value
  UPDATE profiles
  SET current_elevation = current_elevation + p_delta,
      last_active = now()
  WHERE id = p_user_id
  RETURNING current_elevation INTO v_new_total;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  -- Insert log entry in same transaction
  INSERT INTO elevation_log (user_id, delta, total_after, source_type, source_id, trek_id)
  VALUES (p_user_id, p_delta, v_new_total, p_source_type, p_source_id, p_trek_id);

  RETURN v_new_total;
END;
$$;
