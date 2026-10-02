import React from 'react';

/**
 * Base Skeleton placeholder with subtle fade tuned to #FAFAF9 / #E7E5E4 palette.
 */
export function Skeleton({
  variant = 'rect',
  width,
  height,
  aspectRatio,
  className = '',
  ...props
}) {
  const baseStyles = 'relative overflow-hidden bg-[#E7E5E4]/60 animate-pulse';

  const variantStyles = {
    rect: 'rounded-lg',
    circle: 'rounded-full',
    text: 'h-3.5 w-full rounded-md',
  };

  const style = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return (
    <div
      className={`
        ${baseStyles}
        ${variantStyles[variant] || variantStyles.rect}
        ${aspectRatio || ''}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      style={style}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Multi-line text skeleton with natural line length variations
 */
export function SkeletonText({
  lines = 3,
  gap = 'gap-2',
  className = '',
}) {
  const widths = ['w-full', 'w-[88%]', 'w-[65%]', 'w-[75%]', 'w-[50%]'];

  return (
    <div className={`flex flex-col ${gap} ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          variant="text"
          className={widths[idx % widths.length]}
        />
      ))}
    </div>
  );
}

/**
 * Product Card Skeleton conforming to the 4:5 image ratio
 */
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`flex flex-col space-y-3 bg-white p-3 sm:p-4 rounded-lg border border-[#E7E5E4] ${className}`} aria-hidden="true">
      {/* 4:5 Aspect Ratio Locked Container */}
      <div className="relative aspect-[4/5] w-full bg-[#F5F5F4] rounded-lg overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Metadata & Title */}
      <div className="space-y-1.5 pt-1">
        <Skeleton width="40%" height="11px" />
        <Skeleton width="85%" height="15px" />
        <Skeleton width="35%" height="15px" />
      </div>
    </div>
  );
}

export default Skeleton;
