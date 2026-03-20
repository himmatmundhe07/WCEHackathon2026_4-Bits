import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Eye, Download, Trash2, AlertTriangle, FileText, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, addDays, isBefore } from 'date-fns';
import type { HospitalProfile } from '@/hooks/useHospitalContext';

type DocFilter = 'All' | 'License' | 'Accreditation' | 'NABH Certificate' | 'Fire NOC' | 'Insurance' | 'Expiring';

const docTypes = ['License', 'Accreditation', 'NABH Certificate', 'Fire NOC', 'Pollution Certificate', 'Insurance', 'Staff Certificate', 'Other'];

const getDocStatus = (doc: any) => {
  if (!doc.expiry_date) return { label: '🟢 Valid', bg: '#F0FDF4', color: '#059669', archColor: '#F59E0B' };
  if (isBefore(new Date(doc.expiry_date), new Date())) return { label: '🔴 Expired', bg: '#FEF2F2', color: '#DC2626', archColor: '#EF4444' };
  if (isBefore(new Date(doc.expiry_date), addDays(new Date(), 60))) return { label: '🟡 Expiring Soon', bg: '#FFFBEB', color: '#D97706', archColor: '#F59E0B' };
  return { label: '🟢 Valid', bg: '#F0FDF4', color: '#059669', archColor: '#F59E0B' };
};

