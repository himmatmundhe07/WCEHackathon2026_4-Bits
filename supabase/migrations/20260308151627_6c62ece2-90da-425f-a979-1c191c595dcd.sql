
-- Create admin_logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action        TEXT NOT NULL,
  target_type   TEXT,
  target_id     UUID,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin role from user metadata
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT raw_user_meta_data ->> 'role' = 'admin'
     FROM auth.users WHERE id = _user_id),
    false
  )
$$;

-- Admin logs: only admins can access
CREATE POLICY "Admin can read logs"
  ON public.admin_logs FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin can insert logs"
  ON public.admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Drop existing restrictive policies on hospitals to replace with permissive ones that include admin
DROP POLICY IF EXISTS "Hospital can view own record" ON public.hospitals;
DROP POLICY IF EXISTS "Hospital can update own record" ON public.hospitals;
DROP POLICY IF EXISTS "Allow authenticated registration insert" ON public.hospitals;

-- Recreate hospital policies as permissive with admin access
CREATE POLICY "Hospital or admin can view"
  ON public.hospitals FOR SELECT
  TO authenticated
  USING (auth.uid() = supabase_user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Hospital or admin can update"
  ON public.hospitals FOR UPDATE
  TO authenticated
  USING (auth.uid() = supabase_user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Hospital can insert own record"
  ON public.hospitals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = supabase_user_id);

-- Drop existing restrictive policies on patients
DROP POLICY IF EXISTS "Patient can view own record" ON public.patients;
DROP POLICY IF EXISTS "Patient can update own record" ON public.patients;
DROP POLICY IF EXISTS "Allow patient insert on signup" ON public.patients;

-- Recreate patient policies with admin read access
CREATE POLICY "Patient or admin can view"
  ON public.patients FOR SELECT
  TO authenticated
  USING (auth.uid() = supabase_user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Patient can update own record"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (auth.uid() = supabase_user_id);

CREATE POLICY "Patient can insert own record"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = supabase_user_id);

-- Enable realtime for hospitals table
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospitals;
