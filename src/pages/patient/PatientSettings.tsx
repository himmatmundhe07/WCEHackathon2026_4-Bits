import { useState } from 'react';
import { usePatientContext } from '@/hooks/usePatientContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

const PatientSettings = () => {
  const { patient } = usePatientContext();
  const navigate = useNavigate();

  // Personal
  const [fullName, setFullName] = useState(patient.full_name || '');
  const [dob, setDob] = useState(patient.date_of_birth || '');
  const [gender, setGender] = useState(patient.gender || '');
  const [bloodGroup, setBloodGroup] = useState(patient.blood_group || '');
  const [phone, setPhone] = useState(patient.phone || '');

  // Address
  const [address, setAddress] = useState(patient.address || '');
  const [city, setCity] = useState(patient.city || '');
  const [state, setState] = useState(patient.state || '');
  const [pinCode, setPinCode] = useState(patient.pin_code || '');

  // Medical
  const [allergies, setAllergies] = useState<string[]>(patient.allergies || []);
  const [newAllergy, setNewAllergy] = useState('');
  const [conditions, setConditions] = useState<string[]>(patient.chronic_conditions || []);
  const [newCondition, setNewCondition] = useState('');

  // Emergency
  const [emergencyName, setEmergencyName] = useState(patient.emergency_contact_name || '');
  const [emergencyRelation, setEmergencyRelation] = useState(patient.emergency_contact_relation || '');
  const [emergencyPhone, setEmergencyPhone] = useState(patient.emergency_contact_phone || '');

  // Saving state
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingMedical, setSavingMedical] = useState(false);
  const [savingEmergency, setSavingEmergency] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const maskedAadhaar = patient.aadhaar_number ? `XXXX-XXXX-${patient.aadhaar_number.slice(-4)}` : 'Not set';

  const handleUpdatePersonal = async () => {
    setSavingPersonal(true);
    try {
      const { error } = await supabase.from('patients').update({
        full_name: fullName,
        date_of_birth: dob || null,
        gender: gender || null,
        blood_group: bloodGroup || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pin_code: pinCode || null,
      }).eq('id', patient.id);
      if (error) throw error;
      toast.success('Personal details updated');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleUpdateMedical = async () => {
    setSavingMedical(true);
    try {
      const { error } = await supabase.from('patients').update({
        allergies,
        chronic_conditions: conditions,
      }).eq('id', patient.id);
      if (error) throw error;
      toast.success('Medical info updated');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingMedical(false);
    }
  };

  const handleUpdateEmergency = async () => {
    setSavingEmergency(true);
    try {
      const { error } = await supabase.from('patients').update({
        emergency_contact_name: emergencyName || null,
        emergency_contact_relation: emergencyRelation || null,
        emergency_contact_phone: emergencyPhone || null,
      }).eq('id', patient.id);
      if (error) throw error;
      toast.success('Emergency contact updated');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingEmergency(false);
    }
  };

  const addAllergy = () => {
    const val = newAllergy.trim();
    if (val && !allergies.includes(val)) { setAllergies([...allergies, val]); }
    setNewAllergy('');
  };

  const addCondition = () => {
    const val = newCondition.trim();
    if (val && !conditions.includes(val)) { setConditions([...conditions, val]); }
    setNewCondition('');
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setChangingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setChangingPw(false);
    }
  };

  const handleSignOutAll = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    navigate('/patient/login');
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('Type DELETE to confirm account deletion');
    if (confirmation !== 'DELETE') return;
    toast.error('Account deletion requires admin support. Please contact support@sanjeevani.in');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Personal Profile */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#0891B2" opacity={0.18} />
        <div className="p-6">
          <h3 className="text-base font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Personal Profile</h3>
          <hr className="mandana-divider" />
          <div className="space-y-3">
            <div>
              <label className="field-label">Full Name</label>
              <input className="field-input" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Date of Birth</label>
                <input className="field-input" type="date" value={dob} onChange={e => setDob(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Gender</label>
                <select className="field-input" value={gender} onChange={e => setGender(e.target.value)}>
                  <option value="">Select...</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Blood Group</label>
                <select className="field-input" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
                  <option value="">Select...</option>
                  {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Phone</label>
                <input className="field-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
            </div>

            <div>
              <label className="field-label">Address</label>
              <input className="field-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="House no, Street, Area" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="field-label">City</label>
                <input className="field-input" value={city} onChange={e => setCity(e.target.value)} />
              </div>
              <div>
                <label className="field-label">State</label>
                <input className="field-input" value={state} onChange={e => setState(e.target.value)} />
              </div>
              <div>
                <label className="field-label">PIN Code</label>
                <input className="field-input" value={pinCode} onChange={e => setPinCode(e.target.value)} />
              </div>
            </div>

            <button onClick={handleUpdatePersonal} disabled={savingPersonal}
              className="px-6 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50 flex items-center gap-2" style={{ background: '#0891B2' }}>
              {savingPersonal ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Update Personal Details'}
            </button>
          </div>
        </div>
      </div>

      {/* Medical Information */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#F59E0B" opacity={0.18} />
        <div className="p-6">
          <h3 className="text-base font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Medical Information</h3>
          <hr className="mandana-divider" />

          {/* Allergies */}
          <div className="mb-4">
            <label className="field-label">Allergies</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {allergies.map(a => (
                <span key={a} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium" style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}>
                  ⚠️ {a}
                  <button onClick={() => setAllergies(allergies.filter(x => x !== a))} className="hover:opacity-70"><X size={12} /></button>
                </span>
              ))}
              {allergies.length === 0 && <span className="text-[12px] italic" style={{ color: '#94A3B8' }}>No allergies recorded</span>}
            </div>
            <div className="flex gap-2">
              <input className="field-input flex-1" placeholder="e.g. Penicillin, Peanuts" value={newAllergy}
                onChange={e => setNewAllergy(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); } }} />
              <button onClick={addAllergy} className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-white" style={{ background: '#EF4444' }}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Chronic Conditions */}
          <div className="mb-4">
            <label className="field-label">Chronic Conditions</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {conditions.map(c => (
                <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium" style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
                  {c}
                  <button onClick={() => setConditions(conditions.filter(x => x !== c))} className="hover:opacity-70"><X size={12} /></button>
                </span>
              ))}
              {conditions.length === 0 && <span className="text-[12px] italic" style={{ color: '#94A3B8' }}>No conditions recorded</span>}
            </div>
            <div className="flex gap-2">
              <input className="field-input flex-1" placeholder="e.g. Diabetes, Hypertension" value={newCondition}
                onChange={e => setNewCondition(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCondition(); } }} />
              <button onClick={addCondition} className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-white" style={{ background: '#D97706' }}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <button onClick={handleUpdateMedical} disabled={savingMedical}
            className="px-6 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50 flex items-center gap-2" style={{ background: '#F59E0B', color: '#1E293B' }}>
            {savingMedical ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Update Medical Info'}
          </button>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#EF4444" opacity={0.18} />
        <div className="p-6">
          <h3 className="text-base font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Emergency Contact</h3>
          <hr className="mandana-divider" />
          <div className="space-y-3">
            <div>
              <label className="field-label">Contact Name</label>
              <input className="field-input" value={emergencyName} onChange={e => setEmergencyName(e.target.value)} placeholder="e.g. Rajesh Kumar" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Relation</label>
                <select className="field-input" value={emergencyRelation} onChange={e => setEmergencyRelation(e.target.value)}>
                  <option value="">Select...</option>
                  {['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Son', 'Daughter', 'Friend', 'Other'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Phone Number</label>
                <input className="field-input" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
            </div>
            <button onClick={handleUpdateEmergency} disabled={savingEmergency}
              className="px-6 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50 flex items-center gap-2" style={{ background: '#EF4444' }}>
              {savingEmergency ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Update Emergency Contact'}
            </button>
          </div>
        </div>
      </div>

      {/* Identity & ABHA */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#64748B" opacity={0.18} />
        <div className="p-6">
          <h3 className="text-base font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Identity & ABHA</h3>
          <hr className="mandana-divider" />
          <div className="space-y-3">
            <div>
              <label className="field-label">ABHA Card Number</label>
              <div className="flex items-center gap-2">
                <input className="field-input flex-1 opacity-60" value={patient.abha_card_no || 'Not linked'} readOnly />
                {patient.abha_card_no && <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: '#10B981', color: '#fff' }}>Verified</span>}
              </div>
            </div>
            <div>
              <label className="field-label">Aadhaar</label>
              <input className="field-input opacity-60" value={maskedAadhaar} readOnly />
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#64748B" opacity={0.18} />
        <div className="p-6">
          <h3 className="text-base font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Change Password</h3>
          <hr className="mandana-divider" />
          <div className="space-y-3">
            <div>
              <label className="field-label">New Password</label>
              <input className="field-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Confirm New Password</label>
              <input className="field-input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <button onClick={handleChangePassword} disabled={changingPw}
              className="px-6 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: '#0891B2' }}>
              {changingPw ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>

      {/* Privacy & Data */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#0891B2" opacity={0.18} />
        <div className="p-6">
          <h3 className="text-base font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Privacy & Data</h3>
          <hr className="mandana-divider" />
          <div className="p-3 rounded-lg text-[13px]" style={{ background: '#EBF7FA', color: '#0891B2' }}>
            Your emergency QR shows only: Blood group, allergies, emergency contact, and active medications.
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl p-6" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
        <h3 className="text-base font-bold mb-3" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Danger Zone</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleSignOutAll} className="px-4 py-2 rounded-lg text-[13px] font-medium" style={{ border: '1px solid #EF4444', color: '#EF4444' }}>
            Sign Out of All Sessions
          </button>
          <button onClick={handleDeleteAccount} className="px-4 py-2 rounded-lg text-[13px] font-medium" style={{ border: '1px solid #7F1D1D', color: '#7F1D1D' }}>
            Delete My Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientSettings;
