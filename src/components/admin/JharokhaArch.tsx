interface JharokhaArchProps {
  color?: string;
  opacity?: number;
}

const JharokhaArch = ({ color = '#0891B2', opacity = 0.18 }: JharokhaArchProps) => (
  <svg width="100%" height="18" viewBox="0 0 400 18" preserveAspectRatio="none" className="block">
    <rect x="8" y="3" width="3" height="15" rx="1" fill={color} fillOpacity={opacity} />
    <rect x="389" y="3" width="3" height="15" rx="1" fill={color} fillOpacity={opacity} />
    <path d="M50 18 Q120 18 160 6 Q190 0 200 0 Q210 0 240 6 Q280 18 350 18" fill="none" stroke={color} strokeOpacity={opacity} strokeWidth="1.5" />
    <circle cx="170" cy="4" r="1.5" fill={color} fillOpacity={opacity * 0.8} />
    <circle cx="200" cy="1.5" r="1.5" fill={color} fillOpacity={opacity * 0.8} />
    <circle cx="230" cy="4" r="1.5" fill={color} fillOpacity={opacity * 0.8} />
  </svg>
);

export default JharokhaArch;
