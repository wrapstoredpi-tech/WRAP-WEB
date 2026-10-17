import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for WrapStore Home Hero Slider.
 * 
 * Manages:
 * - Dynamic 5-second horizontal slide rotation
 * - Pause on pointer hover, touch interaction, keyboard focus, and tab hidden
 * - 2-second resume delay after interaction stops
 * - Pre-loads background photos for zero layout shift & instant transitions
 * - Touch swipe and desktop mouse drag support
 * - Reduced motion support
 */
export function useHeroSlider({
  slides = [],
  autoScrollInterval = 5000,
  resumeDelay = 2000,
}) {
  const slideCount = slides.length;
  const isMultiSlide = slideCount > 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isManualNav, setIsManualNav] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const resumeTimerRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchDeltaXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragDeltaXRef = useRef(0);

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

  // 2. Detect Tab Visibility
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

  // 3. Preload slide images
  useEffect(() => {
    if (!isMultiSlide || typeof window === 'undefined') return;
    slides.forEach((slide) => {
      if (slide?.image) {
        const img = new Image();
        img.src = slide.image;
      }
    });
  }, [slides, isMultiSlide]);

  // 4. Interaction & 2-Second Resume Delay Handling
  const isInteracting = isHovered || isTouching || isFocused || isTabHidden;

  useEffect(() => {
    if (prefersReducedMotion || !isMultiSlide) {
      setIsPaused(true);
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
      return;
    }

    if (isInteracting) {
      setIsPaused(true);
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    } else {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
      resumeTimerRef.current = setTimeout(() => {
        setIsPaused(false);
      }, resumeDelay);
    }

    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, [isInteracting, prefersReducedMotion, isMultiSlide, resumeDelay]);

  // Navigate to specific slide
  const goToSlide = useCallback((index, isManual = true) => {
    if (!isMultiSlide) return;
    const target = (index + slideCount) % slideCount;
    setCurrentIndex(target);
    setResetKey((prev) => prev + 1);

    if (isManual) {
      setIsManualNav(true);
    }
  }, [isMultiSlide, slideCount]);

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

  // 5. Autoplay Timer: advances dynamically every 5000ms
  useEffect(() => {
    if (isPaused || !isMultiSlide) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

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
  }, [isPaused, isMultiSlide, autoScrollInterval, nextSlide, resetKey]);

  // 6. Keyboard navigation (Left / Right arrow keys)
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

  // 7. Touch Swipe Handlers
  const handleTouchStart = useCallback((e) => {
    setIsTouching(true);
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartXRef.current) return;
    touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsTouching(false);
    const delta = touchDeltaXRef.current;
    if (Math.abs(delta) > 45) {
      if (delta < 0) {
        nextSlide(true);
      } else {
        prevSlide(true);
      }
    }
    touchStartXRef.current = 0;
    touchDeltaXRef.current = 0;
  }, [nextSlide, prevSlide]);

  // 8. Desktop Mouse Drag Handlers
  const handleMouseDown = useCallback((e) => {
    if (!isMultiSlide || e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.pageX;
    dragDeltaXRef.current = 0;
  }, [isMultiSlide]);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    dragDeltaXRef.current = e.pageX - dragStartXRef.current;
  }, []);

  const handleMouseUpOrLeave = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const delta = dragDeltaXRef.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) {
        nextSlide(true);
      } else {
        prevSlide(true);
      }
    }
    dragStartXRef.current = 0;
    dragDeltaXRef.current = 0;
  }, [nextSlide, prevSlide]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    handleMouseUpOrLeave();
    setIsHovered(false);
  }, [handleMouseUpOrLeave]);

  // 9. Focus Handlers
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback((e) => {
    if (!containerRef.current) {
      setIsFocused(false);
      return;
    }
    const isStillInside = containerRef.current.contains(e.relatedTarget);
    if (!isStillInside) {
      setIsFocused(false);
    }
  }, []);

  return {
    currentIndex,
    slideCount,
    isMultiSlide,
    isPaused,
    isManualNav,
    prefersReducedMotion,
    resetKey,
    containerRef,
    goToSlide,
    nextSlide,
    prevSlide,
    handleKeyDown,
    handleMouseDown,
    handleMouseMove,
    handleMouseLeave,
    handleMouseUpOrLeave,
    handleMouseEnter,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleFocus,
    handleBlur,
  };
}

export default useHeroSlider;
