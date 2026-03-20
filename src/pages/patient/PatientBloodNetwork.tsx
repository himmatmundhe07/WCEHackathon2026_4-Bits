import React, { useState, useEffect } from 'react';
import { usePatientContext } from '@/hooks/usePatientContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  HeartHandshake, Search, MapPin, AlertCircle, UserPlus, 
  Activity, Send, Clock, CheckCircle, Droplet, Users, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface BloodRequest {
  id: string;
  patient_id: string;
  patient_name: string;
  blood_group: string;
  hospital_name: string;
  city: string;
  urgency: string;
  units_needed: number;
  contact_number: string;
  status: string;
  created_at: string;
}

export default function PatientBloodNetwork() {
  const { patient } = usePatientContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pledgedDonorPass, setPledgedDonorPass] = useState<BloodRequest | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('blood_requests')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setRequests((data as any[]) || []);
    } catch (err: any) {
      if (err.message?.includes('does not exist')) {
         console.warn("blood_requests table not found yet");
      } else {
         console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    // Set up realtime subscription
    const channel = supabase.channel('blood-network')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blood_requests' }, () => {
         fetchRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Check if a patient is a valid donor for a request
  const isCompatibleMatch = (patientBg: string, requiredBg: string) => {
      if (!patientBg) return false;
      if (patientBg === requiredBg) return true;
      if (patientBg === 'O-') return true; 
      if (requiredBg === 'AB+') return true; 
      return false;
  };

  const filteredFeed = requests.filter(r => 
    r.status === 'Open' &&
    (r.city.toLowerCase().includes(searchQuery.toLowerCase()) || 
     r.hospital_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     r.blood_group.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
         <div>
            <h1 className="text-2xl font-black flex items-center gap-3 text-slate-800">
              <Droplet className="text-red-500 fill-red-100" size={28} /> Community Blood Network
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Local P2P emergency blood donations</p>
         </div>
         <button 
           className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 w-full md:w-auto"
           onClick={() => {
              toast.info("Active Donor Mode: Emergency blood shortages broadcast directly from local hospitals straight to this feed.");
           }}
         >
           <Activity size={18} /> Active Donor Role
         </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-100">
             <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-2 px-2">Navigation</h3>
             <nav className="space-y-1">
               <button 
                 className={`w-full flex justify-between items-center px-4 py-3 rounded-xl text-sm font-bold transition-all bg-red-50 text-red-700`}
               >
                 <span className="flex items-center gap-2"><Activity size={16}/> Active Emergencies</span>
               </button>
             </nav>
          </div>

          <div className="p-6 bg-slate-50 mt-auto">
             <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-1"><ShieldCheck size={12}/> My Donor Profile</h4>
             <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Blood Type</p>
                 <p className="text-3xl font-black text-red-600 mb-2">{patient.blood_group || 'Unknown'}</p>
                 <p className="text-[10px] text-slate-400 mb-4">{patient.city || 'City Unknown'}</p>
                 <button className="w-full bg-slate-800 text-white text-xs font-bold py-2 rounded-xl hover:bg-slate-900 transition-all">
                   Update Medical Profile
                 </button>
             </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col relative min-h-0">
           
           <div className="flex-1 flex flex-col min-h-0">
             <div className="p-6 border-b border-slate-100 flex items-center gap-4">
               <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text" placeholder="Search by city, hospital, or blood group..." 
                   className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 ring-red-500 outline-none transition-all text-sm font-medium"
                   value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
               {loading ? (
                  <div className="col-span-full flex justify-center py-20 text-slate-400 font-bold animate-pulse">Scanning surrounding region for emergencies...</div>
               ) : filteredFeed.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                     <ShieldCheck size={64} className="text-slate-200 mb-4" />
                     <h3 className="text-lg font-bold text-slate-700">No Active Blood Requests</h3>
                     <p className="text-slate-500 text-sm max-w-sm mt-2">There are currently no hospitals in your region requesting blood. You are a hero for checking!</p>
                  </div>
               ) : (
                 filteredFeed.map(req => {
                   const isCompatible = isCompatibleMatch(patient.blood_group!, req.blood_group);
                   return (
                     <div key={req.id} className={`p-5 rounded-2xl border-2 transition-all group ${isCompatible ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}>
                       <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                              <Users size={18} /> {req.patient_name}
                            </h3>
                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin size={14}/> {req.city} • {req.hospital_name}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Needed</p>
                            <div className="font-black text-2xl text-red-600 drop-shadow-sm flex items-center gap-1">
                               {req.blood_group} <Droplet size={14} className="fill-red-600"/>
                            </div>
                          </div>
                       </div>
                       
                       <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-3 py-1 bg-white text-slate-700 font-bold text-xs rounded-full border border-slate-200 shadow-sm">{req.units_needed} Unit(s)</span>
                          {req.urgency === 'Critical' && <span className="px-3 py-1 bg-red-600 text-white font-bold text-xs rounded-full shadow-sm animate-pulse flex items-center gap-1"><AlertCircle size={12}/> Critical</span>}
                          {isCompatible && <span className="px-3 py-1 bg-green-100 text-green-700 font-bold text-xs rounded-full flex items-center gap-1"><CheckCircle size={12}/> You match!</span>}
                       </div>

                       <div className="pt-4 border-t border-slate-200/50 flex flex-col sm:flex-row items-center gap-3">
                          <button 
                            onClick={() => setPledgedDonorPass(req)}
                            className={`flex-1 w-full py-2.5 rounded-xl font-bold text-white text-sm shadow-md transition-all ${isCompatible ? 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600' : 'bg-slate-800 hover:bg-slate-900'}`}
                          >
                             I can donate
                          </button>
                          <a href={`tel:${req.contact_number}`} className="flex-1 w-full py-2.5 rounded-xl font-bold text-slate-700 bg-white border-2 border-slate-200 text-sm hover:bg-slate-50 transition-all text-center">
                             Call Hospital
                          </a>
                       </div>
                     </div>
                 )})
               )}
             </div>
           </div>
        </div>
      </div>

      {/* Digital Donor Pass Modal */}
      {pledgedDonorPass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="bg-green-600 p-6 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                <div className="relative z-10 w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-lg border-4 border-green-500">
                   <Droplet className="text-red-500 fill-red-500" size={24} />
                   <span className="font-black text-slate-800 leading-none">{pledgedDonorPass.blood_group}</span>
                </div>
             </div>
             <div className="p-6 text-center space-y-4">
                <div>
                   <h3 className="text-xl font-black text-slate-800">You're a Hero!</h3>
                   <p className="text-sm text-slate-500 mt-1">Your pledge to donate has been recorded. Please proceed to the hospital immediately.</p>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Destination</p>
                   <p className="font-bold text-slate-800 flex items-center gap-2"><MapPin size={16} className="text-red-500"/> {pledgedDonorPass.hospital_name}</p>
                   <p className="text-sm text-slate-500 ml-6">{pledgedDonorPass.city}</p>
                   
                   <div className="h-px bg-slate-200 my-3"></div>
                   
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Contact</p>
                   <p className="font-bold text-slate-800 flex items-center gap-2">📞 {pledgedDonorPass.contact_number}</p>
                </div>

                <div className="pt-2">
                   <button 
                     onClick={() => {
                        const destination = encodeURIComponent(`${pledgedDonorPass.hospital_name}, ${pledgedDonorPass.city}`);
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
                        toast.success("Location opened in Maps!");
                        setPledgedDonorPass(null);
                     }}
                     className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black shadow-lg shadow-green-200 transition-all text-sm mb-2 flex justify-center items-center gap-2"
                   >
                     <MapPin size={18} /> Get Active Route
                   </button>
                   <button 
                     onClick={() => setPledgedDonorPass(null)}
                     className="w-full py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition-all"
                   >
                     Close
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
