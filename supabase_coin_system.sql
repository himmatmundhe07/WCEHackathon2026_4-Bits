-- ============================================================
-- Sanjeevani Coin System Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Table 1: patient_coins (wallet) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_coins (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id        UUID REFERENCES patients(id) ON DELETE CASCADE UNIQUE,
  balance           INT  NOT NULL DEFAULT 0,
  lifetime_earned   INT  NOT NULL DEFAULT 0,
  tier              TEXT NOT NULL DEFAULT 'Bronze'
                    CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE patient_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient manages own coins"
  ON patient_coins FOR ALL
  USING (patient_id IN (
    SELECT id FROM patients WHERE supabase_user_id = auth.uid()
  ));

-- ── Table 2: coin_transactions (history) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS coin_transactions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id    UUID REFERENCES patients(id) ON DELETE CASCADE,
  coins         INT  NOT NULL,               -- positive = earned, negative = spent
  reason        TEXT NOT NULL,               -- e.g. 'feedback_submitted', 'reward_redeemed'
  reference_id  UUID,                        -- e.g. prescription_feedback.id
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_tx_patient
  ON coin_transactions(patient_id, created_at DESC);

ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient reads own transactions"
  ON coin_transactions FOR SELECT
  USING (patient_id IN (
    SELECT id FROM patients WHERE supabase_user_id = auth.uid()
  ));

CREATE POLICY "Service inserts coin transactions"
  ON coin_transactions FOR INSERT
  WITH CHECK (patient_id IN (
    SELECT id FROM patients WHERE supabase_user_id = auth.uid()
  ));

-- ── Table 3: coin_rewards (discount coupons available) ───────────────────────
CREATE TABLE IF NOT EXISTS coin_rewards (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_name    TEXT NOT NULL,
  description    TEXT,
  coins_required INT  NOT NULL,
  discount_pct   INT  NOT NULL DEFAULT 0,   -- percentage off
  discount_flat  INT  NOT NULL DEFAULT 0,   -- flat INR off
  reward_type    TEXT DEFAULT 'subscription' CHECK (reward_type IN ('subscription', 'appointment', 'priority', 'general')),
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default rewards
INSERT INTO coin_rewards (reward_name, description, coins_required, discount_pct, discount_flat, reward_type)
VALUES
  ('5% Off Subscription',      'Get 5% off any Sanjeevani+ plan',          50,  5,  0,    'subscription'),
  ('10% Off Subscription',     'Get 10% off any Sanjeevani+ plan',         100, 10, 0,    'subscription'),
  ('Free Priority Booking',    'Skip the queue for 1 appointment',         75,  0,  0,    'priority'),
  ('₹200 Off Appointment',     'Flat ₹200 discount on next appointment',   120, 0,  200,  'appointment'),
  ('20% Off Subscription',     'Get 20% off any Sanjeevani+ plan',         200, 20, 0,    'subscription'),
  ('₹500 Off Subscription',    'Flat ₹500 off Sanjeevani+ plans',         250, 0,  500,  'subscription'),
  ('50% Off Subscription',     'Half price on any Sanjeevani+ plan',       500, 50, 0,    'subscription')
ON CONFLICT DO NOTHING;

ALTER TABLE coin_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active rewards"
  ON coin_rewards FOR SELECT
  USING (is_active = TRUE);

-- ── Table 4: redeemed_rewards ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS redeemed_rewards (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id    UUID REFERENCES patients(id) ON DELETE CASCADE,
  reward_id     UUID REFERENCES coin_rewards(id),
  coupon_code   TEXT UNIQUE NOT NULL,        -- e.g. 'SANJ-GOLD-A3X9'
  coins_spent   INT  NOT NULL,
  is_used       BOOLEAN DEFAULT FALSE,
  used_at       TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE redeemed_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient manages own redeemed rewards"
  ON redeemed_rewards FOR ALL
  USING (patient_id IN (
    SELECT id FROM patients WHERE supabase_user_id = auth.uid()
  ));

-- ── Helper function: add coins + update tier + log transaction ────────────────
CREATE OR REPLACE FUNCTION award_coins(
  p_patient_id  UUID,
  p_coins       INT,
  p_reason      TEXT,
  p_ref_id      UUID DEFAULT NULL
)
RETURNS INT   -- returns new balance
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_balance     INT;
  new_lifetime    INT;
  new_tier        TEXT;
BEGIN
  -- Upsert wallet
  INSERT INTO patient_coins (patient_id, balance, lifetime_earned)
    VALUES (p_patient_id, p_coins, p_coins)
  ON CONFLICT (patient_id) DO UPDATE
    SET balance        = patient_coins.balance + p_coins,
        lifetime_earned = patient_coins.lifetime_earned + GREATEST(p_coins, 0),
        updated_at     = NOW();

  -- Read back updated values
  SELECT balance, lifetime_earned INTO new_balance, new_lifetime
  FROM patient_coins
  WHERE patient_id = p_patient_id;

  -- Determine tier from lifetime earned
  new_tier := CASE
    WHEN new_lifetime >= 500 THEN 'Platinum'
    WHEN new_lifetime >= 200 THEN 'Gold'
    WHEN new_lifetime >= 100 THEN 'Silver'
    ELSE 'Bronze'
  END;

  UPDATE patient_coins SET tier = new_tier WHERE patient_id = p_patient_id;

  -- Log transaction
  INSERT INTO coin_transactions (patient_id, coins, reason, reference_id)
    VALUES (p_patient_id, p_coins, p_reason, p_ref_id);

  RETURN new_balance;
END;
$$;
