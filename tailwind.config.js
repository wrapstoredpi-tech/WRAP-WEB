/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System Colors: Light mode only
        base: {
          offwhite: '#FAFAF8',
          charcoal: '#111111',
          gray: '#737373',
        },
        neutral: {
          50: '#FAFAF8',
          100: '#F4F4F1',
          200: '#E5E5DF',
          300: '#D4D4CD',
          400: '#A1A19A',
          500: '#737373',
          600: '#525252',
          700: '#383838',
          800: '#242424',
          900: '#111111',
          950: '#0A0A0A',
        },
        // One restrained accent color (terracotta / deep amber)
        accent: {
          light: '#FDF6F0',
          border: '#F3D9C9',
          DEFAULT: '#C7622D',
          hover: '#B05322',
          dark: '#8C3D14',
        },
      },
      fontFamily: {
        // One Typeface: Inter
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        // 3 primary sizes (sm, body/base, xl/display)
        'body-sm': ['0.8125rem', { lineHeight: '1.4' }],   // ~13px
        'body': ['0.9375rem', { lineHeight: '1.5' }],      // ~15px
        'display': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }], // ~24px
      },
      fontWeight: {
        // 2 weights only: regular (400) & semibold (600)
        normal: '400',
        semibold: '600',
      },
      borderRadius: {
        // Soft 12-16px image corners
        'xl': '12px',
        '2xl': '16px',
      },
      spacing: {
        // 8px spacing grid defaults in Tailwind: 2 (8px), 4 (16px), 6 (24px), 8 (32px), 10 (40px), 12 (48px)
        '18': '4.5rem',
        '22': '5.5rem',
      },
      transitionDuration: {
        // Motion under 250ms
        DEFAULT: '200ms',
        'fast': '150ms',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-down': 'slideDown 200ms ease-out',
        'drawer-in': 'drawerIn 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
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
