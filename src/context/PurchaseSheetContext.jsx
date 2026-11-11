import React, { createContext, useContext, useState, useCallback } from 'react';

const PurchaseSheetContext = createContext(null);

export function PurchaseSheetProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [addedItem, setAddedItem] = useState(null);
  const [toast, setToast] = useState(null);

  const openSheet = useCallback((itemData) => {
    setAddedItem(itemData);
    setIsOpen(true);
    setToast({
      id: Date.now(),
      message: 'Added to bag',
      showViewBag: false,
    });
  }, []);

  const showToastOnly = useCallback((itemData) => {
    setAddedItem(itemData);
    setIsOpen(false);
    setToast({
      id: Date.now(),
      message: 'Added to bag',
      showViewBag: true,
    });
  }, []);

  const closeSheet = useCallback(() => {
    setIsOpen(false);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <PurchaseSheetContext.Provider
      value={{
        isOpen,
        addedItem,
        toast,
        openSheet,
        showToastOnly,
        closeSheet,
        hideToast,
        setToast,
      }}
    >
      {children}
    </PurchaseSheetContext.Provider>
  );
}

export function usePurchaseSheet() {
  const ctx = useContext(PurchaseSheetContext);
  if (!ctx) {
    throw new Error('usePurchaseSheet must be used within a PurchaseSheetProvider');
  }
  return ctx;
}

export default PurchaseSheetContext;

