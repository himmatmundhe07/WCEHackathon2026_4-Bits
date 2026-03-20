import { useEffect, useState, useRef, useCallback } from 'react';
import { usePatientContext } from '@/hooks/usePatientContext';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Calendar, Plus, X, Loader2, MapPin, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const ALL_TABS = ['All', 'Pending Confirmation', 'Confirmed', 'Completed', 'Cancelled'] as const;
type Tab = typeof ALL_TABS[number];

// Status → visual config
const STATUS_MAP: Record<string, { bg: string; color: string; label: string; textColor?: string }> = {
  'Pending Confirmation': { bg: '#FFFBEB', color: '#92400E', label: '⏳ Awaiting Confirmation' },
  Upcoming:              { bg: '#FFFBEB', color: '#92400E', label: '⏳ Awaiting Confirmation' },
  Confirmed:             { bg: '#0891B2', color: 'white',   label: '✅ Confirmed' },
  accepted:              { bg: '#0891B2', color: 'white',   label: '✅ Accepted' },
  Completed:             { bg: '#10B981', color: 'white',   label: '✔ Completed' },
  Cancelled:             { bg: '#EF4444', color: 'white',   label: '❌ Not Accepted' },
};

const PatientAppointments = () => {
  const { patient } = usePatientContext();
  const [tab, setTab] = useState<Tab>('All');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(false);

  // Audio
  const audioCtx = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
  };

  const playNotificationSound = useCallback(() => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }, []);

  const fetchAppointments = useCallback(async () => {
    if (!patient?.id) return;
    setLoading(true);
    let q = supabase.from('patient_appointments')
      .select('*')
      .eq('patient_id', patient.id)
      .order('appointment_date', { ascending: false });

    // Filter by tab — map to DB status values
    if (tab === 'Pending Confirmation') q = q.in('status', ['Pending Confirmation', 'Upcoming']);
    else if (tab === 'Confirmed') q = q.in('status', ['Confirmed', 'accepted']);
    else if (tab === 'Completed') q = q.eq('status', 'Completed');
    else if (tab === 'Cancelled') q = q.eq('status', 'Cancelled');

    const { data } = await q;
    setAppointments(data || []);
    setLoading(false);
  }, [patient?.id, tab]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Real-time subscription on patient's appointments
  useEffect(() => {
    if (!patient?.id) return;
    const ch = supabase.channel(`patient-appts-${patient.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'patient_appointments',
        filter: `patient_id=eq.${patient.id}`,
      }, (payload) => {
        const updated = payload.new as any;
        setAppointments(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));

        if (updated.status === 'Confirmed' || updated.status === 'accepted') {
          playNotificationSound();
          if (updated.rescheduled_by_hospital) {
            toast.success(`🗓 Your appointment was rescheduled to ${updated.appointment_date}${updated.appointment_time ? ' at ' + updated.appointment_time : ''}!`);
          } else {
            toast.success('✅ Your appointment has been accepted!');
          }
        }
        if (updated.status === 'Cancelled') {
          playNotificationSound();
          toast.error('❌ Your appointment was not accepted.' + (updated.cancellation_reason ? ' Reason: ' + updated.cancellation_reason : ''));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [patient?.id, playNotificationSound]);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    await supabase.from('patient_appointments').update({ status: 'Cancelled', cancellation_reason: 'Cancelled by patient', updated_at: new Date().toISOString() }).eq('id', id);
    toast.success('Appointment cancelled');
    fetchAppointments();
  };

  const filtered = appointments; // already filtered by query

  return (
    <div className="space-y-5" onClick={initAudio}>
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {ALL_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-full text-[12px] font-medium whitespace-nowrap transition-all"
            style={{
              background: tab === t ? '#0891B2' : 'white',
              color: tab === t ? 'white' : '#64748B',
              border: tab === t ? '1px solid #0891B2' : '1px solid #E2EEF1',
            }}>
            {t === 'Pending Confirmation' ? '⏳ Pending' : t}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
          {tab} Appointments ({filtered.length})
        </h3>
        <button onClick={() => setShowBook(true)}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-[13px] font-semibold text-white"
          style={{ background: '#0891B2' }}>
          <Plus size={14} /> Book Appointment
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: '#0891B2' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center" style={{ border: '1px solid #E2EEF1' }}>
          <Calendar size={40} className="mx-auto mb-3" style={{ color: '#D1EBF1' }} />
          <p className="text-[14px]" style={{ color: '#94A3B8' }}>No {tab.toLowerCase()} appointments.</p>
          <button onClick={() => setShowBook(true)} className="mt-4 text-[13px] font-medium" style={{ color: '#0891B2' }}>
            + Book one now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => <AppointmentCard key={a.id} appt={a} onCancel={handleCancel} />)}
        </div>
      )}

      {showBook && (
        <BookAppointmentModal
          patientId={patient.id}
          onClose={() => setShowBook(false)}
          onSaved={() => { setShowBook(false); fetchAppointments(); }}
        />
      )}
    </div>
  );
};

/* ──────────────── APPOINTMENT CARD ──────────────── */
const AppointmentCard = ({ appt: a, onCancel }: { appt: any; onCancel: (id: string) => void }) => {
  const st = STATUS_MAP[a.status] || STATUS_MAP['Pending Confirmation'];
  const isPending = a.status === 'Upcoming' || a.status === 'Pending Confirmation';
  const isConfirmed = a.status === 'Confirmed' || a.status === 'accepted';
  const isCancelled = a.status === 'Cancelled';
  const archColor = isCancelled ? '#EF4444' : isConfirmed ? '#0891B2' : '#F59E0B';

  // Add to Google Calendar link
  const calLink = (() => {
    if (!a.appointment_date) return null;
    const d = a.appointment_date.replace(/-/g, '');
    const t = a.appointment_time ? a.appointment_time.replace(':', '') + '00' : '090000';
    const te = a.appointment_time
      ? (() => {
          const [h, m] = a.appointment_time.split(':').map(Number);
          return `${String(h + 1).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
        })()
      : '100000';
    return `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent('Appointment - ' + (a.doctor_name || 'Doctor'))}&dates=${d}T${t}/${d}T${te}&details=${encodeURIComponent(a.hospital_name || '')}`;
  })();

  return (
    <div className="bg-white rounded-xl overflow-hidden transition-all hover:shadow-md" style={{ border: `1px solid ${isCancelled ? '#FECACA' : isConfirmed ? '#D1EBF1' : '#E2EEF1'}` }}>
      <JharokhaArch color={archColor} opacity={0.18} />
      <div className="p-5">
        {/* Top row — hospital + status badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[15px] font-bold" style={{ color: '#1E293B' }}>
              {a.hospital_name || 'Hospital'}
            </p>
            <p className="text-[13px]" style={{ color: '#64748B' }}>
              {a.doctor_name}{a.specialization ? ` · ${a.specialization}` : ''}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
              style={{ background: st.bg, color: st.color }}>
              {st.label}
            </span>
            {a.rescheduled_by_hospital && a.status === 'Confirmed' && (
              <p className="text-[10px] mt-1 px-2 py-0.5 rounded-full w-fit ml-auto font-medium"
                style={{ background: '#FFFBEB', color: '#D97706' }}>
                ⏰ Time Changed
              </p>
            )}
          </div>
        </div>

        {/* Date / Time block */}
        <div className="rounded-lg p-3 mb-3" style={{ background: '#F7FBFC', border: '1px solid #E2EEF1' }}>
          {a.rescheduled_by_hospital && a.original_date ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[12px]" style={{ color: '#94A3B8' }}>
                <Clock size={13} />
                <span className="line-through">
                  Original: {format(parseISO(a.original_date), 'EEE, dd MMM yyyy')}
                  {a.original_time ? ` at ${a.original_time}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: '#0891B2' }}>
                <Clock size={13} />
                New: {format(parseISO(a.appointment_date), 'EEE, dd MMM yyyy')}
                {a.appointment_time ? ` at ${a.appointment_time}` : ''}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[13px] font-medium" style={{ color: '#1E293B' }}>
              <Clock size={13} style={{ color: '#0891B2' }} />
              {a.appointment_date ? format(parseISO(a.appointment_date), 'EEE, dd MMM yyyy') : '—'}
              {a.appointment_time ? ` · ${a.appointment_time}` : ''}
            </div>
          )}
        </div>

        {/* Reason */}
        {a.reason && (
          <p className="text-[12px] italic mb-3" style={{ color: '#94A3B8' }}>"{a.reason}"</p>
        )}

        {/* Note from hospital (if rescheduled) */}
        {a.notes && (
          <div className="rounded-lg p-3 mb-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <p className="text-[11px] font-semibold mb-0.5" style={{ color: '#D97706' }}>Note from hospital:</p>
            <p className="text-[12px]" style={{ color: '#92400E' }}>"{a.notes}"</p>
          </div>
        )}

        {/* Rejection reason */}
        {isCancelled && a.cancellation_reason && (
          <div className="rounded-lg p-3 mb-3 flex items-start gap-2" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <AlertCircle size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
            <div>
              <p className="text-[11px] font-semibold" style={{ color: '#DC2626' }}>Rejection reason:</p>
              <p className="text-[12px]" style={{ color: '#7F1D1D' }}>{a.cancellation_reason}</p>
            </div>
          </div>
        )}

        {/* Actions row */}
        <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: '1px solid #F1F5F9' }}>
          {isPending && (
            <button onClick={() => onCancel(a.id)}
              className="px-3 py-1.5 rounded-md text-[12px] font-medium"
              style={{ border: '1px solid #EF4444', color: '#EF4444' }}>
              Cancel
            </button>
          )}
          {(a.status === 'Completed' || isCancelled) && (
            <button className="px-3 py-1.5 rounded-md text-[12px] font-medium text-white"
              style={{ background: '#0891B2' }}>
              Rebook
            </button>
          )}
          {calLink && (
            <a href={calLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-medium"
              style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>
              <Calendar size={12} /> Add to Calendar
            </a>
          )}
          {a.maps_link && (
            <a href={a.maps_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-medium"
              style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>
              <MapPin size={12} /> Get Directions
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

/* ──────────────── BOOK APPOINTMENT MODAL ──────────────── */
const BookAppointmentModal = ({ patientId, onClose, onSaved }: { patientId: string; onClose: () => void; onSaved: () => void }) => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [form, setForm] = useState({
    doctor_name: '', specialization: '', hospital_name: '', hospital_id: '',
    appointment_date: '', appointment_time: '', reason: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchHospitals = async () => {
      const { data } = await supabase.from('hospitals')
        .select('id, hospital_name, city, state')
        .eq('verification_status', 'Verified');
      setHospitals(data || []);
    };
    fetchHospitals();
  }, []);

  const handleSave = async () => {
    if (!form.doctor_name || !form.appointment_date) { toast.error('Doctor name and date are required'); return; }
    setSaving(true);
    try {
      await supabase.from('patient_appointments').insert([{
        doctor_name: form.doctor_name,
        specialization: form.specialization,
        hospital_name: form.hospital_name,
        hospital_id: form.hospital_id || null,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        reason: form.reason,
        patient_id: patientId, status: 'Pending Confirmation',
        booked_by: 'Patient',
      }]);
      toast.success('Appointment request sent! Awaiting hospital confirmation.');
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-[520px] w-full max-h-[90vh] overflow-y-auto" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#0891B2" opacity={0.18} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Book Appointment</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X size={18} style={{ color: '#64748B' }} /></button>
          </div>
          <div className="rounded-lg p-3 mb-4" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <p className="text-[12px]" style={{ color: '#92400E' }}>
              ℹ️ Your appointment request will be sent to the hospital for confirmation. You'll be notified once it's accepted.
            </p>
          </div>
          <div className="space-y-3">
            <div><label className="field-label">Doctor Name *</label><input className="field-input" value={form.doctor_name} onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))} /></div>
            <div><label className="field-label">Specialization</label><input className="field-input" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} /></div>
            <div>
              <label className="field-label">Select Hospital</label>
              <select 
                className="field-input" 
                value={form.hospital_id} 
                onChange={e => {
                  const selectedHospital = hospitals.find(h => h.id === e.target.value);
                  setForm(f => ({
                    ...f, 
                    hospital_id: e.target.value,
                    hospital_name: selectedHospital ? selectedHospital.hospital_name : ''
                  }));
                }}
              >
                <option value="">-- Choose an ecosystem hospital --</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.hospital_name} {h.city ? `(${h.city})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Date *</label><input className="field-input" type="date" min={format(new Date(), 'yyyy-MM-dd')} value={form.appointment_date} onChange={e => setForm(f => ({ ...f, appointment_date: e.target.value }))} /></div>
              <div><label className="field-label">Preferred Time</label><input className="field-input" type="time" value={form.appointment_time} onChange={e => setForm(f => ({ ...f, appointment_time: e.target.value }))} /></div>
            </div>
            <div><label className="field-label">Reason for Visit</label><textarea className="field-input" rows={2} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: '#0891B2' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? 'Sending...' : '📅 Send Appointment Request'}
            </button>
            <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-[13px] font-medium" style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientAppointments;
