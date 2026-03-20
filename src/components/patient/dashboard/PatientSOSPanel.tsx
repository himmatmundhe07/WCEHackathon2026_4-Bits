import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2, AlertCircle, XCircle, Video, CheckCircle2 } from 'lucide-react';
import JharokhaArch from '@/components/admin/JharokhaArch';
import PatientEvidenceRecorder from './PatientEvidenceRecorder';

// Fix leafet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function PatientSOSPanel({ patientId }: { patientId: string }) {
  const [activeEm, setActiveEm] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recorderOpen, setRecorderOpen] = useState(false);
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [manualAddress, setManualAddress] = useState('');

  // Fetch active
  useEffect(() => {
    const fetchActive = async () => {
      const { data } = await (supabase as any).from('emergencies').select('*').eq('patient_id', patientId).neq('status', 'resolved').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if(data) setActiveEm(data);
    };
    fetchActive();

    const channel = supabase.channel('my-em')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies', filter: `patient_id=eq.${patientId}` }, (payload: any) => {
        if(payload.new.status === 'resolved') setActiveEm(null);
        else setActiveEm(payload.new);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [patientId]);

  const triggerSOS = () => {
    if (!navigator.onLine) {
      toast.error('You are offline. Opening SMS fallback...');
      window.location.href = `sms:108?body=EMERGENCY SOS at my location. Patient ID: ${patientId}`;
      return;
    }

    setLoading(true);
    if (!navigator.geolocation) {
      setShowAddressInput(true);
      toast.error('GPS not supported. Please type your location.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const { data, error } = await (supabase as any).from('emergencies').insert({
          patient_id: patientId,
          emergency_type: 'General SOS',
          latitude,
          longitude,
          status: 'pending'
        }).select().single();
        
        if (error) throw error;
        toast.success('SOS Triggered! Sending to hospitals...');
        setActiveEm(data);
      } catch (e) {
        toast.error('Failed to trigger SOS. Servers may be unreachable.');
      } finally {
        setLoading(false);
      }
    }, () => {
      // Permission denied or timeout
      toast.error('Location denied. Please type your exact landmark/address below.');
      setShowAddressInput(true);
      setLoading(false);
    }, { timeout: 10000 });
  };

  const submitManualAddress = async () => {
    if (!manualAddress.trim()) {
      toast.error('Please enter a location');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await (supabase as any).from('emergencies').insert({
        patient_id: patientId,
        emergency_type: 'General SOS (Manual Address)',
        address: manualAddress,
        status: 'pending'
      }).select().single();
      
      if (error) throw error;
      toast.success('SOS Triggered via address! Sending to hospitals...');
      setActiveEm(data);
      setShowAddressInput(false);
    } catch (e) {
      toast.error('Failed to trigger SOS.');
    } finally {
      setLoading(false);
    }
  };

  const cancelSOS = async () => {
    if(!activeEm) return;
    await (supabase as any).from('emergencies').update({ status: 'resolved' }).eq('id', activeEm.id);
    setActiveEm(null);
    toast.info('Emergency cancelled');
  };

  if (activeEm) {
    return (
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EF4444', boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)' }}>
        <JharokhaArch color="#EF4444" opacity={0.15} />
        <div className="p-5">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-bold text-[#EF4444] flex items-center gap-2 animate-pulse"><AlertCircle /> ACTIVE SOS</h3>
             <span className="px-3 py-1 font-bold text-[11px] uppercase tracking-wider rounded-full bg-red-100 text-red-700 border border-red-200">{activeEm.status}</span>
           </div>
           
           <div className="h-[250px] w-full rounded-xl overflow-hidden mb-4 relative z-0 border border-[#E2EEF1] bg-slate-100 flex items-center justify-center">
             {activeEm.latitude && activeEm.longitude ? (
               <MapContainer center={[activeEm.latitude, activeEm.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                 <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                 <Marker position={[activeEm.latitude, activeEm.longitude]}>
                   <Popup>Your Location</Popup>
                 </Marker>
               </MapContainer>
             ) : (
               <div className="p-6 text-center text-slate-500">
                 <AlertCircle size={40} className="mx-auto mb-2 opacity-50" />
                 <p className="font-bold text-sm">GPS Failed.</p>
                 <p className="text-xs mt-1">Manual Address Provided:<br/><strong>{activeEm.address}</strong></p>
               </div>
             )}
           </div>
           
           <div className="flex flex-col sm:flex-row gap-3">
             <div className="flex-1 bg-[#FEF2F2] p-4 rounded-xl border border-[#FCA5A5]">
                <p className="text-[11px] text-[#DC2626] font-bold mb-1 uppercase tracking-wider">Hospital Assign Status</p>
                <p className="text-[15px] font-bold text-[#991B1B]">
                  {activeEm.status === 'pending' ? 'Searching nearby hospitals...' : 'Hospital Assigned & En Route'}
                </p>
             </div>
             <div className="flex-1 bg-[#FEF2F2] p-4 rounded-xl border border-[#FCA5A5]">
                <p className="text-[11px] text-[#DC2626] font-bold mb-1 uppercase tracking-wider">Ambulance ETA</p>
                <p className="text-xl font-black text-[#991B1B]">{activeEm.ambulance_eta || 'Calculating...'}</p>
             </div>
             <div className="flex flex-col gap-2 relative">
               {activeEm.video_url ? (
                 <div className="bg-green-50 text-green-700 font-bold p-3 rounded-xl border border-green-200 text-center text-[12px] flex items-center justify-center gap-2">
                   <CheckCircle2 size={16} /> Evidence Sent Fully
                 </div>
               ) : (
                 <button onClick={() => setRecorderOpen(true)} className="px-5 py-4 bg-[#EBF7FA] text-[#0891B2] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#CFFAFE] transition-colors border border-[#0891B2]">
                   <Video size={18} /> Record Evidence
                 </button>
               )}
               <button onClick={cancelSOS} className="px-5 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors border border-gray-200">
                 <XCircle size={18} /> Cancel SOS
               </button>
             </div>
           </div>
        </div>
        <PatientEvidenceRecorder 
          emergencyId={activeEm.id} 
          isOpen={recorderOpen} 
          onClose={() => setRecorderOpen(false)} 
          onSuccess={(url) => setActiveEm({...activeEm, video_url: url})} 
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm relative" style={{ border: '1px solid #EF4444' }}>
      <JharokhaArch color="#EF4444" opacity={0.05} />
      <div className="p-10 text-center relative z-10">
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Medical Emergency?</h2>
        <p className="text-[#64748B] text-[13px] mb-8 max-w-md mx-auto">Tap the SOS button to instantly transmit your exact GPS location to all registered Sanjeevani hospitals in your area.</p>
        
        {!showAddressInput ? (
          <button 
            onClick={triggerSOS}
            disabled={loading}
            className="relative group w-44 h-44 rounded-full bg-[#EF4444] text-white font-black text-3xl shadow-2xl hover:bg-[#DC2626] active:scale-95 transition-all flex items-center justify-center mx-auto"
            style={{ boxShadow: '0 0 0 12px rgba(239, 68, 68, 0.1), 0 0 0 24px rgba(239, 68, 68, 0.05)' }}
          >
            {loading ? <Loader2 className="animate-spin" size={40} /> : 'SOS'}
            
            <div className="absolute inset-0 rounded-full border-2 border-red-300 opacity-0 group-hover:animate-ping" style={{ animationDuration: '2s' }}></div>
          </button>
        ) : (
          <div className="max-w-sm mx-auto bg-red-50 p-6 rounded-2xl border-2 border-red-200 shadow-md">
            <h3 className="text-red-800 font-bold mb-2 flex items-center gap-2 justify-center"><AlertCircle size={18} /> GPS Access Denied</h3>
            <p className="text-[12px] text-red-600 mb-4 font-medium">To dispatch an ambulance, we need your exact location or a nearby landmark.</p>
            <textarea 
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="E.g., Highway 42 near City Mall, opposite the petrol pump..."
              className="w-full text-[13px] bg-white border border-red-200 rounded-xl p-3 focus:ring-2 focus:ring-red-500 focus:outline-none mb-3 min-h-[80px]"
            />
            <div className="flex gap-2">
               <button onClick={() => setShowAddressInput(false)} className="flex-1 py-3 text-red-700 bg-white border border-red-200 font-bold rounded-xl text-sm">Cancel</button>
               <button onClick={submitManualAddress} disabled={loading} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl text-sm shadow-md flex justify-center items-center">
                 {loading ? <Loader2 className="animate-spin" size={16} /> : 'Send SOS'}
               </button>
            </div>
          </div>
        )}
        <p className="mt-8 text-[11px] font-medium text-[#94A3B8] uppercase tracking-widest"><AlertCircle size={12} className="inline mr-1 mb-0.5" /> For severe emergencies only</p>
      </div>
    </div>
  );
}
