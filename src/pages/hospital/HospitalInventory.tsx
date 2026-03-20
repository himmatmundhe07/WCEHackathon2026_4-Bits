import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, AlertTriangle, Edit2, Trash2, Package, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, addDays, isBefore } from 'date-fns';
import type { HospitalProfile } from '@/hooks/useHospitalContext';

type CatFilter = 'All' | 'Medicine' | 'Equipment' | 'Consumable' | 'Blood Unit' | 'Vaccine' | 'Surgical Supply' | 'Low Stock' | 'Expiring Soon' | 'Out of Stock';

const categories = ['Medicine', 'Equipment', 'Consumable', 'Blood Unit', 'Vaccine', 'Surgical Supply'];

const getStatus = (item: any) => {
  if (item.quantity === 0) return { label: '❌ Out', key: 'out', bg: '#FEF2F2', color: '#DC2626' };
  if (item.quantity > 0 && item.quantity <= (item.min_threshold || 10)) return { label: '⚠️ Low', key: 'low', bg: '#FFFBEB', color: '#D97706' };
  if (item.expiry_date && isBefore(new Date(item.expiry_date), new Date())) return { label: '💀 Expired', key: 'expired', bg: '#FEF2F2', color: '#DC2626' };
  if (item.expiry_date && isBefore(new Date(item.expiry_date), addDays(new Date(), 30))) return { label: '🕐 Expiring', key: 'expiring', bg: '#FFFBEB', color: '#D97706' };
  return { label: '✅ OK', key: 'ok', bg: '#F0FDF4', color: '#059669' };
};

