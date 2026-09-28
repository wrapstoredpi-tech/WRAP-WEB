/**
 * src/context/PhoneContext.jsx
 * ────────────────────────────
 * Phone Memory context. Manages user's selected phone model ({ brand, model })
 * stored in localStorage key `wrapstore_phone`.
 * Also controls the Phone Selection Sheet / Modal visibility.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LOCAL_STORAGE_KEY = 'wrapstore_phone';
const SESSION_PROMPTED_KEY = 'wrapstore_phone_prompted';

const PhoneContext = createContext(null);

export function PhoneProvider({ children }) {
  const [savedPhone, setSavedPhoneState] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.model || parsed.skipped)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load wrapstore_phone from localStorage', e);
    }
    return null;
  });

  const [isPhoneSheetOpen, setIsPhoneSheetOpen] = useState(false);

  // Auto-prompt on first visit if no phone is saved and hasn't been prompted this session
  useEffect(() => {
    const hasPrompted = sessionStorage.getItem(SESSION_PROMPTED_KEY);
    if (!savedPhone && !hasPrompted) {
      const timer = setTimeout(() => {
        setIsPhoneSheetOpen(true);
        sessionStorage.setItem(SESSION_PROMPTED_KEY, 'true');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [savedPhone]);

  const selectPhone = useCallback((brand, model) => {
    const data = { brand, model, timestamp: Date.now() };
    setSavedPhoneState(data);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save phone to localStorage', e);
    }
    setIsPhoneSheetOpen(false);
  }, []);

  const skipPhoneSelection = useCallback(() => {
    const data = { skipped: true, timestamp: Date.now() };
    setSavedPhoneState(data);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save skipped state to localStorage', e);
    }
    setIsPhoneSheetOpen(false);
  }, []);

  const clearPhone = useCallback(() => {
    setSavedPhoneState(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.warn('Could not remove wrapstore_phone from localStorage', e);
    }
  }, []);

  const openPhoneSheet = useCallback(() => setIsPhoneSheetOpen(true), []);
  const closePhoneSheet = useCallback(() => setIsPhoneSheetOpen(false), []);

  const value = {
    savedPhone: savedPhone && savedPhone.model ? savedPhone : null,
    isSkipped: Boolean(savedPhone?.skipped),
    isPhoneSheetOpen,
    selectPhone,
    skipPhoneSelection,
    clearPhone,
    openPhoneSheet,
    closePhoneSheet,
  };

  return <PhoneContext.Provider value={value}>{children}</PhoneContext.Provider>;
}

export function usePhoneContext() {
  const ctx = useContext(PhoneContext);
  if (!ctx) {
    throw new Error('usePhoneContext must be used within a PhoneProvider');
  }
  return ctx;
}

export default PhoneContext;
