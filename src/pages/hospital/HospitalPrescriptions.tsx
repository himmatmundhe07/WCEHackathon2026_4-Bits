import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Pill, Plus, Eye, BarChart2, X, Loader2, Clock, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';
import type { HospitalProfile } from '@/hooks/useHospitalContext';
import { generatePrescriptionPDF, generateFeedbackPDF, generatePharmacyAlertReportPDF } from '@/utils/pdfReports';

const HospitalPrescriptions = () => {
  const { hospital } = useOutletContext<{ hospital: HospitalProfile | null }>();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRx, setSelectedRx] = useState<any | null>(null);
  const [feedbackData, setFeedbackData] = useState<any | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  const fetchPrescriptions = async () => {
    if (!hospital) return;
    const { data } = await supabase
      .from('prescriptions')
      .select('*, patients(full_name, blood_group, allergies, profile_photo_url, date_of_birth)')
      .eq('hospital_id', hospital.id)
      .order('prescription_date', { ascending: false });
    if (data) setPrescriptions(data);
  };

  const fetchPatients = async () => {
    if (!hospital) return;
    const { data } = await supabase
      .from('hospital_patients')
      .select('*, patients(id, full_name, blood_group, allergies, date_of_birth, profile_photo_url)')
      .eq('hospital_id', hospital.id)
      .eq('relationship_type', 'Admitted');
    if (data) setPatients(data);
  };

  const fetchStaff = async () => {
    if (!hospital) return;
    const { data } = await supabase
      .from('hospital_staff')
      .select('*')
      .eq('hospital_id', hospital.id)
      .eq('role', 'Doctor');
    if (data) setStaff(data);
  };

  useEffect(() => {
    fetchPrescriptions();
    fetchPatients();
    fetchStaff();

    if (!hospital) return;
    const ch = supabase.channel('rx-feedback-live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'prescription_feedback',
        filter: 'hospital_id=eq.' + hospital.id,
      }, () => {
        toast.success('📋 New patient feedback received!');
        fetchPrescriptions();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [hospital]);

  const today = new Date().toISOString().split('T')[0];

  const filteredRx = prescriptions.filter((rx) => {
    if (filter === 'Active' && rx.status !== 'Active') return false;
    if (filter === 'Awaiting Feedback' && !(rx.feedback_requested && rx.feedback_deadline_date && rx.feedback_deadline_date <= today)) return false;
    if (filter === 'Completed' && rx.status !== 'Completed') return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(rx.patients?.full_name?.toLowerCase().includes(s) || rx.diagnosis?.toLowerCase().includes(s))) return false;
    }
    return true;
  });

  const viewFeedback = async (rx: any) => {
    const { data } = await supabase
      .from('prescription_feedback')
      .select('*')
      .eq('prescription_id', rx.id)
      .maybeSingle();
    setFeedbackData(data);
    setSelectedRx(rx);
  };

  const downloadRxPDF = async (rx: any) => {
    const { data: meds } = await supabase.from('prescription_medicines').select('*').eq('prescription_id', rx.id);
    const patAge = rx.patients?.date_of_birth ? Math.floor((Date.now() - new Date(rx.patients.date_of_birth).getTime()) / 31557600000) : undefined;
    generatePrescriptionPDF({
      patientName: rx.patients?.full_name || 'Patient',
      patientAge: patAge,
      bloodGroup: rx.patients?.blood_group,
      doctorName: rx.doctor_name,
      doctorSpecialization: rx.doctor_specialization,
      hospitalName: hospital?.hospital_name || '',
      hospitalCity: hospital?.city,
      diagnosis: rx.diagnosis,
      generalInstructions: rx.general_instructions,
      prescriptionDate: rx.prescription_date,
      validUntil: rx.valid_until,
      medicines: (meds || []).map(m => ({
        name: m.medicine_name,
        dosage: m.dosage,
        form: m.medicine_form,
        timesPerDay: m.times_per_day,
        durationDays: m.duration_days,
        schedule: m.schedule as { time: string; label: string; with: string }[] | undefined,
        specialInstructions: m.special_instructions,
      })),
    });
    toast.success('📄 Prescription PDF downloaded!');
  };

  const discontinue = async (id: string) => {
    await supabase.from('prescriptions').update({ status: 'Discontinued' }).eq('id', id);
    toast.success('Prescription discontinued.');
    fetchPrescriptions();
  };

  const filters = ['All', 'Active', 'Awaiting Feedback', 'Completed'];

  const statusColor = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      Active: { bg: '#DCFCE7', color: '#16A34A' },
      Completed: { bg: '#E0E7FF', color: '#4F46E5' },
      Discontinued: { bg: '#FEE2E2', color: '#DC2626' },
      Expired: { bg: '#F1F5F9', color: '#64748B' },
    };
    return map[status] || map.Expired;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
            💊 Prescriptions
          </h1>
          <p className="text-[13px]" style={{ color: '#64748B' }}>Manage prescriptions, track feedback and treatment outcomes.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold text-white"
          style={{ background: '#F59E0B' }}
        >
          <Plus size={16} /> New Prescription
        </button>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium"
              style={{
                background: filter === f ? '#0891B2' : '#F1F5F9',
                color: filter === f ? '#FFF' : '#64748B',
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          className="flex-1 px-3 py-2 rounded-lg border text-[13px]"
          style={{ borderColor: '#E2EEF1' }}
          placeholder="Search patient or diagnosis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#0891B2" opacity={0.18} />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: '#F7FBFC' }}>
                {['Date', 'Patient', 'Diagnosis', 'Feedback Due', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left p-3 font-semibold" style={{ color: '#64748B' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRx.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No prescriptions found.</td></tr>
              ) : (
                filteredRx.map((rx) => {
                  const sc = statusColor(rx.status || 'Active');
                  const feedbackDue = rx.feedback_requested && rx.feedback_deadline_date;
                  let feedbackLabel = 'Not requested';
                  let feedbackBg = '#F1F5F9';
                  let feedbackColor = '#64748B';
                  if (feedbackDue) {
                    if (rx.feedback_deadline_date > today) {
                      const daysLeft = Math.ceil((new Date(rx.feedback_deadline_date).getTime() - Date.now()) / 86400000);
                      feedbackLabel = 'Due in ' + daysLeft + 'd';
                      feedbackBg = '#FFFBEB';
                      feedbackColor = '#D97706';
                    } else {
                      feedbackLabel = 'Overdue';
                      feedbackBg = '#FEE2E2';
                      feedbackColor = '#DC2626';
                    }
                  }
                  return (
                    <tr key={rx.id} className="border-t" style={{ borderColor: '#F1F5F9' }}>
                      <td className="p-3">{rx.prescription_date ? format(new Date(rx.prescription_date), 'dd MMM yyyy') : '—'}</td>
                      <td className="p-3 font-medium">{rx.patients?.full_name || '—'}</td>
                      <td className="p-3 max-w-[200px] truncate">{rx.diagnosis}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: feedbackBg, color: feedbackColor }}>
                          {feedbackLabel}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: sc.bg, color: sc.color }}>
                          {rx.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button onClick={() => viewFeedback(rx)} className="p-1.5 rounded-md" style={{ background: '#EBF7FA' }} title="View">
                            <Eye size={14} style={{ color: '#0891B2' }} />
                          </button>
                          <button onClick={() => downloadRxPDF(rx)} className="p-1.5 rounded-md" style={{ background: '#F0FDF4' }} title="Download PDF">
                            <Download size={14} style={{ color: '#10B981' }} />
                          </button>
                          {rx.status === 'Active' && (
                            <button onClick={() => discontinue(rx.id)} className="p-1.5 rounded-md" style={{ background: '#FEF2F2' }} title="Discontinue">
                              <X size={14} style={{ color: '#EF4444' }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Prescription Modal */}
      {showModal && (
        <NewPrescriptionModal
          hospitalId={hospital?.id || ''}
          patients={patients}
          staff={staff}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchPrescriptions(); }}
        />
      )}

      {/* Feedback Detail Drawer */}
      {selectedRx && (
        <FeedbackDrawer
          rx={selectedRx}
          feedback={feedbackData}
          onClose={() => { setSelectedRx(null); setFeedbackData(null); }}
        />
      )}
    </div>
  );
};

