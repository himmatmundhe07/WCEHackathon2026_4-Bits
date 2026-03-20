import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { HospitalProfile } from '@/hooks/useHospitalContext';
import { 
  HeartHandshake, Search, MapPin, AlertCircle, 
  Activity, CheckCircle, Droplet, Users, ShieldCheck, Plus, X
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

export default function HospitalBloodNetwork() {
  const { hospital } = useOutletContext<{ hospital: HospitalProfile | null }>();
  const [activeTab, setActiveTab] = useState<'feed' | 'myRequests'>('myRequests');
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // New Request Form State
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    patient_name: '',
    blood_group: '',
    urgency: 'High',
    units_needed: 1,
    contact_number: (hospital as any)?.contact_number || (hospital as any)?.admin_phone || ''
  });

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
    
    const channel = supabase.channel('hospital-blood-network')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blood_requests' }, () => {
         fetchRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCreateRequest = async () => {
    if (!newRequest.blood_group || !newRequest.patient_name || !hospital) {
        toast.error("Please fill all required fields");
        return;
    }

    try {
      const { error } = await (supabase as any).from('blood_requests').insert({
        patient_id: null, // Broadcasted by Hospital directly
        patient_name: newRequest.patient_name,
        blood_group: newRequest.blood_group,
        hospital_name: hospital.hospital_name,
        city: hospital.city || 'Local',
        urgency: newRequest.urgency,
        units_needed: newRequest.units_needed,
        contact_number: newRequest.contact_number,
        status: 'Open'
      });

      if (error) throw error;
      
      toast.success("Emergency Blood Request Broadcasted to network!");
      setShowRequestForm(false);
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('does not exist')) {
          toast.error("Database table missing! Please run the SQL command provided by the Assistant.");
      } else {
          toast.error("Failed to broadcast request.");
      }
    }
  };

  const markResolved = async (id: string) => {
    try {
      const { error } = await (supabase as any).from('blood_requests').update({ status: 'Fulfilled' }).eq('id', id);
      if (error) throw error;
      toast.success("Request marked as fulfilled!");
      fetchRequests();
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const filteredFeed = requests.filter(r => 
    r.status === 'Open' && r.hospital_name !== hospital?.hospital_name &&
    (r.city.toLowerCase().includes(searchQuery.toLowerCase()) || 
     r.hospital_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     r.blood_group.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const myRequestsList = requests.filter(r => r.hospital_name === hospital?.hospital_name);

  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-[#E2EEF1] gap-4">
         <div>
            <h1 className="text-2xl font-black flex items-center gap-3 text-slate-800">
              <Droplet className="text-red-500 fill-red-100" size={28} /> Automated Blood Network
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Broadcast severe blood shortages to community donors instantly.</p>
         </div>
         <button 
           onClick={() => setShowRequestForm(true)}
           className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 w-full md:w-auto"
         >
           <AlertCircle size={18} /> Broadcast Critical Shortage
         </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 bg-white rounded-3xl shadow-sm border border-[#E2EEF1] flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-[#E2EEF1]">
             <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-2 px-2">Management</h3>
             <nav className="space-y-1">
               <button 
                onClick={() => setActiveTab('myRequests')}
                className={`w-full flex justify-between items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'myRequests' ? 'bg-[#EBF7FA] text-[#0891B2]' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span className="flex items-center gap-2"><Activity size={16}/> Our Broadcasts</span>
              </button>
               <button 
                 onClick={() => setActiveTab('feed')}
                 className={`w-full flex justify-between items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'feed' ? 'bg-[#EBF7FA] text-[#0891B2]' : 'text-slate-600 hover:bg-slate-50'}`}
               >
                 <span className="flex items-center gap-2"><MapPin size={16}/> Neighboring Hospitals</span>
               </button>
             </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-[#E2EEF1] overflow-hidden flex flex-col relative min-h-0">
           
           {/* MY REQUESTS VIEW */}
           {activeTab === 'myRequests' && (
             <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-800 mb-6 px-2">Active Shortages Broadcasted</h2>
                <div className="grid gap-4">
                 {myRequestsList.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-[#E2EEF1]">
                      <HeartHandshake className="mx-auto text-slate-200 mb-4" size={48} />
                      <p className="text-slate-400 font-medium tracking-wide">No active blood shortages at this facility.</p>
                      <button onClick={() => setShowRequestForm(true)} className="mt-4 text-[#0891B2] font-bold text-sm bg-white border border-[#E2EEF1] px-4 py-2 rounded-xl">Create Urgent Request</button>
                    </div>
                  ) : (
                   myRequestsList.map(req => (
                      <div key={req.id} className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
                             <span className="text-2xl font-black text-red-600">{req.blood_group}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                             <h4 className="font-bold text-lg text-slate-800">For Patient: {req.patient_name}</h4>
                             <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${req.status === 'Open' ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                               {req.status}
                             </span>
                            </div>
                           <p className="text-sm text-slate-500 font-medium">Require {req.units_needed} Unit(s) • Broadcasted {new Date(req.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {req.status === 'Open' && (
                           <button onClick={() => markResolved(req.id)} className="px-5 py-2.5 border-2 border-[#E2EEF1] text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm shrink-0 flex items-center gap-2 justify-center">
                              Mark as Fulfilled & Stop Feed <CheckCircle size={16}/>
                           </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
             </div>
           )}

           {/* FEED VIEW (Neighboring Hospitals) */}
           {activeTab === 'feed' && (
             <div className="flex-1 flex flex-col min-h-0">
               <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                 <div className="relative flex-1">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                     type="text" placeholder="Search neighboring hospitals..." 
                     className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 ring-red-500 outline-none transition-all text-sm font-medium"
                     value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                   />
                 </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                 {loading ? (
                    <div className="col-span-full flex justify-center py-20 text-slate-400 font-bold animate-pulse">Loading neighboring hospital requests...</div>
                 ) : filteredFeed.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                       <ShieldCheck size={64} className="text-slate-200 mb-4" />
                       <h3 className="text-lg font-bold text-slate-700">No Nearby Shortages</h3>
                       <p className="text-slate-500 text-sm max-w-sm mt-2">No other hospitals in your region have reported critical blood shortages today.</p>
                    </div>
                 ) : (
                   filteredFeed.map(req => (
                     <div key={req.id} className={`p-5 rounded-2xl border-2 border-slate-100 transition-all group`}>
                       <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                              {req.hospital_name}
                            </h3>
                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><Users size={14}/> Patient: {req.patient_name}</p>
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
                       </div>

                       <div className="pt-4 border-t border-slate-200/50 flex flex-col sm:flex-row items-center gap-3">
                          <a href={`tel:${req.contact_number}`} className="flex-1 w-full py-2.5 rounded-xl font-bold bg-[#0891B2] text-white text-sm hover:bg-[#067A99] transition-all text-center">
                             Contact Hospital Admin
                          </a>
                       </div>
                     </div>
                   ))
                 )}
               </div>
             </div>
           )}

        </div>
      </div>

      {/* NEW REQUEST MODAL */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header Strip */}
            <div className="bg-gradient-to-r from-red-600 to-rose-500 px-6 py-4 flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                  <Activity size={120} />
               </div>
               <div className="relative z-10 flex items-center gap-3">
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                   <Droplet size={20} className="text-white fill-white" />
                 </div>
                 <div>
                   <h3 className="text-lg font-black text-white">Broadcast Blood Shortage</h3>
                   <p className="text-red-100 text-xs font-medium">Alert active donors in the Sanjeevani Network</p>
                 </div>
               </div>
               <button onClick={() => setShowRequestForm(false)} className="relative z-10 p-2 bg-black/10 text-white rounded-full hover:bg-black/20 backdrop-blur-sm transition-all">
                 <X size={18}/>
               </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 bg-slate-50/50">
              {/* Patient Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"><Users size={14} className="text-slate-400"/> Patient Alias (For Records)</label>
                <input 
                  type="text" placeholder="e.g. John Doe / Room 402"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm font-medium text-slate-800 shadow-sm transition-all"
                  value={newRequest.patient_name} onChange={(e) => setNewRequest({...newRequest, patient_name: e.target.value})}
                />
              </div>

              {/* Blood Type & Units grid */}
              <div className="grid grid-cols-2 gap-5">
                 <div>
                   <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"><Droplet size={14} className="text-slate-400"/> Blood Type Needed</label>
                   <div className="relative">
                     <select 
                       className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm font-bold text-slate-800 shadow-sm transition-all appearance-none cursor-pointer"
                       value={newRequest.blood_group}
                       onChange={(e) => setNewRequest({...newRequest, blood_group: e.target.value})}
                     >
                       <option value="" disabled>Select Type</option>
                       {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                     </select>
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                       <span className="text-slate-400 text-[10px] font-black">▼</span>
                     </div>
                   </div>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"><Activity size={14} className="text-slate-400"/> Units Required</label>
                   <div className="relative flex items-center">
                     <button onClick={() => setNewRequest(p => ({...p, units_needed: Math.max(1, p.units_needed - 1)}))} className="absolute left-1 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600 font-black">-</button>
                     <input type="number" min="1" max="50"
                       className="w-full py-3 px-10 text-center bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-base font-black text-slate-800 shadow-sm transition-all"
                       value={newRequest.units_needed} onChange={(e) => setNewRequest({...newRequest, units_needed: parseInt(e.target.value)||1})}
                     />
                     <button onClick={() => setNewRequest(p => ({...p, units_needed: Math.min(50, p.units_needed + 1)}))} className="absolute right-1 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600 font-black">+</button>
                   </div>
                 </div>
              </div>

              {/* Contact */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"><AlertCircle size={14} className="text-slate-400"/> Blood Bank Contact No.</label>
                <div className="flex relative">
                   <div className="absolute left-0 top-0 bottom-0 px-4 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl flex items-center justify-center text-sm font-bold text-slate-500">+91</div>
                   <input 
                     type="text" placeholder="Phone Number"
                     className="w-full pl-16 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm font-medium text-slate-800 shadow-sm transition-all"
                     value={newRequest.contact_number} onChange={(e) => setNewRequest({...newRequest, contact_number: e.target.value})}
                   />
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">Urgency Level</label>
                <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
                  {['High', 'Critical'].map(level => (
                    <button 
                      key={level}
                      onClick={() => setNewRequest({...newRequest, urgency: level as any})}
                      className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${
                        newRequest.urgency === level 
                          ? level === 'Critical' ? 'bg-red-600 text-white shadow-md' : 'bg-orange-500 text-white shadow-md'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {level} Urgency
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-3">
                 <button onClick={() => setShowRequestForm(false)} className="px-6 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm">
                   Cancel
                 </button>
                 <button 
                   onClick={handleCreateRequest}
                   className="flex-1 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-black shadow-lg shadow-red-200 hover:from-red-700 hover:to-rose-700 transition-all text-sm flex items-center justify-center gap-2"
                 >
                   <MapPin size={16}/> Broadcast Global SOS
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
