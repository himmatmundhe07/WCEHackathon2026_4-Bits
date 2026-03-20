-- ============================================================
-- SANJEEVANI+ SUBSCRIPTION PLANS — SQL SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ─── Table 1: subscription_plans ────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name    TEXT NOT NULL,
  plan_type    TEXT NOT NULL CHECK (plan_type IN ('free', 'single', 'family')),
  price_yearly INT NOT NULL DEFAULT 0,
  max_members  INT NOT NULL DEFAULT 1,
  free_appointments_per_year INT NOT NULL DEFAULT 0,
  has_priority_booking  BOOLEAN DEFAULT FALSE,
  has_fast_booking      BOOLEAN DEFAULT FALSE,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the 3 plans
INSERT INTO subscription_plans
  (plan_name, plan_type, price_yearly, max_members,
   free_appointments_per_year, has_priority_booking, has_fast_booking)
VALUES
  ('Sanjeevani Free',    'free',   0,    1, 0, FALSE, FALSE),
  ('Sanjeevani+ Single', 'single', 3000, 1, 3, TRUE,  TRUE),
  ('Sanjeevani+ Family', 'family', 6000, 4, 3, TRUE,  TRUE);

-- Allow public read
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active plans"
  ON subscription_plans FOR SELECT
  USING (is_active = TRUE);


-- ─── Table 2: patient_subscriptions ─────────────────────────
CREATE TABLE IF NOT EXISTS patient_subscriptions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  plan_id         UUID REFERENCES subscription_plans(id),
  plan_type       TEXT NOT NULL CHECK (plan_type IN ('free', 'single', 'family')),

  started_at      DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at      DATE NOT NULL,

  status          TEXT DEFAULT 'active' CHECK (status IN (
                    'active', 'expired', 'cancelled', 'pending_payment'
                  )),

  free_appointments_total     INT DEFAULT 0,
  free_appointments_used      INT DEFAULT 0,
  free_appointments_remaining INT GENERATED ALWAYS AS
    (free_appointments_total - free_appointments_used) STORED,

  payment_method     TEXT,
  payment_reference  TEXT,
  amount_paid        INT DEFAULT 0,

  auto_renew         BOOLEAN DEFAULT FALSE,

  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Only one ACTIVE subscription per patient at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_subscription
  ON patient_subscriptions(patient_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_subscriptions_patient
  ON patient_subscriptions(patient_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry
  ON patient_subscriptions(expires_at)
  WHERE status = 'active';

ALTER TABLE patient_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient manages own subscription"
  ON patient_subscriptions FOR ALL
  USING (patient_id IN (
    SELECT id FROM patients WHERE supabase_user_id = auth.uid()
  ));

CREATE POLICY "Hospital reads patient subscription status"
  ON patient_subscriptions FOR SELECT
  USING (true);


-- ─── Table 3: family_members ────────────────────────────────
CREATE TABLE IF NOT EXISTS family_members (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES patient_subscriptions(id) ON DELETE CASCADE,
  owner_patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  member_patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  relation        TEXT CHECK (relation IN (
                    'Self', 'Spouse', 'Parent', 'Child',
                    'Sibling', 'Other'
                  )),
  added_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscription_id, member_patient_id)
);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages family members"
  ON family_members FOR ALL
  USING (owner_patient_id IN (
    SELECT id FROM patients WHERE supabase_user_id = auth.uid()
  ));

CREATE POLICY "Member reads own family entry"
  ON family_members FOR SELECT
  USING (member_patient_id IN (
    SELECT id FROM patients WHERE supabase_user_id = auth.uid()
  ));


-- ─── Table 4: free_appointment_usage ────────────────────────
CREATE TABLE IF NOT EXISTS free_appointment_usage (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id  UUID REFERENCES patient_subscriptions(id) ON DELETE CASCADE,
  patient_id       UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id   UUID REFERENCES patient_appointments(id) ON DELETE SET NULL,
  hospital_name    TEXT,
  used_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE free_appointment_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient sees own usage"
  ON free_appointment_usage FOR SELECT
  USING (patient_id IN (
    SELECT id FROM patients WHERE supabase_user_id = auth.uid()
  ));


-- ─── ALTER patients table ───────────────────────────────────
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'free'
    CHECK (subscription_type IN ('free', 'single', 'family')),
  ADD COLUMN IF NOT EXISTS subscription_expires_at DATE,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;


-- ─── ALTER patient_appointments table ───────────────────────
ALTER TABLE patient_appointments
  ADD COLUMN IF NOT EXISTS is_priority        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_free_appointment BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS free_usage_id       UUID
    REFERENCES free_appointment_usage(id) ON DELETE SET NULL;
