import React, { useState, useEffect, useRef } from 'react';
import { useIntro } from '../context/IntroContext';
import { introConfig } from '../config/intro';
import { checkClipPathSupport } from '../lib/introController';

export function IntroTestPage() {
  const { replayIntro, isIntroDone } = useIntro();

  const [timings, setTimings] = useState({ ...introConfig.timings });
  const [forceFallback, setForceFallback] = useState(false);
  const [lastDuration, setLastDuration] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusLog, setStatusLog] = useState(['Ready to test.']);

  // Comparison video state
  const [videoSrc, setVideoSrc] = useState(null);
  const [compareMode, setCompareMode] = useState('side-by-side'); // 'side-by-side' | 'overlay'
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const videoRef = useRef(null);

  const supportsClipPath = checkClipPathSupport();

  const addLog = (msg) => {
    setStatusLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 9)]);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    addLog(`Starting intro test (wipe: ${timings.wipe}ms, hold: ${timings.hold}ms, fade: ${timings.fade}ms)...`);
    const startTime = performance.now();

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }

    replayIntro({
      timings,
      forceFallback,
      onRevealing: () => {
        addLog('Layer fade started (site entrance revealed).');
      },
      onDone: () => {
        const totalDuration = Math.round(performance.now() - startTime);
        setLastDuration(totalDuration);
        setIsPlaying(false);
        addLog(`Intro completed & removed from DOM in ${totalDuration}ms.`);
      },
    });
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      addLog(`Loaded comparison video: ${file.name}`);
    }
  };

  const clearSessionSeen = () => {
    try {
      sessionStorage.removeItem(introConfig.sessionKey);
      addLog('Cleared sessionStorage key "wrapstore_intro_seen".');
    } catch {}
  };

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Page Header */}
      <div className="border-b border-[#E5E5E3] pb-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[12px] font-semibold tracking-wider text-[#B0521F] uppercase">
              Temporary QA Route
            </span>
            <h1 className="font-display text-[32px] sm:text-[40px] text-[#141414] leading-[1.1] mt-1">
              Logo Intro Animation Inspector
            </h1>
            <p className="font-sans text-[14px] text-[#525252] mt-1">
              Replay the code-built logo intro on demand, inspect timing profiles, and compare with the original video.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePlay}
              disabled={isPlaying}
              className="px-6 py-3 bg-[#141414] hover:bg-[#383836] disabled:opacity-50 text-white font-semibold text-[14px] rounded-[6px] transition-colors cursor-pointer"
            >
              {isPlaying ? 'Intro Playing...' : 'Replay Intro'}
            </button>
            <button
              type="button"
              onClick={clearSessionSeen}
              className="px-4 py-3 bg-[#F4F3F0] hover:bg-[#EAE8E3] text-[#141414] font-medium text-[14px] rounded-[6px] border border-[#E5E5E3] transition-colors cursor-pointer"
            >
              Clear Session Key
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls & Timing Adjustments */}
        <div className="lg:col-span-5 space-y-6">
          {/* Timing Controls */}
          <div className="bg-[#FFFFFF] p-6 rounded-[6px] border border-[#E5E5E3] space-y-4">
            <div className="flex items-center justify-between border-b border-[#F4F3F0] pb-3">
              <h2 className="font-sans font-semibold text-[16px] text-[#141414]">Timeline Controls</h2>
              <button
                type="button"
                onClick={() => setTimings({ ...introConfig.timings })}
                className="text-[12px] text-[#737373] hover:text-[#141414] underline"
              >
                Reset Defaults
              </button>
            </div>

            {/* Blank */}
            <div>
              <div className="flex justify-between text-[13px] font-medium mb-1">
                <span>Blank Screen Delay</span>
                <span className="tabular-nums text-[#525252]">{timings.blank} ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="10"
                value={timings.blank}
                onChange={(e) => setTimings({ ...timings, blank: Number(e.target.value) })}
                className="w-full accent-[#141414]"
              />
            </div>

            {/* Wipe */}
            <div>
              <div className="flex justify-between text-[13px] font-medium mb-1">
                <span>Left-to-Right Wipe Reveal</span>
                <span className="tabular-nums text-[#525252]">{timings.wipe} ms</span>
              </div>
              <input
                type="range"
                min="300"
                max="2000"
                step="50"
                value={timings.wipe}
                onChange={(e) => setTimings({ ...timings, wipe: Number(e.target.value) })}
                className="w-full accent-[#141414]"
              />
              <span className="text-[11px] text-[#737373]">Easing: cubic-bezier(0.05, 0.2, 0.55, 0.9)</span>
            </div>

            {/* Hold */}
            <div>
              <div className="flex justify-between text-[13px] font-medium mb-1">
                <span>Static Hold</span>
                <span className="tabular-nums text-[#525252]">{timings.hold} ms</span>
              </div>
              <input
                type="range"
                min="300"
                max="2500"
                step="50"
                value={timings.hold}
                onChange={(e) => setTimings({ ...timings, hold: Number(e.target.value) })}
                className="w-full accent-[#141414]"
              />
              <span className="text-[11px] text-[#737373]">Original video was 1700ms; currently configured at {timings.hold}ms</span>
            </div>

            {/* Fade */}
            <div>
              <div className="flex justify-between text-[13px] font-medium mb-1">
                <span>Layer Fade Out</span>
                <span className="tabular-nums text-[#525252]">{timings.fade} ms</span>
              </div>
              <input
                type="range"
                min="200"
                max="1000"
                step="50"
                value={timings.fade}
                onChange={(e) => setTimings({ ...timings, fade: Number(e.target.value) })}
                className="w-full accent-[#141414]"
              />
              <span className="text-[11px] text-[#737373]">Easing: cubic-bezier(0.4, 0, 0.2, 1)</span>
            </div>

            {/* Fallback Checkbox */}
            <div className="pt-2 border-t border-[#F4F3F0]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={forceFallback}
                  onChange={(e) => setForceFallback(e.target.checked)}
                  className="rounded border-[#D4D4D0] text-[#141414] focus:ring-[#141414]"
                />
                <span className="text-[13px] text-[#141414] font-medium">
                  Force Fallback Mode (Opacity 600ms)
                </span>
              </label>
            </div>
          </div>

          {/* Diagnostic Stats */}
          <div className="bg-[#FFFFFF] p-6 rounded-[6px] border border-[#E5E5E3] space-y-3">
            <h2 className="font-sans font-semibold text-[16px] text-[#141414] border-b border-[#F4F3F0] pb-2">
              Diagnostics & Telemetry
            </h2>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <span className="text-[#737373] block">Trimmed Size:</span>
                <span className="font-medium text-[#141414] tabular-nums">572 × 158 px</span>
              </div>
              <div>
                <span className="text-[#737373] block">Aspect Ratio:</span>
                <span className="font-medium text-[#141414] tabular-nums">3.62 : 1 (target ~3.65)</span>
              </div>
              <div>
                <span className="text-[#737373] block">Clip-path Support:</span>
                <span className="font-medium text-[#141414]">
                  {supportsClipPath ? 'Native (Hardware Accel)' : 'Unsupported (Fallback)'}
                </span>
              </div>
              <div>
                <span className="text-[#737373] block">Resolution Note:</span>
                <span className="font-medium text-[#B0521F]">572px &lt; 1200px (SVG preferred)</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#F4F3F0]">
                <span className="text-[#737373] block">Measured Animation Duration:</span>
                <span className="font-bold text-[18px] text-[#141414] tabular-nums">
                  {lastDuration ? `${lastDuration} ms` : 'Not yet measured'}
                </span>
              </div>
            </div>
          </div>

          {/* Event Log */}
          <div className="bg-[#FFFFFF] p-4 rounded-[6px] border border-[#E5E5E3]">
            <h3 className="font-sans font-semibold text-[13px] text-[#141414] mb-2">Live Lifecycle Log</h3>
            <div className="font-mono text-[11px] text-[#525252] space-y-1 max-h-36 overflow-y-auto">
              {statusLog.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Asset Preview & Video Comparison */}
        <div className="lg:col-span-7 space-y-6">
          {/* Logo Asset Inspector */}
          <div className="bg-[#FFFFFF] p-6 rounded-[6px] border border-[#E5E5E3] space-y-4">
            <h2 className="font-sans font-semibold text-[16px] text-[#141414]">
              Logo Asset Preview (public/logo.png)
            </h2>
            <div className="p-8 bg-[#FAFAF9] border border-dashed border-[#D4D4D0] rounded-[6px] flex flex-col items-center justify-center">
              <div className="p-4 bg-white border border-[#E5E5E3] shadow-sm">
                <img
                  src="/logo.png"
                  alt="Logo Preview"
                  className="w-[280px] sm:w-[360px] h-auto object-contain"
                />
              </div>
              <p className="text-[12px] text-[#737373] mt-3 text-center">
                Border bounding box: 0px outer margin. Reveal starts at exact left stroke.
              </p>
            </div>
          </div>

          {/* Original Video Comparison */}
          <div className="bg-[#FFFFFF] p-6 rounded-[6px] border border-[#E5E5E3] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="font-sans font-semibold text-[16px] text-[#141414]">
                  Compare with Original Screen Recording
                </h2>
                <p className="text-[12px] text-[#737373]">
                  Load an MP4 / WebM recording of the original intro video to inspect side-by-side.
                </p>
              </div>

              <label className="inline-flex items-center justify-center px-3 py-2 bg-[#F4F3F0] hover:bg-[#EAE8E3] text-[#141414] text-[13px] font-medium rounded-[6px] border border-[#E5E5E3] cursor-pointer">
                <span>Upload Video</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {videoSrc ? (
              <div className="space-y-4">
                <div className="aspect-video bg-black rounded-[6px] overflow-hidden flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#737373]">Loaded video active for synchronized replay.</span>
                  <button
                    type="button"
                    onClick={() => setVideoSrc(null)}
                    className="text-[#B0521F] hover:underline"
                  >
                    Remove Video
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-[#FAFAF9] border border-dashed border-[#D4D4D0] rounded-[6px] text-center text-[13px] text-[#737373]">
                No comparison video loaded yet. Upload your screen recording to review synchronization.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IntroTestPage;
