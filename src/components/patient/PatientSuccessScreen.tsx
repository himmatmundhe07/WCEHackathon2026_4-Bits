import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface PatientSuccessScreenProps {
  patientId: string | null;
  email: string;
}

const PatientSuccessScreen = ({ patientId, email }: PatientSuccessScreenProps) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          navigate('/patient/dashboard');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0FDF4' }}>
      <div className="bg-white rounded-xl shadow-sm border p-10 max-w-md mx-4 text-center" style={{ borderColor: '#E2EEF1' }}>
        {/* Rangoli glow */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="rangoli-glow absolute inset-0 m-auto" style={{ width: 200, height: 200, top: -38, left: -38 }} />
          <div className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(8,145,178,0.1))' }}>
            <svg viewBox="0 0 52 52" className="w-14 h-14">
              <circle cx="26" cy="26" r="25" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.3" />
              <path className="draw-checkmark" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M14 27l8 8 16-16" />
            </svg>
          </div>
        </div>

        <h2 className="text-[26px] font-bold mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
          Welcome to Sanjeevani!
        </h2>
        <p className="text-[15px] mb-4" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
          Your health profile has been created.<br />
          A confirmation email has been sent to your inbox.
        </p>

        {patientId && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(8,145,178,0.08)', border: '1px solid rgba(8,145,178,0.2)' }}>
            <span className="text-[11px] uppercase tracking-wider" style={{ color: '#64748B' }}>Your Patient ID</span>
            <span className="text-sm font-mono font-bold" style={{ color: '#0891B2' }}>
              {patientId.slice(0, 8).toUpperCase()}
            </span>
          </div>
        )}

        <div className="mb-4">
          <button onClick={() => navigate('/patient/dashboard')}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#0891B2' }}>
            Go to My Dashboard →
          </button>
        </div>

        <p className="text-xs" style={{ color: '#94A3B8' }}>
          Redirecting in {countdown}...
        </p>
      </div>
    </div>
  );
};

export default PatientSuccessScreen;
