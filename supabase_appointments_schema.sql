-- Run this in Supabase SQL Editor
-- Adds rescheduling tracking columns to patient_appointments

ALTER TABLE patient_appointments
  ADD COLUMN IF NOT EXISTS rescheduled_by_hospital BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS original_date DATE,
  ADD COLUMN IF NOT EXISTS original_time TIME,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index for patient dashboard real-time queries
CREATE INDEX IF NOT EXISTS idx_appointments_patient
  ON patient_appointments(patient_id, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_hospital
  ON patient_appointments(hospital_id, appointment_date DESC);
