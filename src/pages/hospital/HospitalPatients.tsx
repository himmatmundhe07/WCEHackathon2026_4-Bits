import { useEffect, useState, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Search, Plus, Eye, FileText, LogOut as DischargeIcon, X, Pill, AlertTriangle, UserPlus, Mail, Loader2, Download } from 'lucide-react';
import { addDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import TagInput from '@/components/patient/TagInput';
import type { HospitalProfile } from '@/hooks/useHospitalContext';
import DoctorFitnessPanel from '@/components/hospital/DoctorFitnessPanel';

type RelType = 'All' | 'Admitted' | 'Outpatient' | 'Discharged' | 'Emergency';

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  Admitted: { bg: '#EBF7FA', color: '#0891B2', label: '🛏 Admitted' },
  Outpatient: { bg: '#FFFBEB', color: '#D97706', label: '🚶 Outpatient' },
  Discharged: { bg: '#F0FDF4', color: '#059669', label: '✅ Discharged' },
  Emergency: { bg: '#FEF2F2', color: '#DC2626', label: '🚨 Emergency' },
};

const severityStyles: Record<string, { bg: string; color: string; selectedBg: string; selectedColor: string }> = {
  Mild: { bg: '#F0FDF4', color: '#059669', selectedBg: '#10B981', selectedColor: '#fff' },
  Moderate: { bg: '#FFFBEB', color: '#D97706', selectedBg: '#F59E0B', selectedColor: '#fff' },
  Severe: { bg: '#FEF2F2', color: '#DC2626', selectedBg: '#EF4444', selectedColor: '#fff' },
  Critical: { bg: '#DC2626', color: '#fff', selectedBg: '#DC2626', selectedColor: '#fff' },
};

const routeColors: Record<string, { bg: string; color: string }> = {
  Oral: { bg: '#F1F5F9', color: '#64748B' },
  IV: { bg: '#EBF7FA', color: '#0891B2' },
  IM: { bg: '#FFFBEB', color: '#D97706' },
  Topical: { bg: '#F1F5F9', color: '#94A3B8' },
  Inhaled: { bg: '#E0F2FE', color: '#0284C7' },
  Subcutaneous: { bg: '#F5F3FF', color: '#7C3AED' },
  Other: { bg: '#F1F5F9', color: '#64748B' },
};

const MandanaDivider = () => (
  <div className="flex items-center gap-3 my-5">
    <div className="flex-1 h-px" style={{ background: '#E2EEF1' }} />
    <span style={{ color: '#E8A820', fontSize: '14px' }}>◇ — ◇</span>
    <div className="flex-1 h-px" style={{ background: '#E2EEF1' }} />
  </div>
);

