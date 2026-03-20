import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientContext } from '@/hooks/usePatientContext';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Pill, Plus, Edit2, BellOff, ChevronDown, AlertTriangle, X, Trash2, Loader2, Stethoscope, HeartPulse, Syringe } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const TABS = ['Current Medications', 'Past Treatments', 'Medical Conditions', 'Allergy Management', 'Discharge Summaries'];
const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times', 'As needed', 'Other'];
const TIMES = ['Morning', 'Afternoon', 'Evening', 'Bedtime'];
const TREATMENT_TYPES = ['Hospitalization', 'Surgery', 'Procedure', 'Therapy', 'Consultation', 'Emergency Visit', 'Other'];

const COMMON_CONDITIONS = [
  'Diabetes (Type 2)', 'Hypertension', 'Asthma', 'Thyroid Disorder', 'Heart Disease',
  'Arthritis', 'COPD', 'Kidney Disease', 'Liver Disease', 'Depression',
  'Anxiety', 'Epilepsy', 'Cancer', 'Tuberculosis', 'Migraine', 'PCOS', 'Diabetes (Type 1)',
];

const COMMON_SURGERIES = [
  'Appendectomy', 'C-Section', 'Cataract Surgery', 'Hernia Repair', 'Knee Replacement',
  'Hip Replacement', 'Heart Bypass (CABG)', 'Angioplasty', 'Gallbladder Removal', 'Tonsillectomy',
  'Dental Extraction', 'Fracture Fixation', 'Eye Surgery (LASIK)', 'Thyroidectomy', 'Hysterectomy',
];

interface PastTreatment {
  id: string;
  type: string;
  title: string;
  hospital_name: string;
  doctor_name: string;
  date: string;
  end_date: string;
  diagnosis: string;
  notes: string;
  outcome: string;
}

