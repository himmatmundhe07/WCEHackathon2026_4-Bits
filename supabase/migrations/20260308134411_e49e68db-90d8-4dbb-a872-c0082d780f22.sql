
-- Fix function search path security warnings
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
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status NOT IN ('Pending', 'Verified', 'Rejected') THEN
    RAISE EXCEPTION 'Invalid verification status: %', NEW.verification_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql
SET search_path = public;