/* ─── New Prescription Modal ─── */
const NewPrescriptionModal = ({ hospitalId, patients, staff, onClose, onSaved }: {
  hospitalId: string; patients: any[]; staff: any[]; onClose: () => void; onSaved: () => void;
}) => {
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [instructions, setInstructions] = useState('');
  const [feedbackDays, setFeedbackDays] = useState(0);
  const [requestFeedback, setRequestFeedback] = useState(true);
  const [validDays, setValidDays] = useState(30);
  const [medicines, setMedicines] = useState<any[]>([{ name: '', dosage: '', form: 'Tablet', timesPerDay: 3, durationDays: 7, instructions: '' }]);
  const [saving, setSaving] = useState(false);

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', form: 'Tablet', timesPerDay: 3, durationDays: 7, instructions: '' }]);
  };

  const updateMed = (idx: number, field: string, value: any) => {
    const updated = [...medicines];
    updated[idx] = { ...updated[idx], [field]: value };
    setMedicines(updated);
  };

  const removeMed = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
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

  const handleSubmit = async () => {
    if (!patientId || !diagnosis || medicines.some(m => !m.name || !m.dosage)) {
      toast.error('Please fill all required fields.');
      return;
    }
    setSaving(true);
    try {
      const doctor = staff.find(s => s.id === doctorId);
      const todayDate = new Date().toISOString().split('T')[0];

      const { data: rx, error: rxErr } = await supabase.from('prescriptions').insert([{
        hospital_id: hospitalId,
        patient_id: patientId,
        doctor_id: doctorId || null,
        doctor_name: doctor?.full_name || 'Doctor',
        doctor_specialization: doctor?.specialization || null,
        diagnosis,
        general_instructions: instructions || null,
        feedback_after_days: feedbackDays,
        feedback_requested: requestFeedback,
        feedback_deadline_date: requestFeedback ? addDays(new Date(), feedbackDays).toISOString().split('T')[0] : null,
        prescription_date: todayDate,
        valid_until: addDays(new Date(), validDays).toISOString().split('T')[0],
      }]).select().single();

      if (rxErr) throw rxErr;

      const medsRows = medicines.map(m => ({
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

      toast.success('💊 Prescription issued successfully!');
      onSaved();
    } catch (e: any) {
      toast.error('Error: ' + (e.message || 'Failed'));
    } finally {
      setSaving(false);
    }
  };

  const forms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Inhaler', 'Patch', 'Other'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[600px] flex flex-col" style={{ maxHeight: '90vh' }}>
        <JharokhaArch color="#0891B2" opacity={0.18} />

        <div className="p-6 border-b flex-shrink-0 flex items-center justify-between" style={{ borderColor: '#E2EEF1' }}>
          <h2 className="text-lg font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>💊 New Prescription</h2>
          <button onClick={onClose}><X size={18} style={{ color: '#64748B' }} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Patient + Doctor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Patient *</label>
              <select className="field-input" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                <option value="">Select patient</option>
                {patients.map(p => <option key={p.patients?.id || p.id} value={p.patients?.id || p.id}>{p.patients?.full_name || 'Patient'}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Doctor</label>
              <select className="field-input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                <option value="">Select doctor</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
          </div>

          {/* Diagnosis */}
          <div>
            <label className="field-label">Diagnosis *</label>
            <textarea className="field-input" rows={2} placeholder="e.g. Acute bacterial sinusitis with mild fever" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          </div>

          {/* Medicines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="field-label mb-0">Medicines</label>
              <button onClick={addMedicine} className="text-[12px] font-bold flex items-center gap-1" style={{ color: '#0891B2' }}>
                <Plus size={14} /> Add Medicine
              </button>
            </div>
            <div className="space-y-3">
              {medicines.map((m, idx) => (
                <div key={idx} className="p-3 rounded-lg" style={{ border: '1px solid #E2EEF1', background: '#FAFCFD' }}>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <input className="field-input" placeholder="Medicine name *" value={m.name} onChange={(e) => updateMed(idx, 'name', e.target.value)} />
                    <input className="field-input" placeholder="Dosage *" value={m.dosage} onChange={(e) => updateMed(idx, 'dosage', e.target.value)} />
                    <select className="field-input" value={m.form} onChange={(e) => updateMed(idx, 'form', e.target.value)}>
                      {forms.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="text-[11px] font-medium" style={{ color: '#64748B' }}>Duration (days)</label>
                      <input className="field-input" type="number" min="1" value={m.durationDays} onChange={(e) => updateMed(idx, 'durationDays', parseInt(e.target.value) || 7)} />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium" style={{ color: '#64748B' }}>Times per day</label>
                      <select className="field-input" value={m.timesPerDay} onChange={(e) => updateMed(idx, 'timesPerDay', parseInt(e.target.value))}>
                        {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}×</option>)}
                      </select>
                    </div>
                  </div>
                  <input className="field-input" placeholder="Special instructions (optional)" value={m.instructions} onChange={(e) => updateMed(idx, 'instructions', e.target.value)} />
                  {medicines.length > 1 && (
                    <button onClick={() => removeMed(idx)} className="text-[11px] font-medium mt-2" style={{ color: '#EF4444' }}>Remove ✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* General Instructions */}
          <div>
            <label className="field-label">General Instructions</label>
            <textarea className="field-input" rows={2} placeholder="Drink plenty of water. Avoid cold foods." value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          </div>

          {/* Feedback Settings */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-[13px] font-medium">
              <input type="checkbox" checked={requestFeedback} onChange={(e) => setRequestFeedback(e.target.checked)} />
              Request patient feedback
            </label>
            {requestFeedback && (
              <div className="flex items-center gap-1">
                <span className="text-[12px]" style={{ color: '#64748B' }}>after</span>
                <input className="field-input w-16 text-center" type="number" min={1} max={90} value={feedbackDays} onChange={(e) => setFeedbackDays(parseInt(e.target.value) || 7)} />
                <span className="text-[12px]" style={{ color: '#64748B' }}>days</span>
              </div>
            )}
          </div>

          {/* Valid Until */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium">Valid for</span>
            <input className="field-input w-16 text-center" type="number" min={1} value={validDays} onChange={(e) => setValidDays(parseInt(e.target.value) || 30)} />
            <span className="text-[12px]" style={{ color: '#64748B' }}>days</span>
          </div>
        </div>

        <div className="p-4 border-t flex-shrink-0" style={{ borderColor: '#E2EEF1' }}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-2.5 rounded-lg text-[14px] font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#0891B2' }}
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Issuing...</> : 'Issue Prescription'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Feedback Detail Drawer ─── */
const FeedbackDrawer = ({ rx, feedback, onClose }: { rx: any; feedback: any | null; onClose: () => void }) => {
  const ratingLabels = ['', 'Much worse', 'Worse', 'Same', 'Better', 'Much better'];
  const ratingEmojis = ['', '😞', '😕', '😐', '🙂', '😊'];

  const [showPharmaSelect, setShowPharmaSelect] = useState(false);
  const [selectedPharma, setSelectedPharma] = useState('Global Sanjeevani Network (All Partners)');
  const [isSending, setIsSending] = useState(false);
  const [pharmaciesList, setPharmaciesList] = useState<string[]>([
    'Global Sanjeevani Network (All Partners)',
    'Apollo Pharmacy Network',
    'Wellness Forever',
    'MedPlus Stores',
    'Sanjeevani Partner Pharmacies'
  ]);

  useEffect(() => {
    const fetchPharmacies = async () => {
      const { data, error } = await supabase.from('pharmacies' as any).select('pharmacy_name');
      if (!error && data && data.length > 0) {
        const uniqueNames = Array.from(new Set(data.map((p: any) => p.pharmacy_name)));
        setPharmaciesList(['Global Sanjeevani Network (All Partners)', ...uniqueNames]);
      }
    };
    if (showPharmaSelect) {
      fetchPharmacies();
    }
  }, [showPharmaSelect]);

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white w-full max-w-[560px] h-full overflow-y-auto shadow-xl" style={{ borderLeft: '1px solid #E2EEF1' }}>
        <JharokhaArch color={feedback ? '#10B981' : '#0891B2'} opacity={0.18} />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
              {feedback ? '📊 Feedback Report' : '💊 Prescription Detail'}
            </h2>
            <button onClick={onClose}><X size={18} style={{ color: '#64748B' }} /></button>
          </div>

          {/* Prescription Info */}
          <div className="p-4 rounded-lg mb-6" style={{ background: '#F7FBFC', border: '1px solid #E2EEF1' }}>
            <p className="text-[14px] font-bold" style={{ color: '#1E293B' }}>{rx.patients?.full_name || 'Patient'}</p>
            <p className="text-[12px]" style={{ color: '#64748B' }}>
              Issued by Dr. {rx.doctor_name} · {rx.prescription_date ? format(new Date(rx.prescription_date), 'dd MMM yyyy') : ''}
            </p>
            <p className="text-[13px] mt-2 font-medium" style={{ color: '#475569' }}>Diagnosis: {rx.diagnosis}</p>
          </div>

          {/* Feedback */}
          {feedback ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg text-center" style={{ background: '#F0FDF4' }}>
                  <p className="text-3xl mb-1">{ratingEmojis[feedback.improvement_rating] || '—'}</p>
                  <p className="text-[12px] font-bold" style={{ color: '#16A34A' }}>{ratingLabels[feedback.improvement_rating] || '—'}</p>
                  <p className="text-[11px]" style={{ color: '#64748B' }}>Overall Improvement</p>
                </div>
                <div className="p-3 rounded-lg text-center" style={{ background: '#EFF6FF' }}>
                  <p className="text-2xl font-bold mb-1" style={{ color: '#2563EB' }}>{feedback.adherence_rating}</p>
                  <p className="text-[11px]" style={{ color: '#64748B' }}>Medicine Adherence</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg" style={{ background: '#FAFCFD', border: '1px solid #E2EEF1' }}>
                  <p className="text-[12px] font-bold mb-1" style={{ color: '#64748B' }}>Symptoms Resolved</p>
                  <p className="text-[14px] font-bold" style={{ color: feedback.symptoms_resolved ? '#16A34A' : '#DC2626' }}>
                    {feedback.symptoms_resolved ? '✅ Yes' : '❌ No'}
                  </p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: '#FAFCFD', border: '1px solid #E2EEF1' }}>
                  <p className="text-[12px] font-bold mb-1" style={{ color: '#64748B' }}>Pain Level</p>
                  <p className="text-[14px] font-bold">
                    <span style={{ color: '#DC2626' }}>{feedback.pain_level_before}/10</span>
                    <span style={{ color: '#64748B' }}> → </span>
                    <span style={{ color: '#16A34A' }}>{feedback.pain_level_after}/10</span>
                  </p>
                </div>
              </div>

              {feedback.had_side_effects && (
                <div className="p-3 rounded-lg" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <p className="text-[13px] font-bold mb-2" style={{ color: '#92400E' }}>⚠️ Side Effects — {feedback.side_effect_severity}</p>
                  <div className="flex flex-wrap gap-1">
                    {(feedback.side_effects || []).map((se: string) => (
                      <span key={se} className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: '#FEF3C7', color: '#92400E' }}>
                        {se}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {feedback.patient_notes && (
                <div className="p-3 rounded-lg" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <p className="text-[12px] font-bold mb-1" style={{ color: '#64748B' }}>Patient's Words</p>
                  <p className="text-[13px] italic" style={{ color: '#1E293B' }}>"{feedback.patient_notes}"</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-2 mt-4">
                {!showPharmaSelect ? (
                  <button
                    onClick={() => setShowPharmaSelect(true)}
                    className="w-full py-2.5 rounded-lg text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-all hover:bg-cyan-700"
                    style={{ background: '#0891B2' }}
                  >
                    <AlertTriangle size={14} /> Send Report to Pharmacy Network
                  </button>
                ) : (
                  <div className="p-3 rounded-lg border" style={{ borderColor: '#E2EEF1', background: '#F8FAFC' }}>
                    <p className="text-[12px] font-bold mb-2 text-[#1E293B]">Select Partner Pharmacy Data Hub</p>
                    <select 
                      className="w-full mb-2 p-2 rounded border text-[13px]" 
                      style={{ borderColor: '#E2EEF1' }}
                      value={selectedPharma}
                      onChange={(e) => setSelectedPharma(e.target.value)}
                    >
                      <option value="">-- Choose Pharmacy Network --</option>
                      {pharmaciesList.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        disabled={isSending}
                        onClick={async () => {
                          if (!selectedPharma) {
                            toast.error('Please select a pharmacy first.');
                            return;
                          }
                          setIsSending(true);
                          
                          try {
                            // 1. Actually Update Supabase DB to mark this as shared so Pharma can read it!
                            const { error: dbError } = await supabase
                              .from('prescription_feedback')
                              .update({ 
                                shared_with_pharma: true, 
                                shared_pharma_network: selectedPharma 
                              } as any)
                              .eq('id', feedback.id);

                            if (dbError) throw dbError;

                            toast.success(`🔄 Preparing anonymous alert for ${selectedPharma}...`);
                            
                            // 2. Client-side PDF Generation as a receipt
                            generatePharmacyAlertReportPDF({
                              diagnosis: rx.diagnosis,
                              feedback,
                            });

                            setTimeout(() => {
                              toast.success(`✅ Anonymous feedback securely routed to ${selectedPharma}!`);
                              setShowPharmaSelect(false);
                            }, 1500);

                          } catch (err: any) {
                            console.error('Sharing failed:', err);
                            toast.error('Transmission failed: Please check if you ran the Supabase SQL update.');
                          } finally {
                            setIsSending(false);
                          }
                        }}
                        className="flex-1 py-2 rounded-lg text-[12px] font-bold text-white transition-all bg-[#0891B2] hover:bg-cyan-700 disabled:opacity-50"
                      >
                        {isSending ? 'Transmitting...' : 'Send Alert Securely'}
                      </button>
                      <button
                        disabled={isSending}
                        onClick={() => setShowPharmaSelect(false)}
                        className="px-3 py-2 rounded-lg text-[12px] font-bold border hover:bg-gray-50 disabled:opacity-50"
                        style={{ color: '#64748B', borderColor: '#E2EEF1' }}
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-[10px] text-center mt-2 text-[#64748B]">
                      * Note: Only anonymous medical analytics and symptomatic results will be shared. No personal identifiable information (PII) is transmitted.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    generateFeedbackPDF({
                      patientName: rx.patients?.full_name || 'Patient',
                      doctorName: rx.doctor_name,
                      hospitalName: 'Sanjeevani Hospital',
                      diagnosis: rx.diagnosis,
                      prescriptionDate: rx.prescription_date,
                      feedback,
                    });
                    toast.success('📄 Feedback report downloaded!');
                  }}
                  className="w-full py-2.5 rounded-lg text-[13px] font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: '#10B981' }}
                >
                  <Download size={14} /> Download Feedback Report PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock size={40} className="mx-auto mb-3" style={{ color: '#D1EBF1' }} />
              <p className="text-[14px] font-medium" style={{ color: '#94A3B8' }}>No feedback received yet.</p>
              {rx.feedback_requested && rx.feedback_deadline_date && (
                <p className="text-[12px] mt-1" style={{ color: '#64748B' }}>
                  Expected after {format(new Date(rx.feedback_deadline_date), 'dd MMM yyyy')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalPrescriptions;