const HospitalInventory = () => {
  const { hospital } = useOutletContext<{ hospital: HospitalProfile | null }>();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CatFilter>('All');
  const [showModal, setShowModal] = useState(false);
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ item_name: '', category: 'Medicine', quantity: 0, unit: 'tablets', min_threshold: 10, supplier: '', expiry_date: '' });
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    if (!hospital) return;
    const { data } = await supabase.from('hospital_inventory').select('*').eq('hospital_id', hospital.id).order('item_name');
    setItems(data || []);
  };

  useEffect(() => { fetchItems(); }, [hospital]);

  const openAdd = () => { setEditingId(null); setForm({ item_name: '', category: 'Medicine', quantity: 0, unit: 'tablets', min_threshold: 10, supplier: '', expiry_date: '' }); setShowModal(true); };
  const openEdit = (i: any) => {
    setEditingId(i.id);
    setForm({ item_name: i.item_name, category: i.category || 'Medicine', quantity: i.quantity || 0, unit: i.unit || '', min_threshold: i.min_threshold || 10, supplier: i.supplier || '', expiry_date: i.expiry_date || '' });
    setShowModal(true);
  };

  const saveItem = async () => {
    if (!hospital || !form.item_name) return;
    setSaving(true);
    const payload: any = {
      item_name: form.item_name, category: form.category, quantity: form.quantity,
      unit: form.unit || null, min_threshold: form.min_threshold,
      supplier: form.supplier || null, expiry_date: form.expiry_date || null,
      last_restocked: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase.from('hospital_inventory').update(payload).eq('id', editingId);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); setSaving(false); return; }
      toast({ title: `${form.item_name} updated` });
    } else {
      payload.hospital_id = hospital.id;
      const { error } = await supabase.from('hospital_inventory').insert(payload);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); setSaving(false); return; }
      toast({ title: `${form.item_name} added to inventory` });
    }
    setSaving(false); setShowModal(false); fetchItems();
  };

  const doRestock = async () => {
    if (!restockId || restockQty <= 0) return;
    const item = items.find(i => i.id === restockId);
    const newQty = (item?.quantity || 0) + restockQty;
    await supabase.from('hospital_inventory').update({ quantity: newQty, last_restocked: new Date().toISOString() }).eq('id', restockId);
    toast({ title: `${item?.item_name} restocked. New quantity: ${newQty}` });
    setRestockId(null); setRestockQty(0); fetchItems();
  };

  const deleteItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (item && item.quantity > 0) { toast({ title: 'Cannot delete item with remaining stock', variant: 'destructive' }); return; }
    if (!confirm('Delete this item?')) return;
    await supabase.from('hospital_inventory').delete().eq('id', id);
    toast({ title: 'Item deleted' }); fetchItems();
  };

  const lowCount = items.filter(i => i.quantity <= (i.min_threshold || 10) || i.quantity === 0).length;
  const expiringCount = items.filter(i => i.expiry_date && isBefore(new Date(i.expiry_date), addDays(new Date(), 30))).length;

  const filtered = items.filter(i => {
    const st = getStatus(i);
    if (filter === 'Low Stock' && st.key !== 'low' && st.key !== 'out') return false;
    if (filter === 'Expiring Soon' && st.key !== 'expiring' && st.key !== 'expired') return false;
    if (filter === 'Out of Stock' && i.quantity !== 0) return false;
    if (!['All', 'Low Stock', 'Expiring Soon', 'Out of Stock'].includes(filter) && i.category !== filter) return false;
    if (search && !i.item_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const tabs: CatFilter[] = ['All', 'Medicine', 'Equipment', 'Consumable', 'Blood Unit', 'Vaccine', 'Low Stock', 'Expiring Soon', 'Out of Stock'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Inventory</h1>
        <Button onClick={openAdd} className="text-[13px]" style={{ background: '#F59E0B', color: '#fff' }}>
          <Plus size={16} /> Add Item
        </Button>
      </div>

      {(lowCount > 0 || expiringCount > 0) && (
        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <AlertTriangle size={16} style={{ color: '#D97706' }} />
          <span className="text-[13px] font-medium" style={{ color: '#92400E' }}>
            ⚠️ {lowCount > 0 ? `${lowCount} items low/out of stock` : ''}{lowCount > 0 && expiringCount > 0 ? ' · ' : ''}{expiringCount > 0 ? `${expiringCount} expiring soon` : ''}
          </span>
          <button onClick={() => setFilter('Low Stock')} className="ml-auto text-[12px] font-medium" style={{ color: '#D97706' }}>View Low Stock</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
          <Input placeholder="Search medicines, equipment, or supplies..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-[13px]" style={{ borderColor: '#E2EEF1' }} />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap"
              style={{ background: filter === t ? '#FFFBEB' : 'transparent', color: filter === t ? '#F59E0B' : '#64748B', border: filter === t ? '1px solid #F59E0B' : '1px solid transparent' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2EEF1' }}>
        <JharokhaArch color="#F59E0B" opacity={0.18} />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <thead>
              <tr style={{ background: '#F7FBFC', borderBottom: '1px solid #E2EEF1' }}>
                {['Item', 'Category', 'Qty', 'Unit', 'Threshold', 'Expiry', 'Supplier', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 italic" style={{ color: '#64748B' }}>No items found.</td></tr>
              ) : filtered.map(i => {
                const st = getStatus(i);
                return (
                  <tr key={i.id} style={{ borderBottom: '1px solid #E2EEF1' }} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium" style={{ color: '#1E293B' }}>{i.item_name}</td>
                    <td className="px-4 py-3" style={{ color: '#64748B' }}>{i.category}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#1E293B' }}>{i.quantity}</td>
                    <td className="px-4 py-3" style={{ color: '#64748B' }}>{i.unit || '—'}</td>
                    <td className="px-4 py-3" style={{ color: '#64748B' }}>{i.min_threshold}</td>
                    <td className="px-4 py-3" style={{ color: '#64748B' }}>{i.expiry_date ? format(new Date(i.expiry_date), 'dd MMM yyyy') : '—'}</td>
                    <td className="px-4 py-3" style={{ color: '#64748B' }}>{i.supplier || '—'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setRestockId(i.id); setRestockQty(0); }} className="p-1.5 rounded hover:bg-gray-100" title="Restock"><Package size={14} style={{ color: '#10B981' }} /></button>
                        <button onClick={() => openEdit(i)} className="p-1.5 rounded hover:bg-gray-100" title="Edit"><Edit2 size={14} style={{ color: '#0891B2' }} /></button>
                        <button onClick={() => deleteItem(i.id)} className="p-1.5 rounded hover:bg-gray-100" title="Delete" disabled={i.quantity > 0}><Trash2 size={14} style={{ color: i.quantity > 0 ? '#CBD5E1' : '#EF4444' }} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Mini-Modal */}
      {restockId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="bg-white rounded-xl w-[360px] p-6 space-y-4" style={{ border: '1px solid #E2EEF1' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold" style={{ color: '#1E293B' }}>Restock Item</h3>
              <button onClick={() => setRestockId(null)}><X size={16} style={{ color: '#64748B' }} /></button>
            </div>
            <p className="text-[13px]" style={{ color: '#64748B' }}>Current: {items.find(i => i.id === restockId)?.quantity || 0}</p>
            <Input type="number" placeholder="Add quantity" value={restockQty || ''} onChange={e => setRestockQty(+e.target.value)} className="text-[13px]" />
            <Button onClick={doRestock} className="w-full text-[13px]" style={{ background: '#F59E0B', color: '#fff' }}>Restock</Button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="bg-white rounded-xl w-[440px] max-w-[95vw] overflow-y-auto" style={{ border: '1px solid #E2EEF1' }}>
            <JharokhaArch color="#F59E0B" opacity={0.18} />
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                  {editingId ? 'Edit Item' : 'Add Item'}
                </h2>
                <button onClick={() => setShowModal(false)}><X size={18} style={{ color: '#64748B' }} /></button>
              </div>
              <div className="space-y-3">
                <Input placeholder="Item Name *" value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} className="text-[13px]" />
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full text-[13px] rounded-md border px-3 py-2" style={{ borderColor: '#E2EEF1' }}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Quantity" value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: +e.target.value })} className="text-[13px]" />
                  <Input placeholder="Unit (tablets, vials)" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="text-[13px]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Min Threshold" value={form.min_threshold || ''} onChange={e => setForm({ ...form, min_threshold: +e.target.value })} className="text-[13px]" />
                  <Input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} className="text-[13px]" />
                </div>
                <Input placeholder="Supplier" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className="text-[13px]" />
              </div>
              <Button onClick={saveItem} disabled={saving} className="w-full text-[13px]" style={{ background: '#F59E0B', color: '#fff' }}>
                {saving ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalInventory;
