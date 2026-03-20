
-- Create hospitals table
CREATE TABLE public.hospitals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_name TEXT NOT NULL,
  license_id TEXT NOT NULL UNIQUE,
  license_document_url TEXT,
  facility_type TEXT,
  year_established INT,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pin_code TEXT,
  phone TEXT,
  emergency_helpline TEXT,
  email TEXT NOT NULL,
  website TEXT,
  maps_link TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  total_doctors INT DEFAULT 0,
  total_nurses INT DEFAULT 0,
  support_staff INT DEFAULT 0,
  total_beds INT DEFAULT 0,
  icu_beds INT DEFAULT 0,
  general_ward_beds INT DEFAULT 0,
  private_rooms INT DEFAULT 0,
  operation_theatres INT DEFAULT 0,
  ambulances INT DEFAULT 0,
  emergency_24x7 BOOLEAN DEFAULT FALSE,
  blood_bank BOOLEAN DEFAULT FALSE,
  pharmacy BOOLEAN DEFAULT FALSE,
  specializations TEXT[] DEFAULT '{}',
  custom_specializations TEXT[] DEFAULT '{}',
  admin_name TEXT,
  admin_designation TEXT,
  admin_email TEXT NOT NULL,
  supabase_user_id UUID NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  two_fa_completed BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'Pending',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validation trigger for facility_type
CREATE OR REPLACE FUNCTION public.validate_hospital_facility_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.facility_type IS NOT NULL AND NEW.facility_type NOT IN (
    'Private Hospital', 'Government Hospital', 'Clinic',
    'Nursing Home', 'Diagnostic Center', 'Trauma Center'
  ) THEN
    RAISE EXCEPTION 'Invalid facility type: %', NEW.facility_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_facility_type
BEFORE INSERT OR UPDATE ON public.hospitals
FOR EACH ROW EXECUTE FUNCTION public.validate_hospital_facility_type();

-- Validation trigger for verification_status
CREATE OR REPLACE FUNCTION public.validate_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status NOT IN ('Pending', 'Verified', 'Rejected') THEN
    RAISE EXCEPTION 'Invalid verification status: %', NEW.verification_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_verification_status
BEFORE INSERT OR UPDATE ON public.hospitals
FOR EACH ROW EXECUTE FUNCTION public.validate_verification_status();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hospitals_updated_at
BEFORE UPDATE ON public.hospitals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable RLS
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital can view own record"
  ON public.hospitals FOR SELECT
  TO authenticated
  USING (auth.uid() = supabase_user_id);

CREATE POLICY "Hospital can update own record"
  ON public.hospitals FOR UPDATE
  TO authenticated
  USING (auth.uid() = supabase_user_id);

CREATE POLICY "Allow authenticated registration insert"
  ON public.hospitals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = supabase_user_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('hospital-documents', 'hospital-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('hospital-logos', 'hospital-logos', true);

-- Storage policies: authenticated upload to documents
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'hospital-documents');

CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'hospital-documents');

-- Storage policies: public logo access
CREATE POLICY "Anyone can upload logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'hospital-logos');

CREATE POLICY "Public can view logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hospital-logos');
