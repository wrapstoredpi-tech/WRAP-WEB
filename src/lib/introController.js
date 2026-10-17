import { introConfig } from '../config/intro';

/**
 * Checks whether clip-path inset animation is supported by the browser.
 */
export function checkClipPathSupport() {
  if (typeof window === 'undefined' || !window.CSS || typeof window.CSS.supports !== 'function') {
    return false;
  }
  return (
    window.CSS.supports('clip-path', 'inset(0 0 0 0)') ||
    window.CSS.supports('-webkit-clip-path', 'inset(0 0 0 0)')
  );
}

/**
 * Robust scroll locking that supports iOS Safari without jumping or losing position.
 */
function createScrollLock() {
  let savedScrollY = 0;
  let isLocked = false;

  return {
    lock() {
      if (isLocked || typeof window === 'undefined') return;
      savedScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      isLocked = true;

      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
      document.body.style.touchAction = 'none';

      const root = document.getElementById('root');
      if (root) {
        root.setAttribute('aria-hidden', 'true');
        root.setAttribute('inert', '');
      }
    },
    unlock() {
      if (!isLocked || typeof window === 'undefined') return;
      isLocked = false;

      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
      document.body.style.touchAction = '';

      const root = document.getElementById('root');
      if (root) {
        root.removeAttribute('aria-hidden');
        root.removeAttribute('inert');
      }

      window.scrollTo(0, savedScrollY);
    },
    getSavedScroll() {
      return savedScrollY;
    },
  };
}

/**
 * Waits for the logo image to decode, racing against a timeout.
 */
async function waitForImageDecode(imgEl, timeoutMs) {
  if (!imgEl) return false;

  const decodePromise = (async () => {
    if (imgEl.complete && imgEl.naturalWidth > 0) {
      if (typeof imgEl.decode === 'function') {
        try {
          await imgEl.decode();
        } catch {
          // Continue if decode fails on already loaded element
        }
      }
      return true;
    }

    return new Promise((resolve) => {
      const handleLoad = async () => {
        if (typeof imgEl.decode === 'function') {
          try {
            await imgEl.decode();
          } catch {}
        }
        resolve(true);
      };
      const handleError = () => resolve(false);

      imgEl.addEventListener('load', handleLoad, { once: true });
      imgEl.addEventListener('error', handleError, { once: true });
    });
  })();

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => resolve(false), timeoutMs);
  });

  return Promise.race([decodePromise, timeoutPromise]);
}

/**
 * Runs the intro animation lifecycle.
 * Returns a controller object with a skip() method.
 */
