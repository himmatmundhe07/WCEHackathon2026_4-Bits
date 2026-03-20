import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/landing/Navbar';
import AdminLoginModal from '@/components/landing/AdminLoginModal';
import { Shield } from 'lucide-react';

/* ─── SVG Helpers ─── */
const LotusIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <ellipse cx="8" cy="5" rx="2.5" ry="4" fill="#0891B2" opacity="0.9" />
    <ellipse cx="4.5" cy="8" rx="2.5" ry="3.5" fill="#0891B2" opacity="0.6" transform="rotate(-25 4.5 8)" />
    <ellipse cx="11.5" cy="8" rx="2.5" ry="3.5" fill="#0891B2" opacity="0.6" transform="rotate(25 11.5 8)" />
    <circle cx="8" cy="7.5" r="1.5" fill="#E8A820" />
  </svg>
);

const JharokhaArch = ({ color = '#E8A820', opacity = 0.2 }: { color?: string; opacity?: number }) => (
  <svg width="100%" height="18" viewBox="0 0 400 18" preserveAspectRatio="none" className="block">
    <rect x="8" y="3" width="3" height="15" rx="1" fill={color} fillOpacity={opacity} />
    <rect x="389" y="3" width="3" height="15" rx="1" fill={color} fillOpacity={opacity} />
    <path d="M50 18 Q120 18 160 6 Q190 0 200 0 Q210 0 240 6 Q280 18 350 18" fill="none" stroke={color} strokeOpacity={opacity} strokeWidth="1.5" />
    <circle cx="170" cy="4" r="1.5" fill={color} fillOpacity={opacity * 0.8} />
    <circle cx="200" cy="1.5" r="1.5" fill={color} fillOpacity={opacity * 0.8} />
    <circle cx="230" cy="4" r="1.5" fill={color} fillOpacity={opacity * 0.8} />
  </svg>
);

const MehraabDivider = () => (
  <div className="w-full" style={{ background: 'linear-gradient(to bottom, #F7FBFC, #FFFFFF)' }}>
    <svg width="100%" height="32" viewBox="0 0 900 32" preserveAspectRatio="none">
      <path d="M0 32 Q75 32 112 10 Q140 0 150 0 Q160 0 188 10 Q225 32 300 32" fill="none" stroke="#0891B2" strokeOpacity="0.12" strokeWidth="1.5" />
      <path d="M300 32 Q375 32 412 10 Q440 0 450 0 Q460 0 488 10 Q525 32 600 32" fill="none" stroke="#0891B2" strokeOpacity="0.12" strokeWidth="1.5" />
      <path d="M600 32 Q675 32 712 10 Q740 0 750 0 Q760 0 788 10 Q825 32 900 32" fill="none" stroke="#0891B2" strokeOpacity="0.12" strokeWidth="1.5" />
    </svg>
  </div>
);

/* ─── Hero Illustration Panel ─── */
const HeroIllustration = () => (
  <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden" style={{ background: '#EBF7FA' }}>
    {/* Jaali pattern at 8% */}
    <div className="absolute inset-0 jaali-pattern" style={{ opacity: 0.67 }} />
    <div className="relative z-10 flex items-center justify-center h-full p-10">
      <svg width="280" height="240" viewBox="0 0 280 240" fill="none">
        {/* QR Card */}
        <rect x="20" y="40" width="100" height="120" rx="12" fill="white" stroke="#0891B2" strokeWidth="1.5" />
        <rect x="35" y="60" width="70" height="70" rx="4" fill="#0891B2" fillOpacity="0.08" />
        <rect x="50" y="75" width="40" height="40" rx="2" fill="#0891B2" fillOpacity="0.15" />
        <rect x="58" y="83" width="24" height="24" rx="1" fill="#0891B2" fillOpacity="0.25" />
        <text x="70" y="150" textAnchor="middle" fill="#0891B2" fontSize="8" fontFamily="Inter">Emergency QR</text>
        {/* Hospital */}
        <rect x="150" y="20" width="90" height="100" rx="12" fill="white" stroke="#E8A820" strokeWidth="1.5" />
        <rect x="175" y="40" width="15" height="20" rx="2" fill="#0891B2" fillOpacity="0.2" />
        <rect x="200" y="40" width="15" height="20" rx="2" fill="#0891B2" fillOpacity="0.2" />
        <rect x="186" y="68" width="18" height="24" rx="2" fill="#E8A820" fillOpacity="0.3" />
        <rect x="183" y="35" width="24" height="4" rx="1" fill="#E8A820" fillOpacity="0.4" />
        <path d="M195 30l-3-6h6z" fill="#E8A820" fillOpacity="0.5" />
        <text x="195" y="108" textAnchor="middle" fill="#E8A820" fontSize="8" fontFamily="Inter">Hospital</text>
        {/* Patient card */}
        <rect x="140" y="140" width="110" height="80" rx="12" fill="white" stroke="#0891B2" strokeWidth="1.5" />
        <circle cx="170" cy="170" r="15" fill="#0891B2" fillOpacity="0.12" />
        <circle cx="170" cy="166" r="6" fill="#0891B2" fillOpacity="0.25" />
        <path d="M160 180 Q170 174 180 180" fill="#0891B2" fillOpacity="0.2" />
        <rect x="195" y="158" width="40" height="4" rx="2" fill="#0891B2" fillOpacity="0.15" />
        <rect x="195" y="168" width="30" height="3" rx="1.5" fill="#0891B2" fillOpacity="0.1" />
        <rect x="195" y="177" width="35" height="3" rx="1.5" fill="#0891B2" fillOpacity="0.1" />
        <text x="195" y="210" textAnchor="middle" fill="#0891B2" fontSize="8" fontFamily="Inter">Patient Profile</text>
        {/* Location pin */}
        <g transform="translate(60, 175)">
          <path d="M15 0C8 0 3 5 3 11c0 8 12 22 12 22s12-14 12-22c0-6-5-11-12-11z" fill="#E8A820" fillOpacity="0.2" stroke="#E8A820" strokeWidth="1" />
          <circle cx="15" cy="11" r="4" fill="#E8A820" fillOpacity="0.4" />
        </g>
      </svg>
    </div>
  </div>
);

