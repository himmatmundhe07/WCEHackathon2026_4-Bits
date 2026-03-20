import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { AlertCircle, MapPin, Truck, CheckCircle2, ChevronRight, LocateFixed, Video, UserCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { formatDistanceToNow } from 'date-fns';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Haversine formula to compute distance in km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

export default function HospitalSOSQueue({ hospitalId }: { hospitalId: string }) {
  const [activeSOS, setActiveSOS] = useState<any[]>([]);
  const [hospitalCoords, setHospitalCoords] = useState<{lat: number, lng: number} | null>(null);

  // Fetch Hospital's own coordinates first
  useEffect(() => {
    const fetchCoords = async () => {
      const { data } = await supabase.from('hospitals').select('latitude, longitude').eq('id', hospitalId).single();
      if (data?.latitude && data?.longitude) {
        setHospitalCoords({ lat: data.latitude, lng: data.longitude });
      }
    };
    fetchCoords();
  }, [hospitalId]);

  const fetchActive = async () => {
    // get pending ones OR ones assigned to us that aren't resolved
    const { data } = await (supabase as any).from('emergencies')
      .select('*, patients(full_name, blood_group, phone)')
      .or(`status.eq.pending,hospital_id.eq.${hospitalId}`)
      .neq('status', 'resolved')
      .order('created_at', { ascending: false });
      
    if (data) {
      // filter out ones accepted by OTHER hospitals, AND filter pending ones by distance
      const relevant = data.filter((e: any) => {
        // Always show if we already own it
        if (e.hospital_id === hospitalId) return true;
        
        // If it's pending, calculate distance
        if (e.status === 'pending') {
          // If the patient didn't provide GPS, show it to everyone just in case
          if (!e.latitude || !e.longitude || (!hospitalCoords && e.latitude)) {
            return true;
          }
          // If both have GPS, calculate distance. Only show if within 30 kilometers!
          if (hospitalCoords) {
             const dist = getDistanceFromLatLonInKm(hospitalCoords.lat, hospitalCoords.lng, e.latitude, e.longitude);
             if (dist > 30) return false; // Too far away, hide it!
          }
          return true;
        }
        return false;
      });
      setActiveSOS(relevant);
    }
  };

  useEffect(() => {
    if (!hospitalId || hospitalCoords === undefined) return;
    
    fetchActive();
    const ch = supabase.channel('hosp-sos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, () => {
        fetchActive();
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [hospitalId, hospitalCoords]);

  const updateStatus = async (id: string,  newStatus: string) => {
    const payload: any = { status: newStatus };
    if (newStatus === 'accepted') {
      payload.hospital_id = hospitalId;
      payload.ambulance_eta = '10 mins'; // simple mock ETA
    }
    if (newStatus === 'resolved') {
      payload.resolved_at = new Date().toISOString();
    }
    
    await (supabase as any).from('emergencies').update(payload).eq('id', id);
    toast.success(`SOS marked as ${newStatus.toUpperCase()}`);
    fetchActive();
  };

  if(activeSOS.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#DC2626' }}>
        <LocateFixed size={20} className="animate-pulse" /> LIVE SOS REQUESTS
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {activeSOS.map(sos => (
          <div key={sos.id} className="bg-white rounded-xl overflow-hidden border shadow-sm relative group transition-all" style={{ borderColor: sos.status === 'pending' ? '#FECACA' : '#E2EEF1' }}>
             <JharokhaArch color={sos.status === 'pending' ? '#EF4444' : '#0891B2'} opacity={0.1} />
             <div className="p-5 relative z-10 flex flex-col h-full">
               <div className="flex justify-between items-start mb-3">
                 <div>
                   <h3 className="text-base font-bold" style={{ color: '#1E293B' }}>{sos.patients?.full_name || sos.guest_name || 'Unknown Patient'}</h3>
                   <p className="text-[12px] text-[#64748B] flex items-center gap-1 mt-0.5">
                     <AlertCircle size={12} /> {sos.emergency_type} · {formatDistanceToNow(new Date(sos.created_at))} ago
                   </p>
                 </div>
                 <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${sos.status === 'pending' ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA] animate-pulse' : 'bg-[#EBF7FA] text-[#0891B2] border-[#BAE6FD]'}`}>
                   {sos.status}
                 </span>
               </div>

               <div className="h-32 w-full rounded-lg overflow-hidden border border-[#E2EEF1] relative z-0 mb-4 bg-slate-100 flex items-center justify-center text-center p-4">
                 {sos.latitude && sos.longitude ? (
                   <MapContainer center={[sos.latitude, sos.longitude]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                     <Marker position={[sos.latitude, sos.longitude]} />
                   </MapContainer>
                 ) : (
                   <div>
                     <AlertCircle className="mx-auto mb-2 text-red-500 opacity-50" size={32} />
                     <p className="text-xs font-bold text-slate-700">GPS Unavailable</p>
                     <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] break-words">
                       {sos.address || 'No location provided.'}
                     </p>
                   </div>
                 )}
               </div>

                {sos.video_url ? (
                  <div className="flex gap-2 mb-3">
                    <a href={sos.video_url} target="_blank" rel="noreferrer" className="flex-1 py-2 rounded-lg text-[11px] font-bold text-white flex items-center justify-center gap-1 transition-all hover:bg-slate-700" style={{ background: '#1E293B' }}>
                       <Video size={14} /> Evidence
                    </a>
                    <Link to={`/qr/${sos.patient_id}`} target="_blank" className="flex-1 py-2 rounded-lg text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1 transition-all hover:bg-slate-200 border border-slate-300 bg-white">
                       <UserCircle2 size={14} /> Full Profile
                    </Link>
                  </div>
                ) : (
                  <Link to={`/qr/${sos.patient_id}`} target="_blank" className="w-full mb-3 py-2 rounded-lg text-[12px] font-bold text-slate-700 flex items-center justify-center gap-2 transition-all hover:bg-slate-200 border border-slate-300 bg-white">
                     <UserCircle2 size={16} /> View Full Medical Profile
                  </Link>
                )}

               <div className="mt-auto">
                 {sos.status === 'pending' ? (
                   <button onClick={() => updateStatus(sos.id, 'accepted')} className="w-full py-2.5 rounded-lg text-[13px] font-bold text-white transition-opacity hover:opacity-90 flex justify-center items-center gap-2" style={{ background: '#DC2626' }}>
                     Accept & Dispatch Ambulance <Truck size={16} />
                   </button>
                 ) : (
                   <div className="flex gap-2">
                     {sos.status === 'accepted' && <button onClick={() => updateStatus(sos.id, 'dispatched')} className="flex-1 py-2 rounded-lg text-[12px] font-bold text-white" style={{ background: '#F59E0B' }}>Mark Dispatched</button>}
                     {sos.status === 'dispatched' && <button onClick={() => updateStatus(sos.id, 'arrived')} className="flex-1 py-2 rounded-lg text-[12px] font-bold text-white" style={{ background: '#0891B2' }}>Ambulance Arrived</button>}
                     {sos.status === 'arrived' && <button onClick={() => updateStatus(sos.id, 'resolved')} className="flex-1 py-2 rounded-lg text-[12px] font-bold text-white" style={{ background: '#10B981' }}>Resolve Case ✅</button>}
                   </div>
                 )}
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
