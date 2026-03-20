-- 1. ALTER pharmacies table to add new fields
ALTER TABLE pharmacies
  -- Business & verification
  ADD COLUMN IF NOT EXISTS pharmacy_type    TEXT CHECK (pharmacy_type IN (
                              'Retail Pharmacy', 'Wholesale Agency',
                              'Online Pharmacy', 'Hospital Pharmacy',
                              'Diagnostic Partner'
                            )),
  ADD COLUMN IF NOT EXISTS gst_number       TEXT,
  ADD COLUMN IF NOT EXISTS drug_license_no  TEXT,
  ADD COLUMN IF NOT EXISTS pan_number       TEXT,
  ADD COLUMN IF NOT EXISTS logo_url         TEXT,
  ADD COLUMN IF NOT EXISTS city             TEXT,
  ADD COLUMN IF NOT EXISTS state            TEXT,
  ADD COLUMN IF NOT EXISTS pin_code         TEXT,
  ADD COLUMN IF NOT EXISTS website          TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'Pending'
                              CHECK (verification_status IN (
                                'Pending', 'Verified', 'Rejected', 'Suspended'
                              )),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS verified_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by      TEXT,

  -- T&C Agreement
  ADD COLUMN IF NOT EXISTS tnc_agreed           BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tnc_agreed_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tnc_version          TEXT,
  ADD COLUMN IF NOT EXISTS revenue_share_pct    DECIMAL(5,2) DEFAULT 8.00,
  ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMPTZ DEFAULT NOW();

-- 2. CREATE pharma_tnc_versions
CREATE TABLE IF NOT EXISTS pharma_tnc_versions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version      TEXT NOT NULL UNIQUE,
  effective_date DATE NOT NULL,
  summary_of_changes TEXT,
  full_text    TEXT NOT NULL,
  is_current   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pharma_tnc_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read T&C" ON pharma_tnc_versions;
CREATE POLICY "Anyone can read T&C" ON pharma_tnc_versions FOR SELECT USING (true);

-- Insert version 1.0
INSERT INTO pharma_tnc_versions (version, effective_date, summary_of_changes, full_text, is_current)
VALUES (
  'v1.0',
  '2026-04-01',
  'Initial version of the Sanjeevani Pharma Partner Revenue Sharing Agreement.',
  'SANJEEVANI PHARMA PARTNER REVENUE SHARING AGREEMENT
Version: v1.0 | Effective: 1 April 2026

1. PARTIES
   This agreement is between Sanjeevani Health Infrastructure
   Pvt. Ltd. ("Sanjeevani") and the pharmacy/agency registering
   on this platform ("Partner").

2. PLATFORM COMMISSION
   2.1 Partner agrees to pay Sanjeevani a platform commission
       of 8% (eight percent) on all gross revenue generated
       through the Sanjeevani platform each calendar month.
   2.2 This rate may be renegotiated annually with 30 days
       written notice from Sanjeevani.
   2.3 The commission is calculated on gross transaction value
       before any discounts offered to patients.

3. DEDUCTION MECHANISM
   3.1 Sanjeevani will generate a monthly statement by the
       5th of every subsequent month.
   3.2 Partner will have 5 business days to review the
       statement and raise disputes.
   3.3 If no dispute is raised, Sanjeevani will initiate the
       deduction from the registered bank account or UPI
       by the 15th of each month.
   3.4 Failed deductions will be retried twice. If all attempts
       fail, the Partner''s account will be suspended until
       outstanding dues are cleared.

4. DISPUTES
   4.1 Disputes must be raised within 5 business days of
       statement generation via the Sanjeevani Portal.
   4.2 Sanjeevani will resolve disputes within 10 business days.
   4.3 Undisputed portions of a statement will be deducted
       even if a partial dispute is raised.

5. PLATFORM ACCESS
   5.1 Active platform access is conditional on timely payment
       of commissions.
   5.2 Accounts more than 30 days overdue will be suspended.
   5.3 Accounts more than 60 days overdue may be permanently
       terminated.

6. DATA & PRIVACY
   6.1 Bank details provided are encrypted and used solely
       for commission deduction purposes.
   6.2 Sanjeevani will never share Partner financial details
       with any third party except as required by law.

7. TERMINATION
   7.1 Either party may terminate this agreement with 30 days
       written notice.
   7.2 Outstanding dues must be settled before termination
       takes effect.
   7.3 Patient data and prescription history will be retained
       as required by law.

8. GOVERNING LAW
   This agreement is governed by the laws of India.
   Disputes shall be resolved in courts of Jaipur, Rajasthan.', 
  true
) ON CONFLICT (version) DO NOTHING;


