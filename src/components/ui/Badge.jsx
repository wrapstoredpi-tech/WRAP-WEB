import React from 'react';

/**
 * Quiet Badge component for product states (Out of stock, Low stock, Discount, etc.)
 * Restrained, quiet visual treatment using subtle background tints.
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
    inline-flex items-center justify-center font-sans font-semibold rounded-md
    transition-colors select-none leading-none tracking-tight
  `;

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-[12px] px-2.5 py-1 gap-1.5',
  };

  const variantStyles = {
    // "New" - Quiet subtle dark tint
    new: `
      bg-[#141414] text-white
    `,
    // "Out of Stock" - Quiet muted grey tint
    outofstock: `
      bg-[#F5F5F4] text-[#666664] border border-[#E7E5E4]
    `,
    // "Low Stock" - Quiet amber-terracotta tint
    lowstock: `
      bg-[#F8EBE7] text-[#9E381A] border border-[#ECCEC5]
    `,
    // "Discount" - Subtle accent tint with high contrast
    discount: `
      bg-[#F8EBE7] text-[#9E381A] border border-[#ECCEC5]
    `,
    // Accent text with soft background
    accent: `
      bg-[#F8EBE7] text-[#9E381A] border border-[#ECCEC5]
    `,
    // Neutral soft tag
    neutral: `
      bg-[#F5F5F4] text-[#141414] border border-[#E7E5E4]
    `,
    // Clean outline
    outline: `
      bg-transparent text-[#141414] border border-[#E7E5E4]
    `,
  };

  const dotStyles = {
    new: 'bg-white',
    outofstock: 'bg-[#A8A29E]',
    lowstock: 'bg-[#9E381A]',
    discount: 'bg-[#9E381A]',
    accent: 'bg-[#9E381A]',
    neutral: 'bg-[#666664]',
    outline: 'bg-[#141414]',
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
