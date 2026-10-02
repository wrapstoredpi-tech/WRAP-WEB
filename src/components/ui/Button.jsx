import React from 'react';

/**
 * Reusable Button component adhering to WrapStore minimal design tokens.
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
    inline-flex items-center justify-center font-sans font-semibold rounded-lg transition-colors duration-150
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141414]
    disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
    select-none active:scale-[0.99]
  `;

  const sizeStyles = {
    sm: 'text-[13px] h-9 px-3.5 gap-1.5 min-h-[36px]',
    md: 'text-[14px] h-11 px-5 gap-2 min-h-[44px]',
    lg: 'text-[15px] h-12 px-6 gap-2.5 min-h-[48px]',
  };

  const variantStyles = {
    // Primary: Solid near-black
    primary: `
      bg-[#141414] text-white
      hover:bg-[#262624] active:bg-[#0C0C0C]
    `,
    // Secondary: Calm bordered white surface
    secondary: `
      bg-white text-[#141414]
      border border-[#E7E5E4]
      hover:bg-[#F5F5F4] hover:border-[#D6D3D1]
      active:bg-[#E7E5E4]
    `,
    // Ghost: Transparent with subtle background wash
    ghost: `
      bg-transparent text-[#141414]
      hover:bg-[#F5F5F4] hover:text-[#141414]
      active:bg-[#E7E5E4]
    `,
    // Accent: Reserved for key conversion actions
    accent: `
      bg-[#9E381A] text-white
      hover:bg-[#832C13] active:bg-[#6E230E]
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
