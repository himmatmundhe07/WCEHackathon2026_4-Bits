import { useEffect, useState, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { sendNotification } from '@/hooks/useNotifications';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Input } from '@/components/ui/input';
import { Check, Calendar, X, Eye, RotateCcw, Plus, Loader2, ChevronDown } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { HospitalProfile } from '@/hooks/useHospitalContext';

type StatusFilter = 'All' | 'Pending Confirmation' | 'Confirmed' | 'Completed' | 'Cancelled';

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  'Pending Confirmation': { bg: '#FFFBEB', color: '#D97706', label: '⏳ Pending' },
  Upcoming: { bg: '#FFFBEB', color: '#D97706', label: '⏳ Pending' },
  Confirmed: { bg: '#EBF7FA', color: '#0891B2', label: '✅ Confirmed' },
  accepted: { bg: '#EBF7FA', color: '#0891B2', label: '✅ Accepted' },
  Completed: { bg: '#F0FDF4', color: '#059669', label: '✔ Completed' },
  Cancelled: { bg: '#FEF2F2', color: '#DC2626', label: '❌ Cancelled' },
};

const REJECT_REASONS = [
  'Doctor not available on this date',
  'Patient already has an appointment',
  'Hospital at capacity',
  'Wrong department / specialization',
  'Other',
];

