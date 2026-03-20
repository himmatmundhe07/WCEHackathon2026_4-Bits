
-- Create patients table
CREATE TABLE public.patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  age INT,
  gender TEXT,
  profile_photo_url TEXT,
  aadhaar_number TEXT UNIQUE,
  aadhaar_verified BOOLEAN DEFAULT FALSE,
  abha_card_no TEXT UNIQUE,
  abha_id TEXT UNIQUE,
  blood_group TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pin_code TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  allergies TEXT[] DEFAULT '{}',
  chronic_conditions TEXT[] DEFAULT '{}',
  current_medications TEXT[] DEFAULT '{}',
  past_surgeries TEXT[] DEFAULT '{}',
  disabilities TEXT[] DEFAULT '{}',
  organ_donor BOOLEAN DEFAULT FALSE,
  has_insurance BOOLEAN DEFAULT FALSE,
  insurance_type TEXT,
  insurance_provider TEXT,
  insurance_policy_no TEXT,
  insurance_card_url TEXT,
  insurance_validity_date DATE,
  sum_insured TEXT,
  ayushman_bharat_enrolled BOOLEAN DEFAULT FALSE,
  ayushman_beneficiary_id TEXT,
  state_scheme_name TEXT,
  state_scheme_id TEXT,
  supabase_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validation triggers (using triggers instead of CHECK constraints)
CREATE OR REPLACE FUNCTION public.validate_patient_gender()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.gender IS NOT NULL AND NEW.gender NOT IN ('Male', 'Female', 'Other', 'Prefer not to say') THEN
    RAISE EXCEPTION 'Invalid gender: %', NEW.gender;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_patient_gender_trigger
BEFORE INSERT OR UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.validate_patient_gender();

CREATE OR REPLACE FUNCTION public.validate_patient_blood_group()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.blood_group IS NOT NULL AND NEW.blood_group NOT IN ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown') THEN
    RAISE EXCEPTION 'Invalid blood group: %', NEW.blood_group;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_patient_blood_group_trigger
BEFORE INSERT OR UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.validate_patient_blood_group();

CREATE OR REPLACE FUNCTION public.validate_patient_insurance_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.insurance_type IS NOT NULL AND NEW.insurance_type NOT IN ('Government', 'Private', 'Corporate / Employer', 'None') THEN
    RAISE EXCEPTION 'Invalid insurance type: %', NEW.insurance_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_patient_insurance_type_trigger
BEFORE INSERT OR UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.validate_patient_insurance_type();

-- Auto-update updated_at using existing function
CREATE TRIGGER patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Row Level Security
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient can view own record"
  ON public.patients FOR SELECT
  TO authenticated
  USING (auth.uid() = supabase_user_id);

CREATE POLICY "Patient can update own record"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (auth.uid() = supabase_user_id);

CREATE POLICY "Allow patient insert on signup"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = supabase_user_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-photos', 'patient-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-documents', 'patient-documents', false);

-- Storage policies for patient-photos (public read, authenticated upload)
CREATE POLICY "Patient photos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'patient-photos');

CREATE POLICY "Authenticated users can upload patient photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'patient-photos');

CREATE POLICY "Users can update their own patient photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'patient-photos');

-- Storage policies for patient-documents (private)
CREATE POLICY "Authenticated users can upload patient documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'patient-documents');

CREATE POLICY "Users can view their own patient documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'patient-documents');