/* ─── Removed User Type Card component ─── */

/* ─── Stats ─── */
const stats = [
  { number: '73 Cr+', labelKey: 'landing.stat1' },
  { number: '108', labelKey: 'landing.stat2' },
  { number: '24/7', labelKey: 'landing.stat3' },
  { number: 'ABDM', labelKey: 'landing.stat4' },
];

/* ─── How It Works ─── */
const steps = [
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="14" r="8" stroke="#0891B2" strokeWidth="1.5" fill="#0891B2" fillOpacity="0.08" />
        <path d="M8 34c0-6.6 5.4-12 12-12s12 5.4 12 12" stroke="#0891B2" strokeWidth="1.5" fill="none" />
      </svg>
    ),
    titleKey: 'landing.step1',
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="8" y="8" width="24" height="24" rx="4" stroke="#0891B2" strokeWidth="1.5" fill="#0891B2" fillOpacity="0.08" />
        <rect x="14" y="14" width="12" height="12" rx="1" fill="#0891B2" fillOpacity="0.15" />
        <rect x="17" y="17" width="6" height="6" fill="#0891B2" fillOpacity="0.25" />
      </svg>
    ),
    titleKey: 'landing.step2',
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="6" y="12" width="18" height="18" rx="4" stroke="#0891B2" strokeWidth="1.5" fill="#0891B2" fillOpacity="0.08" />
        <path d="M30 14l-4-6h8z" fill="#E8A820" fillOpacity="0.5" />
        <circle cx="30" cy="22" r="6" stroke="#E8A820" strokeWidth="1.5" fill="#E8A820" fillOpacity="0.08" />
        <circle cx="30" cy="22" r="2" fill="#E8A820" fillOpacity="0.3" />
      </svg>
    ),
    titleKey: 'landing.step3',
  },
];

const ArrowRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="hidden md:block mx-4 shrink-0">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ─── Main Landing Page ─── */
const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: '#F7FBFC' }}>
      <Navbar onAdminLogin={() => setAdminModalOpen(true)} onScrollToCards={() => navigate('/login')} />

      {/* Section 2 — Hero */}
      <section className="min-h-[88vh] flex items-center pt-16" style={{ background: '#F7FBFC' }}>
        <div className="w-full max-w-7xl mx-auto px-5 md:px-12 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.1em] mb-4" style={{ color: '#0891B2', fontFamily: 'Inter, sans-serif' }}>
                {t('landing.tagline')}
              </p>
              <h1 className="text-[34px] md:text-[52px] font-bold leading-[1.15] mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                {t('landing.heroTitle1')}<br />{t('landing.heroTitle2')}
              </h1>
              {/* Brand moment */}
              <div className="inline-block mb-5">
                <p className="text-base italic" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0891B2' }}>
                  {t('landing.poweredBy')}
                </p>
                <svg width="100%" height="6" viewBox="0 0 180 6" preserveAspectRatio="none" className="mt-0.5">
                  <line x1="6" y1="3" x2="174" y2="3" stroke="#E8A820" strokeOpacity="0.6" strokeWidth="1" />
                  <path d="M0 3l3-3 3 3-3 3z" fill="#E8A820" fillOpacity="0.6" />
                  <path d="M174 3l3-3 3 3-3 3z" fill="#E8A820" fillOpacity="0.6" />
                </svg>
              </div>
              <p className="text-[17px] leading-[1.7] mb-8" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
                {t('landing.heroDesc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button onClick={() => navigate('/login')} className="px-8 py-3.5 rounded-xl text-base font-bold text-white transition-all hover:opacity-90 shadow-lg flex items-center justify-center gap-2" style={{ background: '#0891B2', boxShadow: '0 4px 14px rgba(8, 145, 178, 0.3)' }}>
                  Access Sanjeevani Portal <span className="text-sm font-normal opacity-90 pl-1"> (Login / Register)</span> →
                </button>
                <button onClick={() => setAdminModalOpen(true)} className="px-8 py-3.5 rounded-xl text-base font-bold transition-all hover:opacity-90 flex items-center justify-center gap-2" style={{ border: '2px solid #1E293B', color: '#1E293B', background: 'transparent' }}>
                  Admin Login
                </button>
              </div>
              <p className="text-xs flex items-center gap-2 flex-wrap" style={{ color: '#94A3B8' }}>
                {t('landing.trusted')}
                <span className="w-1 h-1 rounded-full inline-block" style={{ background: '#0891B2' }} />
                {t('landing.abdmIntegrated')}
                <span className="w-1 h-1 rounded-full inline-block" style={{ background: '#0891B2' }} />
                {t('landing.abhaCompatible')}
              </p>
            </div>
            {/* Right */}
            <div className="hidden md:block">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Mehraab Divider */}
      <MehraabDivider />


      {/* Section 5 — Mandana Divider */}
      <div className="mandana-divider" style={{ margin: 0 }} />

      {/* Section 6 — Stats */}
      <section className="py-10 px-5 md:px-12" style={{ background: '#EBF7FA', borderTop: '1px solid #D1EBF1', borderBottom: '1px solid #D1EBF1' }}>
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className="text-center px-6 py-2 md:px-10">
                <p className="text-[28px] font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0891B2' }}>{s.number}</p>
                <p className="text-xs uppercase tracking-[0.06em]" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>{t(s.labelKey)}</p>
              </div>
              {i < stats.length - 1 && <div className="hidden md:block w-px h-10" style={{ background: '#D1EBF1' }} />}
            </div>
          ))}
        </div>
      </section>

      {/* Section 7 — How It Works */}
      <section className="py-16 px-5 md:px-12" style={{ background: '#FFFFFF' }}>
        <h2 className="text-[28px] font-bold text-center mb-12" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
          {t('landing.howItWorks')}
        </h2>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className="text-center px-6">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3" style={{ background: '#F7FBFC' }}>
                  {s.icon}
                </div>
                <p className="text-sm max-w-[160px] mx-auto" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>{t(s.titleKey)}</p>
              </div>
              {i < steps.length - 1 && <ArrowRight />}
            </div>
          ))}
        </div>
      </section>

      {/* Section 8 — Footer */}
      <footer style={{ background: '#1E293B' }} className="px-5 md:px-12 pt-12 pb-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <LotusIcon size={16} />
              <span className="text-base font-bold text-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Sanjeevani</span>
            </div>
            <p className="text-[13px] italic" style={{ color: '#94A3B8', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              {t('landing.footerTagline')}
            </p>
          </div>
          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">{t('landing.platform')}</h4>
            {['For Patients', 'For Hospitals', 'Emergency QR', 'ABHA Integration'].map(l => (
              <p key={l} className="text-[13px] mb-1.5 cursor-pointer transition-colors hover:text-white" style={{ color: '#94A3B8' }}>{l}</p>
            ))}
          </div>
          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">{t('landing.company')}</h4>
            {['About', 'Contact', 'Careers', 'Press'].map(l => (
              <p key={l} className="text-[13px] mb-1.5 cursor-pointer transition-colors hover:text-white" style={{ color: '#94A3B8' }}>{l}</p>
            ))}
          </div>
          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">{t('landing.legal')}</h4>
            {['Privacy Policy', 'Terms of Service', 'Data Security'].map(l => (
              <p key={l} className="text-[13px] mb-1.5 cursor-pointer transition-colors hover:text-white" style={{ color: '#94A3B8' }}>{l}</p>
            ))}
          </div>
        </div>
        <div className="border-t pt-6 text-center" style={{ borderColor: '#2D3F52' }}>
          <p className="text-xs" style={{ color: '#4B5563' }}>
            © 2025 Sanjeevani Health Pvt. Ltd. · Made with care in India 🇮🇳
          </p>
        </div>
      </footer>

      {/* Admin Login Modal */}
      <AdminLoginModal open={adminModalOpen} onClose={() => setAdminModalOpen(false)} />
    </div>
  );
};

export default LandingPage;