const HospitalAppointments = () => {
  const { hospital } = useOutletContext<{ hospital: HospitalProfile | null }>();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('All');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorFilter, setDoctorFilter] = useState('');

  // Inline panel state  
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOther, setRejectOther] = useState('');
  const [rejectSaving, setRejectSaving] = useState(false);

  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '', doctor_name: '', note: '' });
  const [rescheduleSaving, setRescheduleSaving] = useState(false);

  // Audio
  const audioCtx = useRef<AudioContext | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(
    sessionStorage.getItem('audio_enabled') === 'true'
  );

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      sessionStorage.setItem('audio_enabled', 'true');
      setAudioEnabled(true);
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

  // Fetch - uses current filter/date state (captured via closure)
  const fetchAppointments = useCallback(async (currentDate?: string, currentFilter?: StatusFilter) => {
    if (!hospital) return;
    const d = currentDate ?? date;
    const f = currentFilter ?? filter;
    setLoading(true);
    let q = supabase.from('patient_appointments')
      .select('*, patients(id, full_name, profile_photo_url, phone, blood_group)')
      .eq('hospital_id', hospital.id)
      .eq('appointment_date', d)
      .order('appointment_time', { ascending: true });
    if (f !== 'All') {
      if (f === 'Confirmed') {
        q = q.in('status', ['Confirmed', 'accepted']);
      } else {
        q = q.eq('status', f);
      }
    }
    if (doctorFilter) q = q.eq('doctor_name', doctorFilter);
    const { data } = await q;
    setAppointments(data || []);
    setLoading(false);
  }, [hospital, date, filter, doctorFilter]);

  useEffect(() => { fetchAppointments(); }, [hospital, filter, date, doctorFilter]);

  // Doctors + Realtime subscription
  useEffect(() => {
    if (!hospital) return;
    supabase.from('hospital_staff').select('full_name').eq('hospital_id', hospital.id).eq('role', 'Doctor')
      .then(({ data }) => setDoctors(data || []));

    const ch = supabase.channel('hospital-appt-realtime-v2')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'patient_appointments',
        filter: `hospital_id=eq.${hospital.id}`
      }, async (payload) => {
        playNotificationSound();
        toast.info('📅 New appointment request received!');

        // Refetch single row with joins
        const { data: newRow } = await supabase
          .from('patient_appointments')
          .select('*, patients(id, full_name, profile_photo_url, phone, blood_group)')
          .eq('id', payload.new.id)
          .single();

        // Only prepend if it matches the currently selected date
        if (newRow && newRow.appointment_date === date) {
          setAppointments(prev => [newRow, ...prev]);
        }

        // Browser notification if tab hidden
        if (document.hidden && Notification.permission === 'granted') {
          new Notification('📅 New Appointment — Sanjeevani', {
            body: `New request for ${newRow?.patients?.full_name || 'a patient'} on ${newRow?.appointment_date}`,
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [hospital, date, playNotificationSound]);

  // ----------- ACTIONS -----------

  const handleAccept = async (a: any) => {
    try {
      const { data, error } = await supabase.from('patient_appointments')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', a.id)
        .select();

      if (error) {
        console.error('Accept Appointment error:', error);
        toast.error(`Accept failed: ${error.message || 'Validation error'}`);
        return;
      }

      setAppointments(prev => prev.map(x => x.id === a.id ? { ...x, status: 'accepted' } : x));
      toast.success('✅ Appointment accepted.');
      // Notify patient
      if (a.patients?.id) {
        const { data: pt } = await supabase.from('patients').select('supabase_user_id').eq('id', a.patients.id).single();
        if (pt?.supabase_user_id) {
          await sendNotification({
            recipientUserId: pt.supabase_user_id,
            recipientType: 'patient',
            title: '✅ Appointment Accepted!',
            body: `Your appointment with ${a.doctor_name} at ${hospital?.hospital_name} on ${a.appointment_date}${a.appointment_time ? ' at ' + a.appointment_time : ''} has been accepted.`,
            type: 'appointment',
          });
        }
      }
    } catch (err: any) {
      console.error('Network or unexpected error while accepting appointment:', err);
      toast.error('An unexpected error occurred while accepting.');
    }
  };

  const handleComplete = async (id: string) => {
    await supabase.from('patient_appointments').update({ status: 'Completed', updated_at: new Date().toISOString() }).eq('id', id);
    setAppointments(prev => prev.map(x => x.id === id ? { ...x, status: 'Completed' } : x));
    toast.success('✔ Appointment marked as completed.');
  };

  const handleReject = async (a: any) => {
    const reason = rejectReason === 'Other' ? rejectOther : rejectReason;
    if (!reason) { toast.error('Please select a reason'); return; }
    setRejectSaving(true);
    const { error } = await supabase.from('patient_appointments')
      .update({ status: 'Cancelled', cancellation_reason: reason, updated_at: new Date().toISOString() })
      .eq('id', a.id);
    if (!error) {
      setAppointments(prev => prev.map(x => x.id === a.id ? { ...x, status: 'Cancelled', cancellation_reason: reason } : x));
      setRejectingId(null);
      setRejectReason('');
      setRejectOther('');
      toast.success('Appointment rejected. Patient will be notified.');
      // Notify patient
      if (a.patients?.id) {
        const { data: pt } = await supabase.from('patients').select('supabase_user_id').eq('id', a.patients.id).single();
        if (pt?.supabase_user_id) {
          await sendNotification({
            recipientUserId: pt.supabase_user_id,
            recipientType: 'patient',
            title: '❌ Appointment Not Accepted',
            body: `Your appointment with ${a.doctor_name} on ${a.appointment_date} was not accepted. Reason: ${reason}`,
            type: 'alert',
          });
        }
      }
    }
    setRejectSaving(false);
  };

  const handleReschedule = async (a: any) => {
    if (!rescheduleForm.date) { toast.error('New date is required'); return; }
    setRescheduleSaving(true);
    const { error } = await supabase.from('patient_appointments')
      .update({
        appointment_date: rescheduleForm.date,
        appointment_time: rescheduleForm.time || null,
        doctor_name: rescheduleForm.doctor_name || a.doctor_name,
        status: 'accepted',
        notes: rescheduleForm.note || null,
        rescheduled_by_hospital: true,
        original_date: a.rescheduled_by_hospital ? a.original_date : a.appointment_date,
        original_time: a.rescheduled_by_hospital ? a.original_time : (a.appointment_time || null),
        updated_at: new Date().toISOString(),
      })
      .eq('id', a.id);
    if (!error) {
      setAppointments(prev => prev.map(x => x.id === a.id ? {
        ...x, appointment_date: rescheduleForm.date,
        appointment_time: rescheduleForm.time || x.appointment_time,
        status: 'accepted', rescheduled_by_hospital: true,
        original_date: x.rescheduled_by_hospital ? x.original_date : x.appointment_date,
      } : x));
      setReschedulingId(null);
      toast.success('🗓 Appointment rescheduled. Patient will see the new time.');
      // Notify patient
      if (a.patients?.id) {
        const { data: pt } = await supabase.from('patients').select('supabase_user_id').eq('id', a.patients.id).single();
        if (pt?.supabase_user_id) {
          await sendNotification({
            recipientUserId: pt.supabase_user_id,
            recipientType: 'patient',
            title: '🗓 Appointment Rescheduled',
            body: `Your appointment with ${rescheduleForm.doctor_name || a.doctor_name} has been moved to ${rescheduleForm.date}${rescheduleForm.time ? ' at ' + rescheduleForm.time : ''}. ${rescheduleForm.note ? '\n"' + rescheduleForm.note + '"' : ''}`,
            type: 'appointment',
          });
        }
      }
    }
    setRescheduleSaving(false);
  };

  const tabs: StatusFilter[] = ['All', 'Pending Confirmation', 'Confirmed', 'Completed', 'Cancelled'];

  return (
    <div className="space-y-6" onClick={initAudio}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Appointments</h1>
          {!audioEnabled && (
            <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>Click anywhere to enable notification sounds</p>
          )}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: '#F59E0B' }}>
          <Plus size={16} /> Add Walk-in
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <Input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-auto text-[13px]" style={{ borderColor: '#E2EEF1' }} />
        <select value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)}
          className="text-[13px] rounded-md border px-3 py-2" style={{ borderColor: '#E2EEF1' }}>
          <option value="">All Doctors</option>
          {doctors.map(d => <option key={d.full_name} value={d.full_name}>{d.full_name}</option>)}
        </select>
        <div className="flex gap-1 flex-wrap">
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap"
              style={{
                background: filter === t ? '#EBF7FA' : 'transparent',
                color: filter === t ? '#0891B2' : '#64748B',
                border: filter === t ? '1px solid #0891B2' : '1px solid transparent',
              }}>
              {t === 'Pending Confirmation' ? '⏳ Pending' : t}
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
                {['Time', 'Patient', 'Reason', 'Doctor', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8"><Loader2 size={20} className="animate-spin mx-auto" style={{ color: '#0891B2' }} /></td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 italic" style={{ color: '#64748B' }}>
                  <Calendar size={32} className="mx-auto mb-2" style={{ color: '#D1EBF1' }} />
                  No appointments for {format(parseISO(date), 'dd MMM yyyy')}.
                </td></tr>
              ) : appointments.map(a => {
                const st = STATUS_STYLES[a.status] || STATUS_STYLES['Pending Confirmation'];
                const isPending = a.status === 'Upcoming' || a.status === 'Pending Confirmation';
                const isConfirmed = a.status === 'Confirmed' || a.status === 'accepted';
                const isDone = a.status === 'Completed' || a.status === 'Cancelled';

                return (
                  <>
                    <tr key={a.id}
                      style={{ borderBottom: rejectingId === a.id || reschedulingId === a.id ? 'none' : '1px solid #E2EEF1' }}
                      className="hover:bg-gray-50/50 transition-colors">
                      {/* Time */}
                      <td className="px-4 py-3 font-mono whitespace-nowrap" style={{ color: '#0891B2' }}>
                        {a.appointment_time || '—'}
                        {a.rescheduled_by_hospital && (
                          <span className="block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 w-fit" style={{ background: '#FFFBEB', color: '#D97706' }}>⏰ Rescheduled</span>
                        )}
                      </td>

                      {/* Patient */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {a.patients?.profile_photo_url ? (
                            <img src={a.patients.profile_photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: '#0891B2' }}>
                              {(a.patients?.full_name || '?').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium" style={{ color: '#1E293B' }}>{a.patients?.full_name || '—'}</p>
                            {a.patients?.phone && <p className="text-[11px]" style={{ color: '#64748B' }}>{a.patients.phone}</p>}
                            {a.patients?.blood_group && <p className="text-[10px] font-bold" style={{ color: '#EF4444' }}>{a.patients.blood_group}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3 max-w-[160px]" style={{ color: '#1E293B' }}>
                        <p className="truncate">{a.reason || '—'}</p>
                        {a.cancellation_reason && (
                          <p className="text-[10px] mt-0.5" style={{ color: '#EF4444' }}>Reason: {a.cancellation_reason}</p>
                        )}
                      </td>

                      {/* Doctor */}
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#1E293B' }}>
                        {a.doctor_name || '—'}
                        {a.specialization && <p className="text-[11px]" style={{ color: '#64748B' }}>{a.specialization}</p>}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap"
                          style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        {a.rescheduled_by_hospital && a.original_date && (
                          <p className="text-[10px] mt-0.5" style={{ color: '#94A3B8' }}>
                            Was: {a.original_date}{a.original_time ? ' ' + a.original_time : ''}
                          </p>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {isPending && (
                            <>
                              <button onClick={() => handleAccept(a)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-white"
                                style={{ background: '#10B981' }}>
                                <Check size={12} /> Accept
                              </button>
                              <button onClick={() => { setRejectingId(rejectingId === a.id ? null : a.id); setReschedulingId(null); }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold"
                                style={{ border: '1px solid #EF4444', color: '#EF4444' }}>
                                <X size={12} /> Reject
                              </button>
                            </>
                          )}
                          {isConfirmed && (
                            <>
                              <button onClick={() => handleComplete(a.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-white"
                                style={{ background: '#0891B2' }}>
                                <Check size={12} /> Complete
                              </button>
                              <button onClick={() => { setReschedulingId(reschedulingId === a.id ? null : a.id); setRejectingId(null); setRescheduleForm({ date: a.appointment_date || '', time: a.appointment_time || '', doctor_name: a.doctor_name || '', note: '' }); }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold"
                                style={{ border: '1px solid #F59E0B', color: '#D97706' }}>
                                <RotateCcw size={12} /> Reschedule
                              </button>
                            </>
                          )}
                          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px]"
                            style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>
                            <Eye size={12} /> View
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* REJECT INLINE PANEL */}
                    {rejectingId === a.id && (
                      <tr key={`reject-${a.id}`}>
                        <td colSpan={6} className="px-4 pb-4 pt-0">
                          <div className="rounded-lg p-4" style={{ background: 'white', border: '1px solid #FECACA' }}>
                            <JharokhaArch color="#EF4444" opacity={0.12} />
                            <p className="text-[13px] font-semibold mb-3 mt-1" style={{ color: '#1E293B' }}>Reason for rejection:</p>
                            <select value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                              className="field-input mb-2 text-[13px]">
                              <option value="">Select a reason...</option>
                              {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {rejectReason === 'Other' && (
                              <textarea value={rejectOther} onChange={e => setRejectOther(e.target.value)}
                                placeholder="Describe the reason..." className="field-input mb-2 text-[13px]" rows={2} />
                            )}
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => handleReject(a)} disabled={rejectSaving || !rejectReason}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white disabled:opacity-50"
                                style={{ background: '#EF4444' }}>
                                {rejectSaving ? <Loader2 size={12} className="animate-spin" /> : null}
                                Confirm Rejection
                              </button>
                              <button onClick={() => { setRejectingId(null); setRejectReason(''); setRejectOther(''); }}
                                className="px-4 py-2 text-[12px]" style={{ color: '#64748B' }}>Cancel</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* RESCHEDULE INLINE PANEL */}
                    {reschedulingId === a.id && (
                      <tr key={`reschedule-${a.id}`}>
                        <td colSpan={6} className="px-4 pb-4 pt-0">
                          <div className="rounded-lg p-4" style={{ background: 'white', border: '1px solid #F59E0B' }}>
                            <JharokhaArch color="#F59E0B" opacity={0.18} />
                            <p className="text-[13px] font-bold mb-1 mt-1" style={{ color: '#1E293B' }}>🗓 Reschedule Appointment</p>
                            {a.appointment_date && (
                              <p className="text-[12px] mb-3" style={{ color: '#94A3B8' }}>
                                Patient requested: {format(parseISO(a.appointment_date), 'EEE, dd MMM yyyy')}
                                {a.appointment_time ? ` at ${a.appointment_time}` : ''}
                              </p>
                            )}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="field-label">New Date *</label>
                                <input type="date" className="field-input text-[12px]"
                                  min={format(new Date(), 'yyyy-MM-dd')}
                                  value={rescheduleForm.date}
                                  onChange={e => setRescheduleForm(f => ({ ...f, date: e.target.value }))} />
                              </div>
                              <div>
                                <label className="field-label">New Time</label>
                                <input type="time" className="field-input text-[12px]"
                                  value={rescheduleForm.time}
                                  onChange={e => setRescheduleForm(f => ({ ...f, time: e.target.value }))} />
                              </div>
                            </div>
                            <div className="mb-3">
                              <label className="field-label">Assign Doctor</label>
                              <select className="field-input text-[12px]"
                                value={rescheduleForm.doctor_name}
                                onChange={e => setRescheduleForm(f => ({ ...f, doctor_name: e.target.value }))}>
                                <option value="">Keep current ({a.doctor_name})</option>
                                {doctors.map(d => <option key={d.full_name} value={d.full_name}>{d.full_name}</option>)}
                              </select>
                            </div>
                            <div className="mb-3">
                              <label className="field-label">Note to Patient (optional)</label>
                              <textarea className="field-input text-[12px]" rows={2}
                                placeholder="e.g. Your appointment has been moved. Please arrive 10 minutes early."
                                value={rescheduleForm.note}
                                onChange={e => setRescheduleForm(f => ({ ...f, note: e.target.value }))} />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleReschedule(a)} disabled={rescheduleSaving || !rescheduleForm.date}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white disabled:opacity-50"
                                style={{ background: '#F59E0B' }}>
                                {rescheduleSaving ? <Loader2 size={12} className="animate-spin" /> : null}
                                Confirm Reschedule
                              </button>
                              <button onClick={() => setReschedulingId(null)}
                                className="px-4 py-2 text-[12px]" style={{ color: '#64748B' }}>Cancel</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HospitalAppointments;
