import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientContext } from '@/hooks/usePatientContext';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Pill, AlertTriangle, Activity, ShieldCheck, Calendar, FileText, TrendingUp, QrCode, Phone, Plus, Loader2, X, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import PatientPrescriptionsOverview from '@/components/patient/dashboard/PatientPrescriptionsOverview';
import { generatePatientProfilePDF } from '@/utils/pdfReports';
import { useLanguage } from '@/contexts/LanguageContext';

const PatientOverview = () => {
  const { patient } = usePatientContext();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const firstName = patient.full_name?.split(' ')[0] || 'Patient';

  const [medications, setMedications] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [bpReadings, setBpReadings] = useState<any[]>([]);
  const [sugarReadings, setSugarReadings] = useState<any[]>([]);
  const [showLogVitals, setShowLogVitals] = useState(false);
  const [downloadingProfile, setDownloadingProfile] = useState(false);

  const fetchData = () => {
    const pid = patient.id;
    Promise.all([
      supabase.from('patient_medications').select('*').eq('patient_id', pid).eq('is_active', true).limit(10),
      supabase.from('patient_appointments').select('*').eq('patient_id', pid).eq('status', 'Upcoming').gte('appointment_date', new Date().toISOString().split('T')[0]).order('appointment_date', { ascending: true }).limit(3),
      supabase.from('patient_reports').select('*').eq('patient_id', pid).order('uploaded_at', { ascending: false }).limit(4),
      supabase.from('patient_vitals').select('*').eq('patient_id', pid).eq('vital_type', 'blood_pressure').order('recorded_at', { ascending: true }).limit(7),
      supabase.from('patient_vitals').select('*').eq('patient_id', pid).eq('vital_type', 'blood_sugar').order('recorded_at', { ascending: true }).limit(7),
    ]).then(([meds, appts, reps, bp, sugar]) => {
      setMedications(meds.data || []);
      setAppointments(appts.data || []);
      setReports(reps.data || []);
      setBpReadings(bp.data || []);
      setSugarReadings(sugar.data || []);
    });
  };

  useEffect(() => { fetchData(); }, [patient.id]);

  const handleDownloadProfile = async () => {
    setDownloadingProfile(true);
    try {
      // Fetch past treatments
      const { data: patientData } = await supabase.from('patients').select('past_treatments').eq('id', patient.id).single();
      // Fetch recent prescriptions
      const { data: rxData } = await supabase.from('prescriptions')
        .select('doctor_name, diagnosis, prescription_date, status, prescription_medicines(count)')
        .eq('patient_id', patient.id)
        .order('prescription_date', { ascending: false })
        .limit(10);

      generatePatientProfilePDF({
        fullName: patient.full_name,
        age: patient.age ?? undefined,
        gender: patient.gender ?? undefined,
        bloodGroup: patient.blood_group ?? undefined,
        phone: patient.phone ?? undefined,
        email: patient.email,
        address: patient.address ?? undefined,
        city: patient.city ?? undefined,
        state: patient.state ?? undefined,
        pinCode: patient.pin_code ?? undefined,
        dateOfBirth: patient.date_of_birth ?? undefined,
        abhaCardNo: patient.abha_card_no ?? undefined,
        emergencyContactName: patient.emergency_contact_name ?? undefined,
        emergencyContactRelation: patient.emergency_contact_relation ?? undefined,
        emergencyContactPhone: patient.emergency_contact_phone ?? undefined,
        allergies: patient.allergies ?? [],
        chronicConditions: patient.chronic_conditions ?? [],
        pastSurgeries: patient.past_surgeries ?? [],
        disabilities: patient.disabilities ?? [],
        currentMedications: medications.map((m: any) => m.medicine_name),
        organDonor: patient.organ_donor ?? false,
        insurance: patient.has_insurance ? {
          provider: patient.insurance_provider ?? undefined,
          policyNo: patient.insurance_policy_no ?? undefined,
          type: patient.insurance_type ?? undefined,
          validUntil: patient.insurance_validity_date ?? undefined,
          sumInsured: patient.sum_insured ?? undefined,
        } : undefined,
        pastTreatments: (patientData?.past_treatments as any[]) ?? [],
        prescriptions: (rxData || []).map((rx: any) => ({
          doctorName: rx.doctor_name,
          diagnosis: rx.diagnosis,
          date: rx.prescription_date,
          status: rx.status,
          medicineCount: rx.prescription_medicines?.[0]?.count ?? 0,
        })),
      });
      toast.success('Patient profile PDF downloaded!');
    } catch (e: any) {
      toast.error('Failed to generate PDF: ' + e.message);
    } finally {
      setDownloadingProfile(false);
    }
  };

  // Profile completeness
  const fields = [patient.full_name, patient.date_of_birth, patient.gender, patient.blood_group, patient.phone, patient.address, patient.city, patient.state, patient.pin_code, patient.emergency_contact_name];
  const filled = fields.filter(Boolean).length;
  const completeness = Math.round((filled / fields.length) * 100);

  const allergies = patient.allergies || [];
  const conditions = patient.chronic_conditions || [];
  const alertCount = (allergies.length > 0 ? 1 : 0) + (conditions.length > 0 ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl p-6 relative overflow-hidden" style={{ background: '#EBF7FA', border: '1px solid #D1EBF1' }}>
        <div className="absolute inset-0 right-0 jaali-pattern" style={{ opacity: 0.06 }} />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-[22px] font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
              {(() => {
                const hour = new Date().getHours();
                const key = hour < 12 ? 'welcome.greeting' : hour < 17 ? 'welcome.greetingAfternoon' : 'welcome.greetingEvening';
                return t(key);
              })()}, {firstName} 👋
            </h1>
            <p className="text-[14px] mb-3" style={{ color: '#64748B' }}>
              {t('welcome.profileStatus', { completeness })}
            </p>
            <div className="w-full max-w-xs h-1 rounded-full" style={{ background: '#E2EEF1' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${completeness}%`, background: '#0891B2' }} />
            </div>
            {completeness < 100 && (
              <button onClick={() => navigate('/patient/dashboard/settings')} className="text-[13px] font-medium mt-2" style={{ color: '#0891B2' }}>
                {t('welcome.completeProfile')}
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex flex-wrap gap-2 justify-end">
              {patient.blood_group && (
                <span className="px-3 py-1.5 rounded-full text-[12px] font-bold text-white" style={{ background: '#EF4444' }}>{patient.blood_group}</span>
              )}
              {patient.abha_card_no && (
                <span className="px-3 py-1.5 rounded-full text-[12px] font-bold text-white" style={{ background: '#10B981' }}>ABHA Linked</span>
              )}
              {alertCount > 0 && (
                <span className="px-3 py-1.5 rounded-full text-[12px] font-bold text-white" style={{ background: '#F59E0B' }}>{alertCount} Alerts</span>
              )}
            </div>
            {/* Download Full Profile Button */}
            <button
              onClick={handleDownloadProfile}
              disabled={downloadingProfile}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-60 transition-all shadow-sm"
              style={{ background: '#0891B2' }}
            >
              {downloadingProfile ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {downloadingProfile ? t('buttons.generatingPdf') : t('buttons.downloadProfile')}
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Quick Card */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EF4444', boxShadow: '0 2px 8px rgba(239,68,68,0.08)' }}>
        <JharokhaArch color="#EF4444" opacity={0.18} />
        <div className="p-5 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <h3 className="text-base font-bold mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>{t('emergency.title')}</h3>
            {patient.blood_group && (
              <span className="inline-block px-4 py-1 rounded-full text-[20px] font-bold mb-2" style={{ background: '#FEF2F2', color: '#EF4444', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                {patient.blood_group}
              </span>
            )}
            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {allergies.slice(0, 3).map(a => (
                  <span key={a} className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: '#FEF2F2', color: '#EF4444' }}>⚠️ {a}</span>
                ))}
                {allergies.length > 3 && <span className="text-[11px]" style={{ color: '#EF4444' }}>+{allergies.length - 3} more</span>}
              </div>
            )}
            {patient.emergency_contact_name && (
              <p className="text-[13px] flex items-center gap-1.5" style={{ color: '#64748B' }}>
                <Phone size={14} /> {patient.emergency_contact_name} ({patient.emergency_contact_relation}) — {patient.emergency_contact_phone}
              </p>
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            <button onClick={() => navigate('/patient/dashboard/emergency')}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: '#EF4444' }}>
              {t('emergency.showQR')}
            </button>
          </div>
        </div>
      </div>

      {/* Health Summary — 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={<Pill size={20} style={{ color: '#0891B2' }} />} label={t('cards.activeMedications')} value={medications.length} color="#0891B2"
          detail={medications.slice(0, 3).map(m => m.medicine_name).join(', ') || t('cards.noneAdded')}
          onViewAll={() => navigate('/patient/dashboard/records')} />
        <SummaryCard icon={<Activity size={20} style={{ color: '#F59E0B' }} />} label={t('cards.conditions')} value={conditions.length} color="#F59E0B"
          detail={conditions.slice(0, 3).join(', ') || t('cards.noneRecorded')}
          onViewAll={() => navigate('/patient/dashboard/records')} />
        <SummaryCard icon={<AlertTriangle size={20} style={{ color: '#EF4444' }} />} label={t('cards.allergies')} value={allergies.length} color="#EF4444"
          detail={allergies.slice(0, 3).join(', ') || t('cards.noneRecorded')}
          onViewAll={() => navigate('/patient/dashboard/records')} />
        <SummaryCard icon={<ShieldCheck size={20} style={{ color: '#10B981' }} />} label={t('cards.insurance')}
          value={patient.has_insurance ? 1 : 0} color="#10B981"
          detail={patient.has_insurance ? (patient.insurance_provider || t('cards.active')) : t('cards.notEnrolled')}
          onViewAll={() => navigate('/patient/dashboard/settings')} />
      </div>

      {/* Prescriptions & Medicine Schedule */}
      <PatientPrescriptionsOverview patientId={patient.id} />

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#0891B2" opacity={0.18} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>{t('appointments.upcoming')}</h3>
            <button onClick={() => navigate('/patient/dashboard/appointments')} className="text-[13px] font-medium" style={{ color: '#0891B2' }}>{t('appointments.book')}</button>
          </div>
          {appointments.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar size={32} className="mx-auto mb-2" style={{ color: '#D1EBF1' }} />
              <p className="text-[13px]" style={{ color: '#94A3B8' }}>{t('appointments.noUpcoming')}</p>
              <button onClick={() => navigate('/patient/dashboard/appointments')} className="text-[13px] font-medium mt-1" style={{ color: '#0891B2' }}>
                {t('appointments.bookFirst')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#F7FBFC' }}>
                  <Calendar size={18} style={{ color: '#0891B2' }} />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold" style={{ color: '#1E293B' }}>{a.doctor_name}</p>
                    <p className="text-[12px]" style={{ color: '#64748B' }}>{a.hospital_name}</p>
                  </div>
                  <span className="text-[12px] font-medium px-2 py-0.5 rounded-md text-white" style={{ background: '#0891B2' }}>
                    {a.appointment_date ? format(new Date(a.appointment_date), 'dd MMM') : '—'}
                    {a.appointment_time ? ` · ${a.appointment_time}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#F59E0B" opacity={0.18} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>{t('reports.recent')}</h3>
            <button onClick={() => navigate('/patient/dashboard/reports')} className="text-[13px] font-medium" style={{ color: '#0891B2' }}>{t('reports.upload')}</button>
          </div>
          {reports.length === 0 ? (
            <div className="py-8 text-center">
              <FileText size={32} className="mx-auto mb-2" style={{ color: '#D1EBF1' }} />
              <p className="text-[13px]" style={{ color: '#94A3B8' }}>{t('reports.noReports')}</p>
              <button onClick={() => navigate('/patient/dashboard/reports')} className="text-[13px] font-medium mt-1" style={{ color: '#0891B2' }}>
                {t('reports.uploadFirst')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#F7FBFC' }}>
                  <FileText size={18} style={{ color: r.file_type === 'pdf' ? '#EF4444' : '#0891B2' }} />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold" style={{ color: '#1E293B' }}>{r.report_name}</p>
                    <p className="text-[11px]" style={{ color: '#64748B' }}>{r.report_type} · {r.doctor_name || 'No doctor'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px]" style={{ color: '#64748B' }}>{r.report_date ? format(new Date(r.report_date), 'dd MMM yyyy') : '—'}</p>
                    {r.is_abnormal && <span className="text-[10px] font-bold" style={{ color: '#EF4444' }}>⚠️ {t('reports.abnormal')}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vitals Trend */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#0891B2" opacity={0.18} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>{t('vitals.tracker')}</h3>
            <button onClick={() => setShowLogVitals(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white" style={{ background: '#0891B2' }}>
              <Plus size={14} /> {t('vitals.logReading')}
            </button>
          </div>
          {bpReadings.length === 0 && sugarReadings.length === 0 ? (
            <div className="py-8 text-center">
              <TrendingUp size={32} className="mx-auto mb-2" style={{ color: '#D1EBF1' }} />
              <p className="text-[13px]" style={{ color: '#94A3B8' }}>{t('vitals.noVitals')}</p>
              <button onClick={() => setShowLogVitals(true)} className="text-[13px] font-medium mt-1" style={{ color: '#0891B2' }}>
                {t('vitals.logFirst')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {bpReadings.length > 0 && (
                <div>
                  <p className="text-[12px] font-medium mb-2" style={{ color: '#64748B' }}>{t('vitals.bpLast7')}</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={bpReadings.map(r => {
                      const parts = r.reading_value.split('/');
                      return { date: format(new Date(r.recorded_at), 'dd/MM'), sys: parseInt(parts[0]) || 0, dia: parseInt(parts[1]) || 0 };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2EEF1" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="sys" stroke="#0891B2" strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
                      <Line type="monotone" dataKey="dia" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {sugarReadings.length > 0 && (
                <div>
                  <p className="text-[12px] font-medium mb-2" style={{ color: '#64748B' }}>{t('vitals.sugarLast7')}</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={sugarReadings.map(r => ({
                      date: format(new Date(r.recorded_at), 'dd/MM'),
                      value: parseFloat(r.reading_value) || 0,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2EEF1" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} name="mg/dL" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Log Vitals Modal */}
      {showLogVitals && <LogVitalsModal patientId={patient.id} onClose={() => setShowLogVitals(false)} onSaved={() => { setShowLogVitals(false); fetchData(); }} />}
    </div>
  );
};

/* Reusable summary card */
const SummaryCard = ({ icon, label, value, color, detail, onViewAll }: {
  icon: React.ReactNode; label: string; value: number; color: string; detail: string; onViewAll: () => void;
}) => (
  <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
    <JharokhaArch color={color} opacity={0.18} />
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>{icon}</div>
        <span className="text-[12px] font-medium" style={{ color: '#64748B' }}>{label}</span>
      </div>
      <p className="text-[28px] font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color }}>{value}</p>
      <p className="text-[12px] truncate mb-2" style={{ color: '#64748B' }}>{detail}</p>
      <button onClick={onViewAll} className="text-[12px] font-medium" style={{ color: '#0891B2' }}>{label === 'View all →' ? label : 'View all →'}</button>
    </div>
  </div>
);

/* Log Vitals Modal */
const LogVitalsModal = ({ patientId, onClose, onSaved }: { patientId: string; onClose: () => void; onSaved: () => void }) => {
  const [vitalType, setVitalType] = useState<'blood_pressure' | 'blood_sugar'>('blood_pressure');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [sugarValue, setSugarValue] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    let readingValue = '';
    if (vitalType === 'blood_pressure') {
      if (!systolic || !diastolic) { toast.error('Please enter both systolic and diastolic values'); return; }
      readingValue = `${systolic}/${diastolic}`;
    } else {
      if (!sugarValue) { toast.error('Please enter blood sugar value'); return; }
      readingValue = sugarValue;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('patient_vitals').insert({
        patient_id: patientId,
        vital_type: vitalType,
        reading_value: readingValue,
        notes: notes || null,
        recorded_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Vital reading logged!');
      onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-[420px] w-full" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#0891B2" opacity={0.18} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Log Vital Reading</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X size={18} style={{ color: '#64748B' }} /></button>
          </div>

          {/* Vital Type Toggle */}
          <div className="flex gap-2 mb-4">
            {(['blood_pressure', 'blood_sugar'] as const).map(t => (
              <button key={t} onClick={() => setVitalType(t)}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all"
                style={{
                  background: vitalType === t ? (t === 'blood_pressure' ? '#0891B2' : '#10B981') : '#F1F5F9',
                  color: vitalType === t ? '#fff' : '#64748B',
                }}>
                {t === 'blood_pressure' ? '🩸 Blood Pressure' : '🍬 Blood Sugar'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {vitalType === 'blood_pressure' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Systolic (mmHg)</label>
                  <input className="field-input" type="number" placeholder="e.g. 120" value={systolic} onChange={e => setSystolic(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Diastolic (mmHg)</label>
                  <input className="field-input" type="number" placeholder="e.g. 80" value={diastolic} onChange={e => setDiastolic(e.target.value)} />
                </div>
              </div>
            ) : (
              <div>
                <label className="field-label">Blood Sugar (mg/dL)</label>
                <input className="field-input" type="number" placeholder="e.g. 110" value={sugarValue} onChange={e => setSugarValue(e.target.value)} />
              </div>
            )}
            <div>
              <label className="field-label">Notes (optional)</label>
              <input className="field-input" placeholder="e.g. After breakfast, Fasting" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: vitalType === 'blood_pressure' ? '#0891B2' : '#10B981' }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Reading'}
            </button>
            <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-[13px] font-medium" style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientOverview;
