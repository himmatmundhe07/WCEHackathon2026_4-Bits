import { Loader2 } from 'lucide-react';

const HospitalProtectedRoute = ({ loading, authorized, children }: { loading: boolean; authorized: boolean; children: React.ReactNode }) => {
  if (loading && !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7FBFC' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#F59E0B' }} />
      </div>
    );
  }
  if (!authorized) return null;
  return <>{children}</>;
};

export default HospitalProtectedRoute;
