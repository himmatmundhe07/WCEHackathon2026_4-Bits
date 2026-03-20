-- PHARMA / PHARMACY ANALYTICS SCHEMA
-- Run this in Supabase SQL Editor

-- 1. Medication Adherence Logs
-- Tracks when patients take their prescribed medication
CREATE TABLE IF NOT EXISTS public.medication_adherence_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES public.patient_medications(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Taken', 'Missed', 'Rescheduled')),
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_at TIMESTAMPTZ NOT NULL
);

-- 2. Medication Side Effects
-- Allows patients to report side effects for specific medications
CREATE TABLE IF NOT EXISTS public.medication_side_effects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES public.patient_medications(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    side_effect TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('Mild', 'Moderate', 'Severe')),
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- 3. Medication Effectiveness Reports
-- Doctors or patients can report the outcome of a treatment
CREATE TABLE IF NOT EXISTS public.medication_effectiveness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES public.patient_medications(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('Improved', 'No Effect', 'Worsened')),
    reported_by_role TEXT NOT NULL CHECK (reported_by_role IN ('Doctor', 'Patient')),
    reported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.medication_adherence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_side_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_effectiveness ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for prototype)
CREATE POLICY "Pharma users can view all analytics" ON public.medication_adherence_logs
    FOR SELECT USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'pharma');

CREATE POLICY "Pharma users can view all side effects" ON public.medication_side_effects
    FOR SELECT USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'pharma');

CREATE POLICY "Pharma users can view all effectiveness reports" ON public.medication_effectiveness
    FOR SELECT USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'pharma');

-- Patients can insert their own data
CREATE POLICY "Patients can insert adherence" ON public.medication_adherence_logs
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT supabase_user_id FROM public.patients WHERE id = patient_id));

CREATE POLICY "Patients can insert side effects" ON public.medication_side_effects
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT supabase_user_id FROM public.patients WHERE id = patient_id));
