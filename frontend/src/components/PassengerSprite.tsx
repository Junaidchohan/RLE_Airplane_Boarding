'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

export type SpriteState = 'IDLE' | 'WALKING' | 'STOWING' | 'SEATED';
export type SpriteTint = 'slate' | 'cyan' | 'amber' | 'emerald';

interface PassengerSpriteProps {
  state?: SpriteState;
  tint?: SpriteTint;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isStalled?: boolean;
}

const TINT_COLORS: Record<SpriteTint, { fill: string; glow?: string }> = {
  slate: { fill: '#94a3b8' },
  cyan: { fill: '#22d3ee', glow: 'rgba(34, 211, 238, 0.4)' },
  amber: { fill: '#fbbf24', glow: 'rgba(251, 191, 36, 0.4)' },
  emerald: { fill: '#34d399', glow: 'rgba(52, 211, 153, 0.4)' },
};

export default function PassengerSprite({
  state = 'IDLE',
  tint,
  size = 'md',
  className,
  isStalled = false,
}: PassengerSpriteProps) {
  // Auto-resolve tint based on state if not explicitly specified
  const effectiveTint: SpriteTint =
    tint ||
    (state === 'SEATED'
      ? 'emerald'
      : state === 'STOWING'
      ? 'amber'
      : state === 'WALKING'
      ? 'cyan'
      : 'slate');

  const color = TINT_COLORS[effectiveTint];

  // Sizing definitions
  const dimensions = {
    sm: { width: 18, height: 24, viewBox: '0 0 28 36' },
    md: { width: 28, height: 36, viewBox: '0 0 28 36' },
    lg: { width: 34, height: 44, viewBox: '0 0 28 36' },
  }[size];

  // Motion variants
  const getMotionAnimation = () => {
    if (isStalled) {
      return {
        x: [0, -1.5, 1.5, -1.5, 0],
        transition: { repeat: Infinity, duration: 0.6, ease: 'easeInOut' },
      };
    }
    if (state === 'WALKING') {
      return {
        y: [0, -2.5, 0],
        transition: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' },
      };
    }
    if (state === 'STOWING') {
      return {
        scale: [1, 1.04, 1],
        transition: { repeat: Infinity, duration: 0.8, ease: 'easeInOut' },
      };
    }
    return {};
  };

  return (
    <motion.div
      animate={getMotionAnimation()}
      style={{ willChange: 'transform' }}
      className={cn('inline-flex items-center justify-center select-none', className)}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={dimensions.viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* Render figure based on state */}
        {state === 'IDLE' && (
          <g fill={color.fill}>
            {/* Head */}
            <circle cx="14" cy="6" r="4" />
            {/* Body */}
            <rect x="10" y="12" width="8" height="13" rx="3" />
            {/* Left Arm */}
            <rect x="6" y="13" width="3" height="9.5" rx="1.5" />
            {/* Right Arm */}
            <rect x="19" y="13" width="3" height="9.5" rx="1.5" />
            {/* Left Leg */}
            <rect x="9.5" y="24.5" width="3.5" height="10" rx="1.5" />
            {/* Right Leg */}
            <rect x="15" y="24.5" width="3.5" height="10" rx="1.5" />
          </g>
        )}

        {state === 'WALKING' && (
          <g fill={color.fill}>
            {/* Head */}
            <circle cx="14" cy="6" r="4" />
            {/* Body */}
            <rect x="10" y="12" width="8" height="13" rx="3" />
            {/* Left Arm (forward) */}
            <rect x="6.5" y="12.5" width="3" height="9" rx="1.5" transform="rotate(12 6.5 12.5)" />
            {/* Right Arm (back) */}
            <rect x="18.5" y="13" width="3" height="9" rx="1.5" transform="rotate(-12 18.5 13)" />
            {/* Left Leg (stepping forward) */}
            <rect x="9" y="24.5" width="3.5" height="10.5" rx="1.5" transform="rotate(-10 9 24.5)" />
            {/* Right Leg (stepping back) */}
            <rect x="15.5" y="24" width="3.5" height="10.5" rx="1.5" transform="rotate(10 15.5 24)" />
          </g>
        )}

        {state === 'STOWING' && (
          <g fill={color.fill}>
            {/* Small Luggage overhead */}
            <rect x="9" y="1" width="10" height="4.5" rx="1.2" stroke={color.fill} strokeWidth="1" fill="none" />
            <line x1="12" y1="1" x2="12" y2="0" stroke={color.fill} strokeWidth="1" strokeLinecap="round" />
            <line x1="16" y1="1" x2="16" y2="0" stroke={color.fill} strokeWidth="1" strokeLinecap="round" />

            {/* Head (bent slightly forward) */}
            <circle cx="14" cy="8" r="4" />
            {/* Body */}
            <rect x="10" y="13.5" width="8" height="12" rx="3" />
            {/* Arms raised toward bin */}
            <path
              d="M 8 16 Q 6 10 10 6"
              stroke={color.fill}
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 20 16 Q 22 10 18 6"
              stroke={color.fill}
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Legs */}
            <rect x="9.5" y="25" width="3.5" height="9.5" rx="1.5" />
            <rect x="15" y="25" width="3.5" height="9.5" rx="1.5" />
          </g>
        )}

        {state === 'SEATED' && (
          <g fill={color.fill}>
            {/* Side-profile seated person */}
            {/* Head */}
            <circle cx="11" cy="7" r="4" />
            {/* Torso */}
            <rect x="7.5" y="12.5" width="7" height="11.5" rx="3" />
            {/* Arm resting on armrest */}
            <path
              d="M 12 15.5 L 17 19 L 19 19"
              stroke={color.fill}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Thigh (horizontal) */}
            <rect x="8.5" y="22" width="11" height="4" rx="2" />
            {/* Shin (downward) */}
            <rect x="16" y="23.5" width="4" height="9.5" rx="1.8" />
          </g>
        )}
      </svg>
    </motion.div>
  );
}
