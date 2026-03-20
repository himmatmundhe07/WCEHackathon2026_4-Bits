import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, ArrowLeft, User, Building2, Pill, ShieldCheck } from 'lucide-react';
import GlobalLanguageSwitcher from '@/components/GlobalLanguageSwitcher';
import AdminLoginModal from '@/components/landing/AdminLoginModal';

/* ─── SVG Helpers ─── */
const JharokhaArch = ({ color = '#0891B2' }: { color?: string }) => (
  <svg width="100%" height="18" viewBox="0 0 400 18" preserveAspectRatio="none" className="block">
    <rect x="8" y="3" width="3" height="15" rx="1" fill={color} fillOpacity="0.18" />
    <rect x="389" y="3" width="3" height="15" rx="1" fill={color} fillOpacity="0.18" />
    <path d="M50 18 Q120 18 160 6 Q190 0 200 0 Q210 0 240 6 Q280 18 350 18" fill="none" stroke={color} strokeOpacity="0.18" strokeWidth="1.5" />
    <circle cx="170" cy="4" r="1.5" fill={color} fillOpacity="0.14" />
    <circle cx="200" cy="1.5" r="1.5" fill={color} fillOpacity="0.14" />
    <circle cx="230" cy="4" r="1.5" fill={color} fillOpacity="0.14" />
  </svg>
);

const LotusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <ellipse cx="8" cy="5" rx="2.5" ry="4" fill="#0891B2" opacity="0.9" />
    <ellipse cx="4.5" cy="8" rx="2.5" ry="3.5" fill="#0891B2" opacity="0.6" transform="rotate(-25 4.5 8)" />
    <ellipse cx="11.5" cy="8" rx="2.5" ry="3.5" fill="#0891B2" opacity="0.6" transform="rotate(25 11.5 8)" />
    <circle cx="8" cy="7.5" r="1.5" fill="#E8A820" />
  </svg>
);

/* ─── Role config ─── */
type Role = 'patient' | 'hospital' | 'pharma';

const ROLES: { key: Role; icon: typeof User; color: string; bg: string; signupPath: string }[] = [
  { key: 'patient',  icon: User,      color: '#0891B2', bg: '#EBF7FA', signupPath: '/patient/signup' },
  { key: 'hospital', icon: Building2,  color: '#F59E0B', bg: '#FFFBEB', signupPath: '/register' },
  { key: 'pharma',   icon: Pill,       color: '#8B5CF6', bg: '#F5F3FF', signupPath: '/pharma/registration' },
];

