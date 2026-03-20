
-- 1. Create treatment_notes table
CREATE TABLE IF NOT EXISTS public.treatment_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES hospital_staff(id) ON DELETE SET NULL,
  staff_name TEXT NOT NULL,
  staff_role TEXT,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treatment_notes_patient ON treatment_notes(patient_id, created_at DESC);

ALTER TABLE treatment_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital manages treatment notes"
  ON treatment_notes FOR ALL TO authenticated
  USING (hospital_id IN (
    SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()
  ));

-- 2. Add missing columns to hospital_patients
ALTER TABLE hospital_patients 
  ADD COLUMN IF NOT EXISTS discharge_summary TEXT,
  ADD COLUMN IF NOT EXISTS discharge_condition TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS follow_up_doctor TEXT;

-- 3. Add missing columns to qr_scan_logs
ALTER TABLE qr_scan_logs
  ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by TEXT;

-- 4. Add missing columns to patient_appointments
ALTER TABLE patient_appointments
  ADD COLUMN IF NOT EXISTS appointment_type TEXT DEFAULT 'Outpatient',
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS booked_by TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
