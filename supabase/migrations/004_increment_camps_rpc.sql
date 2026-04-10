-- Atomic increment of completed_camps on a trek.
CREATE OR REPLACE FUNCTION public.increment_completed_camps(p_trek_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE treks SET completed_camps = completed_camps + 1 WHERE id = p_trek_id;
$$;
