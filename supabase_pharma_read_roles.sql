-- Run this strictly in the Supabase SQL Editor on your browser!

-- 1. Add columns to allow tracking which data is shared
ALTER TABLE public.prescription_feedback 
ADD COLUMN IF NOT EXISTS shared_with_pharma BOOLEAN DEFAULT FALSE;

ALTER TABLE public.prescription_feedback 
ADD COLUMN IF NOT EXISTS shared_pharma_network TEXT;

-- 2. Give Pharma users permission to read shared feedback
CREATE POLICY "Pharma reads shared prescription feedback"
ON public.prescription_feedback 
FOR SELECT 
USING (
  shared_with_pharma = true 
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'pharma'
);

-- 3. Give Pharma users permission to read medicines connected to prescriptions
CREATE POLICY "Pharma reads prescription medicines"
ON public.prescription_medicines 
FOR SELECT 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'pharma'
);

-- 4. Just in case, grant SELECT access on the public schema tables to authenticated users
GRANT SELECT ON public.prescription_feedback TO authenticated;
GRANT SELECT ON public.prescription_medicines TO authenticated;
