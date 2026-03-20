-- ============================================================
-- SANJEEVANI RLS POLICIES
-- Run this ENTIRE script in your Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================

-- ============================
-- 1. PATIENTS TABLE
-- ============================
-- Allow authenticated users to read patients (for hospital search, admin, etc.)
CREATE POLICY "Allow authenticated read patients"
  ON patients FOR SELECT TO authenticated
  USING (true);

-- Allow patients to update their own record
CREATE POLICY "Allow patients to update own record"
  ON patients FOR UPDATE TO authenticated
  USING (supabase_user_id = auth.uid());

-- Allow authenticated users to insert patients (signup, hospital creates patient)
CREATE POLICY "Allow authenticated insert patients"
  ON patients FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================
-- 2. HOSPITALS TABLE
-- ============================
-- Allow anyone (including anon) to read verified hospitals (for patient find doctors page)
CREATE POLICY "Allow public read verified hospitals"
  ON hospitals FOR SELECT TO anon, authenticated
  USING (true);

-- Allow hospitals to update their own record
CREATE POLICY "Allow hospitals to update own record"
  ON hospitals FOR UPDATE TO authenticated
  USING (supabase_user_id = auth.uid());

-- Allow authenticated users to insert hospitals (registration)
CREATE POLICY "Allow authenticated insert hospitals"
  ON hospitals FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================
-- 3. HOSPITAL_PATIENTS TABLE
-- ============================
CREATE POLICY "Allow authenticated read hospital_patients"
  ON hospital_patients FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert hospital_patients"
  ON hospital_patients FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update hospital_patients"
  ON hospital_patients FOR UPDATE TO authenticated
  USING (true);

-- ============================
-- 4. HOSPITAL_BEDS TABLE
-- ============================
CREATE POLICY "Allow authenticated read hospital_beds"
  ON hospital_beds FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert hospital_beds"
  ON hospital_beds FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update hospital_beds"
  ON hospital_beds FOR UPDATE TO authenticated
  USING (true);

-- ============================
-- 5. HOSPITAL_STAFF TABLE
-- ============================
CREATE POLICY "Allow authenticated read hospital_staff"
  ON hospital_staff FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert hospital_staff"
  ON hospital_staff FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update hospital_staff"
  ON hospital_staff FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete hospital_staff"
  ON hospital_staff FOR DELETE TO authenticated
  USING (true);

-- ============================
-- 6. HOSPITAL_BILLS TABLE
-- ============================
CREATE POLICY "Allow authenticated read hospital_bills"
  ON hospital_bills FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert hospital_bills"
  ON hospital_bills FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update hospital_bills"
  ON hospital_bills FOR UPDATE TO authenticated
  USING (true);

-- ============================
-- 7. HOSPITAL_INVENTORY TABLE
-- ============================
CREATE POLICY "Allow authenticated read hospital_inventory"
  ON hospital_inventory FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert hospital_inventory"
  ON hospital_inventory FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update hospital_inventory"
  ON hospital_inventory FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete hospital_inventory"
  ON hospital_inventory FOR DELETE TO authenticated
  USING (true);

-- ============================
-- 8. HOSPITAL_DOCUMENTS TABLE
-- ============================
CREATE POLICY "Allow authenticated read hospital_documents"
  ON hospital_documents FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert hospital_documents"
  ON hospital_documents FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update hospital_documents"
  ON hospital_documents FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete hospital_documents"
  ON hospital_documents FOR DELETE TO authenticated
  USING (true);

-- ============================
-- 9. PATIENT_APPOINTMENTS TABLE
-- ============================
CREATE POLICY "Allow authenticated read patient_appointments"
  ON patient_appointments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert patient_appointments"
  ON patient_appointments FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update patient_appointments"
  ON patient_appointments FOR UPDATE TO authenticated
  USING (true);

-- ============================
-- 10. PATIENT_MEDICATIONS TABLE
-- ============================
CREATE POLICY "Allow authenticated read patient_medications"
  ON patient_medications FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert patient_medications"
  ON patient_medications FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update patient_medications"
  ON patient_medications FOR UPDATE TO authenticated
  USING (true);

-- ============================
-- 11. PATIENT_REPORTS TABLE
-- ============================
CREATE POLICY "Allow authenticated read patient_reports"
  ON patient_reports FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert patient_reports"
  ON patient_reports FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete patient_reports"
  ON patient_reports FOR DELETE TO authenticated
  USING (true);

-- ============================
-- 12. PATIENT_VITALS TABLE
-- ============================
CREATE POLICY "Allow authenticated read patient_vitals"
  ON patient_vitals FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert patient_vitals"
  ON patient_vitals FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================
-- 13. PATIENT_TREATMENTS TABLE
-- ============================
CREATE POLICY "Allow authenticated read patient_treatments"
  ON patient_treatments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert patient_treatments"
  ON patient_treatments FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update patient_treatments"
  ON patient_treatments FOR UPDATE TO authenticated
  USING (true);

-- ============================
-- 14. PATIENT_CREATED_BY_HOSPITAL TABLE
-- ============================
CREATE POLICY "Allow authenticated read patient_created_by_hospital"
  ON patient_created_by_hospital FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert patient_created_by_hospital"
  ON patient_created_by_hospital FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================
-- 15. QR_SCAN_LOGS TABLE
-- ============================
CREATE POLICY "Allow authenticated read qr_scan_logs"
  ON qr_scan_logs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert qr_scan_logs"
  ON qr_scan_logs FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update qr_scan_logs"
  ON qr_scan_logs FOR UPDATE TO authenticated
  USING (true);

-- Public access for emergency QR scans (anon can insert)
CREATE POLICY "Allow anon insert qr_scan_logs"
  ON qr_scan_logs FOR INSERT TO anon
  WITH CHECK (true);

-- ============================
-- 16. ADMIN_LOGS TABLE
-- ============================
CREATE POLICY "Allow authenticated read admin_logs"
  ON admin_logs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert admin_logs"
  ON admin_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================
-- 17. PUBLIC QR ACCESS (patients table for emergency)
-- ============================
-- Allow anon to read patient data for emergency QR code page
CREATE POLICY "Allow anon read patients for emergency"
  ON patients FOR SELECT TO anon
  USING (true);

-- ============================
-- DONE! All tables should now be accessible.
-- ============================
