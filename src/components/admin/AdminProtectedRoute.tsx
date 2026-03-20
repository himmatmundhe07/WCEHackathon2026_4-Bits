import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/', { replace: true });
        return;
      }

      if (user.user_metadata?.role !== 'admin') {
        navigate('/', { replace: true });
        return;
      }

      const twoFaDone = sessionStorage.getItem('admin_2fa_verified');
      if (!twoFaDone) {
        navigate('/', { replace: true });
        return;
      }

      setAuthorized(true);
      setLoading(false);
    };

    checkAdmin();
  }, [navigate]);

  if (loading && !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7FBFC' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#0891B2' }} />
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
};

export default AdminProtectedRoute;
