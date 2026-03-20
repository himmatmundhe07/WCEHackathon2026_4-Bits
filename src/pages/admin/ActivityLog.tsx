import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Search, Download } from 'lucide-react';
import { format } from 'date-fns';

const ActivityLog = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const PAGE_SIZE = 20;

  const fetchLogs = async () => {
    let query = supabase.from('admin_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (actionFilter === 'Verified') query = query.eq('action', 'HOSPITAL_VERIFIED');
    if (actionFilter === 'Rejected') query = query.eq('action', 'HOSPITAL_REJECTED');
    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    const { data, count } = await query;
    setLogs(data || []);
    setTotalCount(count || 0);
  };

  useEffect(() => { fetchLogs(); }, [page, actionFilter]);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.notes?.toLowerCase().includes(q) || l.action?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const exportCSV = () => {
    const headers = ['Timestamp', 'Action', 'Target Type', 'Target ID', 'Notes'];
    const rows = filtered.map((l) => [
      l.created_at ? format(new Date(l.created_at), 'yyyy-MM-dd HH:mm:ss') : '',
      l.action, l.target_type || '', l.target_id || '', l.notes || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'admin_logs.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const actionBadge = (action: string) => {
    const isVerified = action?.includes('VERIFIED');
    const isRejected = action?.includes('REJECTED');
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium"
        style={{
          background: isVerified ? '#F0FDF4' : isRejected ? '#FEF2F2' : '#FFFBEB',
          color: isVerified ? '#059669' : isRejected ? '#DC2626' : '#D97706',
          border: `1px solid ${isVerified ? '#A7F3D0' : isRejected ? '#FECACA' : '#FDE68A'}`,
        }}>
        {action?.replace('HOSPITAL_', '')}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 flex flex-col md:flex-row gap-3" style={{ border: '1px solid #E2EEF1' }}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by action or notes..." className="field-input pl-9" />
        </div>
        <div className="flex gap-2">
          {['All', 'Verified', 'Rejected'].map((f) => (
            <button key={f} onClick={() => { setActionFilter(f); setPage(0); }} className="px-4 py-2 rounded-full text-[12px] font-medium transition-all"
              style={{ background: actionFilter === f ? '#0891B2' : 'transparent', color: actionFilter === f ? '#fff' : '#64748B', border: `1px solid ${actionFilter === f ? '#0891B2' : '#E2EEF1'}` }}>
              {f}
            </button>
          ))}
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-medium" style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#64748B" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2EEF1' }}>
                {['Timestamp', 'Action', 'Target', 'Notes'].map((col) => (
                  <th key={col} className="text-left px-4 py-3 font-medium" style={{ color: '#64748B' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td className="px-4 py-3" style={{ color: '#1E293B' }}>{l.created_at ? format(new Date(l.created_at), 'dd MMM yyyy, h:mm a') : '—'}</td>
                  <td className="px-4 py-3">{actionBadge(l.action)}</td>
                  <td className="px-4 py-3" style={{ color: '#64748B' }}>
                    {l.target_type || '—'}
                    {l.target_id && <code className="ml-1 text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#F1F5F9' }}>{l.target_id.slice(0, 8)}...</code>}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#64748B' }}>{l.notes || '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="text-center py-8" style={{ color: '#94A3B8' }}>No activity logs</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 text-[13px]" style={{ borderTop: '1px solid #E2EEF1' }}>
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1 rounded-md disabled:opacity-40" style={{ color: '#0891B2' }}>Previous</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} className="w-8 h-8 rounded-md font-medium" style={{ background: page === i ? '#0891B2' : 'transparent', color: page === i ? '#fff' : '#64748B' }}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-3 py-1 rounded-md disabled:opacity-40" style={{ color: '#0891B2' }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
