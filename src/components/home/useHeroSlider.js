import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for WrapStore Home Hero Slider.
 * Handles:
 * - 5-second autoplay timer with manual reset
 * - Pause on hover, keyboard focus, document visibility hidden, pause button, and prefers-reduced-motion
 * - CSS Scroll-snap synchronization & programmatic scrolling
 * - Touch swiping & Desktop mouse dragging
 * - Accessible aria-live switching (off during autoplay, polite during manual navigation)
 * - Single slide detection (disables autoplay and controls if slide count <= 1)
 */
export function useHeroSlider({
  slides = [],
  autoScrollInterval = 5000,
}) {
  const slideCount = slides.length;
  const isMultiSlide = slideCount > 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [isHoverPaused, setIsHoverPaused] = useState(false);
  const [isFocusPaused, setIsFocusPaused] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isManualNav, setIsManualNav] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const containerRef = useRef(null);
  const scrollTrackRef = useRef(null);
  const timerRef = useRef(null);
  const isProgrammaticScrollRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // 1. Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // 2. Detect Tab Visibility (pause when tab is hidden)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsTabHidden(document.visibilityState === 'hidden' || document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 3. Preload next slide image
  useEffect(() => {
    if (!isMultiSlide || typeof window === 'undefined') return;
    const nextIdx = (currentIndex + 1) % slideCount;
    const nextImgSrc = slides[nextIdx]?.image;
    if (nextImgSrc) {
      const img = new Image();
      img.src = nextImgSrc;
    }
  }, [currentIndex, slides, isMultiSlide, slideCount]);

  // Determine if autoplay is currently paused
  const isPaused = 
    !isMultiSlide ||
    isManualPaused ||
    isHoverPaused ||
    isFocusPaused ||
    isTabHidden ||
    prefersReducedMotion;

  // Function to programmatically scroll container to a slide index
  const scrollToSlide = useCallback((index, behavior = 'smooth') => {
    const track = scrollTrackRef.current;
    if (!track) return;

    const width = track.clientWidth || track.offsetWidth;
    if (width > 0) {
      isProgrammaticScrollRef.current = true;
      track.scrollTo({
        left: index * width,
        behavior: prefersReducedMotion ? 'auto' : behavior,
      });

      // Clear programmatic flag after scroll settles
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 550);
    }
  }, [prefersReducedMotion]);

  // Navigate to specific slide
  const goToSlide = useCallback((index, isManual = true) => {
    if (!isMultiSlide) return;
    const target = (index + slideCount) % slideCount;
    setCurrentIndex(target);
    setResetKey((prev) => prev + 1);

    if (isManual) {
      setIsManualNav(true);
    }

    scrollToSlide(target, 'smooth');
  }, [isMultiSlide, slideCount, scrollToSlide]);

  // Advance to next slide
  const nextSlide = useCallback((isManual = true) => {
    if (!isMultiSlide) return;
    goToSlide((currentIndex + 1) % slideCount, isManual);
  }, [currentIndex, isMultiSlide, slideCount, goToSlide]);

  // Go to previous slide
  const prevSlide = useCallback((isManual = true) => {
    if (!isMultiSlide) return;
    goToSlide((currentIndex - 1 + slideCount) % slideCount, isManual);
  }, [currentIndex, isMultiSlide, slideCount, goToSlide]);

  // Toggle manual pause/play
  const togglePause = useCallback(() => {
    setIsManualPaused((prev) => !prev);
  }, []);

  // 4. Autoplay Timer: advances every 5000ms unless paused
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Set 5-second interval
    timerRef.current = setInterval(() => {
      setIsManualNav(false);
      nextSlide(false);
    }, autoScrollInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused, autoScrollInterval, nextSlide, resetKey]);

  // 5. Scroll Event Listener (Handles touch swiping & snap alignment)
  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    const track = scrollTrackRef.current;
    if (!track) return;

    const width = track.clientWidth || track.offsetWidth;
    if (width <= 0) return;

    const newIndex = Math.round(track.scrollLeft / width);
    if (newIndex >= 0 && newIndex < slideCount && newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      setIsManualNav(true);
      setResetKey((prev) => prev + 1);
    }
  }, [slideCount, currentIndex]);

  // 6. Keyboard navigation (Left / Right arrows)
  const handleKeyDown = useCallback((e) => {
    if (!isMultiSlide) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide(true);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide(true);
    }
  }, [isMultiSlide, prevSlide, nextSlide]);

  // 7. Mouse Drag Handlers (Desktop drag support)
  const handleMouseDown = useCallback((e) => {
    if (!isMultiSlide || e.button !== 0) return;
    const track = scrollTrackRef.current;
    if (!track) return;

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX;
    scrollLeftStartRef.current = track.scrollLeft;
    track.style.scrollBehavior = 'auto';
    track.style.cursor = 'grabbing';
  }, [isMultiSlide]);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const track = scrollTrackRef.current;
    if (!track) return;

    const deltaX = e.pageX - startXRef.current;
    if (Math.abs(deltaX) > 5) {
      hasDraggedRef.current = true;
    }
    track.scrollLeft = scrollLeftStartRef.current - deltaX;
  }, []);

  const handleMouseUpOrLeave = useCallback((e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const track = scrollTrackRef.current;
    if (!track) return;

    track.style.cursor = '';
    track.style.scrollBehavior = 'smooth';

    const width = track.clientWidth || track.offsetWidth;
    if (width > 0 && hasDraggedRef.current) {
      const targetIndex = Math.min(
        Math.max(0, Math.round(track.scrollLeft / width)),
        slideCount - 1
      );
      goToSlide(targetIndex, true);
    }
  }, [slideCount, goToSlide]);

  // 8. Hover event listeners
  const handleMouseEnter = useCallback(() => {
    setIsHoverPaused(true);
  }, []);

  const handleMouseLeave = useCallback((e) => {
    handleMouseUpOrLeave(e);
    setIsHoverPaused(false);
  }, [handleMouseUpOrLeave]);

  // 9. Focus event listeners
  const handleFocus = useCallback(() => {
    setIsFocusPaused(true);
  }, []);

  const handleBlur = useCallback((e) => {
    if (!containerRef.current) {
      setIsFocusPaused(false);
      return;
    }
    // Check if the newly focused element is still inside hero container
    const isStillInside = containerRef.current.contains(e.relatedTarget);
    if (!isStillInside) {
      setIsFocusPaused(false);
    }
  }, []);

  // Sync scroll position on window resize
  useEffect(() => {
    const handleResize = () => {
      const track = scrollTrackRef.current;
      if (!track) return;
      const width = track.clientWidth || track.offsetWidth;
      if (width > 0) {
        track.scrollLeft = currentIndex * width;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentIndex]);

  return {
    currentIndex,
    slideCount,
    isMultiSlide,
    isPaused,
    isManualPaused,
    isManualNav,
    prefersReducedMotion,
    resetKey,
    containerRef,
    scrollTrackRef,
    goToSlide,
    nextSlide,
    prevSlide,
    togglePause,
    handleScroll,
    handleKeyDown,
    handleMouseDown,
    handleMouseMove,
    handleMouseLeave,
    handleMouseUpOrLeave,
    handleMouseEnter,
    handleFocus,
    handleBlur,
  };
}

export default useHeroSlider;
