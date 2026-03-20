import { useEffect, useState } from 'react';
import { usePatientContext } from '@/hooks/usePatientContext';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Search, MapPin, Phone, Pill, ChevronRight, Globe, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const PatientFindPharma = () => {
  const { patient } = usePatientContext();
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('All Areas');
  const [loading, setLoading] = useState(true);
  const [selectedPharma, setSelectedPharma] = useState<any>(null);
  const [uniqueAreas, setUniqueAreas] = useState<string[]>(['All Areas']);

  // Since we don't have a 'pharmacies' table yet, we'll mock some data 
  // but also try to fetch from auth metadata if possible (complex in client-side)
  // For now, let's create a robust UI that will work once the table exists.
  
  const fetchPharmacies = async () => {
    setLoading(true);
    let q = (supabase as any).from('pharmacies').select('*');
    if (areaFilter !== 'All Areas') {
      q = q.or(`city.eq.${areaFilter},district.eq.${areaFilter},state.eq.${areaFilter}`);
    }
    const { data } = await q;

    // Use mock data if no real data is found yet (since we just added the table schema)
    const mockPharmacies = [
      { id: '1', pharmacy_name: 'City Care Pharmacy', city: 'Jaipur', state: 'Rajasthan', phone: '9876543210', address: '123 Main St, C-Scheme', open_24x7: true, delivery: true },
      { id: '2', pharmacy_name: 'Wellness Medicos', city: 'Ahmedabad', state: 'Gujarat', phone: '9822334455', address: 'Satellite Area', open_24x7: false, delivery: true },
      { id: '3', pharmacy_name: 'Sanjeevani Pharma', city: 'Surat', state: 'Gujarat', phone: '9988776655', address: 'Varachha Road', open_24x7: true, delivery: false },
    ];
    
    let allP = (data && data.length > 0) ? data : mockPharmacies;
    
    if (areaFilter === 'All Areas' && uniqueAreas.length === 1) {
      const areas = Array.from(new Set(allP.map((p: any) => p.district || p.city || p.state).filter(Boolean))) as string[];
      setUniqueAreas(['All Areas', ...areas]);
    }

    if (areaFilter !== 'All Areas' && (!data || data.length === 0)) {
       allP = allP.filter(p => p.district === areaFilter || p.city === areaFilter || p.state === areaFilter);
    }

    if (search) {
      allP = allP.filter(p => 
        p.pharmacy_name?.toLowerCase().includes(search.toLowerCase()) || 
        p.city?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setPharmacies(allP);
    setLoading(false);
  };

  useEffect(() => { fetchPharmacies(); }, [search, areaFilter]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-5 shadow-sm" style={{ border: '1px solid #E2EEF1' }}>
        <h2 className="text-lg font-bold mb-3" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
          💊 Find Pharmacies & Medicines
        </h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5" style={{ color: '#94A3B8' }} />
            <input className="field-input pl-9" placeholder="Search by pharmacy name, city..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="w-[180px]">
            <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="field-input">
              {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <p className="text-[12px] mt-2" style={{ color: '#94A3B8' }}>
          Connect with trusted pharmacies in your area.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin" style={{ color: '#8B5CF6' }} />
        </div>
      ) : pharmacies.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center" style={{ border: '1px solid #E2EEF1' }}>
          <Pill size={40} className="mx-auto mb-3" style={{ color: '#DDD6FE' }} />
          <p className="text-[14px]" style={{ color: '#94A3B8' }}>No pharmacies found in this area.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pharmacies.map(p => (
            <div key={p.id}
              onClick={() => setSelectedPharma(p)}
              className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
              style={{ border: '1px solid #E2EEF1' }}>
              <JharokhaArch color="#8B5CF6" opacity={0.18} />
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: '#F5F3FF' }}>
                    <Pill size={20} style={{ color: '#8B5CF6' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold truncate group-hover:text-[#8B5CF6] transition-colors" style={{ color: '#1E293B' }}>{p.pharmacy_name}</p>
                    <div className="flex gap-2 mt-1">
                      {p.open_24x7 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#F5F3FF', color: '#8B5CF6' }}>24/7</span>
                      )}
                      {p.delivery && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#F0FDF4', color: '#059669' }}>Home Delivery</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-[12px]" style={{ color: '#64748B' }}>
                  <p className="flex items-center gap-1"><MapPin size={12} /> {p.city}, {p.state}</p>
                  <p className="flex items-center gap-1 truncate"><MapPin size={12} className="opacity-0" /> {p.address}</p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
                  <span className="flex items-center gap-1 text-[12px] font-bold" style={{ color: '#8B5CF6' }}>
                    <Phone size={12} /> {p.phone}
                  </span>
                  <span className="flex items-center gap-1 text-[12px] font-medium ml-auto" style={{ color: '#8B5CF6' }}>
                    View & Order <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPharma && (
        <PharmaDetailModal 
          pharma={selectedPharma} 
          onClose={() => setSelectedPharma(null)} 
        />
      )}
    </div>
  );
};

const PharmaDetailModal = ({ pharma, onClose }: { pharma: any; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-[500px] w-full shadow-2xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#8B5CF6" opacity={0.18} />
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#F5F3FF]">
                <Pill size={24} style={{ color: '#8B5CF6' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: '#1E293B' }}>{pharma.pharmacy_name}</h3>
                <p className="text-sm" style={{ color: '#64748B' }}>{pharma.city}, {pharma.state}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">X</button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2EEF1]">
              <p className="text-xs font-semibold text-[#64748B] mb-1">📍 Address</p>
              <p className="text-sm text-[#1E293B]">{pharma.address}</p>
            </div>
            
            <div className="flex gap-2">
              <a href={`tel:${pharma.phone}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#8B5CF6] text-white text-sm font-semibold">
                <Phone size={16} /> Call Now
              </a>
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#8B5CF6] text-[#8B5CF6] text-sm font-semibold">
                <MessageSquare size={16} /> Message
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F1F5F9]">
            <h4 className="text-sm font-bold text-[#1E293B] mb-3">Upload Prescription</h4>
            <div className="border-2 border-dashed border-[#DDD6FE] rounded-xl p-8 text-center bg-[#F5F3FF] cursor-pointer hover:bg-[#EDE9FE] transition-colors">
              <Globe size={32} className="mx-auto mb-2 text-[#8B5CF6] opacity-40" />
              <p className="text-xs font-medium text-[#8B5CF6]">Click to upload prescription for quick ordering</p>
              <p className="text-[10px] text-[#94A3B8] mt-1">Supports JPG, PNG, PDF</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientFindPharma;
