import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import type { HospitalProfile } from '@/hooks/useHospitalContext';

const statusColors: Record<string, { bg: string; border: string }> = {
  Available: { bg: '#F0FDF4', border: '#10B981' },
  Occupied: { bg: '#FEF2F2', border: '#EF4444' },
  Reserved: { bg: '#FFFBEB', border: '#F59E0B' },
  'Under Maintenance': { bg: '#F1F5F9', border: '#94A3B8' },
};

const HospitalBeds = () => {
  const { hospital } = useOutletContext<{ hospital: HospitalProfile | null }>();
  const [beds, setBeds] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ward_name: '', bed_number: '', bed_type: 'General', notes: '' });

  const fetchBeds = async () => {
    if (!hospital) return;
    const { data } = await supabase.from('hospital_beds').select('*').eq('hospital_id', hospital.id).order('ward_name').order('bed_number');
    setBeds(data || []);
  };

  useEffect(() => { fetchBeds(); }, [hospital]);

  useEffect(() => {
    if (!hospital) return;
    const ch = supabase.channel('beds-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hospital_beds', filter: `hospital_id=eq.${hospital.id}` }, (payload) => {
        // Update only the changed bed — no full refetch
        if (payload.eventType === 'UPDATE' && payload.new) {
          setBeds(prev => prev.map(b => b.id === (payload.new as any).id ? payload.new : b));
        } else {
          fetchBeds();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [hospital]);

  const addBed = async () => {
    if (!hospital || !form.ward_name || !form.bed_number) return;
    const { error } = await supabase.from('hospital_beds').insert({ hospital_id: hospital.id, ...form });
    if (error) { toast.error(error.message); return; }
    toast.success('Bed added');
    setForm({ ward_name: '', bed_number: '', bed_type: 'General', notes: '' });
    setShowAdd(false);
    fetchBeds();
  };

  const wardMap = beds.reduce((acc: Record<string, any[]>, bed) => {
    const w = bed.ward_name || 'Unknown';
    if (!acc[w]) acc[w] = [];
    acc[w].push(bed);
    return acc;
  }, {});

  const summary = {
    total: beds.length,
    available: beds.filter(b => b.status === 'Available').length,
    occupied: beds.filter(b => b.status === 'Occupied').length,
    reserved: beds.filter(b => b.status === 'Reserved').length,
    maintenance: beds.filter(b => b.status === 'Under Maintenance').length,
  };
  const occupancy = summary.total > 0 ? Math.round((summary.occupied / summary.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Bed Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowAdd(!showAdd)} className="text-[13px]" style={{ background: '#0891B2', color: '#fff' }}>
            <Plus size={16} /> Add Bed
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-3 text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        <span className="px-3 py-1.5 rounded-full" style={{ background: '#F7FBFC', border: '1px solid #E2EEF1', color: '#1E293B' }}>Total: {summary.total}</span>
        <span className="px-3 py-1.5 rounded-full" style={{ background: '#F0FDF4', color: '#059669' }}>Available: {summary.available}</span>
        <span className="px-3 py-1.5 rounded-full" style={{ background: '#FEF2F2', color: '#DC2626' }}>Occupied: {summary.occupied}</span>
        <span className="px-3 py-1.5 rounded-full" style={{ background: '#FFFBEB', color: '#D97706' }}>Reserved: {summary.reserved}</span>
        <span className="px-3 py-1.5 rounded-full" style={{ background: '#F1F5F9', color: '#64748B' }}>Maintenance: {summary.maintenance}</span>
        <span className="px-3 py-1.5 rounded-full font-semibold" style={{
          background: occupancy > 85 ? '#FEF2F2' : occupancy > 60 ? '#FFFBEB' : '#F0FDF4',
          color: occupancy > 85 ? '#DC2626' : occupancy > 60 ? '#D97706' : '#059669'
        }}>{occupancy}% occupied</span>
      </div>

      {/* Add Bed Form */}
      {showAdd && (
        <div className="bg-white rounded-xl border p-5 space-y-3" style={{ borderColor: '#E2EEF1' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input placeholder="Ward Name" value={form.ward_name} onChange={e => setForm({ ...form, ward_name: e.target.value })} className="text-[13px]" />
            <Input placeholder="Bed Number" value={form.bed_number} onChange={e => setForm({ ...form, bed_number: e.target.value })} className="text-[13px]" />
            <select value={form.bed_type} onChange={e => setForm({ ...form, bed_type: e.target.value })} className="text-[13px] rounded-md border px-3 py-2" style={{ borderColor: '#E2EEF1' }}>
              {['ICU', 'General', 'Private', 'Semi-Private', 'Emergency', 'Pediatric', 'Maternity'].map(t => <option key={t}>{t}</option>)}
            </select>
            <Button onClick={addBed} className="text-[13px]" style={{ background: '#F59E0B', color: '#fff' }}>Save</Button>
          </div>
        </div>
      )}

      {/* Ward Grids */}
      {Object.keys(wardMap).length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: '#E2EEF1' }}>
          <p className="text-[14px]" style={{ color: '#64748B' }}>No beds configured. Click "Add Bed" to get started.</p>
        </div>
      ) : (
        Object.entries(wardMap).map(([ward, wardBeds]) => {
          const typedBeds = wardBeds as any[];
          const wardOccupied = typedBeds.filter(b => b.status === 'Occupied').length;
          const wardAvail = typedBeds.filter(b => b.status === 'Available').length;
          const wardPct = typedBeds.length > 0 ? Math.round((wardOccupied / typedBeds.length) * 100) : 0;
          return (
            <div key={ward} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2EEF1' }}>
              <JharokhaArch color="#F59E0B" opacity={0.18} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[15px] font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                    {ward}
                    <span className="ml-2 text-[12px] font-normal" style={{ color: '#64748B' }}>
                      ({typedBeds.length} beds · {wardOccupied} occupied · {wardAvail} available)
                    </span>
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{
                    background: wardPct > 80 ? '#FEF2F2' : '#F0FDF4',
                    color: wardPct > 80 ? '#DC2626' : '#059669'
                  }}>{wardPct}%</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {typedBeds.map((bed: any) => {
                    const sc = statusColors[bed.status] || statusColors.Available;
                    return (
                      <div key={bed.id} className="w-14 h-14 rounded-lg flex flex-col items-center justify-center text-[10px] font-medium border-2 cursor-pointer hover:shadow-sm transition-all"
                        style={{ background: sc.bg, borderColor: sc.border }} title={`${bed.bed_number} — ${bed.status}${bed.patient_id ? ' (Patient assigned)' : ''}`}>
                        <span style={{ color: sc.border }}>{bed.bed_number}</span>
                        {bed.status === 'Occupied' && (
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white mt-0.5" style={{ background: '#0891B2' }}>P</span>
                        )}
                        {bed.status !== 'Occupied' && <span className="text-[8px]" style={{ color: '#64748B' }}>{bed.bed_type}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default HospitalBeds;