const HospitalDocuments = () => {
  const { hospital } = useOutletContext<{ hospital: HospitalProfile | null }>();
  const [docs, setDocs] = useState<any[]>([]);
  const [filter, setFilter] = useState<DocFilter>('All');
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ doc_name: '', doc_type: 'License', issued_by: '', issue_date: '', expiry_date: '' });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchDocs = async () => {
    if (!hospital) return;
    const { data } = await supabase.from('hospital_documents').select('*').eq('hospital_id', hospital.id).order('expiry_date');
    setDocs(data || []);
  };

  useEffect(() => { fetchDocs(); }, [hospital]);

  const expiringCount = docs.filter(d => d.expiry_date && isBefore(new Date(d.expiry_date), addDays(new Date(), 60))).length;

  const upload = async () => {
    if (!hospital || !form.doc_name) return;
    setSaving(true);
    let file_url = null;
    if (file) {
      const path = `${hospital.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('hospital-documents').upload(path, file);
      if (error) { toast({ title: 'Upload error', description: error.message, variant: 'destructive' }); setSaving(false); return; }
      file_url = path;
    }
    const { error } = await supabase.from('hospital_documents').insert({
      hospital_id: hospital.id, doc_name: form.doc_name, doc_type: form.doc_type,
      issued_by: form.issued_by || null, issue_date: form.issue_date || null,
      expiry_date: form.expiry_date || null, file_url,
    });
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `📄 ${form.doc_name} uploaded successfully` });
    setForm({ doc_name: '', doc_type: 'License', issued_by: '', issue_date: '', expiry_date: '' });
    setFile(null); setShowUpload(false); fetchDocs();
  };

  const viewDoc = async (doc: any) => {
    if (!doc.file_url) { toast({ title: 'No file attached', variant: 'destructive' }); return; }
    const { data, error } = await supabase.storage.from('hospital-documents').createSignedUrl(doc.file_url, 3600);
    if (error || !data) { toast({ title: 'Error generating URL', variant: 'destructive' }); return; }
    window.open(data.signedUrl, '_blank');
  };

  const deleteDoc = async (doc: any) => {
    if (!confirm(`Delete "${doc.doc_name}"?`)) return;
    if (doc.file_url) await supabase.storage.from('hospital-documents').remove([doc.file_url]);
    await supabase.from('hospital_documents').delete().eq('id', doc.id);
    toast({ title: 'Document deleted' }); fetchDocs();
  };

  const filtered = docs.filter(d => {
    if (filter === 'Expiring') return d.expiry_date && isBefore(new Date(d.expiry_date), addDays(new Date(), 60));
    if (filter !== 'All' && d.doc_type !== filter) return false;
    return true;
  });

  const tabs: DocFilter[] = ['All', 'License', 'Accreditation', 'NABH Certificate', 'Fire NOC', 'Insurance', 'Expiring'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Document Vault</h1>
        <Button onClick={() => setShowUpload(true)} className="text-[13px]" style={{ background: '#F59E0B', color: '#fff' }}>
          <Plus size={16} /> Upload Document
        </Button>
      </div>

      {expiringCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <AlertTriangle size={16} style={{ color: '#DC2626' }} />
          <span className="text-[13px] font-medium" style={{ color: '#991B1B' }}>🔴 {expiringCount} documents expire within 60 days. Renew them to stay compliant.</span>
          <button onClick={() => setFilter('Expiring')} className="ml-auto text-[12px] font-medium" style={{ color: '#DC2626' }}>View Expiring</button>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap"
            style={{ background: filter === t ? '#FFFBEB' : 'transparent', color: filter === t ? '#F59E0B' : '#64748B', border: filter === t ? '1px solid #F59E0B' : '1px solid transparent' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="bg-white rounded-xl w-[480px] max-w-[95vw]" style={{ border: '1px solid #E2EEF1' }}>
            <JharokhaArch color="#F59E0B" opacity={0.18} />
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Upload Document</h2>
                <button onClick={() => setShowUpload(false)}><X size={18} style={{ color: '#64748B' }} /></button>
              </div>
              <div className="space-y-3">
                <Input placeholder="Document Name *" value={form.doc_name} onChange={e => setForm({ ...form, doc_name: e.target.value })} className="text-[13px]" />
                <select value={form.doc_type} onChange={e => setForm({ ...form, doc_type: e.target.value })} className="w-full text-[13px] rounded-md border px-3 py-2" style={{ borderColor: '#E2EEF1' }}>
                  {docTypes.map(t => <option key={t}>{t}</option>)}
                </select>
                <Input placeholder="Issued By" value={form.issued_by} onChange={e => setForm({ ...form, issued_by: e.target.value })} className="text-[13px]" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] mb-0.5 block" style={{ color: '#64748B' }}>Issue Date</label>
                    <Input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} className="text-[13px]" />
                  </div>
                  <div>
                    <label className="text-[11px] mb-0.5 block" style={{ color: '#64748B' }}>Expiry Date</label>
                    <Input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} className="text-[13px]" />
                    {form.expiry_date && isBefore(new Date(form.expiry_date), addDays(new Date(), 60)) && (
                      <p className="text-[10px] mt-0.5" style={{ color: '#D97706' }}>⚠️ Expires within 60 days</p>
                    )}
                  </div>
                </div>
                <Input type="file" accept=".pdf,.jpg,.png" onChange={e => setFile(e.target.files?.[0] || null)} className="text-[13px]" />
              </div>
              <Button onClick={upload} disabled={saving} className="w-full text-[13px]" style={{ background: '#F59E0B', color: '#fff' }}>
                {saving ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border p-8 text-center" style={{ borderColor: '#E2EEF1' }}>
            <p className="text-[14px] italic" style={{ color: '#64748B' }}>No documents found.</p>
          </div>
        ) : filtered.map(d => {
          const st = getDocStatus(d);
          return (
            <div key={d.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all" style={{ borderColor: '#E2EEF1' }}>
              <JharokhaArch color={st.archColor} opacity={st.archColor === '#EF4444' ? 0.2 : 0.18} />
              <div className="p-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: '#F7FBFC' }}>
                  <FileText size={20} style={{ color: '#0891B2' }} />
                </div>
                <p className="text-[15px] font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>{d.doc_name}</p>
                <span className="inline-block mb-2 px-1.5 py-0.5 rounded text-[11px]" style={{ background: '#EBF7FA', color: '#0891B2' }}>{d.doc_type}</span>
                <p className="text-[12px]" style={{ color: '#64748B' }}>Issued by: {d.issued_by || '—'}</p>
                {d.issue_date && <p className="text-[12px]" style={{ color: '#64748B' }}>Issue: {format(new Date(d.issue_date), 'dd MMM yyyy')}</p>}
                {d.expiry_date && (
                  <p className="text-[12px] font-medium" style={{ color: st.color }}>
                    Expiry: {format(new Date(d.expiry_date), 'dd MMM yyyy')}
                  </p>
                )}
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>

                <div className="flex gap-1 mt-3">
                  <button onClick={() => viewDoc(d)} className="p-1.5 rounded hover:bg-gray-100" title="View"><Eye size={14} style={{ color: '#0891B2' }} /></button>
                  <button onClick={() => viewDoc(d)} className="p-1.5 rounded hover:bg-gray-100" title="Download"><Download size={14} style={{ color: '#F59E0B' }} /></button>
                  <button onClick={() => deleteDoc(d)} className="p-1.5 rounded hover:bg-gray-100" title="Delete"><Trash2 size={14} style={{ color: '#EF4444' }} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HospitalDocuments;
