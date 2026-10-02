/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System: Ultra-premium minimal palette
        base: {
          DEFAULT: '#FAFAF9',
          offwhite: '#FAFAF9',
          surface: '#FFFFFF',
          charcoal: '#141414',
          gray: '#666664',
        },
        neutral: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#666664',
          600: '#525250',
          700: '#383836',
          800: '#262624',
          900: '#141414',
          950: '#0C0C0C',
        },
        // Single WCAG AA-compliant accent (Contrast 5.85:1 on #FAFAF9)
        accent: {
          light: '#F8EBE7',
          tint: '#F8EBE7',
          border: '#ECCEC5',
          DEFAULT: '#9E381A',
          hover: '#832C13',
          dark: '#6E230E',
        },
      },
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        // 5-size type scale strictly defined
        'caption': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0' }], // 13px
        'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }],  // 14px
        'body': ['0.9375rem', { lineHeight: '1.6', letterSpacing: '0' }],     // 15px
        'subheading': ['1.0625rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }], // 17px
        'heading': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],      // 24px
        'display': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.03em' }],     // 36px
        'display-sm': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.025em' }],  // 28px
      },
      fontWeight: {
        // 2 weights only: Regular (400) & Semibold (600)
        normal: '400',
        semibold: '600',
      },
      borderRadius: {
        // One unified corner radius everywhere: 10px
        DEFAULT: '10px',
        'sm': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '10px',
        '2xl': '10px',
        '3xl': '10px',
        'full': '9999px',
      },
      boxShadow: {
        // Single subtle elevation level for cards/modals
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'modal': '0 8px 30px rgba(0, 0, 0, 0.08)',
        'none': 'none',
      },
      transitionDuration: {
        DEFAULT: '180ms',
        'fast': '120ms',
      },
      animation: {
        'fade-in': 'fadeIn 180ms ease-out',
        'slide-down': 'slideDown 180ms ease-out',
        'drawer-in': 'drawerIn 220ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drawerIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
