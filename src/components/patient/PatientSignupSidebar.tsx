import { PATIENT_STEPS } from '@/types/patient';

interface PatientSignupSidebarProps {
  currentStep: number;
}

/* Patachitra completion icons — same style as hospital registration */
const PatachitraIcons: Record<number, React.ReactNode> = {
  1: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="8" r="5" fill="#0891B2" opacity="0.8" />
      <path d="M4 18c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="none" stroke="#0891B2" strokeWidth="1.5" />
      <path d="M14 5l1.5 2-1.5 2-1.5-2z" fill="#E8A820" />
    </svg>
  ),
  2: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 1C6.5 1 4 3.5 4 7c0 4.5 6 12 6 12s6-7.5 6-12c0-3.5-2.5-6-6-6z" fill="#0891B2" opacity="0.85" />
      <circle cx="10" cy="7" r="2.5" fill="#E8A820" />
    </svg>
  ),
  3: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="6" width="14" height="10" rx="2" fill="#0891B2" opacity="0.7" />
      <path d="M10 8l5 3-5 3V8z" fill="#E8A820" />
    </svg>
  ),
  4: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2C7 5 5 9 6 14c.5 2 2 4 4 5" stroke="#0891B2" strokeWidth="1.5" fill="none" />
      <ellipse cx="9" cy="8" rx="4" ry="6" fill="#0891B2" opacity="0.3" />
      <ellipse cx="9" cy="7.5" rx="1.2" ry="2" fill="#E8A820" />
    </svg>
  ),
  5: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <ellipse cx="10" cy="15" rx="5" ry="2" fill="#0891B2" opacity="0.8" />
      <ellipse cx="10" cy="6" rx="1.5" ry="3" fill="#E8A820" opacity="0.9" />
      <line x1="10" y1="9" x2="10" y2="13" stroke="#E8A820" strokeWidth="1" />
    </svg>
  ),
};

const MehraabBullet = () => (
  <svg width="12" height="14" viewBox="0 0 12 14" fill="#0891B2">
    <path d="M0 14V4C0 1.8 2.7 0 6 0s6 1.8 6 4v10H0z" />
  </svg>
);

const PatientSignupSidebar = ({ currentStep }: PatientSignupSidebarProps) => (
  <aside className="hidden lg:flex flex-col w-[280px] min-h-screen fixed left-0 top-0" style={{ background: '#EBF7FA' }}>
    <div className="absolute inset-0 jaali-pattern" style={{ opacity: 0.67 }} />
    <div className="absolute right-0 top-0 bottom-0 w-px" style={{ background: '#D1EBF1' }} />

    <div className="relative z-10 flex flex-col h-full p-7">
      {/* Logo */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <ellipse cx="8" cy="5" rx="2.5" ry="4" fill="#0891B2" opacity="0.9" />
            <ellipse cx="4.5" cy="8" rx="2.5" ry="3.5" fill="#0891B2" opacity="0.6" transform="rotate(-25 4.5 8)" />
            <ellipse cx="11.5" cy="8" rx="2.5" ry="3.5" fill="#0891B2" opacity="0.6" transform="rotate(25 11.5 8)" />
            <circle cx="8" cy="7.5" r="1.5" fill="#E8A820" />
          </svg>
          <span className="text-lg font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Sanjeevani</span>
        </div>
        <svg width="120" height="6" viewBox="0 0 120 6" preserveAspectRatio="none" className="mt-0.5">
          <line x1="6" y1="3" x2="114" y2="3" stroke="#E8A820" strokeOpacity="0.6" strokeWidth="1" />
          <path d="M0 3l3-3 3 3-3 3z" fill="#E8A820" fillOpacity="0.6" />
          <path d="M114 3l3-3 3 3-3 3z" fill="#E8A820" fillOpacity="0.6" />
        </svg>
      </div>

      {/* Page title */}
      <h2 className="text-[22px] font-bold mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
        Create Your Health Profile
      </h2>
      <p className="text-[13px] leading-relaxed mb-8" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
        Your health information, always secure and always accessible when it matters most.
      </p>

      {/* Step list */}
      <nav className="flex-1">
        <ul className="space-y-1">
          {PATIENT_STEPS.map((s) => {
            const isActive = currentStep === s.number;
            const isCompleted = currentStep > s.number;
            return (
              <li key={s.number}>
                <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${isActive ? 'bg-white/60' : ''}`}>
                  <span className="flex items-center justify-center w-7 h-7 shrink-0">
                    {isCompleted ? (
                      PatachitraIcons[s.number]
                    ) : isActive ? (
                      <MehraabBullet />
                    ) : (
                      <span className="flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold"
                        style={{ background: '#D1EBF1', color: '#94A3B8' }}>
                        {s.number}
                      </span>
                    )}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold leading-tight ${isActive || isCompleted ? 'text-[#1E293B]' : 'text-[#94A3B8]'}`}
                      style={{ fontFamily: 'Inter, sans-serif' }}>
                      {s.title}
                    </p>
                    <p className={`text-[11px] ${isActive ? 'text-[#64748B]' : 'text-[#CBD5E1]'}`}>
                      {s.description}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="mt-auto">
        <svg width="100%" height="28" viewBox="0 0 240 28" preserveAspectRatio="xMidYMid meet" className="mb-2">
          <path d="M0 28 Q60 28 85 10 Q110 0 120 0 Q130 0 155 10 Q180 28 240 28Z" fill="none" stroke="#0891B2" strokeOpacity="0.12" strokeWidth="1.5" />
        </svg>
        <p className="text-xs italic text-center" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
          Your information helps save lives.
        </p>
      </div>
    </div>
  </aside>
);

export default PatientSignupSidebar;
