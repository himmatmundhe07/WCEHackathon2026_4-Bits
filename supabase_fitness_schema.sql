-- ============================================================
-- Sanjeevani Fitness & Recovery Tracker Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Table 1: fitness_plans
CREATE TABLE IF NOT EXISTS fitness_plans (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id    UUID REFERENCES patients(id) ON DELETE CASCADE,
  generated_by  TEXT DEFAULT 'ai' CHECK (generated_by IN ('ai', 'doctor', 'system')),
  patient_age          INT,
  patient_condition    TEXT[],
  patient_medicines    TEXT[],
  patient_vitals_snapshot JSONB,
  patient_location     TEXT CHECK (patient_location IN ('Hospital', 'Home', 'Outdoor')),
  intensity_level TEXT DEFAULT 'Very Light' CHECK (intensity_level IN ('Bed Rest', 'Very Light', 'Light', 'Moderate')),
  plan_title    TEXT,
  plan_summary  TEXT,
  weekly_goal_minutes INT DEFAULT 30,
  daily_water_goal_ml INT DEFAULT 2000,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,
  doctor_approved BOOLEAN DEFAULT FALSE,
  doctor_notes    TEXT,
  safety_note     TEXT,
  is_paused       BOOLEAN DEFAULT FALSE
);

ALTER TABLE fitness_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient manages own fitness plan"
  ON fitness_plans FOR ALL
  USING (patient_id IN (
    SELECT id FROM patients WHERE supabase_user_id = auth.uid()
  ));

CREATE POLICY "Hospital reads patient fitness plans"
  ON fitness_plans FOR SELECT
  USING (patient_id IN (
    SELECT hp.patient_id FROM hospital_patients hp
    WHERE hp.hospital_id IN (
      SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()
    )
  ));

CREATE POLICY "Hospital updates patient fitness plans"
  ON fitness_plans FOR UPDATE
  USING (patient_id IN (
    SELECT hp.patient_id FROM hospital_patients hp
    WHERE hp.hospital_id IN (
      SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()
    )
  ));

-- Table 2: fitness_activities
CREATE TABLE IF NOT EXISTS fitness_activities (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id        UUID REFERENCES fitness_plans(id) ON DELETE CASCADE,
  patient_id     UUID REFERENCES patients(id) ON DELETE CASCADE,
  activity_name  TEXT NOT NULL,
  category       TEXT CHECK (category IN (
                   'Breathing', 'Circulation', 'Mobility', 'Strength',
                   'Balance', 'Walking', 'Relaxation', 'Posture'
                 )),
  description    TEXT NOT NULL,
  duration_seconds   INT,
  repetitions        INT,
  sets               INT DEFAULT 1,
  rest_seconds       INT DEFAULT 30,
  frequency_per_day  INT DEFAULT 1,
  best_time         TEXT CHECK (best_time IN (
                      'Morning', 'Afternoon', 'Evening',
                      'After meals', 'Before sleep', 'Anytime'
                    )),
  difficulty_label  TEXT CHECK (difficulty_label IN (
                      'In Bed', 'Seated', 'Standing', 'Walking'
                    )),
  caution_note  TEXT,
  animation_key TEXT,
  day_of_week   TEXT[],
  order_in_plan INT DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fitness_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient reads own activities"
  ON fitness_activities FOR SELECT
  USING (patient_id IN (
    SELECT id FROM patients WHERE supabase_user_id = auth.uid()
  ));

CREATE POLICY "Hospital reads patient activities"
  ON fitness_activities FOR SELECT
  USING (patient_id IN (
    SELECT hp.patient_id FROM hospital_patients hp
    WHERE hp.hospital_id IN (
      SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()
    )
  ));

-- Table 3: fitness_logs
CREATE TABLE IF NOT EXISTS fitness_logs (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id     UUID REFERENCES patients(id) ON DELETE CASCADE,
  activity_id    UUID REFERENCES fitness_activities(id) ON DELETE SET NULL,
  plan_id        UUID REFERENCES fitness_plans(id) ON DELETE SET NULL,
  log_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  log_time       TIMESTAMPTZ DEFAULT NOW(),
  status         TEXT CHECK (status IN ('Completed', 'Skipped', 'Partial', 'Rest Day')),
  duration_actual_seconds INT,
  how_felt_after TEXT CHECK (how_felt_after IN (
                   'Great', 'Good', 'Okay', 'Tired', 'Pain', 'Dizzy', 'Skipped'
                 )),
  pain_location  TEXT,
  notes          TEXT,
  water_intake_ml    INT,
  steps_count        INT,
  sleep_hours        DECIMAL(3,1),
  mood               TEXT CHECK (mood IN ('Happy', 'Okay', 'Tired', 'Anxious', 'Sad')),
  energy_level       INT CHECK (energy_level BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_fitness_logs_patient_date
  ON fitness_logs(patient_id, log_date DESC);

ALTER TABLE fitness_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient manages own fitness logs"
  ON fitness_logs FOR ALL
  USING (patient_id IN (
    SELECT id FROM patients WHERE supabase_user_id = auth.uid()
  ));

CREATE POLICY "Hospital reads patient fitness logs"
  ON fitness_logs FOR SELECT
  USING (patient_id IN (
    SELECT hp.patient_id FROM hospital_patients hp
    WHERE hp.hospital_id IN (
      SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()
    )
  ));

-- Table 4: fitness_streaks
CREATE TABLE IF NOT EXISTS fitness_streaks (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE UNIQUE,
  current_streak  INT DEFAULT 0,
  longest_streak  INT DEFAULT 0,
  last_active_date DATE,
  total_active_days INT DEFAULT 0,
  badges_earned   TEXT[] DEFAULT '{}',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fitness_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient manages own streak"
  ON fitness_streaks FOR ALL
  USING (patient_id IN (
    SELECT id FROM patients WHERE supabase_user_id = auth.uid()
  ));

CREATE POLICY "Hospital reads patient streaks"
  ON fitness_streaks FOR SELECT
  USING (patient_id IN (
    SELECT hp.patient_id FROM hospital_patients hp
    WHERE hp.hospital_id IN (
      SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()
    )
  ));