const PatientRecords = () => {
  const { patient } = usePatientContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [medications, setMedications] = useState<any[]>([]);
  const [showAddMed, setShowAddMed] = useState(false);
  const [editMed, setEditMed] = useState<any>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [inactiveMeds, setInactiveMeds] = useState<any[]>([]);

  // Past treatments
  const [treatments, setTreatments] = useState<PastTreatment[]>([]);
  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [editTreatment, setEditTreatment] = useState<PastTreatment | null>(null);
  const [savingTreatment, setSavingTreatment] = useState(false);

  // Medical conditions
  const [conditions, setConditions] = useState<string[]>(patient.chronic_conditions || []);
  const [surgeriesList, setSurgeriesList] = useState<string[]>(patient.past_surgeries || []);
  const [newCondition, setNewCondition] = useState('');
  const [newSurgery, setNewSurgery] = useState('');
  const [savingConditions, setSavingConditions] = useState(false);

  const fetchMedications = async () => {
    const { data: active } = await supabase.from('patient_medications').select('*').eq('patient_id', patient.id).eq('is_active', true).order('created_at', { ascending: false });
    const { data: inactive } = await supabase.from('patient_medications').select('*').eq('patient_id', patient.id).eq('is_active', false).order('created_at', { ascending: false });
    setMedications(active || []);
    setInactiveMeds(inactive || []);
  };

  const fetchTreatments = async () => {
    const { data } = await supabase.from('patients').select('past_treatments').eq('id', patient.id).single();
    if (data?.past_treatments) {
      setTreatments(data.past_treatments as unknown as PastTreatment[]);
    }
  };

  useEffect(() => { fetchMedications(); fetchTreatments(); }, [patient.id]);

  const handleMarkInactive = async (id: string) => {
    await supabase.from('patient_medications').update({ is_active: false }).eq('id', id);
    toast.success('Medication marked inactive');
    fetchMedications();
  };

  const saveTreatment = async (t: PastTreatment) => {
    setSavingTreatment(true);
    try {
      let updated: PastTreatment[];
      if (editTreatment) {
        updated = treatments.map(x => x.id === editTreatment.id ? t : x);
      } else {
        updated = [...treatments, { ...t, id: crypto.randomUUID() }];
      }
      const { error } = await supabase.from('patients').update({
        past_treatments: updated as any,
      }).eq('id', patient.id);
      if (error) throw error;
      setTreatments(updated);
      setShowAddTreatment(false);
      setEditTreatment(null);
      toast.success(editTreatment ? 'Treatment updated' : 'Treatment added');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingTreatment(false);
    }
  };

  const deleteTreatment = async (id: string) => {
    const updated = treatments.filter(t => t.id !== id);
    await supabase.from('patients').update({ past_treatments: updated as any }).eq('id', patient.id);
    setTreatments(updated);
    toast.success('Treatment removed');
  };

  const saveConditions = async () => {
    setSavingConditions(true);
    try {
      const { error } = await supabase.from('patients').update({
        chronic_conditions: conditions,
        past_surgeries: surgeriesList,
      }).eq('id', patient.id);
      if (error) throw error;
      toast.success('Medical conditions updated');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingConditions(false);
    }
  };

  const addCondition = (val: string) => {
    const v = val.trim();
    if (v && !conditions.includes(v)) setConditions([...conditions, v]);
    setNewCondition('');
  };

  const addSurgery = (val: string) => {
    const v = val.trim();
    if (v && !surgeriesList.includes(v)) setSurgeriesList([...surgeriesList, v]);
    setNewSurgery('');
  };

  const treatmentTypeColor = (type: string) => {
    const map: Record<string, { bg: string; text: string; border: string }> = {
      Hospitalization: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
      Surgery: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
      Procedure: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
      Therapy: { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
      Consultation: { bg: '#EBF7FA', text: '#0891B2', border: '#D1EBF1' },
      'Emergency Visit': { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
    };
    return map[type] || { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
  };

  const treatmentTypeIcon = (type: string) => {
    const map: Record<string, string> = { Hospitalization: '🏥', Surgery: '🔪', Procedure: '💉', Therapy: '🧘', Consultation: '👨‍⚕️', 'Emergency Visit': '🚑', Other: '📋' };
    return map[type] || '📋';
  };

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 p-1 rounded-lg" style={{ background: '#F1F5F9' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className="px-4 py-2 rounded-md text-[13px] font-medium transition-all"
            style={{
              background: activeTab === i ? '#FFFFFF' : 'transparent',
              color: activeTab === i ? '#0891B2' : '#64748B',
              boxShadow: activeTab === i ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* ===== Tab 0: Current Medications ===== */}
      {activeTab === 0 && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
          <JharokhaArch color="#0891B2" opacity={0.18} />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                Active Medications ({medications.length})
              </h3>
              <button onClick={() => { setEditMed(null); setShowAddMed(true); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white" style={{ background: '#0891B2' }}>
                <Plus size={14} /> Add Medication
              </button>
            </div>
            {medications.length === 0 ? (
              <p className="py-8 text-center text-[13px]" style={{ color: '#94A3B8' }}>No active medications. Add one to start tracking.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medications.map(m => (
                  <MedicationCard key={m.id} med={m}
                    onEdit={() => { setEditMed(m); setShowAddMed(true); }}
                    onDeactivate={() => handleMarkInactive(m.id)} />
                ))}
              </div>
            )}
            {inactiveMeds.length > 0 && (
              <div className="mt-6">
                <button onClick={() => setShowInactive(!showInactive)} className="flex items-center gap-1 text-[13px] font-medium" style={{ color: '#64748B' }}>
                  <ChevronDown size={14} className={`transition-transform ${showInactive ? 'rotate-180' : ''}`} />
                  Show past medications ({inactiveMeds.length})
                </button>
                {showInactive && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 opacity-60">
                    {inactiveMeds.map(m => <MedicationCard key={m.id} med={m} inactive />)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Tab 1: Past Treatments ===== */}
      {activeTab === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
            <JharokhaArch color="#8B5CF6" opacity={0.18} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                    🏥 Past Treatments & Surgeries
                  </h3>
                  <p className="text-[12px]" style={{ color: '#64748B' }}>Add your previous hospitalizations, surgeries, procedures and treatments so doctors have your complete history.</p>
                </div>
                <button onClick={() => { setEditTreatment(null); setShowAddTreatment(true); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-bold text-white whitespace-nowrap" style={{ background: '#8B5CF6' }}>
                  <Plus size={14} /> Add Treatment
                </button>
              </div>

              {treatments.length === 0 ? (
                <div className="text-center py-12">
                  <Stethoscope size={40} className="mx-auto mb-3" style={{ color: '#D1EBF1' }} />
                  <p className="text-[14px] font-medium mb-1" style={{ color: '#94A3B8' }}>No past treatments recorded yet</p>
                  <p className="text-[12px] mb-4" style={{ color: '#CBD5E1' }}>Adding your medical history helps doctors provide better care</p>
                  <button onClick={() => { setEditTreatment(null); setShowAddTreatment(true); }}
                    className="text-[13px] font-medium" style={{ color: '#8B5CF6' }}>
                    + Add your first treatment →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {treatments.sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(t => {
                    const tc = treatmentTypeColor(t.type);
                    return (
                      <div key={t.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tc.border}` }}>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <span className="text-xl mt-0.5">{treatmentTypeIcon(t.type)}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p className="text-[14px] font-bold" style={{ color: '#1E293B' }}>{t.title || t.type}</p>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: tc.bg, color: tc.text }}>{t.type}</span>
                                </div>
                                {t.hospital_name && <p className="text-[12px]" style={{ color: '#475569' }}>🏥 {t.hospital_name}</p>}
                                {t.doctor_name && <p className="text-[12px]" style={{ color: '#475569' }}>👨‍⚕️ Dr. {t.doctor_name}</p>}
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  {t.date && (
                                    <p className="text-[11px]" style={{ color: '#94A3B8' }}>
                                      📅 {format(new Date(t.date), 'dd MMM yyyy')}
                                      {t.end_date && ` — ${format(new Date(t.end_date), 'dd MMM yyyy')}`}
                                    </p>
                                  )}
                                  {t.outcome && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{
                                      background: t.outcome === 'Recovered' ? '#DCFCE7' : t.outcome === 'Ongoing' ? '#FFFBEB' : '#F1F5F9',
                                      color: t.outcome === 'Recovered' ? '#16A34A' : t.outcome === 'Ongoing' ? '#D97706' : '#64748B',
                                    }}>
                                      {t.outcome}
                                    </span>
                                  )}
                                </div>
                                {t.diagnosis && <p className="text-[12px] mt-2" style={{ color: '#475569' }}><strong>Diagnosis:</strong> {t.diagnosis}</p>}
                                {t.notes && <p className="text-[12px] mt-1 italic" style={{ color: '#64748B' }}>📝 {t.notes}</p>}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => { setEditTreatment(t); setShowAddTreatment(true); }} className="p-1.5 rounded-md hover:bg-gray-50" title="Edit">
                                <Edit2 size={14} style={{ color: '#0891B2' }} />
                              </button>
                              <button onClick={() => deleteTreatment(t.id)} className="p-1.5 rounded-md hover:bg-gray-50" title="Delete">
                                <Trash2 size={14} style={{ color: '#EF4444' }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {showAddTreatment && (
            <TreatmentModal
              initial={editTreatment}
              saving={savingTreatment}
              onClose={() => { setShowAddTreatment(false); setEditTreatment(null); }}
              onSave={saveTreatment}
            />
          )}
        </div>
      )}

      {/* ===== Tab 2: Medical Conditions ===== */}
      {activeTab === 2 && (
        <div className="space-y-5">
          {/* Chronic Conditions */}
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
            <JharokhaArch color="#F59E0B" opacity={0.18} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                  <HeartPulse size={18} className="inline mr-1.5" style={{ color: '#F59E0B' }} />
                  Chronic Conditions
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: conditions.length > 0 ? '#FFFBEB' : '#F1F5F9', color: conditions.length > 0 ? '#D97706' : '#94A3B8' }}>
                  {conditions.length} recorded
                </span>
              </div>
              <p className="text-[12px] mb-3" style={{ color: '#64748B' }}>Add any ongoing medical conditions. This helps doctors during emergency treatment.</p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {conditions.map(c => (
                  <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium" style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
                    {c}
                    <button onClick={() => setConditions(conditions.filter(x => x !== c))} className="hover:opacity-70"><X size={12} /></button>
                  </span>
                ))}
                {conditions.length === 0 && <span className="text-[12px] italic" style={{ color: '#94A3B8' }}>No conditions recorded — add below</span>}
              </div>

              <div className="flex gap-2 mb-3">
                <input className="field-input flex-1" placeholder="Type condition and press Enter..." value={newCondition}
                  onChange={e => setNewCondition(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCondition(newCondition); } }} />
                <button onClick={() => addCondition(newCondition)} className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-white" style={{ background: '#D97706' }}>
                  <Plus size={14} />
                </button>
              </div>

              <div>
                <p className="text-[11px] font-bold mb-1.5" style={{ color: '#94A3B8' }}>Quick Add:</p>
                <div className="flex flex-wrap gap-1">
                  {COMMON_CONDITIONS.filter(c => !conditions.includes(c)).slice(0, 12).map(c => (
                    <button key={c} onClick={() => addCondition(c)} className="px-2 py-0.5 rounded text-[11px] font-medium transition-all hover:opacity-80" style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>
                      + {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Past Surgeries */}
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
            <JharokhaArch color="#EF4444" opacity={0.18} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                  <Syringe size={18} className="inline mr-1.5" style={{ color: '#EF4444' }} />
                  Past Surgeries
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: surgeriesList.length > 0 ? '#FEF2F2' : '#F1F5F9', color: surgeriesList.length > 0 ? '#DC2626' : '#94A3B8' }}>
                  {surgeriesList.length} recorded
                </span>
              </div>
              <p className="text-[12px] mb-3" style={{ color: '#64748B' }}>List any surgical procedures you've had. Critical for anesthesia and treatment planning.</p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {surgeriesList.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                    🔪 {s}
                    <button onClick={() => setSurgeriesList(surgeriesList.filter(x => x !== s))} className="hover:opacity-70"><X size={12} /></button>
                  </span>
                ))}
                {surgeriesList.length === 0 && <span className="text-[12px] italic" style={{ color: '#94A3B8' }}>No surgeries recorded</span>}
              </div>

              <div className="flex gap-2 mb-3">
                <input className="field-input flex-1" placeholder="Type surgery name and press Enter..." value={newSurgery}
                  onChange={e => setNewSurgery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSurgery(newSurgery); } }} />
                <button onClick={() => addSurgery(newSurgery)} className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-white" style={{ background: '#EF4444' }}>
                  <Plus size={14} />
                </button>
              </div>

              <div>
                <p className="text-[11px] font-bold mb-1.5" style={{ color: '#94A3B8' }}>Quick Add:</p>
                <div className="flex flex-wrap gap-1">
                  {COMMON_SURGERIES.filter(s => !surgeriesList.includes(s)).slice(0, 10).map(s => (
                    <button key={s} onClick={() => addSurgery(s)} className="px-2 py-0.5 rounded text-[11px] font-medium transition-all hover:opacity-80" style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button onClick={saveConditions} disabled={savingConditions}
            className="w-full py-2.5 rounded-lg text-[14px] font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: '#0891B2' }}>
            {savingConditions ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : '💾 Save Medical Conditions & Surgeries'}
          </button>
        </div>
      )}

      {/* ===== Tab 3: Allergy Management ===== */}
      {activeTab === 3 && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
          <JharokhaArch color="#EF4444" opacity={0.18} />
          <div className="p-5">
            <h3 className="text-base font-bold mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Allergy Management</h3>
            {(patient.allergies || []).length === 0 ? (
              <p className="py-8 text-center text-[13px]" style={{ color: '#94A3B8' }}>No allergies recorded. Update in Settings.</p>
            ) : (
              <div className="space-y-2">
                {(patient.allergies || []).map((a: string) => (
                  <div key={a} className="flex items-center gap-3 p-3 rounded-lg" style={{ borderLeft: '4px solid #EF4444', background: '#FEF2F2' }}>
                    <AlertTriangle size={16} style={{ color: '#EF4444' }} />
                    <p className="text-[13px] font-semibold" style={{ color: '#EF4444' }}>{a}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Tab 4: Discharge Summaries ===== */}
      {activeTab === 4 && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
          <JharokhaArch color="#64748B" opacity={0.18} />
          <div className="p-5">
            <h3 className="text-base font-bold mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Discharge Summaries</h3>
            <div className="py-8 text-center">
              <p className="text-[13px] mb-3" style={{ color: '#94A3B8' }}>View and manage your discharge summaries in the Lab Reports section.</p>
              <button onClick={() => navigate('/patient/dashboard/reports')}
                className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: '#0891B2' }}>
                Go to Lab Reports →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medication Modal */}
      {showAddMed && (
        <MedicationModal
          initial={editMed}
          patientId={patient.id}
          onClose={() => { setShowAddMed(false); setEditMed(null); }}
          onSaved={() => { setShowAddMed(false); setEditMed(null); fetchMedications(); }}
        />
      )}
    </div>
  );
};

/* ─── Treatment Modal ─── */
const TreatmentModal = ({ initial, saving, onClose, onSave }: {
  initial: PastTreatment | null; saving: boolean; onClose: () => void; onSave: (t: PastTreatment) => void;
}) => {
  const [form, setForm] = useState<PastTreatment>({
    id: initial?.id || '',
    type: initial?.type || 'Hospitalization',
    title: initial?.title || '',
    hospital_name: initial?.hospital_name || '',
    doctor_name: initial?.doctor_name || '',
    date: initial?.date || '',
    end_date: initial?.end_date || '',
    diagnosis: initial?.diagnosis || '',
    notes: initial?.notes || '',
    outcome: initial?.outcome || 'Recovered',
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-[520px] w-full max-h-[90vh] overflow-y-auto" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#8B5CF6" opacity={0.18} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
              {initial ? '✏️ Edit Treatment' : '🏥 Add Past Treatment'}
            </h3>
            <button onClick={onClose}><X size={18} style={{ color: '#64748B' }} /></button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="field-label">Treatment Type *</label>
              <div className="flex flex-wrap gap-1.5">
                {TREATMENT_TYPES.map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                    style={{
                      background: form.type === t ? '#8B5CF6' : '#F8FAFC',
                      color: form.type === t ? '#fff' : '#64748B',
                      border: form.type === t ? '1px solid #8B5CF6' : '1px solid #E2E8F0',
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label">Treatment / Surgery Name *</label>
              <input className="field-input" placeholder="e.g. Appendectomy, Chemotherapy, Knee Surgery" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Hospital / Clinic</label>
                <input className="field-input" placeholder="e.g. AIIMS Delhi" value={form.hospital_name}
                  onChange={e => setForm(f => ({ ...f, hospital_name: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Treating Doctor</label>
                <input className="field-input" placeholder="e.g. Dr. Sharma" value={form.doctor_name}
                  onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Date *</label>
                <input className="field-input" type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">End Date</label>
                <input className="field-input" type="date" value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="field-label">Diagnosis / Reason</label>
              <input className="field-input" placeholder="e.g. Acute appendicitis" value={form.diagnosis}
                onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
            </div>

            <div>
              <label className="field-label">Outcome</label>
              <div className="flex gap-2 flex-wrap">
                {['Recovered', 'Improved', 'Ongoing', 'Referred', 'Chronic'].map(o => (
                  <button key={o} onClick={() => setForm(f => ({ ...f, outcome: o }))}
                    className="flex-1 min-w-[70px] py-2 rounded-lg text-[12px] font-medium transition-all"
                    style={{
                      background: form.outcome === o ? (o === 'Recovered' ? '#DCFCE7' : o === 'Ongoing' ? '#FFFBEB' : '#F1F5F9') : '#F8FAFC',
                      color: form.outcome === o ? (o === 'Recovered' ? '#16A34A' : o === 'Ongoing' ? '#D97706' : '#475569') : '#94A3B8',
                      border: form.outcome === o ? '1px solid currentColor' : '1px solid #E2E8F0',
                    }}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label">Additional Notes</label>
              <textarea className="field-input" rows={2} placeholder="Any important details..." value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => { if (!form.title) { toast.error('Treatment name is required'); return; } onSave(form); }} disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-[13px] font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: '#8B5CF6' }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : initial ? '✏️ Update Treatment' : '🏥 Add Treatment'}
            </button>
            <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-[13px] font-medium" style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Medication Card ─── */
const MedicationCard = ({ med, onEdit, onDeactivate, inactive }: { med: any; onEdit?: () => void; onDeactivate?: () => void; inactive?: boolean }) => (
  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
    <JharokhaArch color="#0891B2" opacity={0.12} />
    <div className="p-4">
      <p className="text-[14px] font-bold mb-1" style={{ color: '#1E293B' }}>💊 {med.medicine_name}</p>
      {med.generic_name && <p className="text-[12px] mb-1" style={{ color: '#64748B' }}>Generic: {med.generic_name}</p>}
      <p className="text-[12px]" style={{ color: '#64748B' }}>{med.dosage && `${med.dosage} · `}{med.frequency}</p>
      {med.time_of_day?.length > 0 && <p className="text-[12px]" style={{ color: '#64748B' }}>⏰ {med.time_of_day.join(' + ')}</p>}
      {med.prescribed_by && <p className="text-[12px] mt-1" style={{ color: '#64748B' }}>Prescribed by {med.prescribed_by}</p>}
      {med.start_date && <p className="text-[11px]" style={{ color: '#94A3B8' }}>Started: {format(new Date(med.start_date), 'dd MMM yyyy')}</p>}
      <p className="text-[11px]" style={{ color: '#94A3B8' }}>Duration: {med.duration_type || '—'}</p>
      {!inactive && (
        <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
          {onEdit && <button onClick={onEdit} className="flex items-center gap-1 text-[12px] font-medium" style={{ color: '#0891B2' }}><Edit2 size={12} /> Edit</button>}
          {onDeactivate && <button onClick={onDeactivate} className="flex items-center gap-1 text-[12px] font-medium" style={{ color: '#64748B' }}><BellOff size={12} /> Mark Inactive</button>}
        </div>
      )}
    </div>
  </div>
);

/* ─── Medication Modal ─── */
const MedicationModal = ({ initial, patientId, onClose, onSaved }: {
  initial: any; patientId: string; onClose: () => void; onSaved: () => void;
}) => {
  const [form, setForm] = useState({
    medicine_name: initial?.medicine_name || '', generic_name: initial?.generic_name || '',
    dosage: initial?.dosage || '', frequency: initial?.frequency || '',
    time_of_day: initial?.time_of_day || [], prescribed_by: initial?.prescribed_by || '',
    doctor_reg_no: initial?.doctor_reg_no || '', start_date: initial?.start_date || '',
    duration_type: initial?.duration_type || 'Temporary', end_date: initial?.end_date || '',
    notes: initial?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const toggleTime = (t: string) => setForm(f => ({ ...f, time_of_day: f.time_of_day.includes(t) ? f.time_of_day.filter((x: string) => x !== t) : [...f.time_of_day, t] }));

  const handleSave = async () => {
    if (!form.medicine_name) { toast.error('Medicine name is required'); return; }
    setSaving(true);
    try {
      if (initial?.id) { await supabase.from('patient_medications').update(form).eq('id', initial.id); }
      else { await supabase.from('patient_medications').insert([{ ...form, patient_id: patientId }]); }
      toast.success(initial ? 'Medication updated' : 'Medication added');
      onSaved();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-[480px] w-full max-h-[90vh] overflow-y-auto" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#0891B2" opacity={0.18} />
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>{initial ? 'Edit Medication' : 'Add Medication'}</h3>
          <div className="space-y-3">
            <Field label="Medicine Name *" value={form.medicine_name} onChange={v => setForm(f => ({ ...f, medicine_name: v }))} />
            <Field label="Generic Name" value={form.generic_name} onChange={v => setForm(f => ({ ...f, generic_name: v }))} />
            <Field label="Dosage" value={form.dosage} onChange={v => setForm(f => ({ ...f, dosage: v }))} placeholder="e.g. 500mg" />
            <div>
              <label className="field-label">Frequency</label>
              <select className="field-input" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}><option value="">Select...</option>{FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}</select>
            </div>
            <div>
              <label className="field-label">Time of Day</label>
              <div className="flex flex-wrap gap-2">{TIMES.map(t => (
                <button key={t} type="button" onClick={() => toggleTime(t)} className="px-3 py-1 rounded-full text-[12px] font-medium transition-all"
                  style={{ background: form.time_of_day.includes(t) ? '#0891B2' : '#F1F5F9', color: form.time_of_day.includes(t) ? '#fff' : '#64748B' }}>{t}</button>
              ))}</div>
            </div>
            <Field label="Prescribed By" value={form.prescribed_by} onChange={v => setForm(f => ({ ...f, prescribed_by: v }))} />
            <Field label="Doctor Reg. No." value={form.doctor_reg_no} onChange={v => setForm(f => ({ ...f, doctor_reg_no: v }))} />
            <Field label="Start Date" type="date" value={form.start_date} onChange={v => setForm(f => ({ ...f, start_date: v }))} />
            <div>
              <label className="field-label">Duration Type</label>
              <div className="flex gap-2">{['Temporary', 'Permanent'].map(d => (
                <button key={d} type="button" onClick={() => setForm(f => ({ ...f, duration_type: d }))} className="flex-1 py-2 rounded-lg text-[13px] font-medium transition-all"
                  style={{ background: form.duration_type === d ? '#0891B2' : '#F1F5F9', color: form.duration_type === d ? '#fff' : '#64748B' }}>{d}</button>
              ))}</div>
            </div>
            {form.duration_type === 'Temporary' && <Field label="End Date" type="date" value={form.end_date} onChange={v => setForm(f => ({ ...f, end_date: v }))} />}
            <div><label className="field-label">Notes</label><textarea className="field-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: '#0891B2' }}>{saving ? 'Saving...' : 'Save Medication'}</button>
            <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-[13px] font-medium" style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) => (
  <div>
    <label className="field-label">{label}</label>
    <input className="field-input" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

export default PatientRecords;
