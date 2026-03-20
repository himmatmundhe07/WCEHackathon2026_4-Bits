
-- Hospital staff roster
CREATE TABLE hospital_staff (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id     UUID REFERENCES hospitals(id) ON DELETE CASCADE NOT NULL,
  full_name       TEXT NOT NULL,
  role            TEXT NOT NULL,
  specialization  TEXT,
  registration_no TEXT,
  phone           TEXT,
  email           TEXT,
  shift           TEXT,
  is_on_duty      BOOLEAN DEFAULT FALSE,
  joined_date     DATE,
  photo_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Bed management
CREATE TABLE hospital_beds (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id     UUID REFERENCES hospitals(id) ON DELETE CASCADE NOT NULL,
  ward_name       TEXT NOT NULL,
  bed_number      TEXT NOT NULL,
  bed_type        TEXT,
  status          TEXT DEFAULT 'Available',
  patient_id      UUID REFERENCES patients(id) ON DELETE SET NULL,
  admitted_at     TIMESTAMPTZ,
  notes           TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, bed_number)
);

-- Inventory / pharmacy stock
CREATE TABLE hospital_inventory (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id     UUID REFERENCES hospitals(id) ON DELETE CASCADE NOT NULL,
  item_name       TEXT NOT NULL,
  category        TEXT,
  quantity        INT DEFAULT 0,
  unit            TEXT,
  min_threshold   INT DEFAULT 10,
  expiry_date     DATE,
  supplier        TEXT,
  last_restocked  TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Billing records
CREATE TABLE hospital_bills (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id     UUID REFERENCES hospitals(id) ON DELETE CASCADE NOT NULL,
  patient_id      UUID REFERENCES patients(id) ON DELETE SET NULL,
  bill_number     TEXT UNIQUE,
  services        JSONB,
  subtotal        DECIMAL(10,2),
  discount        DECIMAL(10,2) DEFAULT 0,
  total           DECIMAL(10,2),
  paid_amount     DECIMAL(10,2) DEFAULT 0,
  balance         DECIMAL(10,2),
  payment_status  TEXT DEFAULT 'Pending',
  insurance_claim BOOLEAN DEFAULT FALSE,
  insurer_name    TEXT,
  claim_status    TEXT DEFAULT 'Not Filed',
  bill_date       TIMESTAMPTZ DEFAULT NOW(),
  notes           TEXT
);

-- Hospital document vault
CREATE TABLE hospital_documents (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id     UUID REFERENCES hospitals(id) ON DELETE CASCADE NOT NULL,
  doc_name        TEXT NOT NULL,
  doc_type        TEXT,
  file_url        TEXT,
  issued_by       TEXT,
  issue_date      DATE,
  expiry_date     DATE,
  status          TEXT DEFAULT 'Valid',
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Hospital-Patient relationship table
CREATE TABLE hospital_patients (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id         UUID REFERENCES hospitals(id) ON DELETE CASCADE NOT NULL,
  patient_id          UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  relationship_type   TEXT,
  admitted_at         TIMESTAMPTZ,
  discharged_at       TIMESTAMPTZ,
  ward                TEXT,
  bed_number          TEXT,
  treating_doctor     TEXT,
  treating_doctor_id  UUID REFERENCES hospital_staff(id) ON DELETE SET NULL,
  diagnosis           TEXT,
  notes               JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, patient_id, admitted_at)
);

-- QR scan logs
CREATE TABLE qr_scan_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id    UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  hospital_id   UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  scanned_by    TEXT,
  scan_location TEXT,
  scanned_at    TIMESTAMPTZ DEFAULT NOW(),
  action_taken  TEXT
);

-- Validation triggers
CREATE OR REPLACE FUNCTION public.validate_staff_role()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.role IS NOT NULL AND NEW.role NOT IN ('Doctor', 'Nurse', 'Technician', 'Support Staff', 'Admin Staff', 'Pharmacist', 'Paramedic') THEN
    RAISE EXCEPTION 'Invalid staff role: %', NEW.role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_staff_role_trigger BEFORE INSERT OR UPDATE ON hospital_staff FOR EACH ROW EXECUTE FUNCTION validate_staff_role();

CREATE OR REPLACE FUNCTION public.validate_staff_shift()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.shift IS NOT NULL AND NEW.shift NOT IN ('Morning', 'Afternoon', 'Night', 'Rotating') THEN
    RAISE EXCEPTION 'Invalid shift: %', NEW.shift;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_staff_shift_trigger BEFORE INSERT OR UPDATE ON hospital_staff FOR EACH ROW EXECUTE FUNCTION validate_staff_shift();

