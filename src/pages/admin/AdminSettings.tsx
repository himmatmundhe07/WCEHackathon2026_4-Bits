import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const AdminSettings = () => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || '');
        setDisplayName(user.user_metadata?.full_name || '');
      }
    });
  }, []);

  const handleUpdateProfile = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Profile updated');
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated');
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
  };

  const handleSignOutAll = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    sessionStorage.removeItem('admin_2fa_verified');
    window.location.href = '/';
  };

  const strengthLabel = newPassword.length === 0 ? '' : newPassword.length < 8 ? 'Weak' : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 'Strong' : 'Fair';
  const strengthColor = strengthLabel === 'Strong' ? '#10B981' : strengthLabel === 'Fair' ? '#F59E0B' : '#EF4444';
  const strengthWidth = strengthLabel === 'Strong' ? '100%' : strengthLabel === 'Fair' ? '60%' : newPassword.length > 0 ? '30%' : '0%';

  return (
    <div className="max-w-2xl space-y-6">
      {/* Admin Profile */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#64748B" />
        <div className="p-6">
          <h3 className="text-base font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Admin Profile</h3>
          <div className="mandana-divider" />
          <div className="space-y-4 mt-4">
            <div>
              <label className="field-label">Display Name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="field-input" />
            </div>
            <div>
              <label className="field-label">Email</label>
              <p className="text-[14px] py-2" style={{ color: '#64748B' }}>{email}</p>
            </div>
            <div>
              <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-md" style={{ background: '#0891B2', color: '#fff' }}>Platform Admin</span>
            </div>
            <button onClick={handleUpdateProfile} disabled={loading} className="px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: '#0891B2' }}>
              Update Profile
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#64748B" />
        <div className="p-6">
          <h3 className="text-base font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Change Password</h3>
          <div className="mandana-divider" />
          <div className="space-y-4 mt-4">
            <div>
              <label className="field-label">New Password</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="field-input pr-10" placeholder="Min 8 characters, 1 uppercase, 1 number" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E2EEF1' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: strengthWidth, background: strengthColor }} />
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: strengthColor }}>{strengthLabel}</p>
                </div>
              )}
            </div>
            <div>
              <label className="field-label">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="field-input" />
              {confirmPassword && confirmPassword !== newPassword && <p className="text-[12px] mt-1" style={{ color: '#EF4444' }}>Passwords do not match</p>}
            </div>
            <button onClick={handleUpdatePassword} disabled={loading || !newPassword || newPassword !== confirmPassword} className="px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: '#0891B2' }}>
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
        <div className="p-6">
          <h3 className="text-base font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Danger Zone</h3>
          <div className="mandana-divider" />
          <div className="space-y-3 mt-4">
            <button onClick={handleSignOutAll} className="w-full py-2.5 rounded-lg text-[13px] font-medium" style={{ border: '1px solid #EF4444', color: '#EF4444' }}>
              Sign Out of All Sessions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
