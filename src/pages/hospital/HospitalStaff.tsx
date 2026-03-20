import { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, Edit2, X, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { HospitalProfile } from '@/hooks/useHospitalContext';

type RoleFilter = 'All' | 'Doctor' | 'Nurse' | 'Support Staff' | 'On Duty' | 'By Shift';

const roleColors: Record<string, string> = {
  Doctor: '#0891B2', Nurse: '#F59E0B', Technician: '#64748B',
  'Support Staff': '#94A3B8', 'Admin Staff': '#64748B',
  Pharmacist: '#10B981', Paramedic: '#EF4444',
};

const roles = ['Doctor', 'Nurse', 'Technician', 'Support Staff', 'Admin Staff', 'Pharmacist', 'Paramedic'];
const shifts = ['Morning', 'Afternoon', 'Night', 'Rotating'];

const emptyForm = { full_name: '', role: 'Doctor', specialization: '', registration_no: '', phone: '', email: '', shift: 'Morning', joined_date: '' };

const HospitalStaff = () => {
  const { hospital } = useOutletContext<{ hospital: HospitalProfile | null }>();
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RoleFilter>('All');
  const [shiftFilter, setShiftFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchStaff = async () => {
    if (!hospital) return;
    const { data } = await supabase.from('hospital_staff').select('*').eq('hospital_id', hospital.id).order('role').order('full_name');
    setStaff(data || []);
  };

  useEffect(() => { fetchStaff(); }, [hospital]);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setPhotoFile(null); setShowModal(true); };
  const openEdit = (s: any) => {
    setEditingId(s.id);
    setForm({ full_name: s.full_name, role: s.role, specialization: s.specialization || '', registration_no: s.registration_no || '', phone: s.phone || '', email: s.email || '', shift: s.shift || 'Morning', joined_date: s.joined_date || '' });
    setPhotoFile(null);
    setShowModal(true);
  };

  const saveStaff = async () => {
    if (!hospital || !form.full_name || !form.role) return;
    setSaving(true);
    let photo_url: string | undefined;

    if (photoFile) {
      const path = `staff/${hospital.id}/${editingId || 'new'}_${Date.now()}.jpg`;
      const { error: ue } = await supabase.storage.from('hospital-staff-photos').upload(path, photoFile);
      if (!ue) {
        const { data: urlData } = supabase.storage.from('hospital-staff-photos').getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }
    }

    const payload: any = {
      full_name: form.full_name, role: form.role,
      specialization: form.specialization || null,
      registration_no: form.registration_no || null,
      phone: form.phone || null, email: form.email || null,
      shift: form.shift, joined_date: form.joined_date || null,
    };
    if (photo_url) payload.photo_url = photo_url;

    if (editingId) {
      const { error } = await supabase.from('hospital_staff').update(payload).eq('id', editingId);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); setSaving(false); return; }
      toast({ title: `${form.full_name} updated` });
    } else {
      payload.hospital_id = hospital.id;
      const { error } = await supabase.from('hospital_staff').insert(payload);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); setSaving(false); return; }
      toast({ title: `${form.full_name} added to staff roster` });
    }
    setSaving(false);
    setShowModal(false);
    fetchStaff();
  };

  const toggleDuty = async (s: any) => {
    await supabase.from('hospital_staff').update({ is_on_duty: !s.is_on_duty }).eq('id', s.id);
    toast({ title: `${s.full_name} is now ${!s.is_on_duty ? 'On Duty' : 'Off Duty'}` });
    fetchStaff();
  };

  const filtered = staff.filter(s => {
    if (filter === 'On Duty' && !s.is_on_duty) return false;
    if (filter === 'By Shift' && shiftFilter && s.shift !== shiftFilter) return false;
    if (filter === 'Doctor' && s.role !== 'Doctor') return false;
    if (filter === 'Nurse' && s.role !== 'Nurse') return false;
    if (filter === 'Support Staff' && !['Support Staff', 'Admin Staff', 'Technician', 'Pharmacist', 'Paramedic'].includes(s.role)) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.full_name.toLowerCase().includes(q) || (s.specialization || '').toLowerCase().includes(q) || (s.registration_no || '').toLowerCase().includes(q);
    }
    return true;
  });

  const tabs: RoleFilter[] = ['All', 'Doctor', 'Nurse', 'Support Staff', 'On Duty', 'By Shift'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Staff Roster</h1>
        <Button onClick={openAdd} className="text-[13px]" style={{ background: '#F59E0B', color: '#fff' }}>
          <Plus size={16} /> Add Staff Member
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
          <Input placeholder="Search by name, specialization, or reg number..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-[13px]" style={{ borderColor: '#E2EEF1' }} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap"
              style={{ background: filter === t ? '#FFFBEB' : 'transparent', color: filter === t ? '#F59E0B' : '#64748B', border: filter === t ? '1px solid #F59E0B' : '1px solid transparent' }}>
              {t}
            </button>
          ))}
          {filter === 'By Shift' && (
            <select value={shiftFilter} onChange={e => setShiftFilter(e.target.value)} className="text-[12px] rounded-full border px-2 py-1" style={{ borderColor: '#F59E0B' }}>
              <option value="">All Shifts</option>
              {shifts.map(s => <option key={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border p-8 text-center" style={{ borderColor: '#E2EEF1' }}>
            <p className="text-[14px] italic" style={{ color: '#64748B' }}>No staff members found.</p>
          </div>
        ) : filtered.map(s => {
          const archColor = s.role === 'Doctor' ? '#0891B2' : s.role === 'Nurse' ? '#F59E0B' : '#94A3B8';
          return (
            <div key={s.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all" style={{ borderColor: '#E2EEF1' }}>
              <JharokhaArch color={archColor} opacity={0.18} />
              <div className="p-4 text-center">
                {s.photo_url ? (
                  <img src={s.photo_url} alt={s.full_name} className="w-14 h-14 rounded-full mx-auto mb-2 object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-[16px] font-bold text-white" style={{ background: roleColors[s.role] || '#64748B' }}>
                    {s.full_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <p className="text-[15px] font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>{s.full_name}</p>
                <p className="text-[12px] mb-1" style={{ color: roleColors[s.role] }}>🩺 {s.role}{s.specialization ? ` · ${s.specialization}` : ''}</p>
                {s.registration_no && <p className="text-[11px]" style={{ color: '#64748B' }}>Reg: {s.registration_no}</p>}
                {s.phone && <p className="text-[11px]" style={{ color: '#64748B' }}>📞 {s.phone}</p>}
                <p className="text-[11px] mt-1" style={{ color: '#64748B' }}>Shift: {s.shift || '—'}</p>
                <div className="flex items-center justify-center gap-3 mt-3">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{
                    background: s.is_on_duty ? '#F0FDF4' : '#F1F5F9',
                    color: s.is_on_duty ? '#059669' : '#64748B',
                  }}>
                    {s.is_on_duty ? '🟢 On Duty' : '⚫ Off Duty'}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-gray-100" title="Edit">
                    <Edit2 size={14} style={{ color: '#0891B2' }} />
                  </button>
                  <button onClick={() => toggleDuty(s)} className="p-1.5 rounded hover:bg-gray-100" title="Toggle Duty">
                    <RefreshCw size={14} style={{ color: '#F59E0B' }} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="bg-white rounded-xl w-[480px] max-w-[95vw] max-h-[90vh] overflow-y-auto" style={{ border: '1px solid #E2EEF1' }}>
            <JharokhaArch color="#0891B2" opacity={0.18} />
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                  {editingId ? 'Edit Staff Member' : 'Add Staff Member'}
                </h2>
                <button onClick={() => setShowModal(false)}><X size={18} style={{ color: '#64748B' }} /></button>
              </div>

              <div className="space-y-3">
                <Input placeholder="Full Name *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="text-[13px]" />
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full text-[13px] rounded-md border px-3 py-2" style={{ borderColor: '#E2EEF1' }}>
                  {roles.map(r => <option key={r}>{r}</option>)}
                </select>
                {(form.role === 'Doctor') && (
                  <Input placeholder="Specialization" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} className="text-[13px]" />
                )}
                {(form.role === 'Doctor' || form.role === 'Nurse') && (
                  <Input placeholder="Registration No." value={form.registration_no} onChange={e => setForm({ ...form, registration_no: e.target.value })} className="text-[13px]" />
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="text-[13px]" />
                  <Input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="text-[13px]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })} className="text-[13px] rounded-md border px-3 py-2" style={{ borderColor: '#E2EEF1' }}>
                    {shifts.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <Input type="date" placeholder="Joined Date" value={form.joined_date} onChange={e => setForm({ ...form, joined_date: e.target.value })} className="text-[13px]" />
                </div>

                <div>
                  <label className="text-[12px] mb-1 block" style={{ color: '#64748B' }}>Profile Photo</label>
                  <input ref={fileRef} type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="text-[13px]" />
                </div>
              </div>

              <Button onClick={saveStaff} disabled={saving} className="w-full text-[13px]" style={{ background: '#F59E0B', color: '#fff' }}>
                {saving ? 'Saving...' : editingId ? 'Update Staff Member' : 'Save Staff Member'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalStaff;
