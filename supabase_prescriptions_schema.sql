-- Table 1 — prescriptions
CREATE TABLE prescriptions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id       UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id        UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id         UUID REFERENCES hospital_staff(id) ON DELETE SET NULL,
  doctor_name       TEXT NOT NULL,
  doctor_specialization TEXT,

  admission_id      UUID REFERENCES hospital_patients(id) ON DELETE SET NULL,
  appointment_id    UUID REFERENCES patient_appointments(id) ON DELETE SET NULL,

  diagnosis         TEXT NOT NULL,
  general_instructions TEXT,

  feedback_after_days  INT NOT NULL DEFAULT 7,
  feedback_requested   BOOLEAN DEFAULT TRUE,
  feedback_deadline_date DATE,

  status  TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Discontinued', 'Expired')),

  prescription_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until        DATE,

  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id, prescription_date DESC);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id, prescription_date DESC);
CREATE INDEX idx_prescriptions_feedback_due ON prescriptions(feedback_deadline_date) WHERE feedback_requested = TRUE;

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital manages its prescriptions"
  ON prescriptions FOR ALL
  USING (hospital_id IN (
    SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()
  ));

CREATE POLICY "Patient reads own prescriptions"
  ON prescriptions FOR SELECT
  USING (patient_id IN (
    SELECT id FROM patients WHERE supabase_user_id = auth.uid()
  ));

-- Table 2 — prescription_medicines
CREATE TABLE prescription_medicines (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id  UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  patient_id       UUID REFERENCES patients(id) ON DELETE CASCADE,

  medicine_name    TEXT NOT NULL,
  dosage           TEXT NOT NULL,
  medicine_form    TEXT CHECK (medicine_form IN ('Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Inhaler', 'Patch', 'Other')),

  times_per_day    INT NOT NULL DEFAULT 1,
  schedule         JSONB NOT NULL DEFAULT '[]',

  duration_days    INT,
  start_date       DATE DEFAULT CURRENT_DATE,
  end_date         DATE,
  special_instructions TEXT,

  is_active        BOOLEAN DEFAULT TRUE,
  stopped_reason   TEXT,

  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rx_medicines_prescription ON prescription_medicines(prescription_id);
CREATE INDEX idx_rx_medicines_patient ON prescription_medicines(patient_id, is_active);

ALTER TABLE prescription_medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital manages prescription medicines"
  ON prescription_medicines FOR ALL
  USING (prescription_id IN (
    SELECT id FROM prescriptions
    WHERE hospital_id IN (
      SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()
    )
  ));

CREATE POLICY "Patient reads own prescription medicines"
  ON prescription_medicines FOR SELECT
  USING (patient_id IN (
    SELECT id FROM patients WHERE supabase_user_id = auth.uid()
  ));

-- Table 3 — prescription_feedback
CREATE TABLE prescription_feedback (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id  UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  patient_id       UUID REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id      UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  doctor_id        UUID REFERENCES hospital_staff(id) ON DELETE SET NULL,

  improvement_rating  INT CHECK (improvement_rating BETWEEN 1 AND 5),
  adherence_rating  TEXT CHECK (adherence_rating IN ('Always', 'Mostly', 'Sometimes', 'Rarely', 'Never')),

  had_side_effects  BOOLEAN DEFAULT FALSE,
  side_effects      TEXT[],
  side_effect_severity  TEXT CHECK (side_effect_severity IN ('Mild', 'Moderate', 'Severe')),
  medicine_feedback  JSONB DEFAULT '[]',

  patient_notes  TEXT,
  continue_recommended  BOOLEAN,
  symptoms_resolved   BOOLEAN,
  pain_level_before   INT CHECK (pain_level_before BETWEEN 0 AND 10),
  pain_level_after    INT CHECK (pain_level_after  BETWEEN 0 AND 10),

  patient_age         INT,
  patient_gender      TEXT,
  patient_blood_group TEXT,

  submitted_at   TIMESTAMPTZ DEFAULT NOW(),
  is_read        BOOLEAN DEFAULT FALSE,
  read_at        TIMESTAMPTZ
);

CREATE INDEX idx_feedback_prescription ON prescription_feedback(prescription_id);
CREATE INDEX idx_feedback_doctor ON prescription_feedback(doctor_id, submitted_at DESC);
CREATE INDEX idx_feedback_medicine_analytics ON prescription_feedback(hospital_id, submitted_at DESC);

ALTER TABLE prescription_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient submits own feedback"
  ON prescription_feedback FOR INSERT
  WITH CHECK (patient_id IN (
    SELECT id FROM patients WHERE supabase_user_id = auth.uid()
  ));

CREATE POLICY "Patient reads own feedback"
  ON prescription_feedback FOR SELECT
  USING (patient_id IN (
    SELECT id FROM patients WHERE supabase_user_id = auth.uid()
  ));

CREATE POLICY "Hospital reads its prescription feedback"
  ON prescription_feedback FOR ALL
  USING (hospital_id IN (
    SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()
  ));
