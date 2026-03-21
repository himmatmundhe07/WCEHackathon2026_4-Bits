-- Add ngo_id to link patients to the NGO that created their profile
ALTER TABLE patients ADD COLUMN IF NOT EXISTS ngo_id UUID REFERENCES auth.users(id);

-- Depending on your existing RLS policies on the patients table, 
-- you may want to add a policy allowing NGOs to view their own patients:
-- CREATE POLICY "NGOs can view their added patients" on patients FOR SELECT USING (ngo_id = auth.uid());
