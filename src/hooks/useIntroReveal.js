import { useState, useEffect } from 'react';
import { useIntro } from '../context/IntroContext';

/**
 * Custom hook to animate first-screen elements as the intro layer fades.
 * 
 * Rules:
 * - Elements rise 12px (translateY(12px) -> translateY(0)) and fade in (opacity 0 -> 1) over 600ms.
 * - Staggered by 80ms (e.g., Header: 0ms, Hero Text: 80ms, Hero Photo: 160ms).
 * - Uses transform and opacity only.
 * - will-change is applied during animation and completely removed afterwards.
 * - Runs ONLY when the intro actually played. If intro never ran (direct link, already seen, reduced motion),
 *   elements render immediately with zero delay and no initial opacity 0.
 */
export function useIntroReveal(delayMs = 0) {
  const { introPlayed, isRevealing, isIntroDone } = useIntro();

  // If intro didn't play or is already done, no styles needed (instant standard paint)
  const [style, setStyle] = useState(() => {
    if (!introPlayed || isIntroDone) return {};
    return {
      opacity: 0,
      transform: 'translateY(12px)',
      willChange: 'transform, opacity',
    };
  });

  useEffect(() => {
    if (!introPlayed || isIntroDone) {
      setStyle({});
      return;
    }

    if (isRevealing) {
      const delayTimer = setTimeout(() => {
        setStyle({
          opacity: 1,
          transform: 'translateY(0px)',
          transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1), opacity 600ms cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform, opacity',
        });

        // After 600ms animation completes, clean up inline styles and remove will-change
        const cleanupTimer = setTimeout(() => {
          setStyle({});
        }, 650);

        return () => clearTimeout(cleanupTimer);
      }, delayMs);

      return () => clearTimeout(delayTimer);
    }
  }, [introPlayed, isRevealing, isIntroDone, delayMs]);

  return style;
}

export default useIntroReveal;