-- 3. CREATE pharmacy_bank_details
CREATE TABLE IF NOT EXISTS pharmacy_bank_details (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id       UUID REFERENCES pharmacies(id) ON DELETE CASCADE UNIQUE,

  account_holder_name  TEXT,
  bank_name            TEXT,
  account_number       TEXT,
  ifsc_code            TEXT,
  account_type         TEXT CHECK (account_type IN ('Savings', 'Current', 'OD Account')),
  branch_name          TEXT,

  upi_id               TEXT,

  bank_verified        BOOLEAN DEFAULT FALSE,
  bank_verified_at     TIMESTAMPTZ,

  preferred_method     TEXT DEFAULT 'bank' CHECK (preferred_method IN ('bank', 'upi')),

  deduction_consent          BOOLEAN DEFAULT FALSE,
  deduction_consent_at       TIMESTAMPTZ,
  deduction_consent_ip       TEXT,

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pharmacy_bank_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pharmacy reads own bank details" ON pharmacy_bank_details;
CREATE POLICY "Pharmacy reads own bank details"
  ON pharmacy_bank_details FOR SELECT
  USING (pharmacy_id::text = auth.uid()::text OR pharmacy_id IN (SELECT id FROM pharmacies WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Pharmacy updates own bank details" ON pharmacy_bank_details;
CREATE POLICY "Pharmacy updates own bank details"
  ON pharmacy_bank_details FOR INSERT WITH CHECK (
    pharmacy_id::text = auth.uid()::text OR pharmacy_id IN (SELECT id FROM pharmacies WHERE id = auth.uid())
  );
  
DROP POLICY IF EXISTS "Pharmacy modifies own bank details" ON pharmacy_bank_details;
CREATE POLICY "Pharmacy modifies own bank details"
  ON pharmacy_bank_details FOR UPDATE USING (
    pharmacy_id::text = auth.uid()::text OR pharmacy_id IN (SELECT id FROM pharmacies WHERE id = auth.uid())
  );

-- 4. CREATE pharmacy_revenue_logs
CREATE TABLE IF NOT EXISTS pharmacy_revenue_logs (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id      UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  prescription_id  UUID, -- Removed FK to prescriptions if not strictly needed now or add later
  patient_id       UUID REFERENCES patients(id) ON DELETE SET NULL,

  transaction_type TEXT CHECK (transaction_type IN (
                     'Medicine Sale',
                     'Prescription Fill',
                     'Subscription Revenue',
                     'Other'
                   )),

  gross_amount     DECIMAL(10,2) NOT NULL,
  commission_pct   DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) GENERATED ALWAYS AS
                    (ROUND(gross_amount * commission_pct / 100, 2)) STORED,
  net_amount       DECIMAL(10,2) GENERATED ALWAYS AS
                   (gross_amount - ROUND(gross_amount * commission_pct / 100, 2)) STORED,

  deduction_status TEXT DEFAULT 'Pending' CHECK (deduction_status IN (
                     'Pending', 'Deducted', 'Failed', 'Waived'
                   )),
  deducted_at      TIMESTAMPTZ,
  deduction_ref    TEXT,
  billing_month    TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_logs_pharmacy ON pharmacy_revenue_logs(pharmacy_id, billing_month DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_logs_status ON pharmacy_revenue_logs(deduction_status, billing_month);

ALTER TABLE pharmacy_revenue_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pharmacy reads own revenue" ON pharmacy_revenue_logs;
CREATE POLICY "Pharmacy reads own revenue"
  ON pharmacy_revenue_logs FOR SELECT
  USING (pharmacy_id::text = auth.uid()::text OR pharmacy_id IN (SELECT id FROM pharmacies WHERE id = auth.uid()));

-- 5. CREATE pharmacy_deduction_statements
CREATE TABLE IF NOT EXISTS pharmacy_deduction_statements (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id       UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  billing_month     TEXT NOT NULL,
  total_revenue     DECIMAL(10,2) DEFAULT 0,
  total_commission  DECIMAL(10,2) DEFAULT 0,
  total_net         DECIMAL(10,2) DEFAULT 0,
  commission_pct_applied DECIMAL(5,2),
  transaction_count INT DEFAULT 0,

  statement_status  TEXT DEFAULT 'Draft' CHECK (statement_status IN (
                      'Draft', 'Generated', 'Deducted', 'Disputed', 'Resolved'
                    )),

  generated_at      TIMESTAMPTZ,
  deducted_at       TIMESTAMPTZ,
  deduction_ref     TEXT,

  pharmacy_viewed   BOOLEAN DEFAULT FALSE,
  pharmacy_viewed_at TIMESTAMPTZ,

  dispute_reason    TEXT,
  dispute_raised_at TIMESTAMPTZ,
  dispute_resolved_at TIMESTAMPTZ,
  dispute_resolution TEXT,

  pdf_url           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pharmacy_id, billing_month)
);

ALTER TABLE pharmacy_deduction_statements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pharmacy reads own statements" ON pharmacy_deduction_statements;
CREATE POLICY "Pharmacy reads own statements"
  ON pharmacy_deduction_statements FOR SELECT
  USING (pharmacy_id::text = auth.uid()::text OR pharmacy_id IN (SELECT id FROM pharmacies WHERE id = auth.uid()));

-- 6. Monthly summary view
DROP VIEW IF EXISTS pharmacy_monthly_summary;
CREATE OR REPLACE VIEW pharmacy_monthly_summary AS
SELECT
  pharmacy_id,
  billing_month,
  COUNT(*)                    AS transaction_count,
  SUM(gross_amount)           AS total_revenue,
  SUM(commission_amount)      AS total_commission,
  SUM(net_amount)             AS total_net,
  MAX(commission_pct)         AS commission_pct_applied
FROM pharmacy_revenue_logs
WHERE deduction_status != 'Waived'
GROUP BY pharmacy_id, billing_month;

-- 7. Generate monthly statement function
CREATE OR REPLACE FUNCTION generate_pharmacy_statement(
  p_pharmacy_id UUID,
  p_billing_month TEXT
)
RETURNS UUID AS $$
DECLARE
  v_statement_id UUID;
  v_summary RECORD;
BEGIN
  SELECT * INTO v_summary
  FROM pharmacy_monthly_summary
  WHERE pharmacy_id = p_pharmacy_id
    AND billing_month = p_billing_month;

  INSERT INTO pharmacy_deduction_statements (
    pharmacy_id, billing_month,
    total_revenue, total_commission, total_net,
    commission_pct_applied, transaction_count,
    statement_status, generated_at
  )
  VALUES (
    p_pharmacy_id, p_billing_month,
    COALESCE(v_summary.total_revenue, 0),
    COALESCE(v_summary.total_commission, 0),
    COALESCE(v_summary.total_net, 0),
    COALESCE(v_summary.commission_pct_applied, 8.00),
    COALESCE(v_summary.transaction_count, 0),
    'Generated', NOW()
  )
  ON CONFLICT (pharmacy_id, billing_month)
  DO UPDATE SET
    total_revenue          = EXCLUDED.total_revenue,
    total_commission       = EXCLUDED.total_commission,
    total_net              = EXCLUDED.total_net,
    commission_pct_applied = EXCLUDED.commission_pct_applied,
    transaction_count      = EXCLUDED.transaction_count,
    statement_status       = 'Generated',
    generated_at           = NOW()
  RETURNING id INTO v_statement_id;

  RETURN v_statement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
