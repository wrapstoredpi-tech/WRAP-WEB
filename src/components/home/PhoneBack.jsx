import React from 'react';
import { getPhoneFinish } from '../../config/phoneFinishes';

/**
 * Returns camera layout type based on phone model name.
 * Layouts: 'plateau' | 'pro' | 'pill' | 'diag' | 'galaxy' | 'ultra'
 */
export function getPhoneLayout(model = '') {
  const m = String(model).toLowerCase();

  // 1. Samsung Galaxy Ultra
  if (m.includes('ultra')) return 'ultra';

  // 2. Samsung Galaxy S base / Plus / Edge
  if (m.includes('galaxy') || m.includes('s2') || m.includes('samsung')) return 'galaxy';

  // 3. iPhone Pro with plateau (iPhone 17 Pro, 17 Pro Max, 18 Pro, etc.)
  if (m.match(/iphone\s*(17|18|19|2\d)\s*pro/i)) return 'plateau';

  // 4. iPhone Pro traditional (iPhone 13 Pro to 16 Pro Max)
  if (m.includes('pro max') || (m.includes('pro') && !m.includes('air'))) return 'pro';

  // 5. iPhone Base with vertical pill (iPhone 16, 16 Plus, 17, 18 base)
  if (m.match(/iphone\s*(16|17|18|19|2\d)/i)) return 'pill';

  // 6. iPhone Base diagonal (iPhone 13, 14, 15 and Plus / mini)
  return 'diag';
}

function CameraLens({ cx, cy, r }) {
  return (
    <g>
      {/* Outer metallic bezel ring */}
      <circle cx={cx} cy={cy} r={r} fill="#1A1A1C" stroke="#4A4A52" strokeWidth="1.8" />
      {/* Dark lens glass */}
      <circle cx={cx} cy={cy} r={r * 0.65} fill="#0E0E10" />
      {/* Inner aperture / reflection */}
      <circle cx={cx - r * 0.25} cy={cy - r * 0.25} r={r * 0.22} fill="#71717A" opacity="0.65" />
    </g>
  );
}

