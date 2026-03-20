import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import {
  Loader2, CheckCircle2, XCircle, RefreshCw, Search,
  Pill, ShieldCheck, Clock, Eye, X
} from 'lucide-react';
import { format, addYears } from 'date-fns';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface PharmaSub {
  id: string;
  pharmacy_id: string;
  plan_id: string;
  plan_name: string;
  amount_paid: number;
  payment_reference: string | null;
  payment_method: string | null;
  status: string;
  started_at: string | null;
  expires_at: string;
  activated_by: string | null;
  activated_at: string | null;
  notes: string | null;
  created_at: string;
  pharmacies: {
    pharmacy_name: string;
    owner_name: string | null;
    email: string | null;
    phone: string | null;
    license_number: string | null;
    address: string | null;
  } | null;
}

const PLAN_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  basic:        { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  professional: { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  enterprise:   { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
};

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  pending_payment: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  active:          { bg: '#ECFDF5', color: '#10B981', border: '#A7F3D0' },
  expired:         { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' },
  cancelled:       { bg: '#FEF2F2', color: '#EF4444', border: '#FECACA' },
};

const REJECT_REASONS = [
  'Invalid or unrecognizable payment reference',
  'Payment amount does not match plan price',
  'Duplicate payment reference',
  'Payment not received in our account',
  'Transaction reference already used',
  'Other',
];

type FilterType = 'all' | 'pending_payment' | 'active' | 'expired' | 'cancelled';

const AdminPharmacyApprovals = () => {
  const [subs, setSubs] = useState<PharmaSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('pending_payment');
  const [searchQuery, setSearchQuery] = useState('');
  const [activating, setActivating] = useState<string | null>(null);

  // Drawer state
  const [selectedSub, setSelectedSub] = useState<PharmaSub | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const fetchSubs = async () => {
    setLoading(true);
    try {
      // Step 1: fetch subscriptions (no join — pharmacy_id references auth.users, not pharmacies FK)
      let query = (supabase as any)
        .from('pharmacy_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data: subsData, error: subsError } = await query;
      if (subsError) throw subsError;

      const rows = (subsData || []) as Omit<PharmaSub, 'pharmacies'>[];

      if (rows.length === 0) {
        setSubs([]);
        return;
      }

      // Step 2: fetch pharmacy details for the pharmacy_ids found
      const pharmacyIds = [...new Set(rows.map((r: any) => r.pharmacy_id))];
      const { data: pharmaData } = await (supabase as any)
        .from('pharmacies')
        .select('id, pharmacy_name, owner_name, email, phone, license_number, address')
        .in('id', pharmacyIds);

      const pharmaMap: Record<string, any> = {};
      (pharmaData || []).forEach((p: any) => { pharmaMap[p.id] = p; });

      // Step 3: merge
      const merged = rows.map((r: any) => ({
        ...r,
        pharmacies: pharmaMap[r.pharmacy_id] || null,
      })) as PharmaSub[];

      setSubs(merged);
    } catch (err: any) {
      toast.error('Failed to fetch pharmacy subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubs(); }, [filter]);

  const handleActivate = async (sub: PharmaSub) => {
    setActivating(sub.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const today = new Date();
      const expiresAt = addYears(today, 1);

      const { error } = await (supabase as any)
        .from('pharmacy_subscriptions')
        .update({
          status: 'active',
          started_at: format(today, 'yyyy-MM-dd'),
          expires_at: format(expiresAt, 'yyyy-MM-dd'),
          activated_by: user?.id,
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id);

      if (error) throw error;

      // Log admin action
      await (supabase as any).from('admin_logs').insert([{
        admin_user_id: user?.id,
        action: 'PHARMACY_SUBSCRIPTION_ACTIVATED',
        target_type: 'pharmacy_subscription',
        target_id: sub.id,
        notes: `Activated ${sub.plan_name} for pharmacy ${sub.pharmacies?.pharmacy_name}. Ref: ${sub.payment_reference}`,
      }]);

      toast.success(`✅ ${sub.pharmacies?.pharmacy_name}'s subscription has been activated!`);
      setDrawerOpen(false);
      setSelectedSub(null);
      fetchSubs();
    } catch (err: any) {
      toast.error(err.message || 'Activation failed');
    } finally {
      setActivating(null);
    }
  };

  const handleReject = async () => {
    if (!selectedSub || !rejectReason) { toast.error('Please select a reason'); return; }
    setRejecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const finalNotes = rejectReason === 'Other' ? rejectNotes : rejectReason;

      const { error } = await (supabase as any)
        .from('pharmacy_subscriptions')
        .update({
          status: 'cancelled',
          notes: finalNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedSub.id);

      if (error) throw error;

      await (supabase as any).from('admin_logs').insert([{
        admin_user_id: user?.id,
        action: 'PHARMACY_SUBSCRIPTION_REJECTED',
        target_type: 'pharmacy_subscription',
        target_id: selectedSub.id,
        notes: `Rejected. Reason: ${finalNotes}`,
      }]);

      toast.error(`❌ Subscription rejected for ${selectedSub.pharmacies?.pharmacy_name}`);
      setRejectModalOpen(false);
      setDrawerOpen(false);
      setRejectReason('');
      setRejectNotes('');
      setSelectedSub(null);
      fetchSubs();
    } catch (err: any) {
      toast.error(err.message || 'Rejection failed');
    } finally {
      setRejecting(false);
    }
  };

  const openDrawer = (sub: PharmaSub) => {
    setSelectedSub(sub);
    setDrawerOpen(true);
  };

  const filtered = subs.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.pharmacies?.pharmacy_name?.toLowerCase().includes(q) ||
      s.pharmacies?.email?.toLowerCase().includes(q) ||
      s.payment_reference?.toLowerCase().includes(q) ||
      s.pharmacies?.license_number?.toLowerCase().includes(q)
    );
  });

  const pendingCount = subs.filter(s => s.status === 'pending_payment').length;

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending_payment': return '⏳ Pending Verification';
      case 'active': return '✅ Active';
      case 'expired': return '⏰ Expired';
      case 'cancelled': return '❌ Rejected';
      default: return status;
    }
  };

  const ss = selectedSub;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
            <Pill size={22} className="inline mr-2" style={{ color: '#8B5CF6' }} />
            Pharmacy Subscription Approvals
          </h1>
          <p className="text-[13px] mt-1" style={{ color: '#64748B' }}>
            Review payment references and activate pharmacy subscriptions
          </p>
        </div>
        <button onClick={fetchSubs}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold"
          style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Pending Alert Banner */}
      {pendingCount > 0 && filter !== 'pending_payment' && (
        <div className="rounded-lg p-3 flex items-center justify-between"
          style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <span className="text-[13px] font-medium" style={{ color: '#D97706' }}>
            ⏳ {pendingCount} pharmacy subscription{pendingCount > 1 ? 's' : ''} awaiting payment verification
          </span>
          <button onClick={() => setFilter('pending_payment')}
            className="text-[12px] font-semibold px-3 py-1 rounded-md"
            style={{ background: '#F59E0B', color: '#1E293B' }}>
            View Pending
          </button>
        </div>
      )}

      {/* Filters + Search */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#8B5CF6" opacity={0.15} />
        <div className="p-4 flex flex-col md:flex-row gap-3">
          <div className="flex gap-2 flex-wrap">
            {([
              ['all', 'All'],
              ['pending_payment', '⏳ Pending'],
              ['active', '✅ Active'],
              ['expired', '⏰ Expired'],
              ['cancelled', '❌ Rejected'],
            ] as const).map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key as FilterType)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                style={{
                  background: filter === key ? '#8B5CF6' : '#F1F5F9',
                  color: filter === key ? '#fff' : '#64748B',
                }}>
                {label}
                {key === 'pending_payment' && pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: filter === key ? 'rgba(255,255,255,0.3)' : '#F59E0B', color: filter === key ? '#fff' : '#1E293B' }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5" style={{ color: '#94A3B8' }} />
            <input
              className="field-input pl-9 text-[13px]"
              placeholder="Search by pharmacy name, email, or transaction ref..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#8B5CF6" opacity={0.15} />
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: '#8B5CF6' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Pill size={40} className="mx-auto mb-3" style={{ color: '#DDD6FE' }} />
            <p className="text-[14px]" style={{ color: '#94A3B8' }}>No pharmacy subscriptions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr style={{ background: '#F7FBFC' }}>
                  {['Pharmacy', 'Plan', 'Status', 'Payment Reference', 'Amount', 'Submitted', 'Actions'].map(col => (
                    <th key={col} className="text-left p-4 font-semibold" style={{ color: '#64748B' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => {
                  const sc = STATUS_COLORS[sub.status] || STATUS_COLORS.expired;
                  const pc = PLAN_COLORS[sub.plan_id] || PLAN_COLORS.basic;
                  return (
                    <tr key={sub.id}
                      className="transition-colors hover:bg-purple-50/30"
                      style={{
                        borderTop: '1px solid #F1F5F9',
                        borderLeft: sub.status === 'pending_payment' ? '3px solid #8B5CF6' : '3px solid transparent',
                      }}>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                            style={{ background: '#8B5CF6' }}>
                            {sub.pharmacies?.pharmacy_name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: '#1E293B' }}>
                              {sub.pharmacies?.pharmacy_name || '—'}
                            </p>
                            <p className="text-[11px]" style={{ color: '#64748B' }}>
                              {sub.pharmacies?.email || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize"
                          style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
                          {sub.plan_name}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold"
                          style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          {statusLabel(sub.status)}
                        </span>
                      </td>
                      <td className="p-4">
                        {sub.payment_reference ? (
                          <div>
                            <p className="font-mono text-[12px] font-semibold" style={{ color: '#1E293B' }}>
                              {sub.payment_reference}
                            </p>
                            <p className="text-[11px]" style={{ color: '#94A3B8' }}>
                              via {sub.payment_method?.toUpperCase() || 'UPI'}
                            </p>
                          </div>
                        ) : (
                          <span className="italic text-[12px]" style={{ color: '#94A3B8' }}>Not provided</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold" style={{ color: '#1E293B' }}>
                          ₹{sub.amount_paid.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-[12px]" style={{ color: '#64748B' }}>
                          {format(new Date(sub.created_at), 'dd MMM yyyy')}
                        </span>
                        <p className="text-[11px]" style={{ color: '#94A3B8' }}>
                          {format(new Date(sub.created_at), 'hh:mm a')}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 justify-end flex-wrap">
                          <button onClick={() => openDrawer(sub)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                            style={{ border: '1px solid #DDD6FE', color: '#7C3AED' }}>
                            <Eye size={12} /> Details
                          </button>
                          {sub.status === 'pending_payment' && (
                            <>
                              <button onClick={() => handleActivate(sub)}
                                disabled={activating === sub.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white disabled:opacity-50"
                                style={{ background: '#10B981' }}>
                                {activating === sub.id
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : <CheckCircle2 size={12} />}
                                Approve
                              </button>
                              <button onClick={() => { setSelectedSub(sub); setRejectModalOpen(true); }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                                style={{ border: '1px solid #FECACA', color: '#EF4444' }}>
                                <XCircle size={12} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto p-0" style={{ background: '#FFFFFF' }}>
          {ss && (
            <>
              <JharokhaArch color="#8B5CF6" />
              <SheetHeader className="px-6 pt-4 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                    style={{ background: '#8B5CF6' }}>
                    {ss.pharmacies?.pharmacy_name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <SheetTitle className="text-lg" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                      {ss.pharmacies?.pharmacy_name}
                    </SheetTitle>
                    <div className="mt-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{
                          background: STATUS_COLORS[ss.status]?.bg,
                          color: STATUS_COLORS[ss.status]?.color,
                          border: `1px solid ${STATUS_COLORS[ss.status]?.border}`,
                        }}>
                        {statusLabel(ss.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="px-6 pb-8 space-y-6 mt-4 text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>

                {/* Payment Reference Box */}
                <div className="rounded-xl p-4" style={{ background: '#F5F3FF', border: '2px solid #DDD6FE' }}>
                  <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: '#7C3AED', letterSpacing: '0.08em' }}>
                    Payment Reference
                  </p>
                  {ss.payment_reference ? (
                    <>
                      <p className="font-mono text-[15px] font-bold" style={{ color: '#1E293B' }}>
                        {ss.payment_reference}
                      </p>
                      <p className="text-[12px] mt-1" style={{ color: '#64748B' }}>
                        Method: {ss.payment_method?.toUpperCase() || 'UPI'}
                      </p>
                    </>
                  ) : (
                    <p className="italic" style={{ color: '#94A3B8' }}>No payment reference provided</p>
                  )}
                </div>

                {/* Pharmacy Info */}
                <div>
                  <p className="text-[11px] font-semibold uppercase mb-3" style={{ color: '#0891B2', letterSpacing: '0.08em' }}>
                    Pharmacy Details
                  </p>
                  <div className="space-y-2">
                    {[
                      ['Pharmacy Name', ss.pharmacies?.pharmacy_name],
                      ['Owner', ss.pharmacies?.owner_name],
                      ['Email', ss.pharmacies?.email],
                      ['Phone', ss.pharmacies?.phone],
                      ['License No.', ss.pharmacies?.license_number],
                      ['Address', ss.pharmacies?.address],
                    ].map(([label, val]) => (
                      <div key={label as string} className="flex justify-between py-1.5"
                        style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>{label}</span>
                        <span className="font-medium text-right max-w-[60%]" style={{ color: '#1E293B' }}>{val || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subscription Info */}
                <div>
                  <p className="text-[11px] font-semibold uppercase mb-3" style={{ color: '#8B5CF6', letterSpacing: '0.08em' }}>
                    Subscription Details
                  </p>
                  <div className="space-y-2">
                    {[
                      ['Plan', ss.plan_name],
                      ['Amount', `₹${ss.amount_paid.toLocaleString('en-IN')}`],
                      ['Submitted on', format(new Date(ss.created_at), 'dd MMM yyyy, hh:mm a')],
                      ['Valid Until', ss.expires_at ? format(new Date(ss.expires_at), 'dd MMM yyyy') : '—'],
                      ...(ss.activated_at ? [['Activated on', format(new Date(ss.activated_at), 'dd MMM yyyy, hh:mm a')]] : []),
                      ...(ss.notes ? [['Notes', ss.notes]] : []),
                    ].map(([label, val]) => (
                      <div key={label as string} className="flex justify-between py-1.5"
                        style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>{label}</span>
                        <span className="font-medium text-right" style={{ color: '#1E293B' }}>{val as string}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                {ss.status === 'pending_payment' && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleActivate(ss)}
                      disabled={activating === ss.id}
                      className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: '#10B981' }}>
                      {activating === ss.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      ✅ Activate Subscription
                    </button>
                    <button
                      onClick={() => setRejectModalOpen(true)}
                      className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white flex items-center justify-center gap-2"
                      style={{ background: '#EF4444' }}>
                      <XCircle size={14} /> ❌ Reject
                    </button>
                  </div>
                )}

                {ss.status === 'active' && (
                  <div className="rounded-lg p-3 flex items-center gap-2"
                    style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                    <ShieldCheck size={16} style={{ color: '#10B981' }} />
                    <span className="text-[13px] font-medium" style={{ color: '#065F46' }}>
                      Active until {ss.expires_at ? format(new Date(ss.expires_at), 'dd MMM yyyy') : '—'}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject Modal */}
      {rejectModalOpen && selectedSub && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="bg-white rounded-xl w-full max-w-[440px] mx-4 overflow-hidden">
            <JharokhaArch color="#EF4444" />
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                  style={{ background: '#FEF2F2' }}>❌</div>
                <button onClick={() => { setRejectModalOpen(false); setRejectReason(''); setRejectNotes(''); }}
                  className="p-1 rounded-full hover:bg-gray-100">
                  <X size={18} style={{ color: '#94A3B8' }} />
                </button>
              </div>
              <h3 className="text-[16px] font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                Reject Payment?
              </h3>
              <p className="text-[13px] mb-5" style={{ color: '#64748B' }}>
                Rejecting payment for <strong>{selectedSub.pharmacies?.pharmacy_name}</strong>.
                Ref: <code className="font-mono text-[#D97706]">{selectedSub.payment_reference || 'N/A'}</code>
              </p>
              <select
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="field-input mb-3 text-[13px]">
                <option value="">Select reason...</option>
                {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {rejectReason === 'Other' && (
                <textarea
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value.slice(0, 500))}
                  placeholder="Describe the issue..."
                  className="field-input mb-3 text-[13px]"
                  rows={3}
                />
              )}
              <button
                onClick={handleReject}
                disabled={rejecting || !rejectReason}
                className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white mb-2 disabled:opacity-50"
                style={{ background: '#EF4444' }}>
                {rejecting ? <Loader2 size={14} className="animate-spin inline mr-2" /> : null}
                Confirm Rejection
              </button>
              <button
                onClick={() => { setRejectModalOpen(false); setRejectReason(''); setRejectNotes(''); }}
                className="w-full py-2.5 rounded-lg text-[13px] font-medium"
                style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPharmacyApprovals;
