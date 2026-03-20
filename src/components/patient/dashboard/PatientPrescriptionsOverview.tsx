import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { FileText, Download, Check } from 'lucide-react';
import { format, addDays, isPast, isToday } from 'date-fns';
import { toast } from 'sonner';
import PatientFeedbackForm from './PatientFeedbackForm';
import { generatePrescriptionPDF } from '@/utils/pdfReports';
import { useLanguage } from '@/contexts/LanguageContext';

const PatientPrescriptionsOverview = ({ patientId }: { patientId: string }) => {
  const { t } = useLanguage();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [showFeedbackFor, setShowFeedbackFor] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    const { data: rxData } = await supabase
      .from('prescriptions')
      .select('*, prescription_feedback(id)')
      .eq('patient_id', patientId)
      .eq('status', 'Active')
      .order('prescription_date', { ascending: false });

    if (rxData) {
      setPrescriptions(rxData);
    }

    // Fetch today's medicines
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: medsData } = await supabase
      .from('prescription_medicines')
      .select('*, prescriptions(doctor_name)')
      .eq('patient_id', patientId)
      .eq('is_active', true)
      .lte('start_date', todayStr)
      .gte('end_date', todayStr);

    if (medsData) setMedicines(medsData);
  };

  // Group today's medicines by schedule time
  const scheduledMedicines: { time: string, items: any[] }[] = [];
  
  medicines.forEach(m => {
    const schedule = (m.schedule as any[]) || [];
    schedule.forEach(s => {
      let group = scheduledMedicines.find(g => g.time === s.time);
      if (!group) {
        group = { time: s.time, items: [] };
        scheduledMedicines.push(group);
      }
      group.items.push({ ...m, s });
    });
  });

  scheduledMedicines.sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-6 mt-6">
      {/* Feedback Form Card */}
      {showFeedbackFor && (
        <div className="bg-white rounded-xl overflow-hidden relative" style={{ border: '1px solid #F59E0B', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.1)' }}>
          <JharokhaArch color="#F59E0B" opacity={0.18} />
          <div className="p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1">
              <h3 className="text-[16px] flex items-center gap-2 font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#B45309' }}>
                📋 Dr. {showFeedbackFor.doctor_name} {t('prescriptions.doctorWantsToKnow')}
              </h3>
              <p className="text-[13px]" style={{ color: '#78350F' }}>
                {t('prescriptions.shareFeedback')}
              </p>
            </div>
            <button 
              onClick={() => {
                // We'd navigate to the full page step-by-step form here
                // For simplicity we might render it in a full screen modal if we had it
                setShowFeedbackFor(null);
              }}
              className="px-5 py-2.5 rounded-lg text-[13px] font-bold text-white whitespace-nowrap" style={{ background: '#F59E0B' }}>
              {t('prescriptions.fillFeedback')}
            </button>
          </div>
          {/* We'll render PatientFeedbackForm conditionally over the page */}
          <PatientFeedbackForm prescription={showFeedbackFor} patientId={patientId} onClose={() => { setShowFeedbackFor(null); fetchData(); }} />
        </div>
      )}

      {/* Today's Medicines Timeline */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#10B981" opacity={0.18} />
        <div className="p-5">
          <h3 className="text-base font-bold mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
            💊 {t('prescriptions.todayMedicines')} — {format(new Date(), 'dd MMMM yyyy')}
          </h3>
          
          {scheduledMedicines.length === 0 ? (
            <p className="text-[13px] text-center py-6" style={{ color: '#94A3B8' }}>{t('prescriptions.noMedicines')}</p>
          ) : (
            <div className="space-y-4">
              {scheduledMedicines.map(group => {
                const hour = parseInt(group.time.split(':')[0]);
                let icon = '☀️';
                if (hour < 12) icon = '🌅';
                if (hour >= 18) icon = '🌙';

                return (
                  <div key={group.time}>
                    <p className="text-[13px] font-bold mb-2 flex items-center gap-1.5" style={{ color: '#0F172A' }}>
                      {icon} {group.time}
                    </p>
                    <div className="space-y-2">
                      {group.items.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-lg flex items-center gap-3" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                          <span className="text-[18px]">{item.medicine_form === 'Drops' ? '👁' : '💊'}</span>
                          <div className="flex-1">
                            <p className="text-[13px] font-bold" style={{ color: '#1E293B' }}>{item.medicine_name}</p>
                            <p className="text-[12px]" style={{ color: '#64748B' }}>
                              {item.s.dosage || item.dosage} · {item.s.with}
                            </p>
                            {item.special_instructions && (
                              <p className="text-[11px] font-medium mt-1 flex items-center gap-1" style={{ color: '#D97706' }}>
                                ⚠️ {item.special_instructions}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Prescriptions List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>💊 {t('prescriptions.myPrescriptions')}</h3>
          <button className="text-[13px] font-medium" style={{ color: '#0891B2' }}>{t('prescriptions.viewAll')}</button>
        </div>
        
        {prescriptions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center" style={{ border: '1px solid #E2EEF1' }}>
            <p className="text-[13px]" style={{ color: '#94A3B8' }}>{t('prescriptions.noActive')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prescriptions.map(rx => (
              <div key={rx.id} className="bg-white rounded-xl p-4 flex flex-col sm:flex-row gap-4" style={{ border: '1px solid #E2EEF1' }}>
                <div className="flex-1">
                  <p className="text-[14px] font-bold mb-1" style={{ color: '#1E293B' }}>{t('prescriptions.prescribedBy')} {rx.doctor_name}</p>
                  <p className="text-[12px] mb-3" style={{ color: '#64748B' }}>{format(new Date(rx.prescription_date), 'dd MMMM yyyy')}</p>
                  
                  <div className="mb-3">
                    <p className="text-[12px] font-bold" style={{ color: '#475569' }}>{t('prescriptions.diagnosis')}</p>
                    <p className="text-[13px]" style={{ color: '#1E293B' }}>{rx.diagnosis}</p>
                  </div>

                  <div className="flex items-center gap-3">
                     <span className="text-[11px] font-bold px-2 py-1 rounded" style={{ background: '#ECFDF5', color: '#10B981' }}>
                      🟢 {t('cards.active')}
                     </span>
                     {rx.valid_until && (
                       <span className="text-[11px]" style={{ color: '#64748B' }}>
                         {t('Valid until')} {format(new Date(rx.valid_until), 'dd MMM yyyy')}
                       </span>
                     )}
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 justify-end sm:justify-start">
                  <button className="px-3 py-1.5 rounded-lg text-[12px] font-medium" style={{ background: '#F1F5F9', color: '#475569' }}>{t('prescriptions.viewFull')}</button>
                  <button
                    onClick={async () => {
                      const { data: meds } = await supabase.from('prescription_medicines').select('*').eq('prescription_id', rx.id);
                      const { data: patData } = await supabase.from('patients').select('full_name, blood_group, date_of_birth, gender').eq('id', patientId).single();
                      const patAge = patData?.date_of_birth ? Math.floor((Date.now() - new Date(patData.date_of_birth).getTime()) / 31557600000) : undefined;
                      generatePrescriptionPDF({
                        patientName: patData?.full_name || 'Patient',
                        patientAge: patAge,
                        patientGender: patData?.gender,
                        bloodGroup: patData?.blood_group,
                        doctorName: rx.doctor_name,
                        doctorSpecialization: rx.doctor_specialization,
                        hospitalName: 'Sanjeevani Hospital',
                        diagnosis: rx.diagnosis,
                        generalInstructions: rx.general_instructions,
                        prescriptionDate: rx.prescription_date,
                        validUntil: rx.valid_until,
                        medicines: (meds || []).map((m: any) => ({
                          name: m.medicine_name,
                          dosage: m.dosage,
                          form: m.medicine_form,
                          timesPerDay: m.times_per_day,
                          durationDays: m.duration_days,
                          schedule: m.schedule as any,
                          specialInstructions: m.special_instructions,
                        })),
                      });
                      toast.success('📄 Prescription PDF downloaded!');
                    }}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1" style={{ background: '#FEF3C7', color: '#D97706' }}
                  >
                    <Download size={14} /> PDF
                  </button>
                  {rx.feedback_requested && (!rx.prescription_feedback || rx.prescription_feedback.length === 0) && (
                    <button 
                      onClick={() => setShowFeedbackFor(rx)} 
                      className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white whitespace-nowrap" style={{ background: '#F59E0B' }}>
                      {t('prescriptions.giveFeedback')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPrescriptionsOverview;
