import React from 'react';

interface StillLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  animated?: boolean;
}

export function StillLogo({
  size = 'md',
  showText = false,
  className = '',
  animated = true,
}: StillLogoProps) {
  const sizeMap = {
    sm: {
      box: 'w-8 h-8',
      text: 'text-lg',
      sub: 'text-[9px]',
    },
    md: {
      box: 'w-11 h-11',
      text: 'text-xl',
      sub: 'text-[10px]',
    },
    lg: {
      box: 'w-16 h-16 sm:w-20 sm:h-20',
      text: 'text-2xl sm:text-3xl',
      sub: 'text-xs',
    },
    xl: {
      box: 'w-24 h-24',
      text: 'text-3xl',
      sub: 'text-xs',
    },
  };

  const { box, text, sub } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3.5 select-none ${className}`}>
      {/* Icon Badge */}
      <div className={`relative ${box} flex items-center justify-center shrink-0`}>
        {/* Ambient subtle glow ring */}
        <div
          className={`absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[var(--accent-sage)]/25 via-[var(--accent-sage)]/10 to-transparent blur-xs ${
            animated ? 'animate-pulse' : ''
          }`}
          aria-hidden="true"
        />

        {/* Outer glassmorphic rounded tile */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[var(--card-bg)] to-[var(--bg-page)] border-2 border-[var(--accent-sage)]/35 shadow-sm shadow-[var(--accent-sage)]/10 backdrop-blur-xs flex items-center justify-center transition-transform duration-300 group-hover:scale-105" />

        {/* Vector Logo Artwork */}
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-[75%] h-[75%] text-[var(--accent-sage)]"
          aria-hidden="true"
        >
          <defs>
            {/* Smooth linear gradient for botanical leaf */}
            <linearGradient id="stillLeafGrad" x1="20" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--accent-sage)" stopOpacity="1" />
              <stop offset="1" stopColor="var(--accent-sage-hover)" stopOpacity="0.85" />
            </linearGradient>

            {/* Soft inner petal gradient */}
            <linearGradient id="stillInnerGrad" x1="28" y1="18" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--accent-sage)" stopOpacity="0.75" />
              <stop offset="1" stopColor="var(--accent-sage-active)" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Outer Ripple Wave (Concentric peaceful circle) */}
          <circle
            cx="32"
            cy="32"
            r="27"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeOpacity="0.22"
            strokeDasharray="3 3.5"
          />

          {/* Inner Harmonic Wave */}
          <circle
            cx="32"
            cy="32"
            r="20.5"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeOpacity="0.38"
          />

          {/* Primary Botanical Zen Sprout (Fluid, calm curves) */}
          <path
            d="M32 11C20.5 21.5 17.5 35 28.5 45.5C31.5 38.5 30.5 27 32 11Z"
            fill="url(#stillLeafGrad)"
          />

          {/* Secondary Balanced Inner Petal */}
          <path
            d="M32 17.5C41 24.5 43.5 36.5 34.5 44.5C33.5 36.5 35 27.5 32 17.5Z"
            fill="url(#stillInnerGrad)"
          />

          {/* Serene Dewdrop / Mindful Anchor Apex */}
          <circle cx="32" cy="8.5" r="2.3" fill="currentColor" />

          {/* Grounding Base Pebble */}
          <circle cx="32" cy="49.5" r="1.6" fill="currentColor" fillOpacity="0.6" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span className={`font-serif-card font-medium tracking-tight text-[var(--text-ink)] leading-none ${text}`}>
            Still
          </span>
          <span className={`uppercase tracking-widest text-[var(--dim-text)] font-medium mt-1 ${sub}`}>
            One gentle thing
          </span>
        </div>
      )}
    </div>
  );
}
