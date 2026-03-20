
-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Patient can insert own record" ON public.patients;

-- Create a new INSERT policy that allows:
-- 1. Users inserting their own record (supabase_user_id = auth.uid())
-- 2. Admins inserting on behalf of patients
CREATE POLICY "Patient or admin can insert"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = supabase_user_id
  OR is_admin(auth.uid())
);
