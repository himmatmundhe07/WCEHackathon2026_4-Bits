import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Download, Eye, CreditCard, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import type { HospitalProfile } from '@/hooks/useHospitalContext';

type StatusFilter = 'All' | 'Pending' | 'Partial' | 'Paid' | 'Insurance Claim';

const statusStyles: Record<string, { bg: string; color: string }> = {
  Pending: { bg: '#FFFBEB', color: '#D97706' },
  Partial: { bg: '#EBF7FA', color: '#0891B2' },
  Paid: { bg: '#F0FDF4', color: '#059669' },
  'Insurance Claim': { bg: '#F5F3FF', color: '#7C3AED' },
};

const serviceTemplates = ['Consultation', 'Bed Charges', 'Surgery', 'Lab Tests', 'Pharmacy', 'ICU Charges', 'Ambulance', 'Procedure'];

const HospitalBilling = () => {
  const { hospital } = useOutletContext<{ hospital: HospitalProfile | null }>();
  const [bills, setBills] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('All');
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [services, setServices] = useState<{ name: string; qty: number; unit_price: number }[]>([{ name: '', qty: 1, unit_price: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [insurerName, setInsurerName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewBill, setViewBill] = useState<any>(null);
  const [paymentModal, setPaymentModal] = useState<any>(null);
  const [payAmount, setPayAmount] = useState(0);

  const fetchBills = async () => {
    if (!hospital) return;
    const { data } = await supabase.from('hospital_bills')
      .select('*, patients(full_name)')
      .eq('hospital_id', hospital.id)
      .order('bill_date', { ascending: false });
    setBills(data || []);
  };

  const fetchPatients = async () => {
    if (!hospital) return;
    const { data } = await supabase.from('hospital_patients')
      .select('*, patients(id, full_name, blood_group)')
      .eq('hospital_id', hospital.id)
      .in('relationship_type', ['Admitted', 'Outpatient', 'Emergency']);
    setPatients(data || []);
  };

  useEffect(() => { fetchBills(); fetchPatients(); }, [hospital]);

  const subtotal = services.reduce((s, sv) => s + (sv.qty * sv.unit_price), 0);
  const discountAmt = subtotal * (discount / 100);
  const total = subtotal - discountAmt;

  const createBill = async () => {
    if (!hospital || !selectedPatient) return;
    setSaving(true);
    const bill_number = `BILL-${hospital.hospital_name.slice(0, 3).toUpperCase()}-${Date.now()}`;
    const servicesJson = services.filter(s => s.name).map(s => ({ ...s, total: s.qty * s.unit_price }));

    const { error } = await supabase.from('hospital_bills').insert({
      hospital_id: hospital.id,
      patient_id: selectedPatient.patients?.id || selectedPatient.patient_id,
      bill_number,
      services: servicesJson,
      subtotal, discount: discountAmt, total,
      paid_amount: paidAmount,
      payment_status: paidAmount >= total ? 'Paid' : paidAmount > 0 ? 'Partial' : hasInsurance ? 'Insurance Claim' : 'Pending',
      insurance_claim: hasInsurance,
      insurer_name: hasInsurance ? insurerName : null,
      notes: notes || null,
    });
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }

    // Generate PDF
    generatePDF(bill_number, selectedPatient.patients?.full_name || 'Patient', servicesJson, subtotal, discountAmt, total, paidAmount);

    toast({ title: `🧾 Bill #${bill_number} created` });
    resetCreate();
    fetchBills();
  };

  const resetCreate = () => {
    setShowCreate(false); setStep(1); setSelectedPatient(null);
    setServices([{ name: '', qty: 1, unit_price: 0 }]);
    setDiscount(0); setPaidAmount(0); setHasInsurance(false);
    setInsurerName(''); setNotes('');
  };

  const generatePDF = (billNo: string, patientName: string, svcs: any[], sub: number, disc: number, tot: number, paid: number) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('Sanjeevani — Hospital Bill', 20, 25);
    doc.setFontSize(11);
    doc.text(`Bill #: ${billNo}`, 20, 38);
    doc.text(`Hospital: ${hospital?.hospital_name}`, 20, 46);
    doc.text(`Patient: ${patientName}`, 20, 54);
    doc.text(`Date: ${format(new Date(), 'dd MMM yyyy')}`, 20, 62);
    let y = 78;
    doc.setFontSize(10);
    doc.text('Service', 20, y); doc.text('Qty', 100, y); doc.text('Rate', 120, y); doc.text('Total', 155, y);
    y += 8;
    svcs.forEach(s => { doc.text(s.name, 20, y); doc.text(`${s.qty}`, 100, y); doc.text(`₹${s.unit_price}`, 120, y); doc.text(`₹${s.total}`, 155, y); y += 7; });
    y += 5;
    doc.text(`Subtotal: ₹${sub}`, 120, y); y += 7;
    doc.text(`Discount: ₹${disc}`, 120, y); y += 7;
    doc.setFontSize(12); doc.text(`Total: ₹${tot}`, 120, y); y += 7;
    doc.setFontSize(10); doc.text(`Paid: ₹${paid}`, 120, y); y += 7;
    doc.text(`Balance: ₹${tot - paid}`, 120, y);
    doc.save(`${billNo}.pdf`);
  };

  const recordPayment = async () => {
    if (!paymentModal || payAmount <= 0) return;
    const newPaid = (paymentModal.paid_amount || 0) + payAmount;
    const newStatus = newPaid >= (paymentModal.total || 0) ? 'Paid' : 'Partial';
    await supabase.from('hospital_bills').update({ paid_amount: newPaid, payment_status: newStatus }).eq('id', paymentModal.id);
    toast({ title: `Payment of ₹${payAmount} recorded` });
    setPaymentModal(null); setPayAmount(0); fetchBills();
  };

  const downloadPDF = (b: any) => {
    const svcs = Array.isArray(b.services) ? b.services : [];
    generatePDF(b.bill_number || b.id.slice(0, 8), b.patients?.full_name || 'N/A', svcs, b.subtotal || 0, b.discount || 0, b.total || 0, b.paid_amount || 0);
  };

  const filtered = bills.filter(b => {
    if (filter !== 'All' && b.payment_status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (b.patients?.full_name || '').toLowerCase().includes(s) || (b.bill_number || '').toLowerCase().includes(s);
    }
    return true;
  });

  const filteredPatients = patients.filter(p => {
    if (!patientSearch) return true;
    return (p.patients?.full_name || '').toLowerCase().includes(patientSearch.toLowerCase());
  });

  const tabs: StatusFilter[] = ['All', 'Pending', 'Partial', 'Paid', 'Insurance Claim'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Billing</h1>
        <Button onClick={() => setShowCreate(true)} className="text-[13px]" style={{ background: '#F59E0B', color: '#fff' }}>
          <Plus size={16} /> Create Bill
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
          <Input placeholder="Search by patient name or bill number..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-[13px]" style={{ borderColor: '#E2EEF1' }} />
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

      {/* Bills Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2EEF1' }}>
        <JharokhaArch color="#F59E0B" opacity={0.18} />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <thead>
              <tr style={{ background: '#F7FBFC', borderBottom: '1px solid #E2EEF1' }}>
                {['Bill #', 'Patient', 'Date', 'Total', 'Paid', 'Balance', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 italic" style={{ color: '#64748B' }}>No bills found.</td></tr>
              ) : filtered.map(b => {
                const st = statusStyles[b.payment_status] || statusStyles.Pending;
                const balance = (b.total || 0) - (b.paid_amount || 0);
                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid #E2EEF1' }} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-[12px]" style={{ color: '#0891B2' }}>{b.bill_number || b.id.slice(0, 8)}</td>
                    <td className="px-4 py-3" style={{ color: '#1E293B' }}>{b.patients?.full_name || '—'}</td>
                    <td className="px-4 py-3" style={{ color: '#64748B' }}>{format(new Date(b.bill_date), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#1E293B' }}>₹{b.total || 0}</td>
                    <td className="px-4 py-3" style={{ color: '#059669' }}>₹{b.paid_amount || 0}</td>
                    <td className="px-4 py-3" style={{ color: balance > 0 ? '#DC2626' : '#059669' }}>₹{balance}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: st.bg, color: st.color }}>{b.payment_status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setViewBill(b)} className="p-1.5 rounded hover:bg-gray-100"><Eye size={14} style={{ color: '#0891B2' }} /></button>
                        <button onClick={() => { setPaymentModal(b); setPayAmount(0); }} className="p-1.5 rounded hover:bg-gray-100"><CreditCard size={14} style={{ color: '#10B981' }} /></button>
                        <button onClick={() => downloadPDF(b)} className="p-1.5 rounded hover:bg-gray-100"><Download size={14} style={{ color: '#F59E0B' }} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Bill Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="bg-white rounded-xl w-[560px] max-w-[95vw] max-h-[90vh] overflow-y-auto" style={{ border: '1px solid #E2EEF1' }}>
            <JharokhaArch color="#F59E0B" opacity={0.18} />
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                  Create Bill — Step {step}/3
                </h2>
                <button onClick={resetCreate}><X size={18} style={{ color: '#64748B' }} /></button>
              </div>

              {step === 1 && (
                <div className="space-y-3">
                  <Input placeholder="Search patient..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} className="text-[13px]" />
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredPatients.map(p => (
                      <button key={p.id} onClick={() => { setSelectedPatient(p); setStep(2); }}
                        className="w-full text-left p-3 rounded-lg border hover:border-amber-400 transition-all" style={{ borderColor: '#E2EEF1' }}>
                        <span className="font-medium text-[13px]" style={{ color: '#1E293B' }}>{p.patients?.full_name}</span>
                        {p.patients?.blood_group && <span className="ml-2 px-1.5 py-0.5 rounded text-[11px]" style={{ background: '#FEF2F2', color: '#DC2626' }}>{p.patients.blood_group}</span>}
                        <span className="ml-2 text-[11px]" style={{ color: '#64748B' }}>{p.ward} · Bed {p.bed_number}</span>
                      </button>
                    ))}
                    {filteredPatients.length === 0 && <p className="text-center text-[13px] py-4" style={{ color: '#64748B' }}>No patients found</p>}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-[13px]" style={{ color: '#64748B' }}>Patient: <strong style={{ color: '#1E293B' }}>{selectedPatient?.patients?.full_name}</strong></p>

                  <div className="flex flex-wrap gap-1">
                    {serviceTemplates.map(t => (
                      <button key={t} onClick={() => setServices(s => [...s, { name: t, qty: 1, unit_price: 0 }])}
                        className="px-2 py-1 rounded-full text-[11px]" style={{ background: '#EBF7FA', color: '#0891B2' }}>{t}</button>
                    ))}
                  </div>

                  {services.map((sv, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <Input placeholder="Service" value={sv.name} onChange={e => { const n = [...services]; n[idx].name = e.target.value; setServices(n); }} className="col-span-5 text-[12px]" />
                      <Input type="number" placeholder="Qty" value={sv.qty || ''} onChange={e => { const n = [...services]; n[idx].qty = +e.target.value; setServices(n); }} className="col-span-2 text-[12px]" />
                      <Input type="number" placeholder="Price" value={sv.unit_price || ''} onChange={e => { const n = [...services]; n[idx].unit_price = +e.target.value; setServices(n); }} className="col-span-3 text-[12px]" />
                      <span className="col-span-1 text-[12px] font-medium" style={{ color: '#1E293B' }}>₹{sv.qty * sv.unit_price}</span>
                      <button onClick={() => setServices(s => s.filter((_, i) => i !== idx))} className="col-span-1"><X size={14} style={{ color: '#EF4444' }} /></button>
                    </div>
                  ))}
                  <button onClick={() => setServices(s => [...s, { name: '', qty: 1, unit_price: 0 }])} className="text-[12px] font-medium" style={{ color: '#F59E0B' }}>+ Add Service</button>

                  <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-[13px]">
                    <div className="flex justify-between"><span style={{ color: '#64748B' }}>Subtotal</span><span style={{ color: '#1E293B' }}>₹{subtotal}</span></div>
                    <div className="flex justify-between items-center gap-2">
                      <span style={{ color: '#64748B' }}>Discount %</span>
                      <Input type="number" value={discount || ''} onChange={e => setDiscount(+e.target.value)} className="w-20 text-[12px]" />
                      <span style={{ color: '#1E293B' }}>-₹{discountAmt.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between font-bold"><span style={{ color: '#1E293B' }}>Total</span><span style={{ color: '#1E293B' }}>₹{total.toFixed(0)}</span></div>
                  </div>
                  <Button onClick={() => setStep(3)} className="w-full text-[13px]" style={{ background: '#0891B2', color: '#fff' }}>Next →</Button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-[13px]" style={{ color: '#64748B' }}>Has insurance?</label>
                    <button onClick={() => setHasInsurance(!hasInsurance)}
                      className="px-3 py-1 rounded-full text-[12px] font-medium"
                      style={{ background: hasInsurance ? '#F0FDF4' : '#F1F5F9', color: hasInsurance ? '#059669' : '#64748B' }}>
                      {hasInsurance ? 'Yes' : 'No'}
                    </button>
                  </div>
                  {hasInsurance && <Input placeholder="Insurer Name" value={insurerName} onChange={e => setInsurerName(e.target.value)} className="text-[13px]" />}
                  <div>
                    <label className="text-[12px] block mb-1" style={{ color: '#64748B' }}>Payment received (₹)</label>
                    <Input type="number" value={paidAmount || ''} onChange={e => setPaidAmount(+e.target.value)} className="text-[13px]" />
                  </div>
                  <textarea placeholder="Notes..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full text-[13px] rounded-md border px-3 py-2 min-h-[60px]" style={{ borderColor: '#E2EEF1' }} />
                  <div className="bg-gray-50 rounded-lg p-3 text-[13px] space-y-1">
                    <p><strong>Total:</strong> ₹{total.toFixed(0)} | <strong>Paid:</strong> ₹{paidAmount} | <strong>Balance:</strong> ₹{(total - paidAmount).toFixed(0)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)} className="text-[13px]">← Back</Button>
                    <Button onClick={createBill} disabled={saving} className="flex-1 text-[13px]" style={{ background: '#F59E0B', color: '#fff' }}>
                      {saving ? 'Creating...' : 'Generate Bill'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Bill Drawer */}
      {viewBill && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="bg-white w-[520px] max-w-full h-full overflow-y-auto" style={{ borderLeft: '1px solid #E2EEF1' }}>
            <JharokhaArch color="#F59E0B" opacity={0.18} />
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold" style={{ color: '#1E293B' }}>Bill #{viewBill.bill_number || viewBill.id.slice(0, 8)}</h2>
                <button onClick={() => setViewBill(null)}><X size={18} style={{ color: '#64748B' }} /></button>
              </div>
              <div className="text-[13px] space-y-1">
                <p>Patient: <strong>{viewBill.patients?.full_name || '—'}</strong></p>
                <p>Date: {format(new Date(viewBill.bill_date), 'dd MMM yyyy')}</p>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ ...(statusStyles[viewBill.payment_status] || statusStyles.Pending) }}>{viewBill.payment_status}</span>
              </div>

              <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#E2EEF1' }}>
                <table className="w-full text-[12px]">
                  <thead><tr style={{ background: '#F7FBFC' }}><th className="px-3 py-2 text-left" style={{ color: '#64748B' }}>Service</th><th className="px-3 py-2" style={{ color: '#64748B' }}>Qty</th><th className="px-3 py-2" style={{ color: '#64748B' }}>Rate</th><th className="px-3 py-2" style={{ color: '#64748B' }}>Total</th></tr></thead>
                  <tbody>
                    {(Array.isArray(viewBill.services) ? viewBill.services : []).map((s: any, i: number) => (
                      <tr key={i} style={{ borderTop: '1px solid #E2EEF1' }}>
                        <td className="px-3 py-2">{s.name}</td><td className="px-3 py-2 text-center">{s.qty}</td><td className="px-3 py-2 text-center">₹{s.unit_price}</td><td className="px-3 py-2 text-center">₹{s.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-[13px] space-y-1 bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between"><span style={{ color: '#64748B' }}>Subtotal</span><span>₹{viewBill.subtotal || 0}</span></div>
                <div className="flex justify-between"><span style={{ color: '#64748B' }}>Discount</span><span>-₹{viewBill.discount || 0}</span></div>
                <div className="flex justify-between font-bold"><span>Total</span><span>₹{viewBill.total || 0}</span></div>
                <div className="flex justify-between" style={{ color: '#059669' }}><span>Paid</span><span>₹{viewBill.paid_amount || 0}</span></div>
                <div className="flex justify-between font-bold" style={{ color: '#DC2626' }}><span>Balance</span><span>₹{(viewBill.total || 0) - (viewBill.paid_amount || 0)}</span></div>
              </div>

              {viewBill.insurance_claim && (
                <div className="text-[13px] p-3 rounded-lg" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                  <p style={{ color: '#7C3AED' }}>Insurance: {viewBill.insurer_name || 'N/A'}</p>
                  <p style={{ color: '#7C3AED' }}>Claim: {viewBill.claim_status || 'Not Filed'}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => downloadPDF(viewBill)} variant="outline" className="text-[13px]"><Download size={14} /> Download PDF</Button>
                <Button onClick={() => { setPaymentModal(viewBill); setPayAmount(0); setViewBill(null); }} className="text-[13px]" style={{ background: '#10B981', color: '#fff' }}><CreditCard size={14} /> Record Payment</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="bg-white rounded-xl w-[360px] p-6 space-y-4" style={{ border: '1px solid #E2EEF1' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold" style={{ color: '#1E293B' }}>Record Payment</h3>
              <button onClick={() => setPaymentModal(null)}><X size={16} style={{ color: '#64748B' }} /></button>
            </div>
            <p className="text-[13px]" style={{ color: '#64748B' }}>
              Balance: ₹{(paymentModal.total || 0) - (paymentModal.paid_amount || 0)}
            </p>
            <Input type="number" placeholder="Payment amount (₹)" value={payAmount || ''} onChange={e => setPayAmount(+e.target.value)} className="text-[13px]" />
            <Button onClick={recordPayment} className="w-full text-[13px]" style={{ background: '#10B981', color: '#fff' }}>Record Payment</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalBilling;
