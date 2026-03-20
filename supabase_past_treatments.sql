-- Add past_treatments JSONB column to patients table
-- Run this in your Supabase SQL Editor

ALTER TABLE patients ADD COLUMN IF NOT EXISTS past_treatments JSONB DEFAULT '[]'::jsonb;

-- Optional: Add a comment for documentation
COMMENT ON COLUMN patients.past_treatments IS 'Array of past treatment objects: [{id, type, title, hospital_name, doctor_name, date, end_date, diagnosis, notes, outcome}]';
