import { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { AlertTriangle, Shield, Phone, Pill, Volume2, Camera } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { HospitalProfile } from '@/hooks/useHospitalContext';
import ScannerModal from '@/components/hospital/ScannerModal';
import AdmitPatientModal from '@/components/hospital/AdmitPatientModal';

const HospitalEmergency = () => {
  const { hospital } = useOutletContext<{ hospital: HospitalProfile | null }>();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [scanLogs, setScanLogs] = useState<any[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(() => sessionStorage.getItem('audio_enabled') === 'true');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [selectedAlertContext, setSelectedAlertContext] = useState<any>(null);
  const audioContext = useRef<AudioContext | null>(null);

  const enableAlerts = () => {
    audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioEnabled(true);
    sessionStorage.setItem('audio_enabled', 'true');
  };

  const playAlertSound = () => {
    if (!audioContext.current) return;
    const osc = audioContext.current.createOscillator();
    const gain = audioContext.current.createGain();
    osc.connect(gain);
    gain.connect(audioContext.current.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, audioContext.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.current.currentTime + 0.5);
    osc.start();
    osc.stop(audioContext.current.currentTime + 0.5);
  };

  const fetchAlerts = async () => {
    if (!hospital) return;
    const { data } = await supabase.from('qr_scan_logs')
      .select('*, patients(full_name, blood_group, allergies, current_medications, emergency_contact_name, emergency_contact_phone, gender, date_of_birth)')
      .eq('hospital_id', hospital.id)
      .order('scanned_at', { ascending: false })
      .limit(50);
    const all = data || [];
    setAlerts(all.filter(a => !a.resolved));
    setScanLogs(all);
  };

  useEffect(() => { fetchAlerts(); }, [hospital]);

  useEffect(() => {
    if (!hospital) return;
    const ch = supabase.channel('hospital-emergency-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'qr_scan_logs', filter: `hospital_id=eq.${hospital.id}` }, (payload) => {
        if (audioEnabled) playAlertSound();
        toast.error(`🚨 Emergency QR Scan at ${payload.new.scan_location || 'Emergency Gate'}`);
        fetchAlerts();
        if (document.hidden && Notification.permission === 'granted') {
          new Notification('🚨 Emergency Alert — Sanjeevani', {
            body: `QR scanned at ${payload.new.scan_location}`,
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [hospital, audioEnabled]);

  const markResolved = async (id: string) => {
    await supabase.from('qr_scan_logs').update({ resolved: true, resolved_at: new Date().toISOString(), resolved_by: hospital?.admin_name || 'Admin' }).eq('id', id);
    toast.success('Alert marked as resolved');
    fetchAlerts();
  };

  const handleScan = async (decodedUrl: string) => {
    // Validate if it's our QR code format
    try {
       const url = new URL(decodedUrl);
       if (url.pathname.startsWith('/qr/')) {
          const patientId = url.pathname.replace('/qr/', '');
          
          // Log it on behalf of the hospital
          await supabase.from('qr_scan_logs').insert({
             patient_id: patientId,
             hospital_id: hospital?.id,
             scan_location: 'Hospital Scanner',
             scanned_by: hospital?.admin_name || 'Hospital Admin',
          });
          
          toast.success("Patient scanned successfully! Loading emergency data...");
          // Open the public profile page in a new window/tab for the doctor to see the huge red banners
          window.open(decodedUrl, '_blank');
       } else {
          toast.error("Invalid QR Code format.");
       }
    } catch {
       toast.error("Unrecognized QR Code. Please scan a valid Sanjeevani tag.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <h1 className="text-xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Emergency Alerts</h1>
         <button 
           onClick={() => setIsScannerOpen(true)}
           className="px-5 py-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-105" 
           style={{ background: '#DC2626' }}
         >
           <Camera size={18} />
           Scan Patient QR
         </button>
      </div>

      <ScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan} 
      />

      {hospital && selectedAlertContext && (
         <AdmitPatientModal
            isOpen={admitModalOpen}
            onClose={() => { setAdmitModalOpen(false); setSelectedAlertContext(null); }}
            hospitalId={hospital.id}
            alert={selectedAlertContext}
            onSuccess={fetchAlerts}
         />
      )}

      {/* Audio enable banner */}
      {!audioEnabled && (
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <div>
            <p className="text-[14px] font-bold" style={{ color: '#1E293B' }}>🔔 Enable Emergency Alert Sounds</p>
            <p className="text-[13px]" style={{ color: '#64748B' }}>Click once to enable audio for QR scan alerts.</p>
          </div>
          <button onClick={enableAlerts} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: '#F59E0B' }}>
            <Volume2 size={16} /> Enable Alert Sounds
          </button>
        </div>
      )}

      {/* Active Alerts */}
      <div className="rounded-xl p-5" style={{ background: alerts.length > 0 ? '#FEF2F2' : '#F0FDF4' }}>
        {alerts.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h2 className="text-[16px] font-bold" style={{ color: '#DC2626' }}>🚨 ACTIVE EMERGENCY ALERTS ({alerts.length})</h2>
            </div>
            <div className="space-y-4">
              {alerts.map(alert => {
                const pat = alert.patients;
                const age = pat?.date_of_birth ? Math.floor((Date.now() - new Date(pat.date_of_birth).getTime()) / 31557600000) : null;
                const timeAgo = formatDistanceToNow(new Date(alert.scanned_at), { addSuffix: false });
                return (
                  <div key={alert.id} className="bg-white rounded-xl p-5 border" style={{ borderColor: '#FECACA' }}>
                    <p className="text-[13px] font-bold mb-2" style={{ color: '#DC2626' }}>
                      🚨 QR SCAN — {alert.scan_location || 'EMERGENCY GATE'} · {timeAgo} ago
                    </p>
                    <p className="text-[15px] font-semibold mb-1" style={{ color: '#1E293B' }}>
                      Patient: {pat?.full_name || 'Unknown'} {pat?.gender ? `· ${pat.gender}` : ''} {age ? `· ${age} yrs` : ''}
                    </p>
                    {pat?.blood_group && (
                      <span className="inline-block px-3 py-1 rounded-full text-[14px] font-bold mb-2 mr-2" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                        BLOOD GROUP: {pat.blood_group}
                      </span>
                    )}
                    {pat?.allergies && pat.allergies.length > 0 && (
                      <p className="text-[13px] font-semibold mb-1" style={{ color: '#DC2626' }}>
                        ⚠️ ALLERGIC TO: {pat.allergies.join(', ')}
                      </p>
                    )}
                    {pat?.current_medications && pat.current_medications.length > 0 && (
                      <p className="text-[13px] mb-1" style={{ color: '#1E293B' }}>
                        <Pill size={14} className="inline mr-1" /> Active Meds: {pat.current_medications.join(', ')}
                      </p>
                    )}
                    {pat?.emergency_contact_name && (
                      <p className="text-[13px] mb-3" style={{ color: '#1E293B' }}>
                        <Phone size={14} className="inline mr-1" /> Emergency Contact: {pat.emergency_contact_name} · {pat.emergency_contact_phone}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setSelectedAlertContext(alert); setAdmitModalOpen(true); }}
                        className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-opacity hover:opacity-90" 
                        style={{ background: '#F59E0B' }}
                      >
                        🏥 Admit Patient
                      </button>
                      <button className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ background: '#EBF7FA', color: '#0891B2', border: '1px solid #0891B2' }}>📋 View Profile</button>
                      <button onClick={() => markResolved(alert.id)} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: '#10B981' }}>✅ Mark Resolved</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Shield size={20} style={{ color: '#059669' }} />
            <p className="text-[14px] font-medium" style={{ color: '#059669' }}>✅ No active emergency alerts.</p>
          </div>
        )}
      </div>

      {/* QR Scan Log */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2EEF1' }}>
        <JharokhaArch color="#EF4444" opacity={0.18} />
        <div className="p-5">
          <h3 className="text-[15px] font-bold mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>QR Scan History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr style={{ background: '#F7FBFC', borderBottom: '1px solid #E2EEF1' }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B' }}>Timestamp</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B' }}>Patient</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B' }}>Location</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B' }}>Scanned By</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B' }}>Resolved</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scanLogs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8" style={{ color: '#64748B' }}>No scan records.</td></tr>
                ) : scanLogs.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #E2EEF1' }}>
                    <td className="px-4 py-3" style={{ color: '#64748B' }}>{format(new Date(s.scanned_at), 'dd MMM yyyy, HH:mm')}</td>
                    <td className="px-4 py-3" style={{ color: '#1E293B' }}>{s.patients?.full_name || 'Unknown'}</td>
                    <td className="px-4 py-3" style={{ color: '#1E293B' }}>{s.scan_location || '—'}</td>
                    <td className="px-4 py-3" style={{ color: '#1E293B' }}>{s.scanned_by || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: s.resolved ? '#F0FDF4' : '#FFFBEB', color: s.resolved ? '#059669' : '#D97706' }}>
                        {s.resolved ? '✅ Resolved' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!s.resolved && (
                        <button onClick={() => markResolved(s.id)} className="text-[12px] font-medium px-2 py-1 rounded" style={{ color: '#10B981' }}>Mark Resolved</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalEmergency;
