-- ============================================================
-- Sanjeevani Pharmacy Subscription Schema
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS pharmacy_subscriptions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id       UUID NOT NULL,               -- matches auth.users.id / pharmacies.id
  plan_id           TEXT NOT NULL DEFAULT 'basic'
                    CHECK (plan_id IN ('basic', 'professional', 'enterprise')),
  plan_name         TEXT NOT NULL,

  -- Payment
  amount_paid       INT  NOT NULL DEFAULT 0,     -- in INR (paise-free)
  payment_reference TEXT,                        -- UPI UTR / bank ref entered by pharmacy
  payment_method    TEXT DEFAULT 'upi',

  -- Status
  status            TEXT NOT NULL DEFAULT 'pending_payment'
                    CHECK (status IN ('pending_payment', 'active', 'expired', 'cancelled')),

  -- Validity
  started_at        DATE,                        -- set by admin on activation
  expires_at        DATE NOT NULL,               -- 1 year from registration date by default

  -- Audit
  activated_by      UUID,                        -- admin user id who verified
  activated_at      TIMESTAMPTZ,
  notes             TEXT,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast pharmacy lookups
CREATE INDEX IF NOT EXISTS idx_pharma_subs_pharmacy
  ON pharmacy_subscriptions(pharmacy_id, status);

CREATE INDEX IF NOT EXISTS idx_pharma_subs_status
  ON pharmacy_subscriptions(status);

-- One active subscription per pharmacy at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_pharma_one_active_sub
  ON pharmacy_subscriptions(pharmacy_id)
  WHERE status = 'active';

-- RLS
ALTER TABLE pharmacy_subscriptions ENABLE ROW LEVEL SECURITY;

-- Pharmacy can only read its own subscription
CREATE POLICY "Pharmacy reads own subscription"
  ON pharmacy_subscriptions FOR SELECT
  USING (pharmacy_id = auth.uid());

-- Service role (admin / edge functions) can do anything — handled by service_role key bypass
-- Admin policy for UPDATE (to activate subscription after payment verification)
CREATE POLICY "Admin manages subscriptions"
  ON pharmacy_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ─── Helper: Admin activates a subscription ─────────────────────────────────
-- Usage: SELECT activate_pharmacy_subscription('<subscription_id>', '<admin_user_id>');
CREATE OR REPLACE FUNCTION activate_pharmacy_subscription(
  sub_id  UUID,
  admin_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE pharmacy_subscriptions
  SET
    status       = 'active',
    started_at   = CURRENT_DATE,
    activated_by = admin_id,
    activated_at = NOW(),
    updated_at   = NOW()
  WHERE id = sub_id
    AND status = 'pending_payment';
END;
$$;
