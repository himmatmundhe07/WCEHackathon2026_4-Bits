import { Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7FBFC' }}>
      <div className="bg-white rounded-xl border p-10 text-center max-w-md mx-4 shadow-sm" style={{ borderColor: '#E2EEF1' }}>
        <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-5" style={{ background: '#FEF3C7' }}>
          <Clock size={28} style={{ color: '#E8A820' }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
          Coming Soon
        </h2>
        <p className="text-sm mb-6" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
          This feature is coming soon. We'll notify you when it's ready.
        </p>
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80" style={{ color: '#0891B2' }}>
          <ArrowLeft size={16} /> Back to Home
        </button>
      </div>
    </div>
  );
};

export default ComingSoon;
