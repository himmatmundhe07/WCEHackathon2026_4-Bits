
-- Active medications tracking
CREATE TABLE patient_medications (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  medicine_name   TEXT NOT NULL,
  generic_name    TEXT,
  dosage          TEXT,
  frequency       TEXT,
  time_of_day     TEXT[],
  prescribed_by   TEXT,
  doctor_reg_no   TEXT,
  start_date      DATE,
  duration_type   TEXT,
  end_date        DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Vitals / health readings
CREATE TABLE patient_vitals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  vital_type      TEXT NOT NULL,
  reading_value   TEXT NOT NULL,
  reading_unit    TEXT,
  reading_context TEXT,
  recorded_at     TIMESTAMPTZ DEFAULT NOW(),
  notes           TEXT
);

-- Lab reports and uploaded documents
CREATE TABLE patient_reports (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  report_type     TEXT NOT NULL,
  report_name     TEXT NOT NULL,
  file_url        TEXT,
  file_type       TEXT,
  report_date     DATE,
  doctor_name     TEXT,
  hospital_name   TEXT,
  ai_summary      TEXT,
  is_abnormal     BOOLEAN DEFAULT FALSE,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE patient_appointments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  doctor_name     TEXT NOT NULL,
  specialization  TEXT,
  hospital_name   TEXT,
  hospital_id     UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME,
  reason          TEXT,
  status          TEXT DEFAULT 'Upcoming',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Validation triggers
CREATE OR REPLACE FUNCTION public.validate_medication_duration_type()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.duration_type IS NOT NULL AND NEW.duration_type NOT IN ('Temporary', 'Permanent') THEN
    RAISE EXCEPTION 'Invalid duration type: %', NEW.duration_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_medication_duration
  BEFORE INSERT OR UPDATE ON patient_medications
  FOR EACH ROW EXECUTE FUNCTION validate_medication_duration_type();

CREATE OR REPLACE FUNCTION public.validate_appointment_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('Upcoming', 'Completed', 'Cancelled') THEN
    RAISE EXCEPTION 'Invalid appointment status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_appointment_status
  BEFORE INSERT OR UPDATE ON patient_appointments
  FOR EACH ROW EXECUTE FUNCTION validate_appointment_status();

-- RLS
ALTER TABLE patient_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient owns medications"
  ON patient_medications FOR ALL
  TO authenticated
  USING (patient_id IN (SELECT id FROM patients WHERE supabase_user_id = auth.uid()))
  WITH CHECK (patient_id IN (SELECT id FROM patients WHERE supabase_user_id = auth.uid()));

CREATE POLICY "Patient owns vitals"
  ON patient_vitals FOR ALL
  TO authenticated
  USING (patient_id IN (SELECT id FROM patients WHERE supabase_user_id = auth.uid()))
  WITH CHECK (patient_id IN (SELECT id FROM patients WHERE supabase_user_id = auth.uid()));

CREATE POLICY "Patient owns reports"
  ON patient_reports FOR ALL
  TO authenticated
  USING (patient_id IN (SELECT id FROM patients WHERE supabase_user_id = auth.uid()))
  WITH CHECK (patient_id IN (SELECT id FROM patients WHERE supabase_user_id = auth.uid()));

CREATE POLICY "Patient owns appointments"
  ON patient_appointments FOR ALL
  TO authenticated
  USING (patient_id IN (SELECT id FROM patients WHERE supabase_user_id = auth.uid()))
  WITH CHECK (patient_id IN (SELECT id FROM patients WHERE supabase_user_id = auth.uid()));