export function PhoneBack({ model = '', brand = 'Apple', className = '' }) {
  const layout = getPhoneLayout(model);
  const finish = getPhoneFinish(model);
  const isUltra = layout === 'ultra';
  const bodyRadius = isUltra ? 8 : 20;

  return (
    <svg
      viewBox="0 0 120 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Subtle specular gradient across back glass */}
        <linearGradient id={`grad-${model.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="120" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor={finish.color} />
          <stop offset="0.6" stopColor={finish.color} />
          <stop offset="1" stopColor={finish.edge} />
        </linearGradient>
      </defs>

      {/* Phone chassis / back body */}
      <rect
        x="4"
        y="4"
        width="112"
        height="192"
        rx={bodyRadius}
        fill={`url(#grad-${model.replace(/[^a-zA-Z0-9]/g, '')})`}
        stroke={finish.edge}
        strokeWidth="2"
      />

      {/* Subtle edge shadow/highlight for depth */}
      <rect
        x="6"
        y="6"
        width="108"
        height="188"
        rx={bodyRadius - 2}
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1"
      />

      {/* ─── 1. PLATEAU (iPhone 17 Pro / Pro Max) ─────────────────────────── */}
      {layout === 'plateau' && (
        <g>
          {/* Full-width camera plateau bar */}
          <rect
            x="8"
            y="12"
            width="104"
            height="46"
            rx="14"
            fill={finish.shade}
            stroke={finish.edge}
            strokeWidth="1"
          />
          {/* 3 lenses in triangle */}
          <CameraLens cx={26} cy={26} r={8.5} />
          <CameraLens cx={26} cy={44} r={8.5} />
          <CameraLens cx={46} cy={35} r={8.5} />
          {/* Flash */}
          <circle cx={76} cy={27} r={4} fill="#FFF9E8" stroke="#D3C7B5" strokeWidth="0.8" />
          {/* LiDAR Sensor */}
          <circle cx={76} cy={43} r={3.2} fill="#242426" stroke="#3D3D42" strokeWidth="0.8" />
        </g>
      )}

      {/* ─── 2. PRO (iPhone 13 Pro to 16 Pro Max) ──────────────────────────── */}
      {layout === 'pro' && (
        <g>
          {/* Square camera bump top-left */}
          <rect
            x="12"
            y="12"
            width="46"
            height="46"
            rx="12"
            fill={finish.shade}
            stroke={finish.edge}
            strokeWidth="0.9"
          />
          {/* 3 lenses in triangle */}
          <CameraLens cx={24} cy={24} r={8.2} />
          <CameraLens cx={24} cy={46} r={8.2} />
          <CameraLens cx={46} cy={35} r={8.2} />
          {/* Flash */}
          <circle cx={46} cy={21} r={3.3} fill="#FFF9E8" stroke="#D3C7B5" strokeWidth="0.8" />
          {/* LiDAR */}
          <circle cx={46} cy={49} r={2.8} fill="#242426" stroke="#3D3D42" strokeWidth="0.8" />
        </g>
      )}

      {/* ─── 3. PILL (iPhone 16, 16 Plus, 17 base) ───────────────────────── */}
      {layout === 'pill' && (
        <g>
          {/* Vertical pill bump */}
          <rect
            x="14"
            y="14"
            width="28"
            height="52"
            rx="14"
            fill={finish.shade}
            stroke={finish.edge}
            strokeWidth="0.9"
          />
          <CameraLens cx={28} cy={27} r={8} />
          <CameraLens cx={28} cy={53} r={8} />
          {/* Flash to the right */}
          <circle cx={52} cy={40} r={3.2} fill="#FFF9E8" stroke="#D3C7B5" strokeWidth="0.8" />
        </g>
      )}

      {/* ─── 4. DIAG (iPhone 13, 14, 15 and Plus / mini) ─────────────────── */}
      {layout === 'diag' && (
        <g>
          {/* Square bump */}
          <rect
            x="14"
            y="14"
            width="42"
            height="42"
            rx="10"
            fill={finish.shade}
            stroke={finish.edge}
            strokeWidth="0.9"
          />
          <CameraLens cx={26} cy={26} r={8} />
          <CameraLens cx={44} cy={44} r={8} />
          {/* Flash */}
          <circle cx={44} cy={23} r={3} fill="#FFF9E8" stroke="#D3C7B5" strokeWidth="0.8" />
          {/* Mic */}
          <circle cx={26} cy={47} r={1.5} fill="#242426" />
        </g>
      )}

      {/* ─── 5. GALAXY (Galaxy S base / Plus / Edge) ───────────────────────── */}
      {layout === 'galaxy' && (
        <g>
          {/* 3 individual lenses in vertical column (no camera island) */}
          <CameraLens cx={24} cy={26} r={7.5} />
          <CameraLens cx={24} cy={46} r={7.5} />
          <CameraLens cx={24} cy={66} r={7.5} />
          {/* Flash to the right */}
          <circle cx={40} cy={26} r={2.8} fill="#FFF9E8" stroke="#D3C7B5" strokeWidth="0.8" />
        </g>
      )}

      {/* ─── 6. ULTRA (Galaxy S Ultra) ────────────────────────────────────── */}
      {layout === 'ultra' && (
        <g>
          {/* 3 large lenses in vertical column */}
          <CameraLens cx={24} cy={26} r={8.2} />
          <CameraLens cx={24} cy={48} r={8.2} />
          <CameraLens cx={24} cy={70} r={8.2} />
          {/* Right column: Flash, Laser sensor, Periscope rectangle */}
          <circle cx={43} cy={26} r={2.8} fill="#FFF9E8" stroke="#D3C7B5" strokeWidth="0.8" />
          <circle cx={43} cy={40} r={3.6} fill="#252528" stroke="#4A4A52" strokeWidth="1.2" />
          {/* Periscope rectangular telephoto window */}
          <rect
            x="37"
            y="57"
            width="12"
            height="12"
            rx="2.5"
            fill="#101012"
            stroke="#4A4A52"
            strokeWidth="1.5"
          />
          <rect x="39" y="59" width="8" height="8" rx="1.5" fill="#1C1C20" />
        </g>
      )}
    </svg>
  );
}

export default PhoneBack;
