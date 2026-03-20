import { useEffect, useState } from 'react';
import { usePatientContext } from '@/hooks/usePatientContext';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { FileText, Plus, Search, Eye, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const REPORT_TYPES = ['Blood', 'Urine', 'X-Ray', 'CT/MRI', 'Ultrasound', 'Pathology', 'ECG', 'Discharge Summary', 'Other'];

const PatientReports = () => {
  const { patient } = usePatientContext();
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const fetchReports = async () => {
    let q = supabase.from('patient_reports').select('*').eq('patient_id', patient.id).order('report_date', { ascending: false });
    if (filter !== 'All') q = q.eq('report_type', filter);
    const { data } = await q;
    setReports(data || []);
  };

  useEffect(() => { fetchReports(); }, [patient.id, filter]);

  const filtered = reports.filter(r =>
    !search || r.report_name?.toLowerCase().includes(search.toLowerCase()) || r.doctor_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this report?')) return;
    await supabase.from('patient_reports').delete().eq('id', id);
    toast.success('Report deleted');
    fetchReports();
  };

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="bg-white rounded-lg p-4 flex flex-col md:flex-row gap-3" style={{ border: '1px solid #E2EEF1' }}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5" style={{ color: '#94A3B8' }} />
          <input className="field-input pl-9" placeholder="Search reports by type, date, or doctor..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1">
          {['All', ...REPORT_TYPES].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={{
                background: filter === t ? '#0891B2' : 'transparent',
                color: filter === t ? '#fff' : '#64748B',
                border: filter === t ? 'none' : '1px solid #E2EEF1',
              }}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-[13px] font-semibold text-white shrink-0" style={{ background: '#0891B2' }}>
          <Plus size={14} /> Upload Report
        </button>
      </div>

      {/* Reports grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center" style={{ border: '1px solid #E2EEF1' }}>
          <FileText size={40} className="mx-auto mb-3" style={{ color: '#D1EBF1' }} />
          <p className="text-[14px] font-medium" style={{ color: '#94A3B8' }}>No reports found.</p>
          <button onClick={() => setShowUpload(true)} className="text-[13px] font-medium mt-2" style={{ color: '#0891B2' }}>Upload your first report →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow" style={{ border: '1px solid #E2EEF1' }}>
              <JharokhaArch color="#F59E0B" opacity={0.18} />
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <FileText size={28} style={{ color: r.file_type === 'pdf' ? '#EF4444' : '#0891B2' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold truncate" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>{r.report_name}</p>
                    <p className="text-[12px]" style={{ color: '#64748B' }}>{r.report_type}</p>
                  </div>
                </div>
                {r.hospital_name && <p className="text-[12px] mb-0.5" style={{ color: '#64748B' }}>🏥 {r.hospital_name}</p>}
                {r.doctor_name && <p className="text-[12px] mb-0.5" style={{ color: '#64748B' }}>👨‍⚕️ {r.doctor_name}</p>}
                {r.report_date && <p className="text-[12px] mb-1" style={{ color: '#64748B' }}>📅 {format(new Date(r.report_date), 'dd MMM yyyy')}</p>}
                {r.is_abnormal ? (
                  <span className="text-[11px] font-bold" style={{ color: '#EF4444' }}>🔴 Abnormal</span>
                ) : (
                  <span className="text-[11px] font-bold" style={{ color: '#10B981' }}>🟢 Normal</span>
                )}

                <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
                  {r.file_url ? (
                    <>
                      <button onClick={() => window.open(r.file_url, '_blank')} className="flex items-center gap-1 text-[12px] font-medium" style={{ color: '#0891B2' }}>
                        <Eye size={12} /> View
                      </button>
                      <a href={r.file_url} download className="flex items-center gap-1 text-[12px] font-medium" style={{ color: '#64748B' }}>
                        <Download size={12} /> Download
                      </a>
                    </>
                  ) : (
                    <span className="text-[12px] italic mt-0.5" style={{ color: '#94A3B8' }}>No file attached</span>
                  )}
                  <button onClick={() => handleDelete(r.id)} className="flex items-center gap-1 text-[12px] font-medium ml-auto" style={{ color: '#EF4444' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && <UploadReportModal patientId={patient.id} onClose={() => setShowUpload(false)} onSaved={() => { setShowUpload(false); fetchReports(); }} />}
    </div>
  );
};

const UploadReportModal = ({ patientId, onClose, onSaved }: { patientId: string; onClose: () => void; onSaved: () => void }) => {
  const [form, setForm] = useState({ report_type: '', report_name: '', report_date: '', doctor_name: '', hospital_name: '', notes: '' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    if (!form.report_type || !form.report_name) { toast.error('Report type and name are required'); return; }
    setUploading(true);
    try {
      let fileUrl = '';
      let fileType = '';
      if (file) {
        const path = `reports/${patientId}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from('patient-documents').upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = await supabase.storage.from('patient-documents').createSignedUrl(path, 3600 * 24 * 365);
        fileUrl = urlData?.signedUrl || '';
        fileType = file.name.split('.').pop()?.toLowerCase() || '';
      }
      await supabase.from('patient_reports').insert([{ ...form, patient_id: patientId, file_url: fileUrl, file_type: fileType }]);
      toast.success('Report uploaded');
      onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-[520px] w-full max-h-[90vh] overflow-y-auto" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#F59E0B" opacity={0.18} />
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Upload Report</h3>

          <div className="space-y-3">
            <div>
              <label className="field-label">Report Type *</label>
              <select className="field-input" value={form.report_type} onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))}>
                <option value="">Select type...</option>
                {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Report Name *</label>
              <input className="field-input" value={form.report_name} onChange={e => setForm(f => ({ ...f, report_name: e.target.value }))} placeholder="e.g. Complete Blood Count" />
            </div>
            <div>
              <label className="field-label">Report Date</label>
              <input className="field-input" type="date" value={form.report_date} onChange={e => setForm(f => ({ ...f, report_date: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Doctor Name</label>
              <input className="field-input" value={form.doctor_name} onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Hospital Name</label>
              <input className="field-input" value={form.hospital_name} onChange={e => setForm(f => ({ ...f, hospital_name: e.target.value }))} />
            </div>

            <div>
              <label className="field-label">Upload File</label>
              <div className="upload-zone" style={{ borderColor: '#F59E0B40' }}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                {file ? (
                  <p className="text-[13px] font-medium" style={{ color: '#1E293B' }}>📎 {file.name}</p>
                ) : (
                  <p className="text-[13px]" style={{ color: '#94A3B8' }}>Drag and drop or click to upload (PDF, JPG, PNG · Max 10MB)</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={uploading}
              className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: '#0891B2' }}>
              {uploading ? 'Uploading...' : 'Save Report'}
            </button>
            <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-[13px] font-medium" style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientReports;
