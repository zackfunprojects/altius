-- Fix: migration 004 failed midway. This applies all missing pieces.

-- Stripe subscription fields on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Storage bucket for exercise file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-files', 'exercise-files', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for exercise-files bucket (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload own exercise files'
  ) THEN
    CREATE POLICY "Users can upload own exercise files"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'exercise-files'
      AND (storage.foldername(name))[2] = auth.uid()::text
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read for exercise files'
  ) THEN
    CREATE POLICY "Public read for exercise files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'exercise-files');
  END IF;
END $$;

-- Atomic elevation increment fallback RPC
CREATE OR REPLACE FUNCTION increment_elevation_fallback(p_user_id UUID, p_delta INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_elevation INTEGER;
BEGIN
  UPDATE profiles
  SET current_elevation = current_elevation + p_delta,
      last_active = now()
  WHERE id = p_user_id
  RETURNING current_elevation INTO new_elevation;

  RETURN new_elevation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
