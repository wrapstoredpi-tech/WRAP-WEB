import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { introConfig } from '../config/intro';
import { startIntroAnimation } from '../lib/introController';

const IntroContext = createContext({
  isIntroDone: true,
  introPlayed: false,
  isRevealing: false,
  replayIntro: () => {},
});

export function IntroProvider({ children }) {
  // Check if intro was eligible from initial inline script
  const isInitiallyEligible =
    typeof window !== 'undefined' &&
    window.__WRAPSTORE_INTRO_ELIGIBLE__ === true &&
    document.getElementById('wrapstore-intro') !== null;

  const [isIntroDone, setIsIntroDone] = useState(!isInitiallyEligible);
  const [introPlayed, setIntroPlayed] = useState(isInitiallyEligible);
  const [isRevealing, setIsRevealing] = useState(false);
  const activeControllerRef = useRef(null);

  useEffect(() => {
    // If initially eligible, start animation on the inline element
    if (isInitiallyEligible) {
      const container = document.getElementById('wrapstore-intro');
      const logo = document.getElementById('wrapstore-intro-logo');

      if (container && logo) {
        activeControllerRef.current = startIntroAnimation({
          container,
          logo,
          onRevealing: () => {
            setIsRevealing(true);
          },
          onDone: () => {
            setIsIntroDone(true);
          },
        });
      } else {
        setIsIntroDone(true);
      }
    }

    const handleRevealing = () => {
      setIsRevealing(true);
    };

    const handleDone = () => {
      setIsIntroDone(true);
    };

    window.addEventListener('wrapstore:intro:revealing', handleRevealing);
    window.addEventListener('wrapstore:intro:done', handleDone);

    return () => {
      window.removeEventListener('wrapstore:intro:revealing', handleRevealing);
      window.removeEventListener('wrapstore:intro:done', handleDone);
    };
  }, [isInitiallyEligible]);

  /**
   * Replays the intro on demand (ignores sessionStorage, used for testing or re-run).
   */
  const replayIntro = (customOptions = {}) => {
    // Clean up any existing controller or intro element
    if (activeControllerRef.current) {
      activeControllerRef.current.cancel();
    }
    const existing = document.getElementById('wrapstore-intro');
    if (existing) existing.remove();

    setIsIntroDone(false);
    setIsRevealing(false);
    setIntroPlayed(true);

    // Create fresh intro container and logo elements
    const container = document.createElement('div');
    container.id = 'wrapstore-intro';
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    container.setAttribute('aria-label', 'WrapStore Intro');

    const logo = document.createElement('img');
    logo.id = 'wrapstore-intro-logo';
    logo.src = introConfig.logoSrc;
    logo.alt = 'WrapStore';
    logo.width = introConfig.logoWidth;
    logo.height = introConfig.logoHeight;
    logo.loading = 'eager';
    logo.decoding = 'async';

    container.appendChild(logo);
    document.body.appendChild(container);
    document.documentElement.classList.add('has-intro');

    activeControllerRef.current = startIntroAnimation({
      container,
      logo,
      timings: customOptions.timings || introConfig.timings,
      forceFallback: customOptions.forceFallback || false,
      onRevealing: () => {
        setIsRevealing(true);
        if (customOptions.onRevealing) customOptions.onRevealing();
      },
      onDone: () => {
        setIsIntroDone(true);
        if (customOptions.onDone) customOptions.onDone();
      },
    });

    return activeControllerRef.current;
  };

  return (
    <IntroContext.Provider value={{ isIntroDone, introPlayed, isRevealing, replayIntro }}>
      {children}
    </IntroContext.Provider>
  );
}

export function useIntro() {
  return useContext(IntroContext);
}

export default IntroContext;
