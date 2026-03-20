import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, CheckCircle, ArrowLeft, LockKeyhole } from 'lucide-react';

const JharokhaArch = () => (
  <svg width="100%" height="18" viewBox="0 0 400 18" preserveAspectRatio="none" className="block">
    <rect x="8" y="3" width="3" height="15" rx="1" fill="#0891B2" fillOpacity="0.18" />
    <rect x="389" y="3" width="3" height="15" rx="1" fill="#0891B2" fillOpacity="0.18" />
    <path d="M50 18 Q120 18 160 6 Q190 0 200 0 Q210 0 240 6 Q280 18 350 18" fill="none" stroke="#0891B2" strokeOpacity="0.18" strokeWidth="1.5" />
    <circle cx="170" cy="4" r="1.5" fill="#0891B2" fillOpacity="0.14" />
    <circle cx="200" cy="1.5" r="1.5" fill="#0891B2" fillOpacity="0.14" />
    <circle cx="230" cy="4" r="1.5" fill="#0891B2" fillOpacity="0.14" />
  </svg>
);

const LotusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <ellipse cx="8" cy="5" rx="2.5" ry="4" fill="#0891B2" opacity="0.9" />
    <ellipse cx="4.5" cy="8" rx="2.5" ry="3.5" fill="#0891B2" opacity="0.6" transform="rotate(-25 4.5 8)" />
    <ellipse cx="11.5" cy="8" rx="2.5" ry="3.5" fill="#0891B2" opacity="0.6" transform="rotate(25 11.5 8)" />
    <circle cx="8" cy="7.5" r="1.5" fill="#E8A820" />
  </svg>
);

const PatientResetPassword = () => {
  const navigate = useNavigate();
  const [sessionReady, setSessionReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user clicks the reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionReady(true);
      } else if (event === 'SIGNED_IN' && session) {
        // Also handle if already signed in via recovery token
        setSessionReady(true);
      }
    });

    // Also check if there's already a session (token already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    // If no event after 4s, the link is probably invalid or expired
    const timeout = setTimeout(() => {
      setSessionReady(prev => {
        if (!prev) setInvalidLink(true);
        return prev;
      });
    }, 4000);

    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setDone(true);
      toast.success('Password updated successfully!');
      setTimeout(() => navigate('/patient/login'), 2500);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const strength = (() => {
    if (!newPassword) return null;
    if (newPassword.length < 6) return { label: 'Too short', color: '#EF4444', width: '25%' };
    if (newPassword.length < 8) return { label: 'Weak', color: '#F59E0B', width: '45%' };
    if (/[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && newPassword.length >= 10) return { label: 'Strong', color: '#10B981', width: '100%' };
    return { label: 'Moderate', color: '#0891B2', width: '70%' };
  })();

  return (
    <div className="min-h-screen flex" style={{ background: '#F7FBFC' }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 items-center justify-center relative" style={{ background: '#EBF7FA' }}>
        <div className="absolute inset-0 jaali-pattern" style={{ opacity: 0.5 }} />
        <div className="relative z-10 text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(8,145,178,0.1)' }}>
            <LockKeyhole size={40} style={{ color: '#0891B2' }} />
          </div>
          <p className="text-base italic" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0E6685' }}>
            "Secure access to your health data."
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-[440px]">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#E2EEF1', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <JharokhaArch />
            <div className="p-10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <LotusIcon />
                <span className="text-sm" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#64748B' }}>Sanjeevani</span>
              </div>
              <div className="flex justify-center mb-6">
                <svg width="90" height="6" viewBox="0 0 90 6" preserveAspectRatio="none">
                  <line x1="6" y1="3" x2="84" y2="3" stroke="#E8A820" strokeOpacity="0.6" strokeWidth="1" />
                  <path d="M0 3l3-3 3 3-3 3z" fill="#E8A820" fillOpacity="0.6" />
                  <path d="M84 3l3-3 3 3-3 3z" fill="#E8A820" fillOpacity="0.6" />
                </svg>
              </div>

              {/* Done state */}
              {done ? (
                <div className="text-center py-4">
                  <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#10B981' }} />
                  <h2 className="text-xl font-bold mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Password Updated!</h2>
                  <p className="text-[14px]" style={{ color: '#64748B' }}>Redirecting you to login...</p>
                </div>

              ) : invalidLink ? (
                /* Invalid link state */
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FEF2F2' }}>
                    <LockKeyhole size={28} style={{ color: '#EF4444' }} />
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Invalid or Expired Link</h2>
                  <p className="text-[14px] mb-6" style={{ color: '#64748B' }}>
                    This password reset link is no longer valid. Please request a new one.
                  </p>
                  <button onClick={() => navigate('/patient/login')}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: '#0891B2' }}>
                    Back to Login
                  </button>
                </div>

              ) : !sessionReady ? (
                /* Loading state */
                <div className="text-center py-6">
                  <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: '#0891B2' }} />
                  <p className="text-[14px]" style={{ color: '#64748B' }}>Verifying reset link...</p>
                </div>

              ) : (
                /* Main form */
                <>
                  <h1 className="text-[26px] font-bold text-center mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                    Set New Password
                  </h1>
                  <p className="text-sm text-center mb-8" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
                    Choose a strong, secure password
                  </p>

                  {/* New password */}
                  <div className="mb-4">
                    <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#1E293B' }}>New Password</label>
                    <div className="relative">
                      <input className="field-input pr-10" type={showNew ? 'text' : 'password'}
                        value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()} />
                      <button type="button" onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-2.5 text-muted-foreground">
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Strength meter */}
                    {strength && (
                      <div className="mt-1.5">
                        <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-300" style={{ width: strength.width, background: strength.color }} />
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: strength.color }}>{strength.label}</p>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="mb-6">
                    <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#1E293B' }}>Confirm Password</label>
                    <div className="relative">
                      <input className="field-input pr-10" type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()} />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-2.5 text-muted-foreground">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[11px] mt-1" style={{ color: '#EF4444' }}>Passwords do not match</p>
                    )}
                    {confirmPassword && newPassword === confirmPassword && (
                      <p className="text-[11px] mt-1" style={{ color: '#10B981' }}>✓ Passwords match</p>
                    )}
                  </div>

                  <button onClick={handleResetPassword} disabled={saving}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: '#0891B2' }}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update Password'}
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="text-center mt-4">
            <button onClick={() => navigate('/patient/login')} className="inline-flex items-center gap-1 text-xs hover:underline" style={{ color: '#64748B' }}>
              <ArrowLeft className="w-3 h-3" /> Back to login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientResetPassword;
