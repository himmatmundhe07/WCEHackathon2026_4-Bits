-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO FIX THE FAKE PHARMACIES

CREATE TABLE IF NOT EXISTS public.pharmacies (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pharmacy_name TEXT NOT NULL,
  owner_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  license_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;

-- Allow anyone in the ecosystem (Hospitals, Doctors, Patients) to view the list of pharmacies
CREATE POLICY "Anyone can view pharmacies" 
ON public.pharmacies 
FOR SELECT 
USING (true);

-- Allow pharmacies to manage their own profile
CREATE POLICY "Pharmacies can manage own profile" 
ON public.pharmacies 
FOR ALL 
USING (auth.uid() = id);
