import { useState } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Upload, ExternalLink } from 'lucide-react';
import type { HospitalProfile } from '@/hooks/useHospitalContext';

const HospitalSettings = () => {
  const { hospital } = useOutletContext<{ hospital: HospitalProfile | null }>();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({ current: '', new_: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [mapsLink, setMapsLink] = useState(hospital?.maps_link || '');
  const [helpline, setHelpline] = useState(hospital?.emergency_helpline || '');
  const [emergency24x7, setEmergency24x7] = useState(hospital?.emergency_24x7 || false);
  const [bloodBank, setBloodBank] = useState(hospital?.blood_bank || false);
  const [pharmacy, setPharmacy] = useState(hospital?.pharmacy || false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [deactivateConfirm, setDeactivateConfirm] = useState('');
  const [showDeactivate, setShowDeactivate] = useState(false);

  const updateProfile = async () => {
    if (!hospital) return;
    setProfileSaving(true);
    let logo_url = hospital.logo_url;

    if (logoFile) {
      const path = `${hospital.id}/${Date.now()}-logo.jpg`;
      const { error: ue } = await supabase.storage.from('hospital-logos').upload(path, logoFile);
      if (!ue) {
        const { data: urlData } = supabase.storage.from('hospital-logos').getPublicUrl(path);
        logo_url = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from('hospitals').update({
      logo_url, maps_link: mapsLink || null, emergency_helpline: helpline || null,
    }).eq('id', hospital.id);
    setProfileSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Profile updated' });
  };

  const updateServices = async () => {
    if (!hospital) return;
    const { error } = await supabase.from('hospitals').update({ emergency_24x7: emergency24x7, blood_bank: bloodBank, pharmacy }).eq('id', hospital.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Services updated' });
  };

  const changePassword = async () => {
    if (passwords.new_ !== passwords.confirm) { toast({ title: 'Passwords do not match', variant: 'destructive' }); return; }
    if (passwords.new_.length < 6) { toast({ title: 'Password must be at least 6 characters', variant: 'destructive' }); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new_ });
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Password updated successfully' });
    setPasswords({ current: '', new_: '', confirm: '' });
  };

  const handleSignOut = async () => { await supabase.auth.signOut({ scope: 'global' }); navigate('/hospital/login'); };

  const handleDeactivate = async () => {
    if (!hospital || deactivateConfirm !== hospital.hospital_name) {
      toast({ title: 'Hospital name does not match', variant: 'destructive' }); return;
    }
    await supabase.from('hospitals').update({ verification_status: 'Deactivated' }).eq('id', hospital.id);
    await supabase.auth.signOut();
    toast({ title: 'Hospital account deactivated' });
    navigate('/');
  };

  if (!hospital) return null;

  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
    <button onClick={() => onChange(!value)} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px]"
      style={{ background: value ? '#F0FDF4' : '#F1F5F9', color: value ? '#059669' : '#64748B' }}>
      {value ? '✅' : '❌'} {label}
    </button>
  );

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Settings</h1>

      {/* Section 1: Hospital Profile */}
      <section>
        <h2 className="text-[14px] font-semibold mb-1" style={{ color: '#1E293B' }}>Hospital Profile</h2>
        <hr className="mandana-divider" />
        <div className="grid grid-cols-2 gap-4 mt-4 text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          {[
            ['Hospital Name', hospital.hospital_name],
            ['License ID', hospital.license_id],
            ['Facility Type', hospital.facility_type],
            ['Year Established', hospital.year_established],
            ['Address', hospital.address],
            ['City', hospital.city],
            ['State', hospital.state],
            ['PIN Code', hospital.pin_code],
            ['Phone', hospital.phone],
            ['Email', hospital.email],
            ['Website', hospital.website],
          ].map(([label, val]) => (
            <div key={label as string}>
              <p style={{ color: '#64748B' }}>{label}</p>
              <p className="font-medium" style={{ color: '#1E293B' }}>{val || '—'}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] mt-3" style={{ color: '#94A3B8' }}>To update these fields, contact Sanjeevani support.</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-[12px] block mb-1" style={{ color: '#64748B' }}>Hospital Logo</label>
            <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="text-[13px]" />
          </div>
          <div>
            <label className="text-[12px] block mb-1" style={{ color: '#64748B' }}>Google Maps Link</label>
            <Input value={mapsLink} onChange={e => setMapsLink(e.target.value)} placeholder="https://maps.google.com/..." className="text-[13px]" />
          </div>
          <div>
            <label className="text-[12px] block mb-1" style={{ color: '#64748B' }}>Emergency Helpline</label>
            <Input value={helpline} onChange={e => setHelpline(e.target.value)} placeholder="+91 ..." className="text-[13px]" />
          </div>
          <Button onClick={updateProfile} disabled={profileSaving} className="text-[13px]" style={{ background: '#F59E0B', color: '#fff' }}>
            {profileSaving ? 'Saving...' : 'Update Profile'}
          </Button>
        </div>
      </section>

      {/* Section 2: Services */}
      <section>
        <h2 className="text-[14px] font-semibold mb-1" style={{ color: '#1E293B' }}>Services & Infrastructure</h2>
        <hr className="mandana-divider" />
        <div className="flex flex-wrap gap-3 mt-4">
          <Toggle value={emergency24x7} onChange={setEmergency24x7} label="24/7 Emergency" />
          <Toggle value={bloodBank} onChange={setBloodBank} label="Blood Bank" />
          <Toggle value={pharmacy} onChange={setPharmacy} label="Pharmacy" />
        </div>
        <Button onClick={updateServices} className="text-[13px] mt-3" style={{ background: '#F59E0B', color: '#fff' }}>Save Services</Button>

        <div className="mt-4 space-y-2 text-[13px]" style={{ color: '#64748B' }}>
          <Link to="/hospital/dashboard/beds" className="flex items-center gap-1 hover:underline" style={{ color: '#0891B2' }}>
            Total Beds: {hospital.total_beds || 0} — Manage in Bed Management <ExternalLink size={12} />
          </Link>
          <Link to="/hospital/dashboard/staff" className="flex items-center gap-1 hover:underline" style={{ color: '#0891B2' }}>
            Total Staff: {(hospital.total_doctors || 0) + (hospital.total_nurses || 0) + (hospital.support_staff || 0)} — Manage in Staff Roster <ExternalLink size={12} />
          </Link>
        </div>
      </section>

      {/* Section 3: Change Password */}
      <section>
        <h2 className="text-[14px] font-semibold mb-1" style={{ color: '#1E293B' }}>Change Password</h2>
        <hr className="mandana-divider" />
        <div className="space-y-3 mt-4 max-w-sm">
          <Input type="password" placeholder="Current Password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} className="text-[13px]" />
          <Input type="password" placeholder="New Password" value={passwords.new_} onChange={e => setPasswords({ ...passwords, new_: e.target.value })} className="text-[13px]" />
          <Input type="password" placeholder="Confirm New Password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} className="text-[13px]" />
          <Button onClick={changePassword} disabled={saving} className="text-[13px]" style={{ background: '#0891B2', color: '#fff' }}>
            {saving ? 'Saving...' : 'Update Password'}
          </Button>
        </div>
      </section>

      {/* Section 4: Danger Zone */}
      <section>
        <h2 className="text-[14px] font-semibold mb-1" style={{ color: '#DC2626' }}>Danger Zone</h2>
        <div className="p-5 rounded-lg mt-2 space-y-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <Button variant="outline" onClick={handleSignOut} className="text-[13px]" style={{ borderColor: '#EF4444', color: '#EF4444' }}>
            Sign Out of All Sessions
          </Button>

          <Button variant="outline" className="text-[13px] block" style={{ borderColor: '#64748B', color: '#64748B' }}>
            Export All Hospital Data (CSV)
          </Button>

          {!showDeactivate ? (
            <Button onClick={() => setShowDeactivate(true)} className="text-[13px]" style={{ background: '#991B1B', color: '#fff' }}>
              Deactivate Hospital Account
            </Button>
          ) : (
            <div className="space-y-2 p-3 rounded-lg bg-white">
              <p className="text-[13px]" style={{ color: '#991B1B' }}>Type "<strong>{hospital.hospital_name}</strong>" to confirm:</p>
              <Input value={deactivateConfirm} onChange={e => setDeactivateConfirm(e.target.value)} className="text-[13px]" placeholder="Hospital name" />
              <div className="flex gap-2">
                <Button onClick={handleDeactivate} className="text-[13px]" style={{ background: '#991B1B', color: '#fff' }} disabled={deactivateConfirm !== hospital.hospital_name}>
                  Confirm Deactivation
                </Button>
                <Button variant="outline" onClick={() => { setShowDeactivate(false); setDeactivateConfirm(''); }} className="text-[13px]">Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HospitalSettings;
