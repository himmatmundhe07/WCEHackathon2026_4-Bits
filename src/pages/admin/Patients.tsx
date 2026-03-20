import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Search, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Patients = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
      setPatients(data || []);
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selected) {
      supabase.from('patient_reports').select('*').eq('patient_id', selected.id).order('uploaded_at', { ascending: false }).then(({ data }) => setReports(data || []));
    } else {
      setReports([]);
    }
  }, [selected]);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q) || p.abha_id?.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filter === 'With Insurance') return p.has_insurance;
    if (filter === 'Organ Donors') return p.organ_donor;
    return true;
  });

  const maskAadhaar = (a: string | null) => a ? `XXXX-XXXX-${a.slice(-4)}` : '—';

  const p = selected;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 flex flex-col md:flex-row gap-3" style={{ border: '1px solid #E2EEF1' }}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, city, or ABHA ID..." className="field-input pl-9" />
        </div>
        <div className="flex gap-2">
          {['All', 'With Insurance', 'Organ Donors'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className="px-4 py-2 rounded-full text-[12px] font-medium transition-all"
              style={{ background: filter === f ? '#0891B2' : 'transparent', color: filter === f ? '#fff' : '#64748B', border: `1px solid ${filter === f ? '#0891B2' : '#E2EEF1'}` }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#F59E0B" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2EEF1' }}>
                {['#', 'Patient', 'Age / Gender', 'Blood Group', 'Location', 'Registered', 'Insurance', 'Actions'].map((col) => (
                  <th key={col} className="text-left px-4 py-3 font-medium" style={{ color: '#64748B' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td className="px-4 py-3" style={{ color: '#94A3B8' }}>{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold" style={{ color: '#1E293B' }}>{p.full_name}</p>
                    <p className="text-[11px]" style={{ color: '#94A3B8' }}>{maskAadhaar(p.aadhaar_number)}</p>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#64748B' }}>{p.age || '—'} · {p.gender || '—'}</td>
                  <td className="px-4 py-3">
                    {p.blood_group ? <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>{p.blood_group}</span> : '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#64748B' }}>{p.city || '—'}, {p.state || '—'}</td>
                  <td className="px-4 py-3" style={{ color: '#64748B' }}>{p.created_at ? formatDistanceToNow(new Date(p.created_at), { addSuffix: true }) : '—'}</td>
                  <td className="px-4 py-3" style={{ color: p.has_insurance ? '#10B981' : '#94A3B8' }}>{p.has_insurance ? '✅ Yes' : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setSelected(p); setDrawerOpen(true); }} className="p-1.5 rounded-lg hover:bg-gray-100"><Eye size={16} style={{ color: '#64748B' }} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8" style={{ color: '#94A3B8' }}>No patients found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-[520px] overflow-y-auto p-0" style={{ background: '#FFFFFF' }}>
          {p && (
            <>
              <JharokhaArch color="#F59E0B" />
              <SheetHeader className="px-6 pt-4 pb-2">
                <SheetTitle style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>{p.full_name}</SheetTitle>
              </SheetHeader>
              <div className="px-6 pb-6">
                <Tabs defaultValue="personal" className="mt-4">
                  <TabsList className="w-full justify-start bg-transparent border-b rounded-none" style={{ borderColor: '#E2EEF1' }}>
                    {['Personal', 'Contact', 'Medical', 'Insurance', 'Reports', 'Account'].map((t) => (
                      <TabsTrigger key={t} value={t.toLowerCase()} className="text-[12px] data-[state=active]:shadow-none data-[state=active]:border-b-2 rounded-none pb-2" style={{ borderColor: '#0891B2' }}>{t}</TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="personal" className="mt-4 space-y-3 text-[13px]">
                    {[['Full Name', p.full_name], ['Date of Birth', p.date_of_birth], ['Age', p.age], ['Gender', p.gender], ['Blood Group', p.blood_group], ['Aadhaar', maskAadhaar(p.aadhaar_number)], ['ABHA Card No', p.abha_card_no], ['ABHA ID', p.abha_id]].map(([l, v]) => (
                      <div key={l as string} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>{l}</span>
                        <span className="font-medium" style={{ color: '#1E293B' }}>{v || '—'}</span>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="contact" className="mt-4 space-y-3 text-[13px]">
                    {[['Email', p.email], ['Phone', p.phone], ['Address', p.address], ['City', p.city], ['State', p.state], ['PIN Code', p.pin_code], ['Emergency Contact', p.emergency_contact_name], ['Emergency Phone', p.emergency_contact_phone], ['Relationship', p.emergency_contact_relation]].map(([l, v]) => (
                      <div key={l as string} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>{l}</span>
                        <span className="font-medium" style={{ color: '#1E293B' }}>{v || '—'}</span>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="medical" className="mt-4 space-y-4 text-[13px]">
                    <div>
                      <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: '#EF4444', letterSpacing: '0.1em' }}>Allergies</p>
                      <div className="flex flex-wrap gap-1.5">{(p.allergies || []).map((a: string) => <span key={a} className="px-2 py-0.5 rounded-full text-[11px]" style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}>{a}</span>)}</div>
                      {!(p.allergies?.length) && <span style={{ color: '#94A3B8' }}>None</span>}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: '#F59E0B', letterSpacing: '0.1em' }}>Chronic Conditions</p>
                      <div className="flex flex-wrap gap-1.5">{(p.chronic_conditions || []).map((c: string) => <span key={c} className="chip-tag-gold">{c}</span>)}</div>
                      {!(p.chronic_conditions?.length) && <span style={{ color: '#94A3B8' }}>None</span>}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: '#0891B2', letterSpacing: '0.1em' }}>Medications</p>
                      <div className="flex flex-wrap gap-1.5">{(p.current_medications || []).map((m: string) => <span key={m} className="chip-tag">{m}</span>)}</div>
                      {!(p.current_medications?.length) && <span style={{ color: '#94A3B8' }}>None</span>}
                    </div>
                    <div>
                      <p className="font-medium mb-1" style={{ color: '#1E293B' }}>Organ Donor</p>
                      <span style={{ color: p.organ_donor ? '#10B981' : '#94A3B8' }}>{p.organ_donor ? '✅ Yes' : 'No'}</span>
                    </div>
                  </TabsContent>

                  <TabsContent value="insurance" className="mt-4 space-y-3 text-[13px]">
                    {[['Has Insurance', p.has_insurance ? 'Yes' : 'No'], ['Type', p.insurance_type], ['Provider', p.insurance_provider], ['Policy No', p.insurance_policy_no], ['Sum Insured', p.sum_insured], ['Validity', p.insurance_validity_date], ['Ayushman Enrolled', p.ayushman_bharat_enrolled ? 'Yes' : 'No'], ['Ayushman ID', p.ayushman_beneficiary_id], ['State Scheme', p.state_scheme_name]].map(([l, v]) => (
                      <div key={l as string} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>{l}</span>
                        <span className="font-medium" style={{ color: '#1E293B' }}>{v || '—'}</span>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="reports" className="mt-4 space-y-3 text-[13px]">
                    {reports.length === 0 ? (
                      <p className="py-4 text-center text-[13px]" style={{ color: '#94A3B8' }}>No lab reports or discharge summaries available.</p>
                    ) : (
                      <div className="space-y-3">
                        {reports.map((r) => (
                          <div key={r.id} className="p-3 rounded-lg flex items-center justify-between" style={{ border: '1px solid #E2EEF1', background: '#F7FBFC' }}>
                            <div>
                              <p className="font-bold" style={{ color: '#1E293B' }}>{r.report_name}</p>
                              <p className="text-[11px]" style={{ color: '#64748B' }}>{r.report_type} • {r.report_date || 'No Date'}</p>
                            </div>
                            {r.file_url ? (
                              <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-md text-[11px] font-medium" style={{ background: '#0891B2', color: '#fff' }}>
                                View File
                              </a>
                            ) : (
                              <span className="text-[11px] italic" style={{ color: '#94A3B8' }}>No file</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="account" className="mt-4 space-y-3 text-[13px]">
                    {[['Email', p.email], ['Created', p.created_at ? new Date(p.created_at).toLocaleDateString() : '—']].map(([l, v]) => (
                      <div key={l as string} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>{l}</span>
                        <span className="font-medium" style={{ color: '#1E293B' }}>{v || '—'}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ color: '#64748B' }}>User ID</span>
                      <code className="text-[11px] px-2 py-0.5 rounded" style={{ background: '#F1F5F9', color: '#64748B' }}>{p.supabase_user_id}</code>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Patients;
