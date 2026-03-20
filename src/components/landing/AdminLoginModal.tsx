import { useState } from 'react';
import { X, Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';


interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
}

const JharokhaArch = () => (
  <svg width="100%" height="18" viewBox="0 0 400 18" preserveAspectRatio="none" className="block">
    <rect x="8" y="3" width="3" height="15" rx="1" fill="#64748B" fillOpacity="0.2" />
    <rect x="389" y="3" width="3" height="15" rx="1" fill="#64748B" fillOpacity="0.2" />
    <path d="M50 18 Q120 18 160 6 Q190 0 200 0 Q210 0 240 6 Q280 18 350 18" fill="none" stroke="#64748B" strokeOpacity="0.2" strokeWidth="1.5" />
    <circle cx="170" cy="4" r="1.5" fill="#64748B" fillOpacity="0.15" />
    <circle cx="200" cy="1.5" r="1.5" fill="#64748B" fillOpacity="0.15" />
    <circle cx="230" cy="4" r="1.5" fill="#64748B" fillOpacity="0.15" />
  </svg>
);

const AdminLoginModal = ({ open, onClose }: AdminLoginModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  if (!open) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check if user is admin
      const role = data.user?.user_metadata?.role;
      if (role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin credentials required.');
      }

      sessionStorage.setItem('admin_2fa_verified', 'true');
      toast.success('Admin login successful');
      onClose();
      navigate('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="bg-white rounded-xl w-full max-w-[400px] mx-4 shadow-2xl overflow-hidden relative">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors z-10" style={{ color: '#64748B' }}>
          <X size={18} />
        </button>

        <JharokhaArch />

        <div className="p-6 pt-4">
          {/* Shield icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#F1F5F9' }}>
              <Shield size={28} style={{ color: '#64748B' }} />
            </div>
          </div>

          <h2 className="text-xl font-bold text-center mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
            Admin Access
          </h2>
          <p className="text-[13px] text-center mb-6" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
            Restricted to authorised Sanjeevani personnel only.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1E293B' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sanjeevani.health"
                className="field-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1E293B' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="field-input pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: '#1E293B' }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Login'}
            </button>
          </form>

          <p className="text-xs text-center mt-4 italic" style={{ color: '#94A3B8' }}>
            Forgot credentials? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginModal;
