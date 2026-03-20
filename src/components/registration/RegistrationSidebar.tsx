import { STEPS } from '@/types/registration';
import sanjeevaniLogo from '@/assets/sanjeevani-logo.png';

interface RegistrationSidebarProps {
  currentStep: number;
}

/* Element 5 — Patachitra step completion icons (flat 2-color SVGs) */
const PatachitraIcons: Record<number, React.ReactNode> = {
  // Step 1: Lotus flower
  1: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <ellipse cx="10" cy="7" rx="3" ry="5" fill="#0891B2" opacity="0.9"/>
      <ellipse cx="5.5" cy="10" rx="3" ry="4.5" fill="#0891B2" opacity="0.7" transform="rotate(-30 5.5 10)"/>
      <ellipse cx="14.5" cy="10" rx="3" ry="4.5" fill="#0891B2" opacity="0.7" transform="rotate(30 14.5 10)"/>
      <ellipse cx="7" cy="13" rx="3" ry="4" fill="#0891B2" opacity="0.5" transform="rotate(-15 7 13)"/>
      <ellipse cx="13" cy="13" rx="3" ry="4" fill="#0891B2" opacity="0.5" transform="rotate(15 13 13)"/>
      <circle cx="10" cy="10" r="2" fill="#E8A820"/>
    </svg>
  ),
  // Step 2: Fort in map pin
  2: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 1C6.5 1 4 3.5 4 7c0 4.5 6 12 6 12s6-7.5 6-12c0-3.5-2.5-6-6-6z" fill="#0891B2" opacity="0.85"/>
      <rect x="7" y="5" width="2" height="4" fill="#E8A820"/>
      <rect x="11" y="5" width="2" height="4" fill="#E8A820"/>
      <rect x="9" y="6" width="2" height="3" fill="#E8A820"/>
      <rect x="6.5" y="4.5" width="7" height="1" fill="#E8A820"/>
    </svg>
  ),
  // Step 3: Bed with mandana border
  3: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="12" width="16" height="2" rx="1" fill="#0891B2"/>
      <rect x="3" y="8" width="10" height="4" rx="1" fill="#0891B2" opacity="0.7"/>
      <rect x="2" y="10" width="2" height="6" fill="#0891B2"/>
      <rect x="16" y="10" width="2" height="6" fill="#0891B2"/>
      <path d="M15 6l2 2-2 2-2-2z" fill="#E8A820"/>
      <path d="M15 2l1.5 1.5L15 5l-1.5-1.5z" fill="#E8A820" opacity="0.6"/>
    </svg>
  ),
  // Step 4: Peacock feather
  4: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2C7 5 5 9 6 14c.5 2 2 4 4 5" stroke="#0891B2" strokeWidth="1.5" fill="none"/>
      <ellipse cx="9" cy="8" rx="4" ry="6" fill="#0891B2" opacity="0.3"/>
      <ellipse cx="9" cy="8" rx="2.5" ry="4" fill="#0891B2" opacity="0.5"/>
      <ellipse cx="9" cy="7.5" rx="1.2" ry="2" fill="#E8A820"/>
      <circle cx="9" cy="7" r="0.8" fill="#0891B2"/>
    </svg>
  ),
  // Step 5: Diya (oil lamp)
  5: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <ellipse cx="10" cy="15" rx="5" ry="2" fill="#0891B2" opacity="0.8"/>
      <path d="M6 15c0-3 2-5 4-6s4 3 4 6" fill="#0891B2" opacity="0.5"/>
      <ellipse cx="10" cy="6" rx="1.5" ry="3" fill="#E8A820" opacity="0.9"/>
      <ellipse cx="10" cy="5" rx="0.8" ry="1.8" fill="#E8A820"/>
      <line x1="10" y1="9" x2="10" y2="11" stroke="#E8A820" strokeWidth="1"/>
    </svg>
  ),
};

/* Element 2B — Mehraab arch for active step bullet */
const MehraabBullet = () => (
  <svg width="12" height="14" viewBox="0 0 12 14" fill="#0891B2">
    <path d="M0 14V4C0 1.8 2.7 0 6 0s6 1.8 6 4v10H0z"/>
  </svg>
);

