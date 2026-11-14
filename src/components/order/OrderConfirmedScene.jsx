import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * OrderConfirmedScene
 * ─────────────────────────────────────────────────────────────────────────────
 * Flat, minimal, original WrapStore animated delivery scene.
 * Inline SVG + CSS (transform and opacity only).
 * Under 12 KB added code, zero external libraries.
 */
export function OrderConfirmedScene({
  mode = 'confirmation',
  orderStatus = 'CONFIRMED',
  paymentStatus = 'PAID',
  orderNumber = '',
  onSequenceComplete,
  className = '',
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [isTapped, setIsTapped] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isPaid = paymentStatus === 'PAID' || ['CONFIRMED', 'PAID', 'Payment received'].includes(orderStatus);
  const isFailed = paymentStatus === 'FAILED' || ['CANCELLED', 'Cancelled', 'Refunded'].includes(orderStatus);

  useEffect(() => {
    if (mode !== 'confirmation') return;
    const storageKey = orderNumber ? `wrapstore_scene_played:${orderNumber}` : null;
    const alreadyPlayed = storageKey && typeof sessionStorage !== 'undefined' && sessionStorage.getItem(storageKey);

    if (prefersReducedMotion || alreadyPlayed) {
      setHasFinished(true);
      setIsPlaying(false);
      if (onSequenceComplete) onSequenceComplete();
      return;
    }

    if (isPaid && !isFailed) {
      setIsPlaying(true);
      setHasFinished(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsPlaying(false);
        setHasFinished(true);
        if (storageKey) {
          try { sessionStorage.setItem(storageKey, 'true'); } catch (e) {}
        }
        if (onSequenceComplete) onSequenceComplete();
      }, 4400);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mode, orderNumber, isPaid, isFailed, prefersReducedMotion]);

  const handleReplay = () => {
    if (prefersReducedMotion) return;
    setHasFinished(false);
    setIsPlaying(false);
    setTimeout(() => {
      setIsPlaying(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsPlaying(false);
        setHasFinished(true);
        if (orderNumber) {
          try { sessionStorage.setItem(`wrapstore_scene_played:${orderNumber}`, 'true'); } catch (e) {}
        }
      }, 4400);
    }, 20);
  };

  const handleVanClick = () => {
    if (prefersReducedMotion) return;
    if (hasFinished) {
      handleReplay();
      return;
    }
    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 350);
  };

  const displayState = useMemo(() => {
    if (mode === 'tracking') {
      const s = (orderStatus || '').toUpperCase();
      if (s.includes('CANCEL') || s.includes('REFUND')) return 'tracking-cancelled';
      if (s.includes('DELIVER')) return 'tracking-delivered';
      if (s.includes('SHIP')) return 'tracking-shipped';
      if (s.includes('PACK') || s.includes('CONFIRM') || s.includes('PAID')) return 'tracking-packed';
      return 'tracking-awaiting';
    }
    if (isFailed) return 'failed';
    if (!isPaid) return 'waiting';
    if (hasFinished) return 'final';
    if (isPlaying) return 'playing';
    return 'waiting';
  }, [mode, orderStatus, isPaid, isFailed, hasFinished, isPlaying]);

  const isMuted = displayState === 'failed' || displayState === 'tracking-cancelled';

  return (
    <div className={`relative w-full rounded-[6px] overflow-hidden bg-[#F4F3F0] ${className}`}>
      <style>{`
        @keyframes wsGnd { 0% { transform: scaleX(0); opacity: 0; } 9% { transform: scaleX(1); opacity: 1; } 100% { transform: scaleX(1); opacity: 1; } }
        @keyframes wsPWalk { 0%,9% { transform: translate3d(-80px,0,0); opacity: 0; } 11% { opacity: 1; } 34.1% { transform: translate3d(245px,0,0) rotate(0deg); } 47.7% { transform: translate3d(245px,0,0) rotate(6deg); } 54.5% { transform: translate3d(233px,0,0) rotate(0deg); } 100% { transform: translate3d(233px,0,0) rotate(0deg); opacity: 1; } }
        @keyframes wsLegL { 0%,9%,34.1%,100% { transform: rotate(0deg); } 12%,18%,24%,30% { transform: rotate(22deg); } 15%,21%,27%,33% { transform: rotate(-22deg); } }
        @keyframes wsLegR { 0%,9%,34.1%,100% { transform: rotate(0deg); } 12%,18%,24%,30% { transform: rotate(-22deg); } 15%,21%,27%,33% { transform: rotate(22deg); } }
        @keyframes wsBob { 0%,9%,15%,21%,27%,33%,34.1%,100% { transform: translate3d(0,0,0); } 12%,18%,24%,30% { transform: translate3d(0,-2px,0); } }
        @keyframes wsWave { 0%,65.9%,75.5%,100% { transform: rotate(0deg); } 68%,73% { transform: rotate(-35deg); } 70.5% { transform: rotate(-10deg); } }
        @keyframes wsBox { 0%,9% { transform: translate3d(-80px,0,0); opacity: 0; } 11% { opacity: 1; } 34.1% { transform: translate3d(245px,0,0); } 47.7% { transform: translate3d(324px,-6px,0); } 54.5%,61.4% { transform: translate3d(324px,0,0); opacity: 1; } 88.6%,100% { transform: translate3d(744px,0,0); opacity: 0; } }
        @keyframes wsDoor { 0%,47.7% { transform: scaleX(0.08); } 54.5%,100% { transform: scaleX(1); } }
        @keyframes wsBnc { 0%,54.5%,58.5%,61.4%,100% { transform: translate3d(0,0,0); } 56.5% { transform: translate3d(0,2px,0); } 60% { transform: translate3d(0,1.5px,0); } }
        @keyframes wsDrive { 0%,61.4% { transform: translate3d(0,0,0); opacity: 1; } 88.6% { transform: translate3d(420px,0,0); opacity: 1; } 91%,100% { transform: translate3d(450px,0,0); opacity: 0; } }
        @keyframes wsRoll { 0%,61.4% { transform: rotate(0deg); } 88.6%,100% { transform: rotate(720deg); } }
        @keyframes wsDash { 0%,61.4% { transform: translate3d(0,0,0); } 88.6%,100% { transform: translate3d(-140px,0,0); } }
        @keyframes wsSpd { 0%,63% { opacity: 0; transform: translate3d(0,0,0); } 68%,82% { opacity: 0.85; transform: translate3d(-20px,0,0); } 88.6%,100% { opacity: 0; transform: translate3d(-40px,0,0); } }
        @keyframes wsTick { 0%,88.6% { transform: scale(0); opacity: 0; } 94% { transform: scale(1.15); opacity: 1; } 97%,100% { transform: scale(1); opacity: 1; } }
        @keyframes wsRing { 0%,88.6% { transform: scale(0.6); opacity: 0; } 89% { opacity: 0.5; } 98%,100% { transform: scale(1.6); opacity: 0; } }
        @keyframes wsBreathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        @keyframes wsTapBnc { 0%,100% { transform: translate3d(0,0,0); } 40% { transform: translate3d(0,3px,0); } 75% { transform: translate3d(0,-1px,0); } }
        @keyframes wsLoopDr { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,1.5px,0); } }
        @keyframes wsLoopRl { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wsLoopDs { from { transform: translate3d(0,0,0); } to { transform: translate3d(-30px,0,0); } }

        .ws-q-gnd { animation: wsGnd 4.4s cubic-bezier(0.25,0.1,0.25,1) forwards; transform-origin: left; will-change: transform, opacity; }
        .ws-q-prs { animation: wsPWalk 4.4s cubic-bezier(0.25,0.1,0.25,1) forwards; transform-origin: 255px 290px; will-change: transform; }
        .ws-q-ll { animation: wsLegL 4.4s linear forwards; transform-origin: 251px 258px; }
        .ws-q-lr { animation: wsLegR 4.4s linear forwards; transform-origin: 259px 258px; }
        .ws-q-bdy { animation: wsBob 4.4s ease-in-out forwards; }
        .ws-q-arm { animation: wsWave 4.4s ease-in-out forwards; transform-origin: 258px 236px; }
        .ws-q-box { animation: wsBox 4.4s ease-in-out forwards; will-change: transform, opacity; }
        .ws-q-dor { animation: wsDoor 4.4s ease-in-out forwards; transform-origin: 320px 230px; will-change: transform; }
        .ws-q-vbn { animation: wsBnc 4.4s ease-in-out forwards; will-change: transform; }
        .ws-q-vdr { animation: wsDrive 4.4s cubic-bezier(0.55,0,0.9,0.5) forwards; will-change: transform, opacity; }
        .ws-q-whl { animation: wsRoll 4.4s cubic-bezier(0.55,0,0.9,0.5) forwards; will-change: transform; }
        .ws-q-dsh { animation: wsDash 4.4s cubic-bezier(0.55,0,0.9,0.5) forwards; will-change: transform; }
        .ws-q-spd { animation: wsSpd 4.4s ease-out forwards; will-change: transform, opacity; }
        .ws-q-tck { animation: wsTick 4.4s cubic-bezier(0.34,1.56,0.64,1) forwards; transform-origin: 320px 240px; will-change: transform, opacity; }
        .ws-q-rng { animation: wsRing 4.4s ease-out forwards; transform-origin: 320px 240px; will-change: transform, opacity; }

        .ws-brth { animation: wsBoxBreathe 2.4s ease-in-out infinite; transform-origin: 275px 280px; }
        .ws-lp-dr { animation: wsLoopDr 0.6s ease-in-out infinite; }
        .ws-lp-wh { animation: wsLoopRl 0.8s linear infinite; }
        .ws-lp-ds { animation: wsLoopDs 0.4s linear infinite; }
        .ws-tap { animation: wsTapBnc 0.35s ease-out; }

        @media (prefers-reduced-motion: reduce) {
          .ws-q-gnd,.ws-q-prs,.ws-q-ll,.ws-q-lr,.ws-q-bdy,.ws-q-arm,.ws-q-box,.ws-q-dor,.ws-q-vbn,.ws-q-vdr,.ws-q-whl,.ws-q-dsh,.ws-q-spd,.ws-q-tck,.ws-q-rng,.ws-brth,.ws-lp-dr,.ws-lp-wh,.ws-lp-ds,.ws-tap {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <svg viewBox="0 0 640 360" className="w-full h-auto aspect-[16/9] block select-none" aria-hidden="true">
        <defs>
          <clipPath id="ws-cargoclip">
            <rect x="320" y="190" width="135" height="85" rx="3" />
          </clipPath>
        </defs>

        {/* 1. Background Panel */}
        <rect width="640" height="360" rx="6" fill={isMuted ? '#EDEDEC' : '#F4F3F0'} />

        {/* 2. Ground and Road */}
        <g id="ground">
          <line x1="36" y1="290" x2="604" y2="290" stroke={isMuted ? '#D6D5D2' : '#E5E5E3'} strokeWidth="2.5" strokeLinecap="round" className={displayState === 'playing' ? 'ws-q-gnd' : ''} />
          <g className={displayState === 'playing' ? 'ws-q-dsh' : displayState === 'tracking-shipped' ? 'ws-lp-ds' : ''}>
            <line x1="20" y1="308" x2="680" y2="308" stroke={isMuted ? '#DFDEDC' : '#E8E7E4'} strokeWidth="2" strokeDasharray="16 14" />
          </g>

          {(displayState === 'playing' || displayState === 'tracking-shipped') && (
            <g id="speedlines" className={displayState === 'playing' ? 'ws-q-spd' : ''} opacity={displayState === 'tracking-shipped' ? 0.75 : 0}>
              <line x1="260" y1="215" x2="310" y2="215" stroke="#B0521F" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
              <line x1="240" y1="240" x2="305" y2="240" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
              <line x1="270" y1="262" x2="312" y2="262" stroke="#B0521F" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            </g>
          )}
        </g>

        {/* 3. Van */}
        {displayState !== 'final' && (
          <g
            id="van"
            onClick={handleVanClick}
            className={`cursor-pointer ${displayState === 'playing' ? 'ws-q-vdr' : displayState === 'tracking-shipped' ? 'ws-lp-dr' : ''} ${isTapped ? 'ws-tap' : ''}`}
            style={{ transformOrigin: '400px 290px' }}
          >
            <g className={displayState === 'playing' ? 'ws-q-vbn' : ''}>
              {/* Van Body */}
              <path
                d="M320 270V192q0-6 6-6h128q6 0 10 5l22 24h22q4 0 4 5v49h-14a23 23 0 00-46 0h-69a23 23 0 00-46 0z"
                fill="#FFF"
                stroke={isMuted ? '#999996' : '#141414'}
                strokeWidth="2"
                strokeLinejoin="round"
              />

              {/* Cargo Interior */}
              {['waiting', 'playing', 'tracking-awaiting', 'failed', 'tracking-cancelled'].includes(displayState) && (
                <rect x="321" y="190" width="26" height="78" fill={isMuted ? '#6B6B69' : '#262624'} />
              )}

              {/* Accent stripe (#B0521F) */}
              <path d="M348 232h163v4H348z" fill={isMuted ? '#999996' : '#B0521F'} />

              {/* Cab Windshield (#141414) */}
              <path d="M456 190l26 26h-30V190z" fill={isMuted ? '#787876' : '#141414'} />

              {/* Front Details */}
              <rect x="508" y="226" width="4" height="8" rx="1.5" fill={isMuted ? '#B8B8B5' : '#D99B77'} />
              <rect x="506" y="262" width="7" height="8" rx="1.5" fill="#141414" />

              {/* Rear Door */}
              <g
                className={displayState === 'playing' ? 'ws-q-dor' : ''}
                style={{
                  transformOrigin: '320px 230px',
                  transform: ['waiting', 'tracking-awaiting', 'failed', 'tracking-cancelled'].includes(displayState) ? 'scaleX(0.08)' : 'scaleX(1)',
                }}
              >
                <rect x="320" y="189" width="28" height="80" fill="#FFF" stroke="#141414" strokeWidth="1.5" />
                <line x1="334" y1="190" x2="334" y2="268" stroke="#E5E5E3" strokeWidth="1" />
                <rect x="340" y="230" width="3" height="6" rx="1" fill="#141414" />
              </g>

              {/* WRAP STORE Official Logo on Cargo Panel */}
              <g transform="translate(366, 202)">
                <rect x="0" y="0" width="56" height="20" fill="#FFF" stroke="#141414" strokeWidth="1.2" rx="1" />
                <rect x="1" y="1" width="26" height="18" fill="#141414" />
                <text x="14" y="13" fill="#FFF" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif" textAnchor="middle" letterSpacing="0.4">WRAP</text>
                <text x="41" y="13" fill="#141414" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif" textAnchor="middle" letterSpacing="0.4">STORE</text>
              </g>

              {/* Rear Wheel (x=360, y=274) */}
              <g className={displayState === 'playing' ? 'ws-q-whl' : displayState === 'tracking-shipped' ? 'ws-lp-wh' : ''} style={{ transformOrigin: '360px 274px' }}>
                <circle cx="360" cy="274" r="16" fill="#141414" />
                <circle cx="360" cy="274" r="8" fill="#F4F3F0" stroke="#141414" strokeWidth="2" />
                <circle cx="360" cy="274" r="3" fill="#141414" />
                <line x1="360" y1="267" x2="360" y2="281" stroke="#141414" strokeWidth="1.5" />
                <line x1="353" y1="274" x2="367" y2="274" stroke="#141414" strokeWidth="1.5" />
              </g>

              {/* Front Wheel (x=475, y=274) */}
              <g className={displayState === 'playing' ? 'ws-q-whl' : displayState === 'tracking-shipped' ? 'ws-lp-wh' : ''} style={{ transformOrigin: '475px 274px' }}>
                <circle cx="475" cy="274" r="16" fill="#141414" />
                <circle cx="475" cy="274" r="8" fill="#F4F3F0" stroke="#141414" strokeWidth="2" />
                <circle cx="475" cy="274" r="3" fill="#141414" />
                <line x1="475" y1="267" x2="475" y2="281" stroke="#141414" strokeWidth="1.5" />
                <line x1="468" y1="274" x2="482" y2="274" stroke="#141414" strokeWidth="1.5" />
              </g>
            </g>
          </g>
        )}

        {/* 4. Person & Box */}
        {['waiting', 'tracking-awaiting', 'failed', 'tracking-cancelled'].includes(displayState) && (
          <g id="person-waiting">
            <g transform="translate(230, 0)">
              <circle cx="15" cy="222" r="7" fill="#141414" />
              <path d="M18 218l6 1-1 2h-5z" fill="#141414" />
              <rect x="7" y="231" width="16" height="28" rx="6" fill="#141414" />
              <line x1="11" y1="258" x2="11" y2="290" stroke="#141414" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="19" y1="258" x2="19" y2="290" stroke="#141414" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M9 236l-4 18" stroke="#141414" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M21 236l4 18" stroke="#141414" strokeWidth="3.5" strokeLinecap="round" />
            </g>

            {/* Box on ground beside open door */}
            <g className={displayState === 'waiting' ? 'ws-brth' : ''} transform="translate(275, 268)">
              <rect x="0" y="0" width="24" height="20" rx="2" fill={isMuted ? '#B8B8B5' : '#D99B77'} stroke={isMuted ? '#8C8C8A' : '#B0521F'} strokeWidth="1.2" />
              <rect x="10" y="0" width="4" height="20" fill={isMuted ? '#8C8C8A' : '#B0521F'} />
              <rect x="3" y="10" width="6" height="5" fill="#FFF" rx="0.5" />
              <line x1="4.5" y1="11" x2="4.5" y2="14" stroke="#141414" strokeWidth="0.8" />
              <line x1="6.5" y1="11" x2="6.5" y2="14" stroke="#141414" strokeWidth="0.8" />
            </g>
          </g>
        )}

        {displayState === 'playing' && (
          <g id="person-animated">
            <g className="ws-q-prs">
              <line x1="251" y1="258" x2="251" y2="290" stroke="#141414" strokeWidth="4.5" strokeLinecap="round" className="ws-q-ll" />
              <line x1="259" y1="258" x2="259" y2="290" stroke="#141414" strokeWidth="4.5" strokeLinecap="round" className="ws-q-lr" />
              <g className="ws-q-bdy">
                <circle cx="255" cy="222" r="7" fill="#141414" />
                <path d="M258 218l6 1-1 2h-5z" fill="#141414" />
                <rect x="247" y="231" width="16" height="28" rx="6" fill="#141414" />
                <path d="M249 236l14 10" stroke="#141414" strokeWidth="3.5" strokeLinecap="round" />
                <g className="ws-q-arm">
                  <path d="M261 236l12 10" stroke="#141414" strokeWidth="3.5" strokeLinecap="round" />
                </g>
              </g>
            </g>

            {/* Box moves into van */}
            <g className="ws-q-box" clipPath="url(#ws-cargoclip)">
              <g transform="translate(268, 236)">
                <rect x="0" y="0" width="24" height="20" rx="2" fill="#D99B77" stroke="#B0521F" strokeWidth="1.2" />
                <rect x="10" y="0" width="4" height="20" fill="#B0521F" />
                <rect x="3" y="10" width="6" height="5" fill="#FFF" rx="0.5" />
                <line x1="4.5" y1="11" x2="4.5" y2="14" stroke="#141414" strokeWidth="0.8" />
                <line x1="6.5" y1="11" x2="6.5" y2="14" stroke="#141414" strokeWidth="0.8" />
              </g>
            </g>
          </g>
        )}

        {/* 5. Green Tick Badge */}
        {['playing', 'final', 'tracking-delivered'].includes(displayState) && (
          <g id="tick">
            {displayState === 'playing' && (
              <circle cx="320" cy="240" r="30" fill="none" stroke="#16A34A" strokeWidth="2" className="ws-q-rng" />
            )}
            <g className={displayState === 'playing' ? 'ws-q-tck' : ''} style={{ transformOrigin: '320px 240px' }}>
              <circle cx="320" cy="240" r="24" fill="#16A34A" />
              <path d="M311 240l6 6 12-13" stroke="#FFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
          </g>
        )}
      </svg>

      {/* Floating Replay button for confirmation screen */}
      {mode === 'confirmation' && hasFinished && (
        <button
          type="button"
          onClick={handleReplay}
          aria-label="Replay order confirmation animation"
          className="absolute bottom-2.5 right-3 text-[11px] font-medium text-[#737373] hover:text-[#141414] bg-white/80 hover:bg-white px-2 py-0.5 rounded-[4px] border border-[#E5E5E3] transition-colors cursor-pointer select-none"
        >
          Replay
        </button>
      )}
    </div>
  );
}

export default OrderConfirmedScene;
