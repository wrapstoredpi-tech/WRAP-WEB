import React from 'react';

/**
 * Base Skeleton placeholder with subtle shimmer animation tuned to the offwhite/charcoal palette.
 * 
 * @param {'rect' | 'circle' | 'text'} variant
 * @param {string} width
 * @param {string} height
 * @param {string} aspectRatio - e.g. 'aspect-[4/5]' or 'aspect-square'
 */
export function Skeleton({
  variant = 'rect',
  width,
  height,
  aspectRatio,
  className = '',
  ...props
}) {
  const baseStyles = 'relative overflow-hidden bg-neutral-200/60 dark:bg-neutral-800/40';

  const variantStyles = {
    rect: 'rounded-none',
    circle: 'rounded-full',
    text: 'h-4 w-full rounded-sm',
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
    >
      {/* Shimmer sweep overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-neutral-100/50 to-transparent" />
    </div>
  );
}

/**
 * Multi-line text skeleton with natural line length variations
 */
export function SkeletonText({
  lines = 3,
  gap = 'gap-2.5',
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
 * Product Card Skeleton conforming to the editorial photography-forward grid layout
 */
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`flex flex-col space-y-3.5 ${className}`} aria-hidden="true">
      {/* 4:5 Editorial Image Frame */}
      <div className="relative aspect-[4/5] w-full bg-neutral-200/70 overflow-hidden">
        <Skeleton className="w-full h-full" />
        <div className="absolute top-3 left-3">
          <Skeleton width="48px" height="20px" />
        </div>
      </div>

      {/* Product Metadata & Title */}
      <div className="space-y-2 pt-0.5">
        <div className="flex items-center justify-between">
          <Skeleton width="60px" height="12px" />
          <Skeleton width="40px" height="12px" />
        </div>
        <Skeleton width="85%" height="18px" />
        <Skeleton width="30%" height="16px" />
      </div>
    </div>
  );
}

export default Skeleton;
