-- Phase 5+6: Exercise Engine
-- Add exercise_index to disambiguate multiple exercises per section

ALTER TABLE exercise_responses ADD COLUMN exercise_index INTEGER DEFAULT 0;

-- Drop old index and create a more specific one
DROP INDEX IF EXISTS idx_responses_section;
CREATE INDEX idx_responses_section_exercise ON exercise_responses(section_id, exercise_index, attempt_number);
