import { useEffect, useState, useRef, useCallback } from 'react';
import { usePatientContext } from '@/hooks/usePatientContext';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Calendar, Plus, X, Loader2, MapPin, Clock, AlertCircle, Video } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import VideoCall from '@/components/telemedicine/VideoCall';

const ALL_TABS = ['All', 'Pending Confirmation', 'Confirmed', 'Completed', 'Cancelled'] as const;
type Tab = typeof ALL_TABS[number];

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
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Video Call state
  const [activeCallChannel, setActiveCallChannel] = useState<string | null>(searchParams.get('call'));

  useEffect(() => {
    const callParam = searchParams.get('call');
    if (callParam) setActiveCallChannel(callParam);
  }, [searchParams]);

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

    if (tab === 'Pending Confirmation') q = q.in('status', ['Pending Confirmation', 'Upcoming']);
    else if (tab === 'Confirmed') q = q.in('status', ['Confirmed', 'accepted']);
    else if (tab === 'Completed') q = q.eq('status', 'Completed');
    else if (tab === 'Cancelled') q = q.eq('status', 'Cancelled');

    const { data } = await q;
    setAppointments(data || []);
    setLoading(false);
  }, [patient?.id, tab]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

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
          toast.success('✅ Your appointment has been accepted!');
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

  return (
    <div className="space-y-5" onClick={initAudio}>
      {/* Video Call Modal */}
      {activeCallChannel && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-4xl w-full">
            <VideoCall 
              channelName={activeCallChannel} 
              userName={patient?.full_name || 'Patient'} 
              onClose={() => {
                setActiveCallChannel(null);
                setSearchParams({});
              }} 
            />
          </div>
        </div>
      )}

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

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
          {tab} Appointments ({appointments.length})
        </h3>
        <button onClick={() => setShowBook(true)}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-[13px] font-semibold text-white"
          style={{ background: '#0891B2' }}>
          <Plus size={14} /> Book Appointment
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: '#0891B2' }} /></div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center" style={{ border: '1px solid #E2EEF1' }}>
          <Calendar size={40} className="mx-auto mb-3" style={{ color: '#D1EBF1' }} />
          <p className="text-[14px]" style={{ color: '#94A3B8' }}>No {tab.toLowerCase()} appointments.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(a => (
            <AppointmentCard 
              key={a.id} 
              appt={a} 
              onCancel={handleCancel} 
              onJoinCall={(channel) => setActiveCallChannel(channel)}
            />
          ))}
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

const AppointmentCard = ({ appt: a, onCancel, onJoinCall }: { appt: any; onCancel: (id: string) => void; onJoinCall: (chan: string) => void }) => {
  const st = STATUS_MAP[a.status] || STATUS_MAP['Pending Confirmation'];
  const isConfirmed = a.status === 'Confirmed' || a.status === 'accepted';
  const isPending = a.status === 'Upcoming' || a.status === 'Pending Confirmation';
  
  return (
    <div className="bg-white rounded-xl overflow-hidden transition-all hover:shadow-md" style={{ border: `1px solid ${isConfirmed ? '#D1EBF1' : '#E2EEF1'}` }}>
      <JharokhaArch color={isConfirmed ? '#0891B2' : '#F59E0B'} opacity={0.18} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[15px] font-bold" style={{ color: '#1E293B' }}>{a.hospital_name || 'Hospital'}</p>
            <p className="text-[13px]" style={{ color: '#64748B' }}>{a.doctor_name}</p>
          </div>
          <span className="px-3 py-1.5 rounded-full text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>
            {st.label}
          </span>
        </div>

        <div className="rounded-lg p-3 mb-3" style={{ background: '#F7FBFC', border: '1px solid #E2EEF1' }}>
          <div className="flex items-center gap-2 text-[13px] font-medium" style={{ color: '#1E293B' }}>
            <Clock size={13} style={{ color: '#0891B2' }} />
            {a.appointment_date ? format(parseISO(a.appointment_date), 'EEE, dd MMM yyyy') : '—'}
            {a.appointment_time ? ` · ${a.appointment_time}` : ''}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: '1px solid #F1F5F9' }}>
          {isConfirmed && (
            <button 
              onClick={() => onJoinCall(`call_${a.id.slice(0, 8)}`)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-bold text-white shadow-sm"
              style={{ background: '#8B5CF6' }}
            >
              <Video size={14} /> Join Video Call
            </button>
          )}
          {isPending && (
            <button onClick={() => onCancel(a.id)} className="px-3 py-1.5 rounded-md text-[12px] font-medium" style={{ border: '1px solid #EF4444', color: '#EF4444' }}>
              Cancel
            </button>
          )}
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-medium" style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>
            <MapPin size={12} /> Directions
          </button>
        </div>
      </div>
    </div>
  );
};

/* ──────────────── BOOK APPOINTMENT MODAL (Simplified for reference) ──────────────── */
const BookAppointmentModal = ({ patientId, onClose, onSaved }: { patientId: string; onClose: () => void; onSaved: () => void }) => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [form, setForm] = useState({ doctor_name: '', hospital_id: '', hospital_name: '', appointment_date: '', appointment_time: '', reason: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('hospitals').select('id, hospital_name').eq('verification_status', 'Verified').then(({ data }) => setHospitals(data || []));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('patient_appointments').insert([{ ...form, patient_id: patientId, status: 'Pending Confirmation', booked_by: 'Patient' }]);
    toast.success('Request sent!');
    onSaved();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-[450px] w-full p-6">
        <h3 className="text-lg font-bold mb-4">Book Appointment</h3>
        <div className="space-y-3">
          <input placeholder="Doctor Name" className="w-full p-2 border rounded" onChange={e => setForm({...form, doctor_name: e.target.value})} />
          <select className="w-full p-2 border rounded" onChange={e => {
            const h = hospitals.find(x => x.id === e.target.value);
            setForm({...form, hospital_id: e.target.value, hospital_name: h?.hospital_name || ''});
          }}>
            <option value="">Select Hospital</option>
            {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
          </select>
          <input type="date" className="w-full p-2 border rounded" onChange={e => setForm({...form, appointment_date: e.target.value})} />
          <input type="time" className="w-full p-2 border rounded" onChange={e => setForm({...form, appointment_time: e.target.value})} />
        </div>
        <button onClick={handleSave} className="w-full mt-4 bg-[#0891B2] text-white p-2 rounded">{saving ? 'Booking...' : 'Book Now'}</button>
      </div>
    </div>
  );
};

export default PatientAppointments;