const RegistrationSidebar = ({ currentStep }: RegistrationSidebarProps) => {
  return (
    <aside className="hidden lg:flex flex-col w-80 min-h-screen fixed left-0 top-[4px] bg-primary text-primary-foreground jaali-pattern">
      {/* Mehraab arch decorative edge */}
      <div className="absolute right-0 top-0 bottom-0 w-4 overflow-hidden">
        <svg viewBox="0 0 16 100" preserveAspectRatio="none" className="h-full w-full" fill="hsl(var(--background))">
          <path d="M16 0 C8 10, 0 20, 0 30 C0 40, 8 45, 8 50 C8 55, 0 60, 0 70 C0 80, 8 90, 16 100 L16 0Z" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col h-full p-8">
        {/* Element 7 — Lotus logo mark + manuscript underline */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <img src={sanjeevaniLogo} alt="Sanjeevani Logo" className="w-14 h-14 rounded-xl" />
            {/* Lotus motif */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <ellipse cx="8" cy="5" rx="2.5" ry="4" fill="#0891B2" opacity="0.9"/>
              <ellipse cx="4.5" cy="8" rx="2.5" ry="3.5" fill="#0891B2" opacity="0.6" transform="rotate(-25 4.5 8)"/>
              <ellipse cx="11.5" cy="8" rx="2.5" ry="3.5" fill="#0891B2" opacity="0.6" transform="rotate(25 11.5 8)"/>
              <circle cx="8" cy="7.5" r="1.5" fill="#E8A820"/>
            </svg>
          </div>
          <div className="inline-block">
            <h1 className="font-heading text-2xl font-bold tracking-tight">Sanjeevani</h1>
            {/* Manuscript underline with diamond ends */}
            <svg width="100%" height="6" viewBox="0 0 140 6" preserveAspectRatio="none" className="mt-0.5">
              <line x1="6" y1="3" x2="134" y2="3" stroke="#E8A820" strokeOpacity="0.6" strokeWidth="1"/>
              <path d="M0 3l3-3 3 3-3 3z" fill="#E8A820" fillOpacity="0.6"/>
              <path d="M134 3l3-3 3 3-3 3z" fill="#E8A820" fillOpacity="0.6"/>
            </svg>
          </div>
          <p className="text-sm mt-1.5 opacity-70 italic font-heading">
            Building India's Emergency Health Backbone
          </p>
        </div>

        <nav className="flex-1">
          <ul className="space-y-1.5">
            {STEPS.map((step) => {
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              return (
                <li key={step.number}>
                  <div
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all shimmer-hover ${
                      isActive ? 'bg-sidebar-accent' : ''
                    }`}
                  >
                    <span className="flex items-center justify-center w-8 h-8 shrink-0">
                      {isCompleted ? (
                        PatachitraIcons[step.number]
                      ) : isActive ? (
                        <span className="flex items-center justify-center w-8 h-8">
                          <MehraabBullet />
                        </span>
                      ) : (
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sidebar-accent text-primary-foreground/50 text-xs font-bold">
                          {step.number}
                        </span>
                      )}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold leading-tight ${
                        isActive || isCompleted ? 'text-primary-foreground' : 'text-primary-foreground/40'
                      }`}>{step.title}</p>
                      <p className={`text-xs ${
                        isActive ? 'text-primary-foreground/70' : 'text-primary-foreground/30'
                      }`}>{step.description}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Element 2A — Mehraab arch sidebar bottom divider */}
        <div className="mt-auto">
          <svg width="100%" height="28" viewBox="0 0 280 28" preserveAspectRatio="xMidYMid meet" className="mb-2">
            <path
              d="M0 28 Q70 28 100 10 Q130 0 140 0 Q150 0 180 10 Q210 28 280 28Z"
              fill="none"
              stroke="#0891B2"
              strokeOpacity="0.15"
              strokeWidth="1.5"
            />
          </svg>
          <div className="pt-2 border-t border-sidebar-border">
            <p className="text-xs text-primary-foreground/40 font-heading italic text-center">
              "Powered by Sanjeevani"
            </p>
            <p className="text-[10px] text-primary-foreground/25 text-center mt-1">
              © 2026 Sanjeevani Health Infra
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RegistrationSidebar;
