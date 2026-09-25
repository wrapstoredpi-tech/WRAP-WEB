import React from 'react';

/**
 * Reusable Button component adhering to WrapStore design tokens.
 * 
 * @param {'primary' | 'secondary' | 'ghost' | 'accent'} variant - Visual variant
 * @param {'sm' | 'md' | 'lg'} size - Sizing scale with touch-friendly targets
 * @param {boolean} isLoading - Loading state with spinner
 * @param {boolean} isFullWidth - Stretches button full width
 * @param {React.ReactNode} leftIcon - Optional leading icon
 * @param {React.ReactNode} rightIcon - Optional trailing icon
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isFullWidth = false,
  leftIcon,
  rightIcon,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = `
    inline-flex items-center justify-center font-sans font-medium transition-all duration-200
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
    disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
    select-none active:scale-[0.99] rounded-none
  `;

  const sizeStyles = {
    sm: 'text-body-sm h-9 px-3.5 gap-1.5 min-h-[38px] tracking-wide',
    md: 'text-body h-11 px-5 gap-2 min-h-[44px]',
    lg: 'text-body-lg h-13 px-7 gap-2.5 min-h-[52px]',
  };

  const variantStyles = {
    // Primary: Solid charcoal editorial action
    primary: `
      bg-neutral-900 text-base-offwhite
      hover:bg-neutral-800 active:bg-neutral-950
      shadow-sm hover:shadow
    `,
    // Secondary: Minimalist bordered action with subtle hover background
    secondary: `
      bg-transparent text-neutral-900
      border border-neutral-300
      hover:border-neutral-900 hover:bg-neutral-100/80
      active:bg-neutral-200/70
    `,
    // Ghost: Seamless text action with soft background wash on hover
    ghost: `
      bg-transparent text-neutral-900
      hover:text-accent hover:bg-neutral-100/70
      active:bg-neutral-200/60
    `,
    // Accent: Deep Amber conversion action (used sparingly)
    accent: `
      bg-accent text-white
      hover:bg-accent-hover active:bg-accent-dark
      shadow-sm hover:shadow
    `,
  };

  const widthStyle = isFullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-busy={isLoading}
      className={`
        ${baseStyles}
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.primary}
        ${widthStyle}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>
      )}

      <span>{children}</span>

      {!isLoading && rightIcon && (
        <span className="inline-flex shrink-0 items-center">{rightIcon}</span>
      )}
    </button>
  );
}

export default Button;
