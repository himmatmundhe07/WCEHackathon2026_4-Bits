import React from 'react';

interface AnimationProps {
  size?: number;
  color?: string;
  accentColor?: string;
}

// Deep Breathing — expanding/contracting circle
const DeepBreath: React.FC<AnimationProps> = ({ size = 120, color = '#0891B2', accentColor = '#F59E0B' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <style>{`
      @keyframes breathe {
        0%, 100% { r: 20; opacity: 0.3; }
        50% { r: 38; opacity: 0.8; }
      }
      @keyframes breatheInner {
        0%, 100% { r: 12; }
        50% { r: 24; }
      }
      @keyframes breatheOuter {
        0%, 100% { r: 45; opacity: 0.1; }
        50% { r: 52; opacity: 0.2; }
      }
    `}</style>
    <circle cx="60" cy="60" r="52" fill={`${color}10`} stroke={color} strokeWidth="1" opacity="0.3" />
    <circle cx="60" cy="60" r="45" fill={`${color}0`} stroke={color} strokeWidth="1" style={{ animation: 'breatheOuter 3s ease-in-out infinite' }} />
    <circle cx="60" cy="60" r="20" fill={`${color}30`} stroke={color} strokeWidth="2" style={{ animation: 'breathe 3s ease-in-out infinite' }} />
    <circle cx="60" cy="60" r="12" fill={color} style={{ animation: 'breatheInner 3s ease-in-out infinite' }} />
    <text x="60" y="100" textAnchor="middle" fontSize="9" fill={accentColor} fontFamily="Inter,sans-serif">BREATHE</text>
  </svg>
);

// Ankle Circles — foot rotating
const AnkleCircles: React.FC<AnimationProps> = ({ size = 120, color = '#0891B2', accentColor = '#F59E0B' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <style>{`
      @keyframes rotate-ankle { from { transform: rotate(0deg); transform-origin: 60px 50px; } to { transform: rotate(360deg); transform-origin: 60px 50px; } }
      @keyframes trail-fade { 0%,100% { opacity:0; } 50% { opacity:0.5; } }
    `}</style>
    {/* Leg */}
    <rect x="52" y="15" width="16" height="40" rx="8" fill={color} />
    {/* Ankle joint */}
    <circle cx="60" cy="58" r="8" fill={color} opacity="0.8" />
    {/* Motion trail */}
    <ellipse cx="60" cy="80" rx="22" ry="14" stroke={accentColor} strokeWidth="2" strokeDasharray="4 3" opacity="0.4" style={{ animation: 'trail-fade 2s ease-in-out infinite' }} />
    {/* Foot */}
    <g style={{ animation: 'rotate-ankle 2s linear infinite', transformOrigin: '60px 58px' }}>
      <ellipse cx="75" cy="72" rx="18" ry="9" fill={color} opacity="0.9" transform="rotate(-20 60 58)" />
    </g>
    <text x="60" y="110" textAnchor="middle" fontSize="9" fill={accentColor} fontFamily="Inter,sans-serif">ANKLE CIRCLES</text>
  </svg>
);

// Seated Arm Raise
const SeatedArmRaise: React.FC<AnimationProps> = ({ size = 120, color = '#0891B2', accentColor = '#F59E0B' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <style>{`
      @keyframes raise-arm-l { 0%,100% { transform: rotate(0deg); transform-origin: 42px 52px; } 50% { transform: rotate(-80deg); transform-origin: 42px 52px; } }
      @keyframes raise-arm-r { 0%,100% { transform: rotate(0deg); transform-origin: 78px 52px; } 50% { transform: rotate(80deg); transform-origin: 78px 52px; } }
    `}</style>
    {/* Chair */}
    <rect x="30" y="80" width="60" height="6" rx="3" fill={accentColor} opacity="0.5" />
    <rect x="32" y="86" width="4" height="18" rx="2" fill={accentColor} opacity="0.4" />
    <rect x="84" y="86" width="4" height="18" rx="2" fill={accentColor} opacity="0.4" />
    <rect x="28" y="56" width="4" height="26" rx="2" fill={accentColor} opacity="0.3" />
    <rect x="88" y="56" width="4" height="26" rx="2" fill={accentColor} opacity="0.3" />
    {/* Body */}
    <circle cx="60" cy="32" r="12" fill={color} />
    <rect x="49" y="43" width="22" height="30" rx="6" fill={color} />
    {/* Legs */}
    <rect x="50" y="70" width="8" height="16" rx="4" fill={color} opacity="0.7" />
    <rect x="62" y="70" width="8" height="16" rx="4" fill={color} opacity="0.7" />
    {/* Arms */}
    <rect x="34" y="50" width="10" height="28" rx="5" fill={color} opacity="0.85" style={{ animation: 'raise-arm-l 2.5s ease-in-out infinite' }} />
    <rect x="76" y="50" width="10" height="28" rx="5" fill={color} opacity="0.85" style={{ animation: 'raise-arm-r 2.5s ease-in-out infinite' }} />
    <text x="60" y="112" textAnchor="middle" fontSize="9" fill={accentColor} fontFamily="Inter,sans-serif">ARM RAISES</text>
  </svg>
);

// Leg Lifts (seated)
const LegLifts: React.FC<AnimationProps> = ({ size = 120, color = '#0891B2', accentColor = '#F59E0B' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <style>{`
      @keyframes lift-leg { 0%,100% { transform: rotate(0deg); transform-origin: 54px 78px; } 50% { transform: rotate(-35deg); transform-origin: 54px 78px; } }
    `}</style>
    {/* Chair */}
    <rect x="30" y="76" width="60" height="6" rx="3" fill={accentColor} opacity="0.5" />
    <rect x="32" y="82" width="4" height="20" rx="2" fill={accentColor} opacity="0.4" />
    <rect x="84" y="82" width="4" height="20" rx="2" fill={accentColor} opacity="0.4" />
    {/* Body */}
    <circle cx="60" cy="32" r="12" fill={color} />
    <rect x="49" y="43" width="22" height="33" rx="6" fill={color} />
    {/* Arms resting */}
    <rect x="36" y="52" width="14" height="9" rx="4" fill={color} opacity="0.7" />
    <rect x="70" y="52" width="14" height="9" rx="4" fill={color} opacity="0.7" />
    {/* Static leg */}
    <rect x="62" y="76" width="10" height="22" rx="5" fill={color} opacity="0.6" />
    {/* Lifting leg */}
    <rect x="50" y="76" width="10" height="22" rx="5" fill={color} opacity="0.9" style={{ animation: 'lift-leg 2.5s ease-in-out infinite' }} />
    <text x="60" y="112" textAnchor="middle" fontSize="9" fill={accentColor} fontFamily="Inter,sans-serif">LEG LIFTS</text>
  </svg>
);

// Neck Rolls
const NeckRolls: React.FC<AnimationProps> = ({ size = 120, color = '#0891B2', accentColor = '#F59E0B' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <style>{`
      @keyframes neck-tilt { 0%,100% { transform: rotate(0deg); transform-origin: 60px 58px; } 25% { transform: rotate(-18deg); transform-origin: 60px 58px; } 75% { transform: rotate(18deg); transform-origin: 60px 58px; } }
    `}</style>
    {/* Body */}
    <rect x="42" y="65" width="36" height="40" rx="10" fill={color} opacity="0.7" />
    {/* Neck */}
    <rect x="55" y="52" width="10" height="16" rx="4" fill={color} opacity="0.8" />
    {/* Head */}
    <circle cx="60" cy="38" r="18" fill={color} style={{ animation: 'neck-tilt 3s ease-in-out infinite' }} />
    {/* Face dots */}
    <circle cx="55" cy="36" r="2" fill="white" opacity="0.6" style={{ animation: 'neck-tilt 3s ease-in-out infinite' }} />
    <circle cx="65" cy="36" r="2" fill="white" opacity="0.6" style={{ animation: 'neck-tilt 3s ease-in-out infinite' }} />
    {/* Motion arc */}
    <path d="M 35 38 Q 60 20 85 38" stroke={accentColor} strokeWidth="2" strokeDasharray="3 3" fill="none" opacity="0.5" />
    <text x="60" y="115" textAnchor="middle" fontSize="9" fill={accentColor} fontFamily="Inter,sans-serif">NECK ROLLS</text>
  </svg>
);

// Shoulder Rolls
const ShoulderRolls: React.FC<AnimationProps> = ({ size = 120, color = '#0891B2', accentColor = '#F59E0B' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <style>{`
      @keyframes roll-l { 0% { transform: rotate(0deg); transform-origin: 42px 55px; } 100% { transform: rotate(360deg); transform-origin: 42px 55px; } }
      @keyframes roll-r { 0% { transform: rotate(0deg); transform-origin: 78px 55px; } 100% { transform: rotate(-360deg); transform-origin: 78px 55px; } }
    `}</style>
    {/* Body */}
    <circle cx="60" cy="30" r="12" fill={color} />
    <rect x="48" y="41" width="24" height="35" rx="7" fill={color} />
    {/* Shoulders + rolling arms */}
    <circle cx="42" cy="52" r="9" fill={color} opacity="0.5" style={{ animation: 'roll-l 2s linear infinite' }} />
    <circle cx="78" cy="52" r="9" fill={color} opacity="0.5" style={{ animation: 'roll-r 2s linear infinite' }} />
    <rect x="34" y="50" width="8" height="22" rx="4" fill={color} style={{ animation: 'roll-l 2s linear infinite' }} />
    <rect x="78" y="50" width="8" height="22" rx="4" fill={color} style={{ animation: 'roll-r 2s linear infinite' }} />
    {/* Motion dots */}
    <circle cx="42" cy="38" r="2" fill={accentColor} opacity="0.5" />
    <circle cx="78" cy="38" r="2" fill={accentColor} opacity="0.5" />
    <text x="60" y="112" textAnchor="middle" fontSize="9" fill={accentColor} fontFamily="Inter,sans-serif">SHOULDER ROLLS</text>
  </svg>
);

// Hand Squeeze
const HandSqueeze: React.FC<AnimationProps> = ({ size = 120, color = '#0891B2', accentColor = '#F59E0B' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <style>{`
      @keyframes squeeze { 0%,100% { transform: scaleX(1) scaleY(1); } 50% { transform: scaleX(0.82) scaleY(0.88); } }
    `}</style>
    {/* Hand shape simplified */}
    <g style={{ animation: 'squeeze 1.8s ease-in-out infinite', transformOrigin: '60px 65px' }}>
      <ellipse cx="60" cy="65" rx="26" ry="32" fill={color} opacity="0.85" />
      {/* Fingers */}
      <rect x="36" y="35" width="8" height="20" rx="4" fill={color} />
      <rect x="46" y="30" width="8" height="24" rx="4" fill={color} />
      <rect x="56" y="28" width="8" height="26" rx="4" fill={color} />
      <rect x="66" y="30" width="8" height="24" rx="4" fill={color} />
      <rect x="76" y="36" width="7" height="18" rx="3.5" fill={color} />
      {/* Squeeze lines */}
      <line x1="45" y1="60" x2="75" y2="60" stroke="white" strokeWidth="1.5" opacity="0.4" />
      <line x1="42" y1="70" x2="78" y2="70" stroke="white" strokeWidth="1.5" opacity="0.4" />
    </g>
    <text x="60" y="112" textAnchor="middle" fontSize="9" fill={accentColor} fontFamily="Inter,sans-serif">HAND SQUEEZE</text>
  </svg>
);

// Short Walk — walking figure
const ShortWalk: React.FC<AnimationProps> = ({ size = 120, color = '#0891B2', accentColor = '#F59E0B' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <style>{`
      @keyframes leg-front { 0%,100% { transform: rotate(20deg); transform-origin: 60px 65px; } 50% { transform: rotate(-20deg); transform-origin: 60px 65px; } }
      @keyframes leg-back { 0%,100% { transform: rotate(-20deg); transform-origin: 60px 65px; } 50% { transform: rotate(20deg); transform-origin: 60px 65px; } }
      @keyframes arm-swing { 0%,100% { transform: rotate(-25deg); transform-origin: 55px 55px; } 50% { transform: rotate(25deg); transform-origin: 55px 55px; } }
      @keyframes arm-swing-r { 0%,100% { transform: rotate(25deg); transform-origin: 65px 55px; } 50% { transform: rotate(-25deg); transform-origin: 65px 55px; } }
      @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
    `}</style>
    {/* Ground */}
    <line x1="15" y1="100" x2="105" y2="100" stroke={accentColor} strokeWidth="2" opacity="0.3" />
    {/* Body with bob */}
    <g style={{ animation: 'bob 0.7s ease-in-out infinite' }}>
      <circle cx="60" cy="30" r="12" fill={color} />
      <rect x="51" y="41" width="18" height="28" rx="6" fill={color} />
      {/* Arms */}
      <rect x="40" y="50" width="8" height="20" rx="4" fill={color} opacity="0.85" style={{ animation: 'arm-swing 0.7s ease-in-out infinite' }} />
      <rect x="72" y="50" width="8" height="20" rx="4" fill={color} opacity="0.85" style={{ animation: 'arm-swing-r 0.7s ease-in-out infinite' }} />
      {/* Legs */}
      <rect x="52" y="67" width="9" height="26" rx="4.5" fill={color} style={{ animation: 'leg-front 0.7s ease-in-out infinite' }} />
      <rect x="59" y="67" width="9" height="26" rx="4.5" fill={color} opacity="0.7" style={{ animation: 'leg-back 0.7s ease-in-out infinite' }} />
    </g>
    <text x="60" y="112" textAnchor="middle" fontSize="9" fill={accentColor} fontFamily="Inter,sans-serif">SHORT WALK</text>
  </svg>
);

// Standing Balance — one leg
const StandingBalance: React.FC<AnimationProps> = ({ size = 120, color = '#0891B2', accentColor = '#F59E0B' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <style>{`
      @keyframes balance-sway { 0%,100% { transform: rotate(-4deg); transform-origin: 60px 95px; } 50% { transform: rotate(4deg); transform-origin: 60px 95px; } }
      @keyframes lifted-leg { 0%,100% { transform: rotate(0deg); transform-origin: 57px 72px; } 50% { transform: rotate(-30deg); transform-origin: 57px 72px; } }
    `}</style>
    {/* Ground */}
    <line x1="30" y1="100" x2="90" y2="100" stroke={accentColor} strokeWidth="2" opacity="0.3" />
    {/* Full figure swaying */}
    <g style={{ animation: 'balance-sway 2.5s ease-in-out infinite' }}>
      <circle cx="60" cy="25" r="12" fill={color} />
      <rect x="51" y="36" width="18" height="30" rx="6" fill={color} />
      {/* Arms spread for balance */}
      <rect x="28" y="46" width="24" height="7" rx="3.5" fill={color} opacity="0.7" />
      <rect x="68" y="46" width="24" height="7" rx="3.5" fill={color} opacity="0.7" />
      {/* Standing leg */}
      <rect x="56" y="65" width="10" height="32" rx="5" fill={color} opacity="0.9" />
      {/* Lifted leg */}
      <rect x="52" y="72" width="10" height="24" rx="5" fill={color} opacity="0.7" style={{ animation: 'lifted-leg 2.5s ease-in-out infinite' }} />
    </g>
    <text x="60" y="114" textAnchor="middle" fontSize="9" fill={accentColor} fontFamily="Inter,sans-serif">BALANCE</text>
  </svg>
);

// Progressive Relaxation — wave effect
const ProgressiveRelax: React.FC<AnimationProps> = ({ size = 120, color = '#0891B2', accentColor = '#F59E0B' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <style>{`
      @keyframes wave1 { 0%,100% { opacity:0.2; transform: scaleX(1); } 50% { opacity:0.6; transform: scaleX(1.1); } }
      @keyframes wave2 { 0%,100% { opacity:0.15; transform: scaleX(1); } 50% { opacity:0.5; transform: scaleX(1.15); } }
      @keyframes wave3 { 0%,100% { opacity:0.1; transform: scaleX(1); } 50% { opacity:0.35; transform: scaleX(1.2); } }
      @keyframes glow { 0%,100% { opacity:0.8; } 50% { opacity:1; } }
    `}</style>
    {/* Laying body */}
    <ellipse cx="60" cy="68" rx="42" ry="14" fill={color} opacity="0.8" style={{ animation: 'glow 3s ease-in-out infinite' }} />
    {/* Head */}
    <circle cx="16" cy="58" r="12" fill={color} style={{ animation: 'glow 3s ease-in-out infinite' }} />
    {/* Waves of relaxation */}
    <ellipse cx="60" cy="68" rx="50" ry="20" fill="none" stroke={accentColor} strokeWidth="2" style={{ animation: 'wave1 3s ease-in-out infinite', transformOrigin: '60px 68px' }} />
    <ellipse cx="60" cy="68" rx="58" ry="26" fill="none" stroke={accentColor} strokeWidth="1.5" style={{ animation: 'wave2 3s ease-in-out 0.5s infinite', transformOrigin: '60px 68px' }} />
    <ellipse cx="60" cy="68" rx="64" ry="32" fill="none" stroke={color} strokeWidth="1" style={{ animation: 'wave3 3s ease-in-out 1s infinite', transformOrigin: '60px 68px' }} />
    <text x="60" y="112" textAnchor="middle" fontSize="9" fill={accentColor} fontFamily="Inter,sans-serif">RELAXATION</text>
  </svg>
);

// Map of animation keys to components
const ANIMATIONS: Record<string, React.FC<AnimationProps>> = {
  deep_breath: DeepBreath,
  ankle_circles: AnkleCircles,
  seated_arm_raise: SeatedArmRaise,
  leg_lifts: LegLifts,
  neck_rolls: NeckRolls,
  shoulder_rolls: ShoulderRolls,
  hand_squeeze: HandSqueeze,
  short_walk: ShortWalk,
  standing_balance: StandingBalance,
  progressive_relaxation: ProgressiveRelax,
};

interface RecoveryAnimationProps extends AnimationProps {
  animationKey: string;
}

const RecoveryAnimation: React.FC<RecoveryAnimationProps> = ({ animationKey, size, color, accentColor }) => {
  const Component = ANIMATIONS[animationKey] || DeepBreath;
  return <Component size={size} color={color} accentColor={accentColor} />;
};

export default RecoveryAnimation;
export {
  DeepBreath, AnkleCircles, SeatedArmRaise, LegLifts, NeckRolls,
  ShoulderRolls, HandSqueeze, ShortWalk, StandingBalance, ProgressiveRelax,
};