export function startIntroAnimation({
  container = document.getElementById('wrapstore-intro'),
  logo = document.getElementById('wrapstore-intro-logo'),
  timings = introConfig.timings,
  forceFallback = false,
  onRevealing,
  onDone,
} = {}) {
  if (!container || !logo) {
    if (onDone) onDone();
    return { skip: () => {} };
  }

  const scrollLock = createScrollLock();
  scrollLock.lock();

  const timingConfig = { ...introConfig.timings, ...timings };
  let isDone = false;
  let isFading = false;
  let currentAnimation = null;
  let blankTimer = null;
  let holdTimer = null;
  let hardCapTimer = null;

  // Cleanup function
  const cleanup = () => {
    if (isDone) return;
    isDone = true;

    if (blankTimer) clearTimeout(blankTimer);
    if (holdTimer) clearTimeout(holdTimer);
    if (hardCapTimer) clearTimeout(hardCapTimer);

    window.removeEventListener('keydown', handleKeydown, true);
    window.removeEventListener('touchstart', handlePointerSkip, true);
    window.removeEventListener('click', handlePointerSkip, true);
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    scrollLock.unlock();

    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    document.documentElement.classList.remove('has-intro');

    // Emit event
    try {
      window.dispatchEvent(new CustomEvent('wrapstore:intro:done'));
      window.dispatchEvent(new CustomEvent('intro:done'));
    } catch {}

    if (onDone) onDone();
  };

  // Skip straight into fade
  const triggerFade = () => {
    if (isFading || isDone) return;
    isFading = true;

    if (blankTimer) clearTimeout(blankTimer);
    if (holdTimer) clearTimeout(holdTimer);

    // Ensure logo is at full reveal before layer fades
    if (logo) {
      logo.style.clipPath = 'inset(0 0% 0 0)';
      logo.style.webkitClipPath = 'inset(0 0% 0 0)';
      logo.style.opacity = '1';
    }

    // Trigger site content entrance
    try {
      window.dispatchEvent(new CustomEvent('wrapstore:intro:revealing'));
      window.dispatchEvent(new CustomEvent('intro:revealing'));
    } catch {}
    if (onRevealing) onRevealing();

    // Fade the entire layer out
    try {
      const fadeAnim = container.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        {
          duration: timingConfig.fade,
          easing: introConfig.easing.fade,
          fill: 'forwards',
        }
      );
      currentAnimation = fadeAnim;
      fadeAnim.onfinish = cleanup;
      fadeAnim.oncancel = cleanup;
    } catch {
      // Fallback if animate fails
      container.style.transition = `opacity ${timingConfig.fade}ms ${introConfig.easing.fade}`;
      container.style.opacity = '0';
      setTimeout(cleanup, timingConfig.fade);
    }
  };

  // Hard cap safety timer: intro must be completely gone within 4000ms
  hardCapTimer = setTimeout(() => {
    cleanup();
  }, introConfig.hardCapMs);

  // User skip listeners
  const handlePointerSkip = (e) => {
    // Prevent default so clicks don't fall through to underlying interactive elements
    e.stopPropagation();
    triggerFade();
  };

  const handleKeydown = (e) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      triggerFade();
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      triggerFade();
    }
  };

  window.addEventListener('keydown', handleKeydown, true);
  window.addEventListener('touchstart', handlePointerSkip, { capture: true, passive: true });
  window.addEventListener('click', handlePointerSkip, true);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Run the sequence
  (async () => {
    // 1. Wait for logo image decode (max 1000ms)
    const decoded = await waitForImageDecode(logo, introConfig.decodeTimeoutMs);
    if (!decoded || isDone) {
      // If decode fails or takes too long, skip immediately
      cleanup();
      return;
    }

    // 2. Blank white phase (50ms)
    logo.style.visibility = 'visible';
    const supportsClipPath = !forceFallback && checkClipPathSupport();

    if (!supportsClipPath) {
      logo.style.clipPath = 'none';
      logo.style.webkitClipPath = 'none';
      logo.style.opacity = '0';
    } else {
      logo.style.clipPath = 'inset(0 100% 0 0)';
      logo.style.webkitClipPath = 'inset(0 100% 0 0)';
      logo.style.opacity = '1';
    }

    blankTimer = setTimeout(() => {
      if (isFading || isDone) return;

      // 3. Wipe reveal phase (900ms)
      if (supportsClipPath) {
        try {
          const wipeAnim = logo.animate(
            [
              { clipPath: 'inset(0 100% 0 0)', WebkitClipPath: 'inset(0 100% 0 0)' },
              { clipPath: 'inset(0 0% 0 0)', WebkitClipPath: 'inset(0 0% 0 0)' },
            ],
            {
              duration: timingConfig.wipe,
              easing: introConfig.easing.wipe,
              fill: 'forwards',
            }
          );
          currentAnimation = wipeAnim;

          wipeAnim.onfinish = () => {
            if (isFading || isDone) return;
            // 4. Hold phase (1000ms)
            holdTimer = setTimeout(() => {
              triggerFade();
            }, timingConfig.hold);
          };
          wipeAnim.oncancel = () => {
            if (!isFading && !isDone) triggerFade();
          };
        } catch {
          // Fallback to opacity
          logo.style.clipPath = 'none';
          logo.style.webkitClipPath = 'none';
          logo.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: introConfig.fallbackFadeMs,
            fill: 'forwards',
          }).onfinish = () => {
            holdTimer = setTimeout(triggerFade, timingConfig.hold);
          };
        }
      } else {
        // Fallback: 600ms opacity fade-in
        const fallbackAnim = logo.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: introConfig.fallbackFadeMs,
          fill: 'forwards',
        });
        fallbackAnim.onfinish = () => {
          if (isFading || isDone) return;
          holdTimer = setTimeout(() => {
            triggerFade();
          }, timingConfig.hold);
        };
      }
    }, timingConfig.blank);
  })();

  return {
    skip: triggerFade,
    cancel: cleanup,
  };
}
