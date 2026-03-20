import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface PharmaProtectedRouteProps {
  children: ReactNode;
  loading: boolean;
  authorized: boolean;
}

const PharmaProtectedRoute = ({ children, loading, authorized }: PharmaProtectedRouteProps) => {
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7FBFC]">
        <Loader2 className="w-10 h-10 animate-spin text-[#8B5CF6] mb-4" />
        <p className="text-sm font-medium text-[#64748B]">Verifying access...</p>
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/pharma/login" replace />;
  }

  return <>{children}</>;
};

export default PharmaProtectedRoute;
