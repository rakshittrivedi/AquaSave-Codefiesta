import React from 'react';
import { TankStatus } from '../../types/tank';

interface TankFillProps {
  level: number;
  status: TankStatus;
  width?: number;
  height?: number;
}

export const TankFill: React.FC<TankFillProps> = ({ level, status, width = 120, height = 180 }) => {
  // Clamp level 0 - 100
  const clampedLevel = Math.min(100, Math.max(0, level));

  // Geometry: cylinder body from y=24 to y=156 (total cylinder height = 132px)
  const cylinderTopY = 24;
  const cylinderHeight = 132;
  const cylinderBottomY = cylinderTopY + cylinderHeight; // 156
  const fillPixels = (clampedLevel / 100) * cylinderHeight;
  const waterSurfaceY = cylinderBottomY - fillPixels;

  // Status-based color mapping
  const colorMap: Record<TankStatus, { main: string; surface: string; shadow: string }> = {
    normal: {
      main: '#10B981',
      surface: '#34D399',
      shadow: 'rgba(16, 185, 129, 0.25)',
    },
    low: {
      main: '#F59E0B',
      surface: '#FBBF24',
      shadow: 'rgba(245, 158, 11, 0.25)',
    },
    critical: {
      main: '#EF4444',
      surface: '#F87171',
      shadow: 'rgba(239, 68, 68, 0.3)',
    },
    offline: {
      main: '#64748B',
      surface: '#94A3B8',
      shadow: 'rgba(100, 116, 139, 0.15)',
    },
  };

  const {
    main: liquidColor,
    surface: surfaceColor,
    shadow: glowColor,
  } = colorMap[status] || colorMap.normal;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width, height }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 120 180"
        width={width}
        height={height}
        className="overflow-visible"
        style={
          {
            '--fill-color': liquidColor,
            '--glow-color': glowColor,
          } as React.CSSProperties
        }
      >
        <defs>
          {/* Cylinder body gradient for industrial glass/steel look */}
          <linearGradient id="cylinderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0.8" />
            <stop offset="25%" stopColor="#334155" stopOpacity="0.4" />
            <stop offset="80%" stopColor="#1E293B" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.9" />
          </linearGradient>

          {/* Liquid gradient */}
          <linearGradient id={`liquidGrad-${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={liquidColor} stopOpacity="0.95" />
            <stop offset="40%" stopColor={surfaceColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={liquidColor} stopOpacity="0.75" />
          </linearGradient>

          {/* Liquid mask ensuring volume stays strictly inside the cylinder boundary */}
          <clipPath id="cylinderClip">
            <path d="M 20 24 A 40 12 0 0 1 100 24 L 100 156 A 40 12 0 0 1 20 156 Z" />
          </clipPath>
        </defs>

        {/* Cylinder outer shadow/glow */}
        <rect
          x="18"
          y="20"
          width="84"
          height="140"
          rx="12"
          fill="none"
          stroke={glowColor}
          strokeWidth="2"
          className="opacity-40"
        />

        {/* Cylinder Background */}
        <path
          d="M 20 24 A 40 12 0 0 1 100 24 L 100 156 A 40 12 0 0 1 20 156 Z"
          fill="url(#cylinderGrad)"
          stroke="#334155"
          strokeWidth="1.5"
        />

        {/* Liquid Volume (clipped to cylinder cross-section) */}
        <g clipPath="url(#cylinderClip)">
          {clampedLevel > 0 && (
            <>
              {/* Bottom fluid base */}
              <rect
                x="15"
                y={waterSurfaceY}
                width="90"
                height={cylinderBottomY - waterSurfaceY + 20}
                fill={`url(#liquidGrad-${status})`}
                className="transition-all duration-700 ease-out"
              />

              {/* Water surface elliptical meniscus */}
              <ellipse
                cx="60"
                cy={waterSurfaceY}
                rx="40"
                ry="10"
                fill={surfaceColor}
                opacity="0.9"
                className="transition-all duration-700 ease-out"
              />

              {/* Subtle animated surface wave */}
              <path
                d={`M 20 ${waterSurfaceY} Q 40 ${waterSurfaceY - 2} 60 ${waterSurfaceY} T 100 ${waterSurfaceY}`}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1"
                opacity="0.4"
                className="motion-safe:animate-pulse"
              />
            </>
          )}
        </g>

        {/* Cylinder Gradation / Tick Marks (SCADA Style) */}
        {[0.25, 0.5, 0.75].map((fraction) => {
          const y = cylinderBottomY - fraction * cylinderHeight;
          return (
            <g key={fraction} className="opacity-40">
              <line x1="20" y1={y} x2="30" y2={y} stroke="#94A3B8" strokeWidth="1" />
              <line x1="90" y1={y} x2="100" y2={y} stroke="#94A3B8" strokeWidth="1" />
              <text
                x="12"
                y={y + 3}
                fill="#64748B"
                fontSize="7"
                fontFamily="ui-monospace, monospace"
                textAnchor="end"
              >
                {fraction * 100}%
              </text>
            </g>
          );
        })}

        {/* Top Rim Ellipse */}
        <ellipse
          cx="60"
          cy={cylinderTopY}
          rx="40"
          ry="10"
          fill="none"
          stroke="#475569"
          strokeWidth="1.5"
        />

        {/* Bottom Rim Curve */}
        <path d="M 20 156 A 40 10 0 0 0 100 156" fill="none" stroke="#475569" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

export default TankFill;
