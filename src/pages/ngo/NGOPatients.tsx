import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Eye, FileText, UserPlus, FileHeart } from 'lucide-react';
import { toast } from 'sonner';

const NGOPatients = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);

  // Form for NGO registering a new patient
  const [newPatient, setNewPatient] = useState({
    fullName: '',
    email: '',
    phone: '',
    bloodGroup: '',
    diagnosis: '',
    condition: 'Stable'
  });

  const fetchNGOPatients = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // For MVP: We fetch patients they have either sponsored OR we would typically map them in a join table
      // Let's create an 'ngo_managed_patients' table conceptually, or just save them with notes
      // We'll simulate fetching patients by looking for patients where the NGO helped them
      // In a real app, you'd add an NGO_ID to the `patients` table or an `ngo_patients` relation.
      
      // Let's fetch all patients for now but in a real-world scenario we'd filter by `ngo_id`
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10); // limited for demo purposes of the EHR system

      if (error) throw error;
      setPatients(data || []);
    } catch (e: any) {
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNGOPatients(); }, []);

  const handleRegisterPatient = async () => {
    if (!newPatient.fullName || !newPatient.email || !newPatient.phone) {
      toast.error('Name, Email, and Phone are required.');
      return;
    }
    setAdding(true);
    try {
      // Step 1: Create auth user
      const { data: fnData, error: fnError } = await supabase.functions.invoke('create-auth-user', {
        body: { email: newPatient.email, password: crypto.randomUUID(), metadata: { role: 'patient', full_name: newPatient.fullName } },
      });

      if (fnError || fnData?.error) {
        toast.error(fnData?.error || fnError?.message || 'Failed to create account');
        setAdding(false);
        return;
      }

      // Step 2: Insert patient
      const { error: patErr } = await supabase.from('patients').insert({
        full_name: newPatient.fullName,
        email: newPatient.email,
        phone: newPatient.phone,
        blood_group: newPatient.bloodGroup || null,
        supabase_user_id: fnData.userId,
      });

      if (patErr) throw patErr;

      toast.success('Patient registered successfully! They are now part of your NGO records.');
      setShowAddModal(false);
      fetchNGOPatients();
      setNewPatient({ fullName: '', email: '', phone: '', bloodGroup: '', diagnosis: '', condition: 'Stable' });
    } catch (e: any) {
      toast.error(e.message || 'Error registering patient');
    } finally {
      setAdding(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileHeart className="text-rose-600" /> My Patients (EHR)
          </h1>
          <p className="text-slate-500 text-sm">Manage and review medical records for patients supported by your NGO.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-rose-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Register Patient
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold">
              <tr>
                <th className="px-6 py-3">Patient Profile</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Blood Group</th>
                <th className="px-6 py-3">Record date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading your patients...</td></tr>
              ) : filteredPatients.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No patients found.</td></tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center font-bold text-rose-600 text-xs">
                          {p.full_name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{p.full_name}</p>
                          <p className="text-[11px] text-slate-500">ABHA: {p.abha_id || 'Not assigned'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <p>{p.email}</p>
                      <p className="text-[11px] text-slate-400">{p.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      {p.blood_group ? (
                        <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">
                          {p.blood_group}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="View Medical Record">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <UserPlus size={18} className="text-rose-600" /> Register Patient
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Full Name *</label>
                <input type="text" value={newPatient.fullName} onChange={e => setNewPatient({...newPatient, fullName: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-rose-400" placeholder="Patient's Full Name" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Email Address *</label>
                <input type="email" value={newPatient.email} onChange={e => setNewPatient({...newPatient, email: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-rose-400" placeholder="patient@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Phone Number *</label>
                  <input type="tel" value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-rose-400" placeholder="+91..." />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Blood Group</label>
                  <select value={newPatient.bloodGroup} onChange={e => setNewPatient({...newPatient, bloodGroup: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-rose-400 bg-white">
                    <option value="">Select...</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRegisterPatient}
                disabled={adding}
                className="flex-1 py-2 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
              >
                {adding ? <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"/> : 'Register Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NGOPatients;
