/* Element 3 — Jharokha (haveli window) frame on form card */
const JharokhaFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">
    {/* Jharokha arch SVG at top */}
    <svg
      width="100%"
      height="20"
      viewBox="0 0 600 20"
      preserveAspectRatio="none"
      className="block -mb-px"
    >
      {/* Left pillar */}
      <rect x="10" y="4" width="4" height="16" rx="1" fill="#E8A820" fillOpacity="0.25"/>
      {/* Right pillar */}
      <rect x="586" y="4" width="4" height="16" rx="1" fill="#E8A820" fillOpacity="0.25"/>
      {/* Cusped arch at center */}
      <path
        d="M80 20 Q150 20 200 8 Q250 0 300 0 Q350 0 400 8 Q450 20 520 20"
        fill="none"
        stroke="#E8A820"
        strokeOpacity="0.25"
        strokeWidth="1.5"
      />
      {/* Small cusp details */}
      <circle cx="250" cy="5" r="2" fill="#E8A820" fillOpacity="0.2"/>
      <circle cx="300" cy="2" r="2" fill="#E8A820" fillOpacity="0.2"/>
      <circle cx="350" cy="5" r="2" fill="#E8A820" fillOpacity="0.2"/>
    </svg>
    {children}
  </div>
);

export default JharokhaFrame;
