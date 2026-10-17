import React, { useState, useEffect } from 'react';
import { storeConfig } from '../../config/store';

export function AnnouncementBar() {
  const announcements = storeConfig.announcements || [
    'Store location: Near Town Bus Stand, Dharmapuri • Hours: 10 AM – 9 PM',
    'WhatsApp assistance: +91 94422 18765 for fit queries and stock',
    'Secure online payment via UPI, Debit/Credit Cards & Net Banking',
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, announcements.length]);

  return (
    <aside
      aria-label="Store Announcement"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="w-full h-[36px] bg-[#141414] text-[#FAFAF9] border-b border-[#141414] flex items-center justify-center px-4 overflow-hidden z-50 select-none"
    >
      <div className="max-w-[1280px] w-full mx-auto flex items-center justify-center text-center">
        <p
          key={currentIndex}
          className="text-[12px] font-normal tracking-normal transition-opacity duration-300 truncate"
        >
          {announcements[currentIndex]}
        </p>
      </div>
    </aside>
  );
}

export default AnnouncementBar;