CREATE OR REPLACE FUNCTION public.validate_bed_type()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.bed_type IS NOT NULL AND NEW.bed_type NOT IN ('ICU', 'General', 'Private', 'Semi-Private', 'Emergency', 'Pediatric', 'Maternity') THEN
    RAISE EXCEPTION 'Invalid bed type: %', NEW.bed_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_bed_type_trigger BEFORE INSERT OR UPDATE ON hospital_beds FOR EACH ROW EXECUTE FUNCTION validate_bed_type();

CREATE OR REPLACE FUNCTION public.validate_bed_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('Available', 'Occupied', 'Reserved', 'Under Maintenance') THEN
    RAISE EXCEPTION 'Invalid bed status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_bed_status_trigger BEFORE INSERT OR UPDATE ON hospital_beds FOR EACH ROW EXECUTE FUNCTION validate_bed_status();

CREATE OR REPLACE FUNCTION public.validate_inventory_category()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.category IS NOT NULL AND NEW.category NOT IN ('Medicine', 'Equipment', 'Consumable', 'Blood Unit', 'Vaccine', 'Surgical Supply') THEN
    RAISE EXCEPTION 'Invalid inventory category: %', NEW.category;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_inventory_category_trigger BEFORE INSERT OR UPDATE ON hospital_inventory FOR EACH ROW EXECUTE FUNCTION validate_inventory_category();

CREATE OR REPLACE FUNCTION public.validate_bill_payment_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.payment_status NOT IN ('Pending', 'Partial', 'Paid', 'Insurance Claim') THEN
    RAISE EXCEPTION 'Invalid payment status: %', NEW.payment_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_bill_payment_status_trigger BEFORE INSERT OR UPDATE ON hospital_bills FOR EACH ROW EXECUTE FUNCTION validate_bill_payment_status();

CREATE OR REPLACE FUNCTION public.validate_bill_claim_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.claim_status IS NOT NULL AND NEW.claim_status NOT IN ('Not Filed', 'Filed', 'Approved', 'Rejected') THEN
    RAISE EXCEPTION 'Invalid claim status: %', NEW.claim_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_bill_claim_status_trigger BEFORE INSERT OR UPDATE ON hospital_bills FOR EACH ROW EXECUTE FUNCTION validate_bill_claim_status();

CREATE OR REPLACE FUNCTION public.validate_doc_type()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.doc_type IS NOT NULL AND NEW.doc_type NOT IN ('License', 'Accreditation', 'NABH Certificate', 'Fire NOC', 'Pollution Certificate', 'Insurance', 'Staff Certificate', 'Other') THEN
    RAISE EXCEPTION 'Invalid doc type: %', NEW.doc_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_doc_type_trigger BEFORE INSERT OR UPDATE ON hospital_documents FOR EACH ROW EXECUTE FUNCTION validate_doc_type();

CREATE OR REPLACE FUNCTION public.validate_doc_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('Valid', 'Expiring Soon', 'Expired') THEN
    RAISE EXCEPTION 'Invalid doc status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_doc_status_trigger BEFORE INSERT OR UPDATE ON hospital_documents FOR EACH ROW EXECUTE FUNCTION validate_doc_status();

CREATE OR REPLACE FUNCTION public.validate_relationship_type()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.relationship_type IS NOT NULL AND NEW.relationship_type NOT IN ('Admitted', 'Outpatient', 'Discharged', 'Emergency') THEN
    RAISE EXCEPTION 'Invalid relationship type: %', NEW.relationship_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_relationship_type_trigger BEFORE INSERT OR UPDATE ON hospital_patients FOR EACH ROW EXECUTE FUNCTION validate_relationship_type();

-- RLS policies
ALTER TABLE hospital_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital owns staff" ON hospital_staff FOR ALL
  USING (hospital_id IN (SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()));

CREATE POLICY "Hospital owns beds" ON hospital_beds FOR ALL
  USING (hospital_id IN (SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()));

CREATE POLICY "Hospital owns inventory" ON hospital_inventory FOR ALL
  USING (hospital_id IN (SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()));

CREATE POLICY "Hospital owns bills" ON hospital_bills FOR ALL
  USING (hospital_id IN (SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()));

CREATE POLICY "Hospital owns documents" ON hospital_documents FOR ALL
  USING (hospital_id IN (SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()));

CREATE POLICY "Hospital owns its patient relationships" ON hospital_patients FOR ALL
  USING (hospital_id IN (SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()));

CREATE POLICY "Hospital can view its QR scans" ON qr_scan_logs FOR ALL
  USING (hospital_id IN (SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()));

-- Update triggers for updated_at
CREATE TRIGGER update_hospital_beds_updated_at BEFORE UPDATE ON hospital_beds FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_hospital_inventory_updated_at BEFORE UPDATE ON hospital_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_hospital_patients_updated_at BEFORE UPDATE ON hospital_patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
