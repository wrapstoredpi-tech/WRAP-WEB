import React from 'react';

/**
 * Reusable Badge component for product states (New, Out of Stock, Discount %, etc.)
 * 
 * @param {'new' | 'outofstock' | 'discount' | 'accent' | 'neutral' | 'outline'} variant
 * @param {'sm' | 'md'} size
 * @param {boolean} hasDot - Optional visual indicator dot
 */
export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  hasDot = false,
  className = '',
  ...props
}) {
  const baseStyles = `
    inline-flex items-center justify-center font-sans uppercase font-medium
    tracking-editorial transition-colors select-none leading-none
  `;

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-1 gap-1',
    md: 'text-[11px] px-2.5 py-1.5 gap-1.5',
  };

  const variantStyles = {
    // "New" - Crisp high-contrast charcoal
    new: `
      bg-neutral-900 text-base-offwhite
    `,
    // "Out of Stock" - Muted mid-gray with subtle strike or border
    outofstock: `
      bg-neutral-200/70 text-neutral-500 border border-neutral-300/80
    `,
    // "Low Stock" - Amber warning state
    lowstock: `
      bg-amber-100 text-amber-900 border border-amber-300 font-semibold
    `,
    // "Discount %" / "Sale" - Deep Amber Accent solid
    discount: `
      bg-accent text-white
    `,
    // Amber Accent tinted background with deep amber text
    accent: `
      bg-accent-light text-accent border border-accent-border font-semibold
    `,
    // Neutral soft tag
    neutral: `
      bg-neutral-100 text-neutral-700 border border-neutral-200
    `,
    // Editorial fine outline
    outline: `
      bg-transparent text-neutral-800 border border-neutral-400
    `,
  };

  const dotStyles = {
    new: 'bg-white',
    outofstock: 'bg-neutral-400',
    lowstock: 'bg-amber-600',
    discount: 'bg-white',
    accent: 'bg-accent',
    neutral: 'bg-neutral-500',
    outline: 'bg-neutral-700',
  };

  return (
    <span
      className={`
        ${baseStyles}
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.neutral}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      {...props}
    >
      {hasDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[variant] || 'bg-current'}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
