
-- Add nurse assignment columns to hospital_patients
ALTER TABLE hospital_patients
  ADD COLUMN IF NOT EXISTS assigned_nurse_id UUID REFERENCES hospital_staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_nurse TEXT;

-- Create patient_treatments table
CREATE TABLE IF NOT EXISTS patient_treatments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id     UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  admission_id    UUID REFERENCES hospital_patients(id) ON DELETE CASCADE,
  current_disease   TEXT,
  disease_severity  TEXT,
  treatment_plan    TEXT,
  prescribed_medicines JSONB DEFAULT '[]',
  admission_allergies TEXT[] DEFAULT '{}',
  dietary_restrictions   TEXT[] DEFAULT '{}',
  activity_restrictions  TEXT[] DEFAULT '{}',
  medications_to_avoid   TEXT[] DEFAULT '{}',
  other_instructions     TEXT,
  assigned_doctor_id   UUID REFERENCES hospital_staff(id) ON DELETE SET NULL,
  assigned_doctor      TEXT,
  assigned_nurse_id    UUID REFERENCES hospital_staff(id) ON DELETE SET NULL,
  assigned_nurse       TEXT,
  last_updated_by   TEXT,
  last_updated_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_treatments_admission ON patient_treatments(admission_id);
CREATE INDEX IF NOT EXISTS idx_patient_treatments_patient ON patient_treatments(patient_id, created_at DESC);

ALTER TABLE patient_treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital manages treatment plans"
  ON patient_treatments FOR ALL TO authenticated
  USING (hospital_id IN (
    SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()
  ));

-- Severity validation trigger
CREATE OR REPLACE FUNCTION public.validate_disease_severity()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
BEGIN
  IF NEW.disease_severity IS NOT NULL AND NEW.disease_severity NOT IN ('Mild', 'Moderate', 'Severe', 'Critical') THEN
    RAISE EXCEPTION 'Invalid disease severity: %', NEW.disease_severity;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_disease_severity
  BEFORE INSERT OR UPDATE ON patient_treatments
  FOR EACH ROW EXECUTE FUNCTION validate_disease_severity();

-- Create patient_created_by_hospital table
CREATE TABLE IF NOT EXISTS patient_created_by_hospital (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id     UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  created_by_staff TEXT,
  password_set    BOOLEAN DEFAULT FALSE,
  invite_sent_at  TIMESTAMPTZ DEFAULT NOW(),
  password_set_at TIMESTAMPTZ,
  notes           TEXT
);

ALTER TABLE patient_created_by_hospital ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital sees accounts it created"
  ON patient_created_by_hospital FOR ALL TO authenticated
  USING (hospital_id IN (
    SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()
  ));
