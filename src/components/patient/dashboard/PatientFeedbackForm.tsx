import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import JharokhaArch from '@/components/admin/JharokhaArch';

const PatientFeedbackForm = ({ prescription, patientId, onClose, onCoinsEarned }: {
  prescription: any;
  patientId: string;
  onClose: () => void;
  onCoinsEarned?: (coins: number) => void;
}) => {
  const [step, setStep] = useState(1);
  const [overallRating, setOverallRating] = useState<number>(0);
  const [symptomsResolved, setSymptomsResolved] = useState<boolean | null>(null);
  const [painBefore, setPainBefore] = useState<number>(5);
  const [painAfter, setPainAfter] = useState<number>(5);

  const [adherence, setAdherence] = useState<string>('');
  const [hadSideEffects, setHadSideEffects] = useState<boolean | null>(null);
  const [sideEffects, setSideEffects] = useState<string[]>([]);
  const [customSideEffect, setCustomSideEffect] = useState<string>('');
  const [severity, setSeverity] = useState<string>('Mild');
  const [notes, setNotes] = useState('');
  const [continueRec, setContinueRec] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const sideEffectOptions = ['Nausea', 'Vomiting', 'Dizziness', 'Headache', 'Rash', 'Stomach pain', 'Drowsiness', 'Dry mouth', 'Fever', 'Difficulty breathing'];

  if (!prescription) return null;

  // ── Award coins helper ────────────────────────────────────────────────────
  const awardCoins = async (feedbackId: string | null) => {
    // Random between 10–20 coins to keep it exciting
    const coins = Math.floor(Math.random() * 11) + 10; // 10 to 20
    const db = supabase as any;

    // Upsert wallet
    const { data: existing } = await db
      .from('patient_coins')
      .select('balance, lifetime_earned')
      .eq('patient_id', patientId)
      .maybeSingle();

    const newBalance = (existing?.balance ?? 0) + coins;
    const newLifetime = (existing?.lifetime_earned ?? 0) + coins;
    const newTier =
      newLifetime >= 500 ? 'Platinum' :
      newLifetime >= 200 ? 'Gold' :
      newLifetime >= 100 ? 'Silver' : 'Bronze';

    await db.from('patient_coins').upsert([{
      patient_id: patientId,
      balance: newBalance,
      lifetime_earned: newLifetime,
      tier: newTier,
      updated_at: new Date().toISOString(),
    }], { onConflict: 'patient_id' });

    await db.from('coin_transactions').insert([{
      patient_id: patientId,
      coins,
      reason: 'feedback_submitted',
      reference_id: feedbackId,
    }]);

    return coins;
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const { data: profile } = await supabase
        .from('patients')
        .select('date_of_birth, gender, blood_group')
        .eq('id', patientId)
        .single();

      let age = 0;
      if (profile?.date_of_birth) {
        const diff = Date.now() - new Date(profile.date_of_birth).getTime();
        age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
      }

      const finalSideEffects = [...sideEffects];
      if (customSideEffect.trim() && !finalSideEffects.includes(customSideEffect.trim())) {
        finalSideEffects.push(customSideEffect.trim());
      }

      const { error } = await supabase.from('prescription_feedback').insert([{
        prescription_id: prescription.id,
        patient_id: patientId,
        hospital_id: prescription.hospital_id,
        doctor_id: prescription.doctor_id,
        improvement_rating: overallRating,
        adherence_rating: adherence,
        had_side_effects: hadSideEffects,
        side_effects: finalSideEffects,
        side_effect_severity: hadSideEffects ? severity : null,
        patient_notes: notes,
        continue_recommended: continueRec,
        symptoms_resolved: symptomsResolved,
        pain_level_before: painBefore,
        pain_level_after: painAfter,
        patient_age: age,
        patient_gender: profile?.gender,
        patient_blood_group: profile?.blood_group,
      }]);

      if (error) throw error;

      // ── Award coins ──────────────────────────────────────────────────────
      try {
        const coinsEarned = await awardCoins(null);
        onCoinsEarned?.(coinsEarned);
        toast.success(
          `✅ Feedback submitted! +${coinsEarned} 🪙 coins earned!`,
          { duration: 4000 }
        );
      } catch (_coinErr) {
        // coin error is non-blocking
        toast.success('✅ Feedback submitted. Dr. ' + prescription.doctor_name + ' will review it.');
      }
      onClose();
    } catch (e: any) {
      toast.error('Failed to submit feedback: ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const progressWidth = ((step / 4) * 100) + '%';

  const ratingOptions = [
    { e: '😞', v: 1, l: 'Much worse' },
    { e: '😕', v: 2, l: 'Worse' },
    { e: '😐', v: 3, l: 'Same' },
    { e: '🙂', v: 4, l: 'Better' },
    { e: '😊', v: 5, l: 'Much better' },
  ];

  const adherenceOptions = ['Always', 'Mostly', 'Sometimes', 'Rarely', 'Never'];
  const severityOptions = ['Mild', 'Moderate', 'Severe'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full flex flex-col" style={{ maxHeight: '85vh' }}>
        <JharokhaArch color="#F59E0B" opacity={0.18} />

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
            Prescription Feedback
          </h2>
          <p className="text-[13px] text-gray-500 mt-1">
            Dr. {prescription.doctor_name} · {prescription.diagnosis}
          </p>
          <div className="w-full h-1 bg-yellow-100 rounded-full mt-4">
            <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: progressWidth }} />
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">

          {/* STEP 1 — Overall */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="font-bold text-gray-900 mb-4">How are you feeling compared to when you got this prescription?</p>
                <div className="flex gap-2 justify-between">
                  {ratingOptions.map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setOverallRating(o.v)}
                      className="flex-1 py-3 px-1 rounded-xl flex flex-col items-center gap-1 transition-all"
                      style={{
                        background: overallRating === o.v ? '#FEF3C7' : '#F9FAFB',
                        border: overallRating === o.v ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                      }}
                    >
                      <span className="text-3xl">{o.e}</span>
                      <span className="text-[10px] font-medium text-center">{o.l}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-3">Did your main symptoms go away?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSymptomsResolved(true)}
                    className="flex-1 py-2 rounded-lg font-medium"
                    style={{ background: symptomsResolved === true ? '#DCFCE7' : '#F9FAFB', color: symptomsResolved === true ? '#15803D' : '#6B7280' }}
                  >Yes</button>
                  <button
                    onClick={() => setSymptomsResolved(false)}
                    className="flex-1 py-2 rounded-lg font-medium"
                    style={{ background: symptomsResolved === false ? '#FEE2E2' : '#F9FAFB', color: symptomsResolved === false ? '#B91C1C' : '#6B7280' }}
                  >No</button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-900 flex justify-between">
                    Pain Level (Before) <span>{painBefore}/10</span>
                  </label>
                  <input type="range" min="0" max="10" value={painBefore} onChange={(e) => setPainBefore(parseInt(e.target.value))} className="w-full accent-amber-500" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-900 flex justify-between">
                    Pain Level (Now) <span>{painAfter}/10</span>
                  </label>
                  <input type="range" min="0" max="10" value={painAfter} onChange={(e) => setPainAfter(parseInt(e.target.value))} className="w-full accent-green-500" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Adherence */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="font-bold text-gray-900 mb-4">How regularly did you take your medicines as prescribed?</p>
                <div className="flex flex-col gap-2">
                  {adherenceOptions.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAdherence(a)}
                      className="p-3 rounded-lg text-left font-medium text-[14px]"
                      style={{
                        background: adherence === a ? '#FEF3C7' : '#F9FAFB',
                        border: adherence === a ? '1px solid #F59E0B' : '1px solid #E5E7EB',
                        color: adherence === a ? '#92400E' : '#374151',
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Side Effects */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="font-bold text-gray-900 mb-3">Did you experience any side effects?</p>
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => setHadSideEffects(true)}
                    className="flex-1 py-2 rounded-lg font-medium"
                    style={{ background: hadSideEffects === true ? '#FEF3C7' : '#F9FAFB', color: hadSideEffects === true ? '#92400E' : '#6B7280' }}
                  >Yes</button>
                  <button
                    onClick={() => setHadSideEffects(false)}
                    className="flex-1 py-2 rounded-lg font-medium"
                    style={{ background: hadSideEffects === false ? '#DCFCE7' : '#F9FAFB', color: hadSideEffects === false ? '#15803D' : '#6B7280' }}
                  >No</button>
                </div>
              </div>

              {hadSideEffects && (
                <>
                  <div>
                    <p className="font-bold text-gray-900 mb-3">Which side effects?</p>
                    <div className="flex flex-wrap gap-2">
                      {sideEffectOptions.map((se) => (
                        <button
                          key={se}
                          onClick={() => setSideEffects((prev) => prev.includes(se) ? prev.filter((p) => p !== se) : [...prev, se])}
                          className="px-3 py-1.5 rounded-full text-sm font-medium"
                          style={{
                            background: sideEffects.includes(se) ? '#F59E0B' : '#FFFFFF',
                            color: sideEffects.includes(se) ? '#FFFFFF' : '#4B5563',
                            border: sideEffects.includes(se) ? '1px solid #D97706' : '1px solid #D1D5DB',
                          }}
                        >
                          {se}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3">
                      <input 
                        type="text" 
                        value={customSideEffect} 
                        onChange={(e) => setCustomSideEffect(e.target.value)} 
                        placeholder="Other side effect (please specify)" 
                        className="w-full p-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-[13px]" 
                      />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 mb-3">How severe were they?</p>
                    <div className="flex gap-3">
                      {severityOptions.map((sev) => (
                        <button
                          key={sev}
                          onClick={() => setSeverity(sev)}
                          className="flex-1 py-2 rounded-lg font-medium"
                          style={{
                            background: severity === sev ? '#FEE2E2' : '#F9FAFB',
                            color: severity === sev ? '#B91C1C' : '#6B7280',
                          }}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 4 — Your Words */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <p className="font-bold text-gray-900 mb-2">Anything else you'd like to tell Dr. {prescription.doctor_name}?</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. I felt much better after day 3, but still have a mild cough..."
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px] text-sm"
                />
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-3">Would you recommend continuing this medicine if needed?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setContinueRec(true)}
                    className="flex-1 py-2 rounded-lg font-medium"
                    style={{ background: continueRec === true ? '#DCFCE7' : '#F9FAFB', color: continueRec === true ? '#15803D' : '#6B7280' }}
                  >Yes</button>
                  <button
                    onClick={() => setContinueRec(false)}
                    className="flex-1 py-2 rounded-lg font-medium"
                    style={{ background: continueRec === false ? '#FEE2E2' : '#F9FAFB', color: continueRec === false ? '#B91C1C' : '#6B7280' }}
                  >No</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-3 flex-shrink-0 rounded-b-xl">
          {step > 1 ? (
            <button onClick={() => setStep((s) => s - 1)} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 bg-white border border-gray-300">
              Back
            </button>
          ) : (
            <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 bg-transparent">
              Skip for now
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={(step === 1 && !overallRating) || (step === 2 && !adherence)}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-50"
              style={{ background: '#F59E0B' }}
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2"
              style={{ background: '#16A34A' }}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : 'Submit Feedback'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientFeedbackForm;
