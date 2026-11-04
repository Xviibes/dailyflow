import React, { useId, memo } from 'react';
import flowOrbData from '../../constants/flowOrbLottie.json';

/**
 * FlowOrbAvatar — "The Flow Orb / Liquid Core" (Optimized for Android WebView)
 * Tanpa setInterval kedip atau global pointermove/touchmove listener yang memicu CPU thrashing.
 */
export const FlowOrbAvatar = memo(function FlowOrbAvatar({
  size = 'md', // 'sm' (44px), 'md' (54px), 'lg' (68px), 'xl' (86px)
  isOnline = true,
  isLoading = false,
  isDragging = false,
  onClick,
  className = '',
}) {
  const uid = useId().replace(/:/g, '');

  const sizePx =
    size === 'sm'
      ? 44
      : size === 'lg'
      ? 68
      : size === 'xl'
      ? 86
      : 54;

  const activeExpr = !isOnline
    ? 'offline'
    : isLoading
    ? 'happy'
    : 'neutral';

  const particles = flowOrbData.meta?.particles || [];

  return (
    <div
      onClick={onClick}
      style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
      className={`relative select-none shrink-0 flex items-center justify-center group ${
        !isDragging ? 'flowy-gpu-float' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      title="Flowy • Sahabat Produktivitasmu"
    >
      {/* Aura Neon Luar GPU-Accelerated (Ungu - Cyan Pulse Glow) */}
      <div
        className={`absolute -inset-1 rounded-full pointer-events-none ${
          isOnline
            ? isLoading
              ? 'bg-gradient-to-tr from-purple-500/55 via-cyan-400/55 to-fuchsia-500/55 flowy-gpu-glow'
              : 'bg-gradient-to-tr from-indigo-500/45 via-purple-500/45 to-cyan-400/45 flowy-gpu-glow'
            : 'bg-slate-700/25'
        }`}
      />

      {/* Renderer Vektor SVG: The Flow Orb / Liquid Core */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id={`orbCore-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isOnline ? '#a855f7' : '#475569'} />
            <stop offset="48%" stopColor={isOnline ? '#4f46e5' : '#334155'} />
            <stop offset="100%" stopColor={isOnline ? '#06b6d4' : '#1e293b'} />
          </linearGradient>

          <linearGradient id={`orbWave-${uid}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isOnline ? '#22d3ee' : '#64748b'} stopOpacity="0.85" />
            <stop offset="55%" stopColor={isOnline ? '#7c3aed' : '#475569'} stopOpacity="0.75" />
            <stop offset="100%" stopColor={isOnline ? '#ec4899' : '#334155'} stopOpacity="0.8" />
          </linearGradient>

          <radialGradient id={`oledScreen-${uid}`} cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.92" />
            <stop offset="80%" stopColor="#060913" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.98" />
          </radialGradient>

          <linearGradient id={`glassShine-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Partikel Cahaya Halus Statis Ringan */}
        {isOnline &&
          particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const px = 100 + Math.cos(rad) * p.dist;
            const py = 100 + Math.sin(rad) * p.dist;
            return (
              <circle
                key={p.id}
                cx={px}
                cy={py}
                r={p.size}
                fill={p.color}
                opacity="0.75"
              />
            );
          })}

        {/* Layer 1: Liquid Core Outer Blob */}
        <path
          d="M100,18 C146,16 184,52 182,100 C180,148 148,184 100,182 C52,180 16,146 18,100 C20,54 54,20 100,18 Z"
          fill={`url(#orbWave-${uid})`}
          opacity="0.75"
        />

        {/* Layer 2: Liquid Core Inner Blob */}
        <path
          d="M100,22 C142,26 178,56 176,100 C174,144 140,178 100,176 C60,174 22,142 24,100 C26,58 58,18 100,22 Z"
          fill={`url(#orbCore-${uid})`}
        />

        {/* Cincin Energi Cyan-Ungu GPU-Accelerated */}
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke={isOnline ? '#67e8f9' : '#64748b'}
          strokeWidth="2.2"
          strokeOpacity="0.55"
          strokeDasharray="28 14"
          className={isOnline ? 'flowy-gpu-ring' : ''}
        />

        {/* Layar Inti OLED Wajah Digital */}
        <circle
          cx="100"
          cy="100"
          r="54"
          fill={`url(#oledScreen-${uid})`}
          stroke={isOnline ? '#38bdf8' : '#475569'}
          strokeWidth="2"
          strokeOpacity="0.5"
        />

        {/* Kilau Refleksi Kaca Atas */}
        <ellipse
          cx="100"
          cy="64"
          rx="36"
          ry="15"
          fill={`url(#glassShine-${uid})`}
        />

        {/* EKSPRESI WAJAH DIGITAL OLED */}
        <g>
          {activeExpr === 'happy' ? (
            <>
              <path
                d="M70 96 Q80 82 90 96"
                fill="none"
                stroke="#67e8f9"
                strokeWidth="6.5"
                strokeLinecap="round"
              />
              <path
                d="M110 96 Q120 82 130 96"
                fill="none"
                stroke="#67e8f9"
                strokeWidth="6.5"
                strokeLinecap="round"
              />
              <ellipse cx="66" cy="108" rx="6" ry="3.2" fill="#f472b6" opacity="0.65" />
              <ellipse cx="134" cy="108" rx="6" ry="3.2" fill="#f472b6" opacity="0.65" />
              <path
                d="M88 112 Q100 124 112 112"
                fill="none"
                stroke="#67e8f9"
                strokeWidth="5.5"
                strokeLinecap="round"
              />
            </>
          ) : activeExpr === 'offline' ? (
            <>
              <line
                x1="70"
                y1="95"
                x2="90"
                y2="95"
                stroke="#94a3b8"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <line
                x1="110"
                y1="95"
                x2="130"
                y2="95"
                stroke="#94a3b8"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M91 116 L109 116"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              <circle cx="80" cy="94" r="8.5" fill="#67e8f9" />
              <circle cx="77.5" cy="91" r="2.6" fill="#ffffff" />

              <circle cx="120" cy="94" r="8.5" fill="#67e8f9" />
              <circle cx="117.5" cy="91" r="2.6" fill="#ffffff" />

              <ellipse cx="66" cy="107" rx="5" ry="2.8" fill="#c084fc" opacity="0.45" />
              <ellipse cx="134" cy="107" rx="5" ry="2.8" fill="#c084fc" opacity="0.45" />

              <path
                d="M90 113 Q100 121 110 113"
                fill="none"
                stroke="#67e8f9"
                strokeWidth="5.2"
                strokeLinecap="round"
              />
            </>
          )}
        </g>
      </svg>
    </div>
  );
});
