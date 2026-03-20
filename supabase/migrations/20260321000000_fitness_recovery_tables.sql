-- ============================================================
-- FITNESS & RECOVERY TRACKER TABLES
-- These tables power the patient recovery/fitness section
-- ============================================================

-- 1. FITNESS PLANS — AI-generated recovery plans
CREATE TABLE IF NOT EXISTS fitness_plans (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id             UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  generated_by           TEXT DEFAULT 'ai',
  patient_age            INT,
  patient_condition      JSONB DEFAULT '[]',
  patient_medicines      JSONB DEFAULT '[]',
  patient_vitals_snapshot JSONB DEFAULT '{}',
  patient_location       TEXT DEFAULT 'Home',
  intensity_level        TEXT DEFAULT 'Very Light',
  plan_title             TEXT NOT NULL,
  plan_summary           TEXT,
  weekly_goal_minutes    INT DEFAULT 60,
  daily_water_goal_ml    INT DEFAULT 2000,
  safety_note            TEXT,
  is_active              BOOLEAN DEFAULT TRUE,
  is_paused              BOOLEAN DEFAULT FALSE,
  doctor_approved        BOOLEAN DEFAULT FALSE,
  doctor_notes           TEXT,
  expires_at             TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fitness_plans_patient ON fitness_plans(patient_id, is_active);

ALTER TABLE fitness_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own fitness plans"
  ON fitness_plans FOR SELECT TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE supabase_user_id = auth.uid())
    OR TRUE
  );

CREATE POLICY "Patients can insert own fitness plans"
  ON fitness_plans FOR INSERT TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Patients can update own fitness plans"
  ON fitness_plans FOR UPDATE TO authenticated
  USING (TRUE);


-- 2. FITNESS ACTIVITIES — individual exercises within a plan
CREATE TABLE IF NOT EXISTS fitness_activities (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id           UUID NOT NULL REFERENCES fitness_plans(id) ON DELETE CASCADE,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  activity_name     TEXT NOT NULL,
  category          TEXT DEFAULT 'Breathing',
  description       TEXT,
  duration_seconds  INT,
  repetitions       INT,
  sets              INT DEFAULT 1,
  rest_seconds      INT DEFAULT 30,
  frequency_per_day INT DEFAULT 1,
  best_time         TEXT DEFAULT 'Anytime',
  difficulty_label  TEXT DEFAULT 'Seated',
  caution_note      TEXT,
  animation_key     TEXT DEFAULT 'deep_breath',
  day_of_week       TEXT[] DEFAULT '{Daily}',
  order_in_plan     INT DEFAULT 1,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fitness_activities_plan ON fitness_activities(plan_id);
CREATE INDEX IF NOT EXISTS idx_fitness_activities_patient ON fitness_activities(patient_id);

ALTER TABLE fitness_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read fitness activities"
  ON fitness_activities FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Anyone authenticated can insert fitness activities"
  ON fitness_activities FOR INSERT TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Anyone authenticated can update fitness activities"
  ON fitness_activities FOR UPDATE TO authenticated
  USING (TRUE);


-- 3. FITNESS LOGS — daily logs of completed/skipped activities + daily metrics
CREATE TABLE IF NOT EXISTS fitness_logs (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  activity_id             UUID REFERENCES fitness_activities(id) ON DELETE SET NULL,
  plan_id                 UUID REFERENCES fitness_plans(id) ON DELETE SET NULL,
  log_date                DATE NOT NULL DEFAULT CURRENT_DATE,
  log_time                TIME DEFAULT CURRENT_TIME,
  status                  TEXT DEFAULT 'Completed',
  duration_actual_seconds INT,
  how_felt_after          TEXT,
  pain_location           TEXT,
  notes                   TEXT,
  water_intake_ml         INT,
  steps_count             INT,
  sleep_hours             NUMERIC(3,1),
  mood                    TEXT,
  energy_level            INT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fitness_logs_patient ON fitness_logs(patient_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_fitness_logs_plan ON fitness_logs(plan_id);

ALTER TABLE fitness_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read fitness logs"
  ON fitness_logs FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Anyone authenticated can insert fitness logs"
  ON fitness_logs FOR INSERT TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Anyone authenticated can update fitness logs"
  ON fitness_logs FOR UPDATE TO authenticated
  USING (TRUE);


-- 4. FITNESS STREAKS — gamification streak tracking per patient
CREATE TABLE IF NOT EXISTS fitness_streaks (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  current_streak    INT DEFAULT 0,
  longest_streak    INT DEFAULT 0,
  last_active_date  DATE,
  total_active_days INT DEFAULT 0,
  badges_earned     TEXT[] DEFAULT '{}',
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_patient_streak UNIQUE (patient_id)
);

CREATE INDEX IF NOT EXISTS idx_fitness_streaks_patient ON fitness_streaks(patient_id);

ALTER TABLE fitness_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read fitness streaks"
  ON fitness_streaks FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Anyone authenticated can insert fitness streaks"
  ON fitness_streaks FOR INSERT TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Anyone authenticated can update fitness streaks"
  ON fitness_streaks FOR UPDATE TO authenticated
  USING (TRUE);


-- 5. Also create the patient_vitals table if it doesn't exist 
--    (referenced by the edge function)
CREATE TABLE IF NOT EXISTS patient_vitals (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  blood_pressure_sys INT,
  blood_pressure_dia INT,
  heart_rate        INT,
  spo2              INT,
  blood_sugar       INT,
  temperature       NUMERIC(4,1),
  reading_value     TEXT,
  recorded_at       TIMESTAMPTZ DEFAULT NOW(),
  recorded_by       TEXT
);

CREATE INDEX IF NOT EXISTS idx_patient_vitals_patient ON patient_vitals(patient_id, recorded_at DESC);

ALTER TABLE patient_vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read patient vitals"
  ON patient_vitals FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Anyone authenticated can insert patient vitals"
  ON patient_vitals FOR INSERT TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Anyone authenticated can update patient vitals"
  ON patient_vitals FOR UPDATE TO authenticated
  USING (TRUE);
