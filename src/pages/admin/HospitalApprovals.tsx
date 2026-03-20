import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendNotification } from '@/hooks/useNotifications';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Search, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  Pending: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', label: '⏳ Pending' },
  Verified: { bg: '#F0FDF4', color: '#059669', border: '#A7F3D0', label: '✅ Verified' },
  Rejected: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: '❌ Rejected' },
};

const INDIAN_STATES = ['All States', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh'];

const REJECT_REASONS = [
  'Invalid or expired license document',
  'License ID does not match records',
  'Incomplete information submitted',
  'Duplicate registration detected',
  'Facility does not meet minimum requirements',
  'Other',
];

const HospitalApprovals = () => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All States');
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchHospitals = async () => {
    let query = supabase.from('hospitals').select('*').order('registered_at', { ascending: false });
    if (statusFilter !== 'All') query = query.eq('verification_status', statusFilter);
    if (stateFilter !== 'All States') query = query.eq('state', stateFilter);
    const { data } = await query;
    setHospitals(data || []);
  };

  useEffect(() => { fetchHospitals(); }, [statusFilter, stateFilter]);

  const filtered = hospitals.filter((h) => {
    const q = search.toLowerCase();
    return !q || h.hospital_name?.toLowerCase().includes(q) || h.city?.toLowerCase().includes(q) || h.license_id?.toLowerCase().includes(q);
  });

  const openDrawer = (h: any) => { setSelectedHospital(h); setDrawerOpen(true); };

  const handleVerify = async () => {
    if (!selectedHospital) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('hospitals').update({ verification_status: 'Verified' }).eq('id', selectedHospital.id);
    await supabase.from('admin_logs').insert([{ admin_user_id: user!.id, action: 'HOSPITAL_VERIFIED', target_type: 'hospital', target_id: selectedHospital.id, notes: 'Verified by admin' }]);
    // Notify hospital
    if (selectedHospital.supabase_user_id) {
      await sendNotification({
        recipientUserId: selectedHospital.supabase_user_id,
        recipientType: 'hospital',
        title: '✅ Hospital Verified!',
        body: `Congratulations! ${selectedHospital.hospital_name} has been verified by admin. You can now access your full dashboard.`,
        type: 'approval',
      });
    }
    toast.success(`✅ ${selectedHospital.hospital_name} has been verified.`);
    setVerifyModalOpen(false);
    setDrawerOpen(false);
    setLoading(false);
    fetchHospitals();
  };

  const handleReject = async () => {
    if (!selectedHospital || !rejectReason) { toast.error('Please select a reason'); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const notes = rejectReason === 'Other' ? rejectNotes : rejectReason;
    await supabase.from('hospitals').update({ verification_status: 'Rejected' }).eq('id', selectedHospital.id);
    await supabase.from('admin_logs').insert([{ admin_user_id: user!.id, action: 'HOSPITAL_REJECTED', target_type: 'hospital', target_id: selectedHospital.id, notes }]);
    // Notify hospital
    if (selectedHospital.supabase_user_id) {
      await sendNotification({
        recipientUserId: selectedHospital.supabase_user_id,
        recipientType: 'hospital',
        title: '❌ Application Rejected',
        body: `Your registration for ${selectedHospital.hospital_name} was rejected. Reason: ${notes}. Please contact support.`,
        type: 'alert',
      });
    }
    toast.error(`❌ ${selectedHospital.hospital_name} has been rejected.`);
    setRejectModalOpen(false);
    setRejectReason('');
    setRejectNotes('');
    setDrawerOpen(false);
    setLoading(false);
    fetchHospitals();
  };

  const statusBadge = (status: string) => {
    const s = STATUS_STYLES[status] || STATUS_STYLES.Pending;
    return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</span>;
  };

  const sh = selectedHospital;

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="bg-white rounded-xl p-4 flex flex-col md:flex-row gap-3" style={{ border: '1px solid #E2EEF1' }}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by hospital name, city, or license ID..." className="field-input pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', 'Pending', 'Verified', 'Rejected'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className="px-4 py-2 rounded-full text-[12px] font-medium transition-all"
              style={{ background: statusFilter === s ? '#0891B2' : 'transparent', color: statusFilter === s ? '#fff' : '#64748B', border: `1px solid ${statusFilter === s ? '#0891B2' : '#E2EEF1'}` }}>
              {s}
            </button>
          ))}
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="field-input text-[12px] w-auto px-3 py-2">
            {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#0891B2" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2EEF1' }}>
                {['#', 'Hospital', 'Location', 'Type', 'Beds', 'Doctors', 'Registered', 'Status', 'Actions'].map((col) => (
                  <th key={col} className="text-left px-4 py-3 font-medium" style={{ color: '#64748B' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((h, i) => (
                <tr key={h.id} className="hover:bg-gray-50/50 transition-colors" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td className="px-4 py-3" style={{ color: '#94A3B8' }}>{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold" style={{ color: '#1E293B' }}>{h.hospital_name}</p>
                    <p className="text-[11px]" style={{ color: '#94A3B8' }}>{h.license_id}</p>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#64748B' }}>{h.city}, {h.state}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[11px]" style={{ background: '#F1F5F9', color: '#64748B' }}>{h.facility_type || '—'}</span></td>
                  <td className="px-4 py-3" style={{ color: '#64748B' }}>{h.total_beds || 0}</td>
                  <td className="px-4 py-3" style={{ color: '#64748B' }}>{h.total_doctors || 0}</td>
                  <td className="px-4 py-3" style={{ color: '#64748B' }}>{h.registered_at ? formatDistanceToNow(new Date(h.registered_at), { addSuffix: true }) : '—'}</td>
                  <td className="px-4 py-3">{statusBadge(h.verification_status)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openDrawer(h)} className="px-3 py-1.5 rounded-md text-[12px] font-medium" style={{ border: '1px solid #0891B2', color: '#0891B2' }}>
                      View Details & Certificate
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8" style={{ color: '#94A3B8' }}>No hospitals found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-[520px] overflow-y-auto p-0" style={{ background: '#FFFFFF' }}>
          {sh && (
            <>
              <JharokhaArch color="#0891B2" />
              <SheetHeader className="px-6 pt-4 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: '#0891B2' }}>
                    {sh.hospital_name?.charAt(0)}
                  </div>
                  <div>
                    <SheetTitle className="text-lg" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>{sh.hospital_name}</SheetTitle>
                    <div className="mt-1">{statusBadge(sh.verification_status)}</div>
                  </div>
                </div>
              </SheetHeader>

              <div className="px-6 pb-6">
                <Tabs defaultValue="overview" className="mt-4">
                  <TabsList className="w-full justify-start bg-transparent border-b rounded-none" style={{ borderColor: '#E2EEF1' }}>
                    {['Overview', 'Staff', 'Treatments', 'Documents', 'Admin'].map((t) => (
                      <TabsTrigger key={t} value={t.toLowerCase()} className="text-[12px] data-[state=active]:shadow-none data-[state=active]:border-b-2 rounded-none pb-2" style={{ borderColor: '#0891B2' }}>{t}</TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="overview" className="mt-4 space-y-3 text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {[
                      ['Hospital Name', sh.hospital_name],
                      ['License ID', sh.license_id],
                      ['Facility Type', sh.facility_type],
                      ['Year Established', sh.year_established],
                      ['Address', sh.address],
                      ['City / State / PIN', `${sh.city || ''}, ${sh.state || ''} ${sh.pin_code || ''}`],
                      ['Phone', sh.phone],
                      ['Emergency Helpline', sh.emergency_helpline],
                      ['Email', sh.email],
                      ['Website', sh.website],
                    ].map(([label, val]) => (
                      <div key={label as string} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>{label}</span>
                        <span className="font-medium text-right" style={{ color: '#1E293B' }}>{val || '—'}</span>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="staff" className="mt-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        ['Doctors', sh.total_doctors],
                        ['Nurses', sh.total_nurses],
                        ['Support Staff', sh.support_staff],
                        ['Total Beds', sh.total_beds],
                        ['ICU Beds', sh.icu_beds],
                        ['General Ward', sh.general_ward_beds],
                        ['Private Rooms', sh.private_rooms],
                        ['OTs', sh.operation_theatres],
                        ['Ambulances', sh.ambulances],
                      ].map(([label, val]) => (
                        <div key={label as string} className="p-3 rounded-lg" style={{ background: '#F7FBFC', border: '1px solid #E2EEF1' }}>
                          <p className="text-lg font-bold" style={{ color: '#0891B2' }}>{val || 0}</p>
                          <p className="text-[11px]" style={{ color: '#64748B' }}>{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 space-y-2 text-[13px]">
                      {[['24/7 Emergency', sh.emergency_24x7], ['Blood Bank', sh.blood_bank], ['Pharmacy', sh.pharmacy]].map(([label, val]) => (
                        <div key={label as string} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <span style={{ color: '#64748B' }}>{label}</span>
                          <span style={{ color: val ? '#10B981' : '#94A3B8' }}>{val ? '✅ Yes' : '— No'}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="treatments" className="mt-4">
                    <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: '#0891B2', letterSpacing: '0.1em' }}>Specializations</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(sh.specializations || []).map((s: string) => <span key={s} className="chip-tag">{s}</span>)}
                      {!(sh.specializations?.length) && <span className="text-[13px]" style={{ color: '#94A3B8' }}>None listed</span>}
                    </div>
                    <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: '#F59E0B', letterSpacing: '0.1em' }}>Custom Specializations</p>
                    <div className="flex flex-wrap gap-2">
                      {(sh.custom_specializations || []).map((s: string) => <span key={s} className="chip-tag-gold">{s}</span>)}
                      {!(sh.custom_specializations?.length) && <span className="text-[13px]" style={{ color: '#94A3B8' }}>None listed</span>}
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="mt-4 space-y-4 text-[13px]">
                    <div>
                      <p className="font-medium mb-1" style={{ color: '#1E293B' }}>License Document</p>
                      {sh.license_document_url ? (
                        <a href={sh.license_document_url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium" style={{ color: '#0891B2' }}>View Document →</a>
                      ) : <p className="italic" style={{ color: '#94A3B8' }}>No document uploaded</p>}
                    </div>
                    <div>
                      <p className="font-medium mb-1" style={{ color: '#1E293B' }}>Hospital Logo</p>
                      {sh.logo_url ? <img src={sh.logo_url} alt="Logo" className="w-20 h-20 rounded-lg object-cover" style={{ border: '1px solid #E2EEF1' }} /> : <p className="italic" style={{ color: '#94A3B8' }}>No logo uploaded</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="admin" className="mt-4 space-y-3 text-[13px]">
                    {[
                      ['Admin Name', sh.admin_name],
                      ['Designation', sh.admin_designation],
                      ['Admin Email', sh.admin_email],
                      ['Registered', sh.registered_at ? format(new Date(sh.registered_at), 'dd MMM yyyy, h:mm a') : '—'],
                    ].map(([label, val]) => (
                      <div key={label as string} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>{label}</span>
                        <span className="font-medium" style={{ color: '#1E293B' }}>{val || '—'}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ color: '#64748B' }}>User ID</span>
                      <code className="text-[11px] px-2 py-0.5 rounded" style={{ background: '#F1F5F9', color: '#64748B' }}>{sh.supabase_user_id}</code>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Action buttons */}
                {sh.verification_status === 'Pending' && (
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setVerifyModalOpen(true)} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white" style={{ background: '#10B981' }}>✅ Verify Hospital</button>
                    <button onClick={() => setRejectModalOpen(true)} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white" style={{ background: '#EF4444' }}>❌ Reject Application</button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Verify Modal */}
      {verifyModalOpen && sh && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="bg-white rounded-xl w-full max-w-[400px] mx-4 overflow-hidden">
            <JharokhaArch color="#10B981" />
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl" style={{ background: '#F0FDF4' }}>✅</div>
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Verify this Hospital?</h3>
              <p className="text-[13px] mb-6" style={{ color: '#64748B' }}>{sh.hospital_name} will be marked as Verified.</p>
              <button onClick={handleVerify} disabled={loading} className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white mb-2 disabled:opacity-50" style={{ background: '#10B981' }}>Yes, Verify</button>
              <button onClick={() => setVerifyModalOpen(false)} className="w-full py-2.5 rounded-lg text-[13px] font-medium" style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && sh && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="bg-white rounded-xl w-full max-w-[440px] mx-4 overflow-hidden">
            <JharokhaArch color="#EF4444" />
            <div className="p-6">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl" style={{ background: '#FEF2F2' }}>❌</div>
              <h3 className="text-lg font-bold text-center mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Reject this Application?</h3>
              <p className="text-[13px] text-center mb-4" style={{ color: '#64748B' }}>Please provide a reason for rejecting {sh.hospital_name}.</p>
              <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="field-input mb-3 text-[13px]">
                <option value="">Select reason...</option>
                {REJECT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {rejectReason === 'Other' && (
                <textarea value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value.slice(0, 500))} placeholder="Describe the reason..." className="field-input mb-1 text-[13px]" rows={3} />
              )}
              <button onClick={handleReject} disabled={loading || !rejectReason} className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white mb-2 disabled:opacity-50 mt-3" style={{ background: '#EF4444' }}>Confirm Rejection</button>
              <button onClick={() => { setRejectModalOpen(false); setRejectReason(''); setRejectNotes(''); }} className="w-full py-2.5 rounded-lg text-[13px] font-medium" style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalApprovals;
