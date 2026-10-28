/**
 * WrapStore Intro Animation Configuration
 * Timings measured from the original logo reveal video.
 */
export const introConfig = {
  timings: {
    blank: 50, // Blank white screen before wipe begins
    wipe: 900,  // Left-to-right clip-path wipe reveal
    hold: 1000, // Static hold after full reveal (original was 1700ms; configurable)
    fade: 500,  // Entire intro layer opacity fade-out
  },
  easing: {
    wipe: 'cubic-bezier(0.05, 0.2, 0.55, 0.9)', // Fast start, slow finish
    fade: 'cubic-bezier(0.4, 0, 0.2, 1)',       // Smooth standard exit
  },
  fallbackFadeMs: 600, // Opacity fade-in when clip-path is unsupported
  hardCapMs: 4000,      // Maximum safety time the layer can remain visible
  decodeTimeoutMs: 1000,// Maximum time to wait for image decode before skipping
  sessionKey: 'wrapstore_intro_seen',
  logoSrc: '/logo.png',
  logoWidth: 349,
  logoHeight: 96,
};

export default introConfig;
