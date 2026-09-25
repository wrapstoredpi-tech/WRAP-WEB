/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // WrapStore Custom Editorial Palette
        base: {
          offwhite: '#FAFAF8',
          charcoal: '#1A1A1A',
          gray: '#6B6B6B',
        },
        neutral: {
          50: '#FAFAF8', // Primary off-white surface
          100: '#F4F4F0', // Card surface / warm neutral tint
          200: '#E7E7E1', // Delicate border & divider
          300: '#D5D5CD', // Muted border
          400: '#9E9E96', // Secondary muted icons/text
          500: '#6B6B6B', // Standard mid-gray muted text
          600: '#525252',
          700: '#383838',
          800: '#262626',
          900: '#1A1A1A', // Primary charcoal text & dark elements
          950: '#111111',
        },
        // ONE accent color - deep amber, used sparingly
        accent: {
          light: '#FBF2ED',
          border: '#F0D5C7',
          DEFAULT: '#C7622D',
          hover: '#B45422',
          dark: '#984114',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        // Confident editorial scale
        'display': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.035em' }],
        'hero': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'h1': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.025em' }],
        'h2': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'h3': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.015em' }],
        'body-lg': ['1.125rem', { lineHeight: '1.55', letterSpacing: '-0.01em' }],
        'body': ['0.9375rem', { lineHeight: '1.5', letterSpacing: '-0.005em' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.45' }],
        'metadata': ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.08em' }],
      },
      boxShadow: {
        'subtle-header': '0 2px 12px 0 rgba(26, 26, 26, 0.04), 0 1px 2px 0 rgba(26, 26, 26, 0.02)',
        'subtle-card': '0 1px 3px 0 rgba(26, 26, 26, 0.03)',
        'subtle-hover': '0 8px 24px -4px rgba(26, 26, 26, 0.06)',
      },
      animation: {
        'shimmer': 'shimmer 1.8s infinite ease-in-out',
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'drawer-in': 'drawerIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drawerIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}
