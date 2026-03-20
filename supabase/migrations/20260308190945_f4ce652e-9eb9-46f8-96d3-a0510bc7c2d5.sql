
-- Create storage buckets for hospital-staff-photos and patient-reports
INSERT INTO storage.buckets (id, name, public) VALUES ('hospital-staff-photos', 'hospital-staff-photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-reports', 'patient-reports', false) ON CONFLICT (id) DO NOTHING;

-- RLS for hospital-staff-photos (public read, hospital upload)
CREATE POLICY "Anyone can view staff photos" ON storage.objects FOR SELECT USING (bucket_id = 'hospital-staff-photos');
CREATE POLICY "Hospital uploads staff photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hospital-staff-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Hospital deletes staff photos" ON storage.objects FOR DELETE USING (bucket_id = 'hospital-staff-photos' AND auth.role() = 'authenticated');

-- RLS for patient-reports bucket
CREATE POLICY "Authenticated can upload patient reports" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'patient-reports' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated can read patient reports" ON storage.objects FOR SELECT USING (bucket_id = 'patient-reports' AND auth.role() = 'authenticated');

-- Hospital RLS on patient_appointments (hospitals need to see/manage their appointments)
CREATE POLICY "Hospital sees its appointments" ON patient_appointments FOR ALL TO authenticated
  USING (hospital_id IN (SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()));

-- Hospital RLS on patient_vitals
CREATE POLICY "Hospital manages vitals" ON patient_vitals FOR ALL TO authenticated
  USING (patient_id IN (
    SELECT patient_id FROM hospital_patients WHERE hospital_id IN (
      SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()
    )
  ));

-- Hospital RLS on patient_reports  
CREATE POLICY "Hospital manages reports" ON patient_reports FOR ALL TO authenticated
  USING (patient_id IN (
    SELECT patient_id FROM hospital_patients WHERE hospital_id IN (
      SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()
    )
  ));

-- Hospital can read patient data for their admitted patients
CREATE POLICY "Hospital reads its patients" ON patients FOR SELECT TO authenticated
  USING (id IN (
    SELECT patient_id FROM hospital_patients WHERE hospital_id IN (
      SELECT id FROM hospitals WHERE supabase_user_id = auth.uid()
    )
  ));
