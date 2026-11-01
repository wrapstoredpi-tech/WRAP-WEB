import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function BuildYourOwnCaseModal({ isOpen, onClose }) {
  const modalRef = useRef(null);

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle click outside modal container
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-case-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-[380px] bg-white rounded-[16px] border border-[#E5E5E3] shadow-xl p-6 sm:p-7 text-center animate-scale-up"
      >
        {/* Minimal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full hover:bg-[#F5F4F0] text-[#737373] hover:text-[#141414] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Minimal pill status */}
        <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#F5F4F0] text-[#737373] text-[11px] font-medium tracking-wider uppercase mb-3 select-none">
          Coming Soon
        </div>

        {/* Title */}
        <h3
          id="custom-case-title"
          className="text-[20px] font-semibold text-[#141414] tracking-tight mb-2"
        >
          Build Your Own Case
        </h3>

        {/* Minimal Note */}
        <p className="text-[14px] text-[#737373] leading-relaxed mb-6">
          We're currently crafting our custom case builder. Stay tuned for the launch.
        </p>

        {/* Minimal Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-[#141414] hover:bg-[#262626] text-white text-[13px] font-medium py-2.5 px-4 rounded-[8px] transition-colors cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