const HospitalPatients = () => {
  const { hospital } = useOutletContext<{ hospital: HospitalProfile | null }>();
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RelType>('All');
  const [areaFilter, setAreaFilter] = useState<string>('All Areas');
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState('overview');
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [dischargePatient, setDischargePatient] = useState<any>(null);
  const [admitStep, setAdmitStep] = useState(1);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedAdmitPatient, setSelectedAdmitPatient] = useState<any>(null);
  const [admitForm, setAdmitForm] = useState({ relationship_type: 'Admitted', ward: '', bed_id: '', doctor_id: '', doctor_name: '', nurse_id: '', nurse_name: '', diagnosis: '', notes: '' });
  const [wards, setWards] = useState<string[]>([]);
  const [availableBeds, setAvailableBeds] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [nurses, setNurses] = useState<any[]>([]);
  const [dischargeForm, setDischargeForm] = useState({ discharge_summary: '', discharge_condition: 'Recovered', follow_up_date: '', follow_up_doctor: '' });

  // Create patient account state
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [createForm, setCreateForm] = useState({ full_name: '', email: '', phone: '', date_of_birth: '', blood_group: '' });
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Tab 6 state
  const [treatment, setTreatment] = useState<any>(null);
  const [treatmentLoading, setTreatmentLoading] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(false);
  const [editingNurse, setEditingNurse] = useState(false);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [editMedicineIdx, setEditMedicineIdx] = useState<number | null>(null);
  const [medicineForm, setMedicineForm] = useState({ name: '', dosage: '', route: 'Oral', frequency: 'Once daily', start_date: new Date().toISOString().split('T')[0], end_date: '', prescribed_by: '', notes: '' });
  const [showAllergyConfirm, setShowAllergyConfirm] = useState(false);
  const [passwordNotSet, setPasswordNotSet] = useState<boolean | null>(null);

  // Prescription tab state
  const [patientRxList, setPatientRxList] = useState<any[]>([]);
  const [patientRxMeds, setPatientRxMeds] = useState<any[]>([]);
  const [rxFeedbacks, setRxFeedbacks] = useState<any[]>([]);
  const [showRxModal, setShowRxModal] = useState(false);
  const [rxViewFeedback, setRxViewFeedback] = useState<any>(null);
  const [rxSaving, setRxSaving] = useState(false);
  const [rxForm, setRxForm] = useState({
    diagnosis: '', instructions: '', feedbackDays: 0, requestFeedback: true, validDays: 30,
    medicines: [{ name: '', dosage: '', form: 'Tablet', timesPerDay: 3, durationDays: 7, instructions: '' }] as any[],
  });

  const fetchPatients = useCallback(async () => {
    if (!hospital) return;
    let q = supabase
      .from('hospital_patients')
      .select('*, patients(*)')
      .eq('hospital_id', hospital.id)
      .order('admitted_at', { ascending: false });
    if (filter !== 'All') q = q.eq('relationship_type', filter);
    const { data, error } = await q;
    if (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patients");
    }
    setPatients(data || []);
    setLoading(false);
  }, [hospital, filter]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  useEffect(() => {
    if (!hospital) return;
    const fetchMeta = async () => {
      const [bedsRes, staffRes, nurseRes] = await Promise.all([
        supabase.from('hospital_beds').select('ward_name').eq('hospital_id', hospital.id),
        supabase.from('hospital_staff').select('id, full_name, specialization, shift').eq('hospital_id', hospital.id).eq('role', 'Doctor'),
        supabase.from('hospital_staff').select('id, full_name, role, shift').eq('hospital_id', hospital.id).in('role', ['Nurse', 'Paramedic']),
      ]);
      setWards([...new Set((bedsRes.data || []).map(b => b.ward_name))]);
      setDoctors(staffRes.data || []);
      setNurses(nurseRes.data || []);
    };
    fetchMeta();
  }, [hospital]);

  const fetchNotes = async (patientId: string) => {
    if (!hospital) return;
    const { data } = await supabase.from('treatment_notes').select('*').eq('patient_id', patientId).eq('hospital_id', hospital.id).order('created_at', { ascending: false });
    setNotes(data || []);
  };

  const fetchTreatment = async (admissionId: string) => {
    setTreatmentLoading(true);
    const { data } = await supabase.from('patient_treatments').select('*').eq('admission_id', admissionId).single();
    setTreatment(data);
    setTreatmentLoading(false);
  };

  const checkPasswordStatus = async (patientId: string) => {
    const { data } = await supabase.from('patient_created_by_hospital').select('password_set').eq('patient_id', patientId).maybeSingle();
    setPasswordNotSet(data ? !data.password_set : null);
  };

  const fetchPatientRx = async (patientId: string) => {
    if (!hospital) return;
    const [rxRes, fbRes] = await Promise.all([
      supabase.from('prescriptions').select('*').eq('patient_id', patientId).eq('hospital_id', hospital.id).order('prescription_date', { ascending: false }),
      supabase.from('prescription_feedback').select('*').eq('patient_id', patientId).eq('hospital_id', hospital.id),
    ]);
    setPatientRxList(rxRes.data || []);
    setRxFeedbacks(fbRes.data || []);
  };

  const generateSchedule = (timesPerDay: number) => {
    const templates: Record<number, { time: string; label: string; with: string }[]> = {
      1: [{ time: '08:00', label: 'Morning', with: 'After breakfast' }],
      2: [{ time: '08:00', label: 'Morning', with: 'After breakfast' }, { time: '21:00', label: 'Night', with: 'After dinner' }],
      3: [{ time: '08:00', label: 'Morning', with: 'After breakfast' }, { time: '14:00', label: 'Afternoon', with: 'After lunch' }, { time: '21:00', label: 'Night', with: 'After dinner' }],
      4: [{ time: '08:00', label: 'Morning', with: 'After breakfast' }, { time: '14:00', label: 'Afternoon', with: 'After lunch' }, { time: '18:00', label: 'Evening', with: 'Before dinner' }, { time: '21:00', label: 'Night', with: 'After dinner' }],
    };
    return templates[timesPerDay] || templates[3];
  };

  const submitPrescription = async () => {
    if (!hospital || !selectedPatient) return;
    const patientId = selectedPatient.patients?.id || selectedPatient.patient_id;
    if (!rxForm.diagnosis || rxForm.medicines.some((m: any) => !m.name || !m.dosage)) {
      toast.error('Please fill diagnosis and all medicine fields.');
      return;
    }
    setRxSaving(true);
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const doctorName = selectedPatient.treating_doctor || hospital.admin_name || 'Doctor';
      const doctorId = selectedPatient.treating_doctor_id || null;

      const { data: rx, error: rxErr } = await supabase.from('prescriptions').insert([{
        hospital_id: hospital.id,
        patient_id: patientId,
        doctor_id: doctorId,
        doctor_name: doctorName,
        doctor_specialization: null,
        admission_id: selectedPatient.id || null,
        diagnosis: rxForm.diagnosis,
        general_instructions: rxForm.instructions || null,
        feedback_after_days: rxForm.feedbackDays,
        feedback_requested: rxForm.requestFeedback,
        feedback_deadline_date: rxForm.requestFeedback ? addDays(new Date(), rxForm.feedbackDays).toISOString().split('T')[0] : null,
        prescription_date: todayDate,
        valid_until: addDays(new Date(), rxForm.validDays).toISOString().split('T')[0],
      }]).select().single();

      if (rxErr) throw rxErr;

      const medsRows = rxForm.medicines.map((m: any) => ({
        prescription_id: rx.id,
        patient_id: patientId,
        medicine_name: m.name,
        dosage: m.dosage,
        medicine_form: m.form,
        times_per_day: m.timesPerDay,
        schedule: generateSchedule(m.timesPerDay),
        duration_days: m.durationDays,
        start_date: todayDate,
        end_date: m.durationDays ? addDays(new Date(), m.durationDays).toISOString().split('T')[0] : null,
        special_instructions: m.instructions || null,
      }));

      const { error: medsErr } = await supabase.from('prescription_medicines').insert(medsRows);
      if (medsErr) throw medsErr;

      toast.success('💊 Prescription issued! Patient can now see it on their dashboard.');
      setShowRxModal(false);
      setRxForm({ diagnosis: '', instructions: '', feedbackDays: 0, requestFeedback: true, validDays: 30, medicines: [{ name: '', dosage: '', form: 'Tablet', timesPerDay: 3, durationDays: 7, instructions: '' }] });
      fetchPatientRx(patientId);
    } catch (e: any) {
      toast.error('Error: ' + (e.message || 'Failed'));
    } finally {
      setRxSaving(false);
    }
  };

  const openDrawer = (p: any) => {
    setSelectedPatient(p);
    setDrawerTab('overview');
    fetchNotes(p.patients?.id || p.patient_id);
    checkPasswordStatus(p.patients?.id || p.patient_id);
    fetchPatientRx(p.patients?.id || p.patient_id);
    if (p.id) fetchTreatment(p.id);
  };

  const addNote = async () => {
    if (!hospital || !selectedPatient || !newNote.trim()) return;
    await supabase.from('treatment_notes').insert({ patient_id: selectedPatient.patients?.id || selectedPatient.patient_id, hospital_id: hospital.id, staff_name: hospital.admin_name || 'Admin', staff_role: 'Admin', note: newNote.trim() });
    setNewNote('');
    fetchNotes(selectedPatient.patients?.id || selectedPatient.patient_id);
    toast.success('Note added');
  };

  // Patient search
  const searchPatients = async () => {
    if (!patientSearch.trim()) return;
    const q = patientSearch.trim();
    const { data } = await supabase.from('patients').select('id, full_name, profile_photo_url, blood_group, allergies, abha_id, email').or(`abha_id.eq.${q},full_name.ilike.%${q}%,email.eq.${q}`).limit(5);
    setSearchResults(data || []);
    setShowCreatePatient(false);
    setCreateSuccess(false);
  };

  const fetchAvailableBeds = async (ward: string) => {
    if (!hospital) return;
    const { data } = await supabase.from('hospital_beds').select('id, bed_number, bed_type').eq('hospital_id', hospital.id).eq('ward_name', ward).eq('status', 'Available');
    setAvailableBeds(data || []);
  };

  const confirmAdmit = async () => {
    if (!hospital || !selectedAdmitPatient) return;
    const { data: admData, error } = await supabase.from('hospital_patients').insert({
      hospital_id: hospital.id,
      patient_id: selectedAdmitPatient.id,
      treating_doctor_id: admitForm.doctor_id || null,
      treating_doctor: admitForm.doctor_name || null,
      assigned_nurse_id: admitForm.nurse_id || null,
      assigned_nurse: admitForm.nurse_name || null,
      relationship_type: admitForm.relationship_type,
      ward: admitForm.ward,
      bed_number: availableBeds.find(b => b.id === admitForm.bed_id)?.bed_number || null,
      diagnosis: admitForm.diagnosis,
      notes: admitForm.notes,
    }).select('id').single();
    if (error) { toast.error(error.message); return; }
    if (admitForm.bed_id) {
      await supabase.from('hospital_beds').update({ status: 'Occupied', patient_id: selectedAdmitPatient.id, admitted_at: new Date().toISOString() }).eq('id', admitForm.bed_id);
    }
    // Create blank treatment record
    if (admData) {
      await supabase.from('patient_treatments').insert({
        hospital_id: hospital.id,
        patient_id: selectedAdmitPatient.id,
        admission_id: admData.id,
        assigned_doctor: admitForm.doctor_name || null,
        assigned_doctor_id: admitForm.doctor_id || null,
        assigned_nurse: admitForm.nurse_name || null,
        assigned_nurse_id: admitForm.nurse_id || null,
      });
    }
    toast.success(`🏥 ${selectedAdmitPatient.full_name} admitted to ${admitForm.ward}`);
    setShowAdmitModal(false);
    resetAdmitForm();
    fetchPatients();
  };

  const resetAdmitForm = () => {
    setAdmitStep(1);
    setPatientSearch('');
    setSearchResults([]);
    setSelectedAdmitPatient(null);
    setShowCreatePatient(false);
    setCreateSuccess(false);
    setCreateForm({ full_name: '', email: '', phone: '', date_of_birth: '', blood_group: '' });
    setAdmitForm({ relationship_type: 'Admitted', ward: '', bed_id: '', doctor_id: '', doctor_name: '', nurse_id: '', nurse_name: '', diagnosis: '', notes: '' });
  };

  // Create patient account
  const createPatientAccount = async () => {
    if (!hospital || !createForm.full_name.trim() || !createForm.email.trim() || !createForm.phone.trim()) {
      toast.error('Full name, email, and phone are required');
      return;
    }
    setCreatingPatient(true);
    try {
      // Step 1: Create auth user via edge function
      const { data: fnData, error: fnError } = await supabase.functions.invoke('create-auth-user', {
        body: { email: createForm.email, password: crypto.randomUUID(), metadata: { role: 'patient', full_name: createForm.full_name } },
      });
      if (fnError || fnData?.error) {
        toast.error(fnData?.error || fnError?.message || 'Failed to create account');
        setCreatingPatient(false);
        return;
      }
      const userId = fnData.userId;

      // Step 2: Insert patient record
      const { data: patData, error: patErr } = await supabase.from('patients').insert({
        full_name: createForm.full_name,
        email: createForm.email,
        phone: createForm.phone,
        date_of_birth: createForm.date_of_birth || null,
        blood_group: createForm.blood_group || null,
        supabase_user_id: userId,
      }).select('id, full_name, blood_group, allergies, abha_id, email, profile_photo_url').single();

      if (patErr) { toast.error(patErr.message); setCreatingPatient(false); return; }

      // Step 3: Log creation
      await supabase.from('patient_created_by_hospital').insert({
        patient_id: patData.id,
        hospital_id: hospital.id,
        created_by_staff: hospital.admin_name || 'Admin',
        password_set: false,
        notes: `Created during admission at ${hospital.hospital_name}`,
      });

      // Step 4: Password reset will be sent when patient first tries to log in
      // (admin.generateLink is not available from client — patient uses "forgot password" to set up)

      setSelectedAdmitPatient(patData);
      setCreateSuccess(true);
      toast.success(`✅ Account created for ${createForm.full_name}`);
    } catch (err: any) {
      toast.error(err.message || 'Unexpected error');
    }
    setCreatingPatient(false);
  };

  const confirmDischarge = async () => {
    if (!hospital || !dischargePatient) return;
    await supabase.from('hospital_patients').update({
      discharged_at: new Date().toISOString(), relationship_type: 'Discharged',
      discharge_summary: dischargeForm.discharge_summary, discharge_condition: dischargeForm.discharge_condition,
      follow_up_date: dischargeForm.follow_up_date || null, follow_up_doctor: dischargeForm.follow_up_doctor || null,
    }).eq('id', dischargePatient.id);
    if (dischargePatient.bed_number) {
      await supabase.from('hospital_beds').update({ status: 'Available', patient_id: null, admitted_at: null }).eq('hospital_id', hospital.id).eq('bed_number', dischargePatient.bed_number);
    }
    toast.success(`✅ ${dischargePatient.patients?.full_name} discharged.`);
    setShowDischargeModal(false);
    setDischargePatient(null);
    setDischargeForm({ discharge_summary: '', discharge_condition: 'Recovered', follow_up_date: '', follow_up_doctor: '' });
    fetchPatients();
  };

  // Tab 6 operations
  const saveTreatmentCondition = async () => {
    if (!treatment) return;
    await supabase.from('patient_treatments').update({
      current_disease: treatment.current_disease, disease_severity: treatment.disease_severity,
      treatment_plan: treatment.treatment_plan, other_instructions: treatment.other_instructions,
      last_updated_by: hospital?.admin_name || 'Admin', last_updated_at: new Date().toISOString(),
    }).eq('id', treatment.id);
    toast.success('✅ Treatment record updated.');
  };

  const saveMedicine = async () => {
    if (!treatment || !medicineForm.name.trim()) return;
    const meds = [...(treatment.prescribed_medicines || [])];
    const entry = { ...medicineForm };
    if (editMedicineIdx !== null) {
      meds[editMedicineIdx] = entry;
    } else {
      meds.push(entry);
    }
    await supabase.from('patient_treatments').update({
      prescribed_medicines: meds, last_updated_by: hospital?.admin_name || 'Admin', last_updated_at: new Date().toISOString(),
    }).eq('id', treatment.id);
    setTreatment({ ...treatment, prescribed_medicines: meds });
    setShowAddMedicine(false);
    setEditMedicineIdx(null);
    setMedicineForm({ name: '', dosage: '', route: 'Oral', frequency: 'Once daily', start_date: new Date().toISOString().split('T')[0], end_date: '', prescribed_by: '', notes: '' });
    toast.success(`💊 ${medicineForm.name} ${editMedicineIdx !== null ? 'updated' : 'added'}.`);
  };

  const stopMedicine = async (idx: number) => {
    if (!treatment) return;
    const meds = [...(treatment.prescribed_medicines || [])];
    meds[idx] = { ...meds[idx], end_date: new Date().toISOString().split('T')[0], notes: (meds[idx].notes || '') + ` | Stopped by ${hospital?.admin_name || 'Admin'}` };
    await supabase.from('patient_treatments').update({ prescribed_medicines: meds, last_updated_by: hospital?.admin_name || 'Admin', last_updated_at: new Date().toISOString() }).eq('id', treatment.id);
    setTreatment({ ...treatment, prescribed_medicines: meds });
    toast.success('Medicine stopped.');
  };

  const saveRestrictions = async () => {
    if (!treatment) return;
    await supabase.from('patient_treatments').update({
      dietary_restrictions: treatment.dietary_restrictions, activity_restrictions: treatment.activity_restrictions,
      medications_to_avoid: treatment.medications_to_avoid, last_updated_by: hospital?.admin_name || 'Admin', last_updated_at: new Date().toISOString(),
    }).eq('id', treatment.id);
    toast.success('✅ Restrictions updated.');
  };

  const saveAdmissionAllergies = async () => {
    if (!treatment || !selectedPatient) return;
    // Step 1: Save to treatment record
    await supabase.from('patient_treatments').update({
      admission_allergies: treatment.admission_allergies, last_updated_by: hospital?.admin_name || 'Admin', last_updated_at: new Date().toISOString(),
    }).eq('id', treatment.id);

    // Step 2: Merge into patient permanent allergies
    const patientId = selectedPatient.patients?.id || selectedPatient.patient_id;
    const { data: patData } = await supabase.from('patients').select('allergies').eq('id', patientId).single();
    const existing = patData?.allergies || [];
    const newAllergens = (treatment.admission_allergies || []).map((a: string) => a.split('—')[0].trim());
    const merged = [...new Set([...existing, ...newAllergens])];
    await supabase.from('patients').update({ allergies: merged }).eq('id', patientId);
    toast.success('🚨 Allergies saved and added to patient profile.');
    setShowAllergyConfirm(false);
  };

  const reassignStaff = async (type: 'doctor' | 'nurse', staffId: string, staffName: string) => {
    if (!treatment || !selectedPatient) return;
    const tUpdate: any = { last_updated_by: hospital?.admin_name || 'Admin', last_updated_at: new Date().toISOString() };
    const hpUpdate: any = {};
    if (type === 'doctor') {
      tUpdate.assigned_doctor_id = staffId; tUpdate.assigned_doctor = staffName;
      hpUpdate.treating_doctor_id = staffId; hpUpdate.treating_doctor = staffName;
    } else {
      tUpdate.assigned_nurse_id = staffId; tUpdate.assigned_nurse = staffName;
      hpUpdate.assigned_nurse_id = staffId; hpUpdate.assigned_nurse = staffName;
    }
    await Promise.all([
      supabase.from('patient_treatments').update(tUpdate).eq('id', treatment.id),
      supabase.from('hospital_patients').update(hpUpdate).eq('id', selectedPatient.id),
    ]);
    setTreatment({ ...treatment, ...tUpdate });
    setEditingDoctor(false); setEditingNurse(false);
    toast.success(`${type === 'doctor' ? '🩺' : '👩‍⚕️'} ${staffName} assigned.`);
  };

  const filtered = patients.filter(p => {
    const area = p.patients?.district || p.patients?.city || p.patients?.state;
    if (areaFilter !== 'All Areas' && area !== areaFilter) return false;

    if (!search) return true;
    const s = search.toLowerCase();
    return (p.patients?.full_name?.toLowerCase() || '').includes(s) || (p.patients?.abha_id?.toLowerCase() || '').includes(s) || (p.diagnosis?.toLowerCase() || '').includes(s);
  });

  const tabs: RelType[] = ['All', 'Admitted', 'Outpatient', 'Discharged', 'Emergency'];
  const uniqueAreas = ['All Areas', ...Array.from(new Set(patients.map(p => p.patients?.district || p.patients?.city || p.patients?.state).filter(Boolean)))];

  // Medicine status helper
  const getMedStatus = (med: any) => {
    if (!med.end_date) return { label: '🟢 Active', color: '#059669', bg: '#F0FDF4' };
    if (new Date(med.end_date) <= new Date()) return { label: 'Stopped', color: '#64748B', bg: '#F1F5F9' };
    return { label: '🟢 Active', color: '#059669', bg: '#F0FDF4' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Patients</h1>
        <Button onClick={() => { setShowAdmitModal(true); resetAdmitForm(); }} className="text-[13px]" style={{ background: '#F59E0B', color: '#fff' }}>
          <Plus size={16} /> Admit New Patient
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-[300px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
          <Input placeholder="Search name, ABHA ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-[13px]" style={{ borderColor: '#E2EEF1' }} />
        </div>
        <div className="flex-1 max-w-[200px]">
          <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="w-full text-[13px] rounded-md border px-3 py-2" style={{ borderColor: '#E2EEF1', height: '40px' }}>
            {uniqueAreas.map(a => <option key={a as string} value={a as string}>{a as string}</option>)}
          </select>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)} className="px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all"
              style={{ background: filter === t ? '#EBF7FA' : 'transparent', color: filter === t ? '#0891B2' : '#64748B', border: filter === t ? '1px solid #0891B2' : '1px solid transparent' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2EEF1' }}>
        <JharokhaArch color="#F59E0B" opacity={0.18} />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <thead>
              <tr style={{ background: '#F7FBFC', borderBottom: '1px solid #E2EEF1' }}>
                {['Patient', 'Age/Gender', 'Diagnosis', 'Ward/Bed', 'Doctor', 'Nurse', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8" style={{ color: '#64748B' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8" style={{ color: '#64748B' }}>No patients found.</td></tr>
              ) : filtered.map(p => {
                const pat = p.patients;
                const st = statusStyles[p.relationship_type] || statusStyles.Admitted;
                const age = pat?.date_of_birth ? Math.floor((Date.now() - new Date(pat.date_of_birth).getTime()) / 31557600000) : '—';
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #E2EEF1' }} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#0891B2' }}>
                          {(pat?.full_name || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: '#1E293B' }}>{pat?.full_name || '—'}</p>
                          {pat?.abha_id && <p className="text-[11px]" style={{ color: '#0891B2' }}>ABHA: {pat.abha_id}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#1E293B' }}>{age} / {pat?.gender || '—'}</td>
                    <td className="px-4 py-3" style={{ color: '#1E293B' }}>{p.diagnosis || '—'}</td>
                    <td className="px-4 py-3" style={{ color: '#1E293B' }}>{p.ward || '—'} / {p.bed_number || '—'}</td>
                    <td className="px-4 py-3" style={{ color: '#1E293B' }}>{p.treating_doctor || '—'}</td>
                    <td className="px-4 py-3" style={{ color: '#1E293B' }}>{p.assigned_nurse || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openDrawer(p)} className="p-1.5 rounded hover:bg-gray-100" title="View"><Eye size={14} style={{ color: '#0891B2' }} /></button>
                        <button onClick={() => { openDrawer(p); setDrawerTab('notes'); }} className="p-1.5 rounded hover:bg-gray-100" title="Notes"><FileText size={14} style={{ color: '#F59E0B' }} /></button>
                        <button onClick={() => { openDrawer(p); setDrawerTab('prescriptions'); }} className="p-1.5 rounded hover:bg-gray-100" title="Prescriptions"><Pill size={14} style={{ color: '#10B981' }} /></button>
                        {p.relationship_type === 'Admitted' && (
                          <button onClick={() => { setDischargePatient(p); setShowDischargeModal(true); }} className="p-1.5 rounded hover:bg-gray-100" title="Discharge"><DischargeIcon size={14} style={{ color: '#10B981' }} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== PATIENT DETAIL DRAWER ===== */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSelectedPatient(null)} />
          <div className="relative w-full max-w-[560px] h-full bg-white shadow-xl overflow-y-auto animate-in slide-in-from-right duration-200">
            <JharokhaArch color="#F59E0B" opacity={0.18} />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: '#0891B2' }}>
                    {(selectedPatient.patients?.full_name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: '#1E293B' }}>{selectedPatient.patients?.full_name}</h2>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedPatient.patients?.blood_group && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: '#FEF2F2', color: '#DC2626' }}>{selectedPatient.patients.blood_group}</span>}
                      {selectedPatient.patients?.abha_id && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: '#EBF7FA', color: '#0891B2' }}>ABHA: {selectedPatient.patients.abha_id}</span>}
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: statusStyles[selectedPatient.relationship_type]?.bg, color: statusStyles[selectedPatient.relationship_type]?.color }}>
                        {statusStyles[selectedPatient.relationship_type]?.label}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="p-1.5 rounded hover:bg-gray-100"><X size={18} style={{ color: '#64748B' }} /></button>
              </div>

              {/* Password not set warning */}
              {passwordNotSet && (
                <div className="p-3 rounded-lg mb-4" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <p className="text-[12px] font-semibold" style={{ color: '#D97706' }}>⚠️ This patient has not yet set their Sanjeevani password.</p>
                  <p className="text-[11px] mt-1" style={{ color: '#92400E' }}>Their emergency QR is active but they cannot log in yet.</p>
                </div>
              )}

              <Tabs value={drawerTab} onValueChange={setDrawerTab}>
                <TabsList className="w-full justify-start mb-4 flex-wrap" style={{ background: '#F7FBFC' }}>
                  <TabsTrigger value="overview" className="text-[11px]">Overview</TabsTrigger>
                  <TabsTrigger value="medical" className="text-[11px]">Medical</TabsTrigger>
                  <TabsTrigger value="vitals" className="text-[11px]">Vitals</TabsTrigger>
                  <TabsTrigger value="notes" className="text-[11px]">Notes</TabsTrigger>
                  <TabsTrigger value="treatment" className="text-[11px]">Active Treatment</TabsTrigger>
                  <TabsTrigger value="prescriptions" className="text-[11px]">💊 Prescriptions</TabsTrigger>
                  <TabsTrigger value="billing" className="text-[11px]">Billing</TabsTrigger>
                  <TabsTrigger value="fitness" className="text-[11px]">🏃 Recovery Fitness</TabsTrigger>
                </TabsList>

                {/* TAB: Overview */}
                <TabsContent value="overview">
                  <div className="space-y-4 text-[13px]">
                    <div className="grid grid-cols-2 gap-3">
                      {[['Name', selectedPatient.patients?.full_name], ['DOB', selectedPatient.patients?.date_of_birth ? format(new Date(selectedPatient.patients.date_of_birth), 'dd MMM yyyy') : '—'], ['Gender', selectedPatient.patients?.gender], ['Blood Group', selectedPatient.patients?.blood_group], ['Ward', selectedPatient.ward], ['Bed', selectedPatient.bed_number], ['Doctor', selectedPatient.treating_doctor], ['Nurse', selectedPatient.assigned_nurse || '—'], ['Admitted', selectedPatient.admitted_at ? format(new Date(selectedPatient.admitted_at), 'dd MMM yyyy') : '—']].map(([l, v]) => (
                        <div key={l as string}><p className="text-[11px]" style={{ color: '#64748B' }}>{l}</p><p className="font-medium" style={{ color: '#1E293B' }}>{v || '—'}</p></div>
                      ))}
                    </div>
                    {selectedPatient.patients?.emergency_contact_name && (
                      <div className="p-3 rounded-lg" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                        <p className="text-[12px] font-semibold mb-1" style={{ color: '#DC2626' }}>Emergency Contact</p>
                        <p style={{ color: '#1E293B' }}>{selectedPatient.patients.emergency_contact_name} ({selectedPatient.patients.emergency_contact_relation})</p>
                        <p style={{ color: '#1E293B' }}>{selectedPatient.patients.emergency_contact_phone}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TAB: Medical Profile */}
                <TabsContent value="medical">
                  <div className="space-y-4 text-[13px]">
                    {selectedPatient.patients?.allergies?.length > 0 && (
                      <div className="p-3 rounded-lg" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                        <p className="text-[12px] font-semibold mb-2" style={{ color: '#DC2626' }}>⚠️ Allergies</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedPatient.patients.allergies.map((a: string) => <span key={a} className="px-2 py-0.5 rounded-full text-[11px]" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>{a}</span>)}
                        </div>
                      </div>
                    )}
                    {selectedPatient.patients?.chronic_conditions?.length > 0 && (
                      <div><p className="text-[12px] font-semibold mb-2" style={{ color: '#D97706' }}>Chronic Conditions</p>
                        <div className="flex flex-wrap gap-1.5">{selectedPatient.patients.chronic_conditions.map((c: string) => <span key={c} className="px-2 py-0.5 rounded-full text-[11px]" style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>{c}</span>)}</div>
                      </div>
                    )}
                    {selectedPatient.patients?.current_medications?.length > 0 && (
                      <div><p className="text-[12px] font-semibold mb-2" style={{ color: '#0891B2' }}>Current Medications (Patient's Own)</p>
                        <div className="flex flex-wrap gap-1.5">{selectedPatient.patients.current_medications.map((m: string) => <span key={m} className="px-2 py-0.5 rounded-full text-[11px]" style={{ background: '#EBF7FA', color: '#0891B2', border: '1px solid #D1EBF1' }}>{m}</span>)}</div>
                      </div>
                    )}
                    {selectedPatient.patients?.past_surgeries?.length > 0 && (
                      <div><p className="text-[12px] font-semibold mb-2" style={{ color: '#64748B' }}>Past Surgeries</p>
                        <ul className="list-disc pl-4 space-y-1" style={{ color: '#1E293B' }}>{selectedPatient.patients.past_surgeries.map((s: string) => <li key={s}>{s}</li>)}</ul>
                      </div>
                    )}
                    {/* Admission allergies from Tab 6 */}
                    <MandanaDivider />
                    <div>
                      <p className="text-[12px] font-semibold mb-2" style={{ color: '#DC2626' }}>Allergies Added During This Admission</p>
                      {treatment?.admission_allergies?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {treatment.admission_allergies.map((a: string) => <span key={a} className="px-2 py-0.5 rounded-full text-[11px]" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>{a}</span>)}
                        </div>
                      ) : <p className="italic" style={{ color: '#94A3B8' }}>No new allergies discovered during this admission.</p>}
                      <button onClick={() => setDrawerTab('treatment')} className="text-[12px] mt-2" style={{ color: '#0891B2' }}>Manage in Active Treatment tab →</button>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB: Vitals */}
                <TabsContent value="vitals">
                  <p className="text-[13px] italic" style={{ color: '#64748B' }}>Vitals recording coming soon.</p>
                </TabsContent>

                {/* TAB: Notes */}
                <TabsContent value="notes">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input placeholder="Add a treatment note..." value={newNote} onChange={e => setNewNote(e.target.value)} className="flex-1 text-[13px]" />
                      <Button onClick={addNote} className="text-[13px]" style={{ background: '#0891B2', color: '#fff' }}>Save</Button>
                    </div>
                    {notes.length === 0 ? <p className="text-[13px] italic" style={{ color: '#64748B' }}>No treatment notes yet.</p> : notes.map(n => (
                      <div key={n.id} className="p-3 rounded-lg" style={{ background: '#F7FBFC', borderLeft: `3px solid ${n.staff_role === 'Doctor' ? '#0891B2' : n.staff_role === 'Nurse' ? '#F59E0B' : '#94A3B8'}` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-semibold" style={{ color: '#1E293B' }}>{n.staff_name}</span>
                          <span className="text-[11px]" style={{ color: '#64748B' }}>{n.staff_role}</span>
                          <span className="text-[11px] ml-auto" style={{ color: '#94A3B8' }}>{format(new Date(n.created_at), 'dd MMM, HH:mm')}</span>
                        </div>
                        <p className="text-[13px]" style={{ color: '#1E293B' }}>{n.note}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* ===== TAB 6: ACTIVE TREATMENT ===== */}
                <TabsContent value="treatment">
                  {treatmentLoading ? <p className="text-[13px]" style={{ color: '#64748B' }}>Loading...</p> : !treatment ? (
                    <div className="text-center py-8">
                      <p className="text-[13px] mb-3" style={{ color: '#64748B' }}>No treatment record found for this admission.</p>
                      <Button onClick={async () => {
                        if (!hospital || !selectedPatient) return;
                        const { data } = await supabase.from('patient_treatments').insert({
                          hospital_id: hospital.id, patient_id: selectedPatient.patients?.id || selectedPatient.patient_id, admission_id: selectedPatient.id,
                        }).select().single();
                        if (data) setTreatment(data);
                      }} className="text-[13px]" style={{ background: '#0891B2', color: '#fff' }}>Start Treatment Record</Button>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {/* Section F: Treatment Summary (read-only, top) */}
                      <div className="p-4 rounded-lg mb-5" style={{ background: '#EBF7FA', border: '1px solid #D1EBF1' }}>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
                          <span>🩺 {treatment.assigned_doctor || 'No doctor'}</span>
                          <span>👩‍⚕️ {treatment.assigned_nurse || 'No nurse'}</span>
                        </div>
                        {treatment.current_disease && <p className="text-[13px] mt-2 font-medium" style={{ color: '#1E293B' }}>Condition: {treatment.current_disease}</p>}
                        {treatment.disease_severity && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: severityStyles[treatment.disease_severity]?.selectedBg || '#94A3B8', color: '#fff' }}>
                            {treatment.disease_severity}
                          </span>
                        )}
                        <div className="flex gap-4 mt-2 text-[11px]" style={{ color: '#64748B' }}>
                          <span>Medicines: {(treatment.prescribed_medicines || []).filter((m: any) => !m.end_date || new Date(m.end_date) > new Date()).length}</span>
                          <span>Restrictions: {(treatment.dietary_restrictions?.length || 0) + (treatment.activity_restrictions?.length || 0)}</span>
                          <span>Avoid: {treatment.medications_to_avoid?.length || 0}</span>
                        </div>
                        {treatment.last_updated_by && <p className="text-[11px] mt-2" style={{ color: '#94A3B8' }}>Last updated by {treatment.last_updated_by} · {treatment.last_updated_at ? formatDistanceToNow(new Date(treatment.last_updated_at), { addSuffix: true }) : ''}</p>}
                      </div>

                      {/* Section A: Assigned Staff */}
                      <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2EEF1' }}>
                        <JharokhaArch color="#F59E0B" opacity={0.18} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          <div>
                            <p className="text-[12px] font-semibold mb-1" style={{ color: '#64748B' }}>🩺 Treating Doctor</p>
                            {editingDoctor ? (
                              <div className="space-y-2">
                                <select className="w-full text-[13px] rounded-md border px-3 py-2" style={{ borderColor: '#E2EEF1' }}
                                  onChange={e => { const d = doctors.find(x => x.id === e.target.value); if (d) reassignStaff('doctor', d.id, d.full_name); }}>
                                  <option value="">Select Doctor</option>
                                  {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} — {d.specialization}</option>)}
                                </select>
                                <button onClick={() => setEditingDoctor(false)} className="text-[11px]" style={{ color: '#64748B' }}>Cancel</button>
                              </div>
                            ) : (
                              <div>
                                <p className="font-medium text-[14px]" style={{ color: '#1E293B' }}>{treatment.assigned_doctor || 'Not assigned'}</p>
                                {!treatment.assigned_doctor && <div className="p-2 rounded mt-1" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}><p className="text-[11px]" style={{ color: '#D97706' }}>⚠️ No doctor assigned</p></div>}
                                <button onClick={() => setEditingDoctor(true)} className="text-[11px] mt-1" style={{ color: '#0891B2' }}>Change Doctor ✏️</button>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold mb-1" style={{ color: '#64748B' }}>👩‍⚕️ Assigned Nurse</p>
                            {editingNurse ? (
                              <div className="space-y-2">
                                <select className="w-full text-[13px] rounded-md border px-3 py-2" style={{ borderColor: '#E2EEF1' }}
                                  onChange={e => { const n = nurses.find(x => x.id === e.target.value); if (n) reassignStaff('nurse', n.id, n.full_name); }}>
                                  <option value="">Select Nurse</option>
                                  {nurses.map(n => <option key={n.id} value={n.id}>{n.full_name} — {n.role}</option>)}
                                </select>
                                <button onClick={() => setEditingNurse(false)} className="text-[11px]" style={{ color: '#64748B' }}>Cancel</button>
                              </div>
                            ) : (
                              <div>
                                <p className="font-medium text-[14px]" style={{ color: '#1E293B' }}>{treatment.assigned_nurse || 'Not assigned'}</p>
                                <button onClick={() => setEditingNurse(true)} className="text-[11px] mt-1" style={{ color: '#0891B2' }}>Change Nurse ✏️</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Section B: Current Condition */}
                      <MandanaDivider />
                      <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2EEF1' }}>
                        <JharokhaArch color="#F59E0B" opacity={0.18} />
                        <div className="space-y-3 mt-2">
                          <div>
                            <label className="text-[12px] font-semibold" style={{ color: '#64748B' }}>Current Disease / Diagnosis</label>
                            <textarea className="w-full text-[13px] rounded-md border px-3 py-2 mt-1 min-h-[60px]" style={{ borderColor: '#E2EEF1' }} value={treatment.current_disease || ''} onChange={e => setTreatment({ ...treatment, current_disease: e.target.value })} placeholder="e.g. Type 2 Diabetes with Hypertensive Crisis" />
                          </div>
                          <div>
                            <label className="text-[12px] font-semibold" style={{ color: '#64748B' }}>Severity</label>
                            <div className="flex gap-2 mt-1">
                              {['Mild', 'Moderate', 'Severe', 'Critical'].map(s => {
                                const isSelected = treatment.disease_severity === s;
                                const style = severityStyles[s];
                                return (
                                  <button key={s} onClick={() => setTreatment({ ...treatment, disease_severity: s })}
                                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${s === 'Critical' && isSelected ? 'animate-pulse' : ''}`}
                                    style={{ background: isSelected ? style.selectedBg : style.bg, color: isSelected ? style.selectedColor : style.color, border: `1px solid ${isSelected ? style.selectedBg : '#E2EEF1'}` }}>
                                    {s}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <label className="text-[12px] font-semibold" style={{ color: '#64748B' }}>Treatment Plan</label>
                            <textarea className="w-full text-[13px] rounded-md border px-3 py-2 mt-1 min-h-[80px]" style={{ borderColor: '#E2EEF1' }} value={treatment.treatment_plan || ''} onChange={e => setTreatment({ ...treatment, treatment_plan: e.target.value })} placeholder="e.g. IV fluid resuscitation + insulin sliding scale" />
                          </div>
                          <div>
                            <label className="text-[12px] font-semibold" style={{ color: '#64748B' }}>Other Instructions</label>
                            <textarea className="w-full text-[13px] rounded-md border px-3 py-2 mt-1 min-h-[60px]" style={{ borderColor: '#E2EEF1' }} value={treatment.other_instructions || ''} onChange={e => setTreatment({ ...treatment, other_instructions: e.target.value })} placeholder="e.g. Monitor blood sugar every 4 hours" />
                          </div>
                          <div className="flex justify-end">
                            <Button onClick={saveTreatmentCondition} className="text-[13px]" style={{ background: '#0891B2', color: '#fff' }}>Save Condition</Button>
                          </div>
                        </div>
                      </div>

                      {/* Section C: Prescribed Medicines */}
                      <MandanaDivider />
                      <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2EEF1' }}>
                        <JharokhaArch color="#0891B2" opacity={0.18} />
                        <div className="flex items-center justify-between mt-2 mb-3">
                          <p className="text-[14px] font-semibold" style={{ color: '#1E293B' }}>💊 Prescribed Medicines</p>
                          <Button onClick={() => { setShowAddMedicine(true); setEditMedicineIdx(null); setMedicineForm({ name: '', dosage: '', route: 'Oral', frequency: 'Once daily', start_date: new Date().toISOString().split('T')[0], end_date: '', prescribed_by: hospital?.admin_name || '', notes: '' }); }} className="text-[12px] h-8" style={{ background: '#0891B2', color: '#fff' }}>
                            <Plus size={14} /> Add Medicine
                          </Button>
                        </div>
                        <div className="p-2.5 rounded-lg mb-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                          <p className="text-[11px]" style={{ color: '#92400E' }}>These are medicines prescribed by this hospital during this admission. Separate from the patient's own regular medications.</p>
                        </div>
                        {(treatment.prescribed_medicines || []).length === 0 ? (
                          <p className="text-[13px] italic" style={{ color: '#94A3B8' }}>No medicines prescribed yet.</p>
                        ) : (treatment.prescribed_medicines || []).map((med: any, idx: number) => {
                          const st = getMedStatus(med);
                          const rc = routeColors[med.route] || routeColors.Other;
                          return (
                            <div key={idx} className="p-3 rounded-lg border mb-2" style={{ borderColor: '#E2EEF1' }}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-[13px]" style={{ color: '#1E293B' }}>💊 {med.name} {med.dosage}</p>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: rc.bg, color: rc.color }}>{med.route}</span>
                                    <span className="text-[11px]" style={{ color: '#64748B' }}>{med.frequency}</span>
                                    {med.prescribed_by && <span className="text-[11px]" style={{ color: '#64748B' }}>by {med.prescribed_by}</span>}
                                  </div>
                                  <p className="text-[11px] mt-1" style={{ color: '#94A3B8' }}>
                                    Started: {med.start_date}{med.end_date ? ` · Ends: ${med.end_date}` : ''}
                                  </p>
                                  {med.notes && <p className="text-[11px] mt-1 italic" style={{ color: '#64748B' }}>{med.notes}</p>}
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => { setEditMedicineIdx(idx); setMedicineForm(med); setShowAddMedicine(true); }} className="text-[11px]" style={{ color: '#0891B2' }}>Edit ✏️</button>
                                {(!med.end_date || new Date(med.end_date) > new Date()) && (
                                  <button onClick={() => stopMedicine(idx)} className="text-[11px]" style={{ color: '#DC2626' }}>Stop 🛑</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add/Edit Medicine Modal */}
                      {showAddMedicine && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center">
                          <div className="absolute inset-0 bg-black/20" onClick={() => setShowAddMedicine(false)} />
                          <div className="relative w-full max-w-[480px] bg-white rounded-xl shadow-xl overflow-hidden">
                            <JharokhaArch color="#0891B2" opacity={0.18} />
                            <div className="p-6 space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="text-[15px] font-bold" style={{ color: '#1E293B' }}>{editMedicineIdx !== null ? 'Edit Medicine' : 'Add Medicine'}</h3>
                                <button onClick={() => setShowAddMedicine(false)}><X size={16} style={{ color: '#64748B' }} /></button>
                              </div>
                              <Input placeholder="Medicine Name *" value={medicineForm.name} onChange={e => setMedicineForm({ ...medicineForm, name: e.target.value })} className="text-[13px]" />
                              <Input placeholder="Dosage *" value={medicineForm.dosage} onChange={e => setMedicineForm({ ...medicineForm, dosage: e.target.value })} className="text-[13px]" />
                              <div>
                                <label className="text-[12px]" style={{ color: '#64748B' }}>Route</label>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {['Oral', 'IV', 'IM', 'Topical', 'Inhaled', 'Subcutaneous', 'Other'].map(r => (
                                    <button key={r} onClick={() => setMedicineForm({ ...medicineForm, route: r })}
                                      className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                                      style={{ background: medicineForm.route === r ? (routeColors[r]?.color || '#64748B') : '#F7FBFC', color: medicineForm.route === r ? '#fff' : '#64748B', border: '1px solid #E2EEF1' }}>
                                      {r}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <select value={medicineForm.frequency} onChange={e => setMedicineForm({ ...medicineForm, frequency: e.target.value })} className="w-full text-[13px] rounded-md border px-3 py-2" style={{ borderColor: '#E2EEF1' }}>
                                {['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'As needed (PRN)', 'Other'].map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                              <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[11px]" style={{ color: '#64748B' }}>Start Date</label><Input type="date" value={medicineForm.start_date} onChange={e => setMedicineForm({ ...medicineForm, start_date: e.target.value })} className="text-[13px]" /></div>
                                <div><label className="text-[11px]" style={{ color: '#64748B' }}>End Date (optional)</label><Input type="date" value={medicineForm.end_date} onChange={e => setMedicineForm({ ...medicineForm, end_date: e.target.value })} className="text-[13px]" /></div>
                              </div>
                              <Input placeholder="Prescribed By" value={medicineForm.prescribed_by} onChange={e => setMedicineForm({ ...medicineForm, prescribed_by: e.target.value })} className="text-[13px]" />
                              <textarea placeholder="Notes / dosage instructions" value={medicineForm.notes} onChange={e => setMedicineForm({ ...medicineForm, notes: e.target.value })} className="w-full text-[13px] rounded-md border px-3 py-2 min-h-[60px]" style={{ borderColor: '#E2EEF1' }} />
                              <Button onClick={saveMedicine} className="w-full text-[13px]" style={{ background: '#0891B2', color: '#fff' }}>{editMedicineIdx !== null ? 'Save Changes' : 'Add Medicine'}</Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section D: Restrictions */}
                      <MandanaDivider />
                      <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#EF4444' }}>
                        <JharokhaArch color="#EF4444" opacity={0.18} />
                        <p className="text-[14px] font-semibold mt-2 mb-3" style={{ color: '#1E293B' }}>⚠️ Restrictions & What to Avoid</p>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[12px] font-semibold mb-1" style={{ color: '#DC2626' }}>Dietary Restrictions</p>
                            <TagInput tags={treatment.dietary_restrictions || []} onChange={tags => setTreatment({ ...treatment, dietary_restrictions: tags })} placeholder="Type a restriction and press Enter..." chipColor="red"
                              quickAddOptions={['Low Salt', 'Diabetic Diet', 'Low Fat', 'NPO', 'Liquid Only', 'No Citrus', 'No Dairy', 'No Spicy Food']} />
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold mb-1" style={{ color: '#D97706' }}>Activity Restrictions</p>
                            <TagInput tags={treatment.activity_restrictions || []} onChange={tags => setTreatment({ ...treatment, activity_restrictions: tags })} placeholder="Type a restriction..." chipColor="amber"
                              quickAddOptions={['Bed Rest', 'No Weight Bearing', 'No Stairs', 'No Driving', 'Limited Walking', 'No Heavy Lifting']} />
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold mb-1" style={{ color: '#DC2626' }}>Medications to Avoid</p>
                            <TagInput tags={treatment.medications_to_avoid || []} onChange={tags => setTreatment({ ...treatment, medications_to_avoid: tags })} placeholder="e.g. NSAIDs, Aspirin..." chipColor="red"
                              quickAddOptions={['NSAIDs', 'Aspirin', 'Ibuprofen', 'Penicillin Class', 'Sulfonamides', 'Contrast Dye', 'Blood Thinners']} />
                          </div>
                          <Button onClick={saveRestrictions} className="w-full text-[13px]" style={{ background: '#EF4444', color: '#fff' }}>Save Restrictions</Button>
                        </div>
                      </div>

                      {/* Section E: Admission Allergies */}
                      <MandanaDivider />
                      <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#EF4444' }}>
                        <JharokhaArch color="#EF4444" opacity={0.18} />
                        <p className="text-[14px] font-semibold mt-2 mb-2" style={{ color: '#1E293B' }}>🚨 New Allergies Discovered Here</p>
                        <div className="p-2.5 rounded-lg mb-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                          <p className="text-[11px]" style={{ color: '#DC2626' }}>Use this section for allergies discovered DURING this admission only. The patient's existing allergies are in the Medical tab.</p>
                        </div>
                        <TagInput tags={treatment.admission_allergies || []} onChange={tags => setTreatment({ ...treatment, admission_allergies: tags })} placeholder="e.g. Ceftriaxone — rash on Day 2" chipColor="red" />
                        <Button onClick={() => setShowAllergyConfirm(true)} className="w-full text-[13px] mt-3" style={{ background: '#EF4444', color: '#fff' }}>Save & Update Patient Profile</Button>
                      </div>

                      {/* Allergy Confirmation Modal */}
                      {showAllergyConfirm && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center">
                          <div className="absolute inset-0 bg-black/20" onClick={() => setShowAllergyConfirm(false)} />
                          <div className="relative w-full max-w-[420px] bg-white rounded-xl shadow-xl overflow-hidden">
                            <JharokhaArch color="#EF4444" opacity={0.18} />
                            <div className="p-6 space-y-4">
                              <p className="text-[14px] font-bold" style={{ color: '#1E293B' }}>⚠️ Update Patient's Permanent Profile?</p>
                              <p className="text-[13px]" style={{ color: '#64748B' }}>This will permanently add these allergies to the patient's Sanjeevani health profile. They will appear on their QR emergency data and all future hospital visits.</p>
                              <div className="flex gap-2">
                                <Button onClick={() => setShowAllergyConfirm(false)} variant="outline" className="flex-1 text-[13px]">Cancel</Button>
                                <Button onClick={saveAdmissionAllergies} className="flex-1 text-[13px]" style={{ background: '#EF4444', color: '#fff' }}>Yes, Update Profile</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* ===== TAB: PRESCRIPTIONS ===== */}
                <TabsContent value="prescriptions">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-bold" style={{ color: '#1E293B' }}>💊 Prescriptions</p>
                      <button
                        onClick={() => {
                          setShowRxModal(true);
                          setRxForm({ diagnosis: selectedPatient.diagnosis || '', instructions: '', feedbackDays: 0, requestFeedback: true, validDays: 30, medicines: [{ name: '', dosage: '', form: 'Tablet', timesPerDay: 3, durationDays: 7, instructions: '' }] });
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white"
                        style={{ background: '#F59E0B' }}
                      >
                        <Plus size={14} /> Write Prescription
                      </button>
                    </div>

                    {patientRxList.length === 0 ? (
                      <div className="text-center py-8">
                        <Pill size={32} className="mx-auto mb-2" style={{ color: '#D1EBF1' }} />
                        <p className="text-[13px]" style={{ color: '#94A3B8' }}>No prescriptions issued for this patient yet.</p>
                        <button
                          onClick={() => {
                            setShowRxModal(true);
                            setRxForm({ diagnosis: selectedPatient.diagnosis || '', instructions: '', feedbackDays: 0, requestFeedback: true, validDays: 30, medicines: [{ name: '', dosage: '', form: 'Tablet', timesPerDay: 3, durationDays: 7, instructions: '' }] });
                          }}
                          className="text-[13px] font-medium mt-2" style={{ color: '#0891B2' }}
                        >
                          Write first prescription →
                        </button>
                      </div>
                    ) : (
                      patientRxList.map((rx: any) => {
                        const fb = rxFeedbacks.find((f: any) => f.prescription_id === rx.id);
                        const statusColor: Record<string, { bg: string; color: string }> = {
                          Active: { bg: '#DCFCE7', color: '#16A34A' },
                          Completed: { bg: '#E0E7FF', color: '#4F46E5' },
                          Discontinued: { bg: '#FEE2E2', color: '#DC2626' },
                        };
                        const sc = statusColor[rx.status] || { bg: '#F1F5F9', color: '#64748B' };
                        const ratingEmojis = ['', '😞', '😕', '😐', '🙂', '😊'];

                        return (
                          <div key={rx.id} className="p-4 rounded-xl" style={{ border: '1px solid #E2EEF1', background: '#FAFCFD' }}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-[13px] font-bold" style={{ color: '#1E293B' }}>Dr. {rx.doctor_name}</p>
                                <p className="text-[11px]" style={{ color: '#64748B' }}>
                                  {rx.prescription_date ? format(new Date(rx.prescription_date), 'dd MMM yyyy') : ''}
                                  {rx.valid_until ? ' · Valid until ' + format(new Date(rx.valid_until), 'dd MMM') : ''}
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: sc.bg, color: sc.color }}>
                                {rx.status || 'Active'}
                              </span>
                            </div>

                            <div className="mb-2">
                              <p className="text-[12px] font-bold" style={{ color: '#475569' }}>Diagnosis</p>
                              <p className="text-[13px]" style={{ color: '#1E293B' }}>{rx.diagnosis}</p>
                            </div>

                            {rx.general_instructions && (
                              <p className="text-[12px] italic mb-2" style={{ color: '#64748B' }}>📋 {rx.general_instructions}</p>
                            )}

                            {/* Feedback status */}
                            {fb ? (
                              <div className="p-3 rounded-lg" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                                <p className="text-[12px] font-bold mb-1" style={{ color: '#16A34A' }}>✅ Feedback Received</p>
                                <div className="flex items-center gap-3 text-[12px]">
                                  <span>{ratingEmojis[fb.improvement_rating] || '—'} {fb.improvement_rating}/5</span>
                                  <span>Adherence: {fb.adherence_rating}</span>
                                  <span>Pain: {fb.pain_level_before} → {fb.pain_level_after}</span>
                                </div>
                                {fb.had_side_effects && (
                                  <p className="text-[11px] mt-1" style={{ color: '#D97706' }}>⚠️ Side effects: {(fb.side_effects || []).join(', ')}</p>
                                )}
                                {fb.patient_notes && <p className="text-[11px] mt-1 italic" style={{ color: '#475569' }}>"{fb.patient_notes}"</p>}
                              </div>
                            ) : rx.feedback_requested ? (
                              <div className="p-2 rounded-lg" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                                <p className="text-[11px] font-medium" style={{ color: '#92400E' }}>⏳ Feedback requested — due {rx.feedback_deadline_date ? format(new Date(rx.feedback_deadline_date), 'dd MMM yyyy') : 'soon'}</p>
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Write Prescription Modal */}
                  {showRxModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-black/30" onClick={() => setShowRxModal(false)} />
                      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[560px] flex flex-col" style={{ maxHeight: '88vh' }}>
                        <JharokhaArch color="#F59E0B" opacity={0.18} />
                        <div className="p-5 border-b flex-shrink-0 flex items-center justify-between" style={{ borderColor: '#E2EEF1' }}>
                          <div>
                            <h3 className="text-[16px] font-bold" style={{ color: '#1E293B' }}>💊 Write Prescription</h3>
                            <p className="text-[12px]" style={{ color: '#64748B' }}>for {selectedPatient.patients?.full_name}</p>
                          </div>
                          <button onClick={() => setShowRxModal(false)}><X size={18} style={{ color: '#64748B' }} /></button>
                        </div>

                        <div className="p-5 overflow-y-auto flex-1 space-y-4">
                          {/* Diagnosis */}
                          <div>
                            <label className="field-label">Diagnosis *</label>
                            <textarea className="field-input" rows={2} placeholder="e.g. Viral fever with throat infection" value={rxForm.diagnosis} onChange={(e) => setRxForm({ ...rxForm, diagnosis: e.target.value })} />
                          </div>

                          {/* Medicines */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="field-label mb-0">Medicines</label>
                              <button onClick={() => setRxForm({ ...rxForm, medicines: [...rxForm.medicines, { name: '', dosage: '', form: 'Tablet', timesPerDay: 3, durationDays: 7, instructions: '' }] })} className="text-[11px] font-bold flex items-center gap-1" style={{ color: '#0891B2' }}><Plus size={12} /> Add</button>
                            </div>
                            {rxForm.medicines.map((m: any, idx: number) => (
                              <div key={idx} className="p-3 rounded-lg mb-2" style={{ border: '1px solid #E2EEF1', background: '#FAFCFD' }}>
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                  <input className="field-input" placeholder="Medicine *" value={m.name} onChange={(e) => { const u = [...rxForm.medicines]; u[idx] = { ...m, name: e.target.value }; setRxForm({ ...rxForm, medicines: u }); }} />
                                  <input className="field-input" placeholder="Dosage *" value={m.dosage} onChange={(e) => { const u = [...rxForm.medicines]; u[idx] = { ...m, dosage: e.target.value }; setRxForm({ ...rxForm, medicines: u }); }} />
                                  <select className="field-input" value={m.form} onChange={(e) => { const u = [...rxForm.medicines]; u[idx] = { ...m, form: e.target.value }; setRxForm({ ...rxForm, medicines: u }); }}>
                                    {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Inhaler'].map(f => <option key={f} value={f}>{f}</option>)}
                                  </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <div>
                                    <label className="text-[10px]" style={{ color: '#64748B' }}>Duration (days)</label>
                                    <input className="field-input" type="number" min="1" value={m.durationDays} onChange={(e) => { const u = [...rxForm.medicines]; u[idx] = { ...m, durationDays: parseInt(e.target.value) || 7 }; setRxForm({ ...rxForm, medicines: u }); }} />
                                  </div>
                                  <div>
                                    <label className="text-[10px]" style={{ color: '#64748B' }}>Times/day</label>
                                    <select className="field-input" value={m.timesPerDay} onChange={(e) => { const u = [...rxForm.medicines]; u[idx] = { ...m, timesPerDay: parseInt(e.target.value) }; setRxForm({ ...rxForm, medicines: u }); }}>
                                      {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}×</option>)}
                                    </select>
                                  </div>
                                </div>
                                <input className="field-input" placeholder="Special instructions (optional)" value={m.instructions} onChange={(e) => { const u = [...rxForm.medicines]; u[idx] = { ...m, instructions: e.target.value }; setRxForm({ ...rxForm, medicines: u }); }} />
                                {rxForm.medicines.length > 1 && (
                                  <button onClick={() => setRxForm({ ...rxForm, medicines: rxForm.medicines.filter((_: any, i: number) => i !== idx) })} className="text-[10px] font-medium mt-1" style={{ color: '#EF4444' }}>Remove ✕</button>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Instructions */}
                          <div>
                            <label className="field-label">General Instructions</label>
                            <textarea className="field-input" rows={2} placeholder="Drink water, avoid cold food..." value={rxForm.instructions} onChange={(e) => setRxForm({ ...rxForm, instructions: e.target.value })} />
                          </div>

                          {/* Feedback */}
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-[12px] font-medium">
                              <input type="checkbox" checked={rxForm.requestFeedback} onChange={(e) => setRxForm({ ...rxForm, requestFeedback: e.target.checked })} />
                              Request feedback
                            </label>
                            {rxForm.requestFeedback && (
                              <div className="flex items-center gap-1">
                                <span className="text-[11px]" style={{ color: '#64748B' }}>after</span>
                                <input className="field-input w-14 text-center" type="number" min={1} value={rxForm.feedbackDays} onChange={(e) => setRxForm({ ...rxForm, feedbackDays: parseInt(e.target.value) || 7 })} />
                                <span className="text-[11px]" style={{ color: '#64748B' }}>days</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 border-t flex-shrink-0" style={{ borderColor: '#E2EEF1' }}>
                          <button
                            onClick={submitPrescription}
                            disabled={rxSaving}
                            className="w-full py-2.5 rounded-lg text-[13px] font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ background: '#0891B2' }}
                          >
                            {rxSaving ? <><Loader2 size={14} className="animate-spin" /> Issuing...</> : '💊 Issue Prescription'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* TAB: Billing */}
                <TabsContent value="billing">
                  <p className="text-[13px] italic" style={{ color: '#64748B' }}>Billing details available in the Billing page.</p>
                </TabsContent>

                {/* TAB: Recovery Fitness */}
                <TabsContent value="fitness">
                  <DoctorFitnessPanel
                    patientId={selectedPatient.patients?.id || selectedPatient.patient_id}
                    hospitalId={hospital?.id || ''}
                    adminName={hospital?.admin_name || 'Doctor'}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADMIT NEW PATIENT MODAL ===== */}
      {showAdmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowAdmitModal(false)} />
          <div className="relative w-full max-w-[520px] bg-white rounded-xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <JharokhaArch color="#F59E0B" opacity={0.18} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: '#1E293B' }}>Admit New Patient</h2>
                <button onClick={() => setShowAdmitModal(false)}><X size={18} style={{ color: '#64748B' }} /></button>
              </div>

              {admitStep === 1 && (
                <div className="space-y-4">
                  <p className="text-[13px] font-semibold" style={{ color: '#64748B' }}>Step 1 — Find Patient</p>
                  <div className="flex gap-2">
                    <Input placeholder="Search by ABHA ID, name, or email..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} className="flex-1 text-[13px]" />
                    <Button onClick={searchPatients} className="text-[13px]" style={{ background: '#0891B2', color: '#fff' }}>Search</Button>
                  </div>

                  {searchResults.map(p => (
                    <button key={p.id} onClick={() => { setSelectedAdmitPatient(p); setAdmitStep(2); }} className="w-full p-3 rounded-lg border text-left hover:shadow-sm transition-all" style={{ borderColor: '#E2EEF1' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#0891B2' }}>{p.full_name.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <p className="text-[13px] font-medium" style={{ color: '#1E293B' }}>{p.full_name}</p>
                          <div className="flex gap-2">{p.blood_group && <span className="text-[11px] font-bold" style={{ color: '#DC2626' }}>{p.blood_group}</span>}{p.abha_id && <span className="text-[11px]" style={{ color: '#0891B2' }}>ABHA: {p.abha_id}</span>}</div>
                        </div>
                      </div>
                      {p.allergies?.length > 0 && <div className="mt-2 p-2 rounded" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}><p className="text-[11px]" style={{ color: '#D97706' }}>⚠️ Allergies: {p.allergies.join(', ')}</p></div>}
                    </button>
                  ))}

                  {/* No results → Create account option */}
                  {patientSearch.trim() && searchResults.length === 0 && !showCreatePatient && !createSuccess && (
                    <div className="text-center py-4 space-y-3">
                      <p className="text-[13px]" style={{ color: '#64748B' }}>No patient found matching "{patientSearch}"</p>
                      <Button onClick={searchPatients} variant="outline" className="text-[13px]"><Search size={14} /> Search Again</Button>
                      <div className="flex items-center gap-3 my-2"><div className="flex-1 h-px bg-gray-200" /><span className="text-[12px]" style={{ color: '#94A3B8' }}>OR</span><div className="flex-1 h-px bg-gray-200" /></div>
                      <Button onClick={() => { setShowCreatePatient(true); setCreateForm({ ...createForm, full_name: patientSearch }); }} className="text-[13px]" style={{ background: '#0891B2', color: '#fff' }}>
                        <UserPlus size={14} /> Create Sanjeevani Account for This Patient
                      </Button>
                      <p className="text-[11px]" style={{ color: '#64748B' }}>The patient will receive an email to set their password and access their health records.</p>
                    </div>
                  )}

                  {/* Create patient form */}
                  {showCreatePatient && !createSuccess && (
                    <div className="space-y-3 p-4 rounded-xl border" style={{ borderColor: '#D1EBF1' }}>
                      <JharokhaArch color="#0891B2" opacity={0.18} />
                      <p className="text-[13px] font-semibold mt-2" style={{ color: '#1E293B' }}>Create Sanjeevani Patient Account</p>
                      <Input placeholder="Full Name *" value={createForm.full_name} onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })} className="text-[13px]" />
                      <Input placeholder="Email Address *" type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} className="text-[13px]" />
                      <Input placeholder="Phone Number *" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} className="text-[13px]" />
                      <Input type="date" value={createForm.date_of_birth} onChange={e => setCreateForm({ ...createForm, date_of_birth: e.target.value })} className="text-[13px]" />
                      <div>
                        <label className="text-[12px]" style={{ color: '#64748B' }}>Blood Group</label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'].map(bg => (
                            <button key={bg} onClick={() => setCreateForm({ ...createForm, blood_group: bg })}
                              className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                              style={{ background: createForm.blood_group === bg ? '#DC2626' : '#FEF2F2', color: createForm.blood_group === bg ? '#fff' : '#DC2626', border: '1px solid #FECACA' }}>
                              {bg}
                            </button>
                          ))}
                        </div>
                        <div className="p-2 rounded mt-2" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                          <p className="text-[11px]" style={{ color: '#92400E' }}>⚠️ Blood group is critical for emergencies. Add it if known.</p>
                        </div>
                      </div>
                      <Button onClick={createPatientAccount} disabled={creatingPatient} className="w-full text-[13px]" style={{ background: '#0891B2', color: '#fff' }}>
                        {creatingPatient ? 'Creating...' : 'Create Account & Continue →'}
                      </Button>
                    </div>
                  )}

                  {/* Create success */}
                  {createSuccess && selectedAdmitPatient && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                        <p className="text-[13px] font-semibold" style={{ color: '#059669' }}>✅ Account created for {selectedAdmitPatient.full_name}</p>
                        <p className="text-[11px] mt-1" style={{ color: '#064E3B' }}>They can log in at /patient/login after setting their password via the "Forgot Password" flow.</p>
                      </div>
                      <div className="p-3 rounded-lg border" style={{ borderColor: '#E2EEF1' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#0891B2' }}>{selectedAdmitPatient.full_name.slice(0, 2).toUpperCase()}</div>
                          <div>
                            <p className="text-[13px] font-medium" style={{ color: '#1E293B' }}>{selectedAdmitPatient.full_name}</p>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: '#F0FDF4', color: '#059669' }}>🆕 New Sanjeevani Account</span>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => setAdmitStep(2)} className="w-full text-[13px]" style={{ background: '#F59E0B', color: '#fff' }}>Continue to Admission Details →</Button>
                    </div>
                  )}
                </div>
              )}

              {admitStep === 2 && selectedAdmitPatient && (
                <div className="space-y-4">
                  <p className="text-[13px] font-semibold" style={{ color: '#64748B' }}>Step 2 — Admission Details for {selectedAdmitPatient.full_name}</p>
                  <div className="flex gap-2">
                    {['Admitted', 'Outpatient', 'Emergency'].map(t => (
                      <button key={t} onClick={() => setAdmitForm({ ...admitForm, relationship_type: t })}
                        className="px-3 py-1.5 rounded-full text-[12px] font-medium"
                        style={{ background: admitForm.relationship_type === t ? '#EBF7FA' : 'transparent', color: admitForm.relationship_type === t ? '#0891B2' : '#64748B', border: admitForm.relationship_type === t ? '1px solid #0891B2' : '1px solid #E2EEF1' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <select value={admitForm.ward} onChange={e => { setAdmitForm({ ...admitForm, ward: e.target.value, bed_id: '' }); fetchAvailableBeds(e.target.value); }}
                    className="w-full text-[13px] rounded-md border px-3 py-2.5" style={{ borderColor: '#E2EEF1' }}>
                    <option value="">Select Ward</option>
                    {wards.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                  {admitForm.ward && (
                    <select value={admitForm.bed_id} onChange={e => setAdmitForm({ ...admitForm, bed_id: e.target.value })}
                      className="w-full text-[13px] rounded-md border px-3 py-2.5" style={{ borderColor: '#E2EEF1' }}>
                      <option value="">Select Available Bed</option>
                      {availableBeds.map(b => <option key={b.id} value={b.id}>{b.bed_number} ({b.bed_type})</option>)}
                    </select>
                  )}

                  {/* Staff Assignment — Doctor + Nurse side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <select value={admitForm.doctor_id} onChange={e => {
                      const doc = doctors.find(d => d.id === e.target.value);
                      setAdmitForm({ ...admitForm, doctor_id: e.target.value, doctor_name: doc?.full_name || '' });
                    }} className="w-full text-[13px] rounded-md border px-3 py-2.5" style={{ borderColor: '#E2EEF1' }}>
                      <option value="">Select Doctor</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                    </select>
                    <select value={admitForm.nurse_id} onChange={e => {
                      const nrs = nurses.find(n => n.id === e.target.value);
                      setAdmitForm({ ...admitForm, nurse_id: e.target.value, nurse_name: nrs?.full_name || '' });
                    }} className="w-full text-[13px] rounded-md border px-3 py-2.5" style={{ borderColor: '#E2EEF1' }}>
                      <option value="">Select Nurse (optional)</option>
                      {nurses.map(n => <option key={n.id} value={n.id}>{n.full_name} — {n.role}</option>)}
                    </select>
                  </div>

                  <Input placeholder="Diagnosis" value={admitForm.diagnosis} onChange={e => setAdmitForm({ ...admitForm, diagnosis: e.target.value })} className="text-[13px]" />
                  <textarea placeholder="Notes..." value={admitForm.notes} onChange={e => setAdmitForm({ ...admitForm, notes: e.target.value })}
                    className="w-full text-[13px] rounded-md border px-3 py-2.5 min-h-[80px]" style={{ borderColor: '#E2EEF1' }} />
                  <div className="flex gap-2">
                    <Button onClick={() => setAdmitStep(1)} variant="outline" className="text-[13px]">Back</Button>
                    <Button onClick={confirmAdmit} className="text-[13px] flex-1" style={{ background: '#F59E0B', color: '#fff' }}>Confirm Admission</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== DISCHARGE MODAL ===== */}
      {showDischargeModal && dischargePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowDischargeModal(false)} />
          <div className="relative w-full max-w-[480px] bg-white rounded-xl shadow-xl overflow-hidden">
            <JharokhaArch color="#10B981" opacity={0.18} />
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ color: '#1E293B' }}>Discharge {dischargePatient.patients?.full_name}</h2>
                <button onClick={() => setShowDischargeModal(false)}><X size={18} style={{ color: '#64748B' }} /></button>
              </div>
              <textarea placeholder="Discharge Summary..." value={dischargeForm.discharge_summary} onChange={e => setDischargeForm({ ...dischargeForm, discharge_summary: e.target.value })}
                className="w-full text-[13px] rounded-md border px-3 py-2.5 min-h-[100px]" style={{ borderColor: '#E2EEF1' }} />
              <select value={dischargeForm.discharge_condition} onChange={e => setDischargeForm({ ...dischargeForm, discharge_condition: e.target.value })}
                className="w-full text-[13px] rounded-md border px-3 py-2.5" style={{ borderColor: '#E2EEF1' }}>
                {['Recovered', 'Improved', 'Referred', 'Against Medical Advice', 'Deceased'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Input type="date" placeholder="Follow-up Date" value={dischargeForm.follow_up_date} onChange={e => setDischargeForm({ ...dischargeForm, follow_up_date: e.target.value })} className="text-[13px]" />
              <Input placeholder="Follow-up Doctor" value={dischargeForm.follow_up_doctor} onChange={e => setDischargeForm({ ...dischargeForm, follow_up_doctor: e.target.value })} className="text-[13px]" />
              <Button onClick={confirmDischarge} className="w-full text-[13px]" style={{ background: '#10B981', color: '#fff' }}>Confirm Discharge</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalPatients;