/* ─── Main Unified Login ─── */
const UnifiedLogin = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  
  // Auto-detect role from URL path or query param
  const detectRole = (): Role => {
    const path = window.location.pathname;
    if (path.includes('/hospital')) return 'hospital';
    if (path.includes('/pharma')) return 'pharma';
    const paramRole = searchParams.get('role') as Role;
    if (paramRole && ['patient', 'hospital', 'pharma'].includes(paramRole)) return paramRole;
    return 'patient';
  };

  const [role, setRole] = useState<Role>(detectRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  const activeRole = ROLES.find(r => r.key === role)!;

  const roleLabels: Record<Role, string> = {
    patient: t('landing.patientTitle'),
    hospital: t('landing.hospitalTitle'),
    pharma: t('landing.pharmaTitle'),
  };

  const roleSubtitles: Record<Role, string> = {
    patient: 'Log in to your health profile',
    hospital: 'Sign in to your hospital dashboard',
    pharma: 'Sign in to your pharmacy dashboard',
  };

  const emailPlaceholders: Record<Role, string> = {
    patient: 'your.email@example.com',
    hospital: 'admin@yourhospital.com',
    pharma: 'contact@pharmacy.com',
  };

  /* ─── Login handler ─── */
  const handleLogin = async () => {
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('not confirmed')) {
          toast.error('Please verify your email first. Check your inbox for the confirmation link.');
        } else {
          toast.error('Incorrect email or password.');
        }
        return;
      }

      if (role === 'patient') {
        const { data: patient } = await supabase.from('patients').select('id').eq('supabase_user_id', data.user.id).single();
        if (patient) {
          toast.success('Welcome back!');
          navigate('/patient/dashboard');
        } else {
          toast.error('No patient account found for this email.');
        }
      } else if (role === 'hospital') {
        const userRole = data.user?.user_metadata?.role;
        if (userRole !== 'hospital' && userRole !== 'hospital_admin') {
          const { data: fallbackHospital } = await supabase.from('hospitals').select('id').eq('admin_email', email).maybeSingle();
          if (!fallbackHospital) {
            toast.error('This account is not registered as a hospital.');
            await supabase.auth.signOut();
            return;
          }
        }
        const { data: hospital } = await supabase.from('hospitals').select('id, verification_status').or(`supabase_user_id.eq.${data.user.id},admin_email.eq.${email}`).single();
        if (!hospital) {
          toast.error('No hospital profile found. Please register first.');
          await supabase.auth.signOut();
          return;
        }
        if (hospital.verification_status === 'Pending') navigate('/hospital/pending');
        else if (hospital.verification_status === 'Rejected') navigate('/hospital/rejected');
        else { toast.success('Welcome back!'); navigate('/hospital/dashboard'); }
      } else if (role === 'pharma') {
        const userRole = data.user?.user_metadata?.role;
        if (userRole !== 'pharma') {
          toast.error('This account is not registered as a pharmacy.');
          await supabase.auth.signOut();
          return;
        }
        toast.success('Welcome back!');
        navigate('/pharma/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Forgot password ─── */
  const handleForgotPassword = async () => {
    if (!forgotEmail) { toast.error('Please enter your email'); return; }
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/${role}/reset-password`,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset link');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#F7FBFC' }}>
      {/* Left illustration panel — desktop only */}
      <div className="hidden lg:flex w-1/2 items-center justify-center relative transition-colors duration-300" style={{ background: activeRole.bg }}>
        <div className="absolute inset-0 jaali-pattern" style={{ opacity: 0.5 }} />
        <div className="relative z-10 text-center">
          {/* Dynamic illustration based on role */}
          <div className="w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-6 transition-all duration-300"
            style={{ background: 'white', boxShadow: `0 8px 32px ${activeRole.color}22` }}>
            <activeRole.icon size={48} style={{ color: activeRole.color }} strokeWidth={1.5} />
          </div>
          <p className="text-xl font-bold mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: activeRole.color }}>
            {roleLabels[role]}
          </p>
          <p className="text-sm italic max-w-[260px] mx-auto" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#64748B' }}>
            "Your health, always within reach."
          </p>
        </div>
      </div>

      {/* Right — Login Card */}
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-[460px]">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#E2EEF1', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <JharokhaArch color={activeRole.color} />

            <div className="p-8 sm:p-10">
              {/* Logo + language */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <LotusIcon />
                  <span className="text-sm" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#64748B' }}>Sanjeevani</span>
                </div>
                <GlobalLanguageSwitcher />
              </div>
              <div className="flex justify-center mb-6">
                <svg width="90" height="6" viewBox="0 0 90 6" preserveAspectRatio="none">
                  <line x1="6" y1="3" x2="84" y2="3" stroke="#E8A820" strokeOpacity="0.6" strokeWidth="1" />
                  <path d="M0 3l3-3 3 3-3 3z" fill="#E8A820" fillOpacity="0.6" />
                  <path d="M84 3l3-3 3 3-3 3z" fill="#E8A820" fillOpacity="0.6" />
                </svg>
              </div>

              {/* Role Tabs */}
              <div className="flex rounded-lg p-1 mb-6" style={{ background: '#F1F5F9' }}>
                {ROLES.map(r => (
                  <button
                    key={r.key}
                    onClick={() => { setRole(r.key); setShowForgot(false); setForgotSent(false); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-[13px] font-semibold transition-all"
                    style={{
                      background: role === r.key ? 'white' : 'transparent',
                      color: role === r.key ? r.color : '#94A3B8',
                      boxShadow: role === r.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    <r.icon size={15} />
                    <span className="hidden sm:inline">{r.key === 'patient' ? t('navbar.forPatients').replace(/^(For |.*खातर|.*माटे|.*साठी|.*लिए)/, '') : r.key === 'hospital' ? 'Hospital' : 'Pharma'}</span>
                  </button>
                ))}
              </div>

              <h1 className="text-[24px] font-bold text-center mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                Welcome Back
              </h1>
              <p className="text-sm text-center mb-6" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
                {roleSubtitles[role]}
              </p>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#1E293B', fontFamily: 'Inter, sans-serif' }}>
                  Email Address
                </label>
                <input className="field-input" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder={emailPlaceholders[role]}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
              </div>

              {/* Password */}
              <div className="mb-2">
                <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#1E293B', fontFamily: 'Inter, sans-serif' }}>
                  Password
                </label>
                <div className="relative">
                  <input className="field-input pr-10" type={showPassword ? 'text' : 'password'}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot link */}
              <div className="text-right mb-6">
                <button onClick={() => { setShowForgot(!showForgot); setForgotEmail(email); }}
                  className="text-[13px] font-medium hover:underline" style={{ color: activeRole.color }}>
                  Forgot your password?
                </button>
              </div>

              {/* Forgot password panel */}
              {showForgot && (
                <div className="mb-6 p-4 rounded-lg animate-fade-up" style={{ background: activeRole.bg, border: `1px solid ${activeRole.color}33` }}>
                  {forgotSent ? (
                    <p className="text-sm font-medium text-center" style={{ color: '#10B981' }}>
                      ✅ Reset link sent! Check your inbox.
                    </p>
                  ) : (
                    <>
                      <p className="text-base font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                        Reset your password
                      </p>
                      <p className="text-[13px] mb-3" style={{ color: '#64748B' }}>
                        Enter your email and we'll send you a reset link.
                      </p>
                      <input className="field-input mb-3" type="email" value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)} placeholder={emailPlaceholders[role]} />
                      <button onClick={handleForgotPassword} disabled={forgotLoading}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold border transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ borderColor: activeRole.color, color: activeRole.color, background: 'white' }}>
                        {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send Reset Link'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Login button */}
              <button onClick={handleLogin} disabled={isLoading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 mb-6"
                style={{ background: activeRole.color }}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Log In'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px" style={{ background: '#E2EEF1' }} />
                <span className="text-xs" style={{ color: '#94A3B8' }}>or</span>
                <div className="flex-1 h-px" style={{ background: '#E2EEF1' }} />
              </div>

              {/* Create account / Register */}
              <p className="text-sm text-center" style={{ color: activeRole.color, fontFamily: 'Inter, sans-serif' }}>
                <button onClick={() => navigate(activeRole.signupPath)} className="font-medium hover:underline">
                  {role === 'patient' ? 'Create a new account →' : role === 'hospital' ? 'Register your hospital →' : 'Register your pharmacy →'}
                </button>
              </p>
            </div>
          </div>

          {/* Admin Login / Back home */}
          <div className="flex items-center justify-between mt-4 px-2">
            <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline" style={{ color: '#64748B' }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back to home
            </button>
            <button onClick={() => setAdminModalOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline" style={{ color: '#1E293B' }}>
              <ShieldCheck className="w-4 h-4" /> Admin Login
            </button>
          </div>
        </div>
      </div>
      
      {/* Admin Login Modal */}
      <AdminLoginModal open={adminModalOpen} onClose={() => setAdminModalOpen(false)} />
    </div>
  );
};

export default UnifiedLogin;
