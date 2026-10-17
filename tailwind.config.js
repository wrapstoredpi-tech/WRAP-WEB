/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAF9',
        text: '#141414',
        secondary: '#6B6B6B',
        border: '#E5E5E3',
        accent: {
          DEFAULT: '#B0521F',
          hover: '#994518',
          tint: '#F9EDE7',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-sans)'],
      },
      fontSize: {
        display: ['56px', { lineHeight: '60px', letterSpacing: '-0.01em' }],
        'display-mobile': ['36px', { lineHeight: '40px', letterSpacing: '-0.01em' }],
        h2: ['40px', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'h2-mobile': ['30px', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        h3: ['20px', { lineHeight: '1.3' }],
        body: ['16px', { lineHeight: '1.6' }],
        'body-mobile': ['15px', { lineHeight: '1.6' }],
        small: ['14px', { lineHeight: '1.5' }],
        caption: ['12px', { lineHeight: '1.4' }],
        12: ['12px', { lineHeight: '16px' }],
        14: ['14px', { lineHeight: '20px' }],
        15: ['15px', { lineHeight: '22px' }],
        16: ['16px', { lineHeight: '24px' }],
        20: ['20px', { lineHeight: '28px' }],
        28: ['28px', { lineHeight: '34px' }],
        30: ['30px', { lineHeight: '1.1' }],
        36: ['36px', { lineHeight: '40px' }],
        40: ['40px', { lineHeight: '1.1' }],
        56: ['56px', { lineHeight: '60px' }],
      },
      fontWeight: {
        normal: '400',
        semibold: '600',
      },
      borderRadius: {
        // One corner radius (6px) used everywhere
        DEFAULT: '6px',
        none: '0px',
        sm: '6px',
        md: '6px',
        lg: '6px',
        xl: '6px',
        '2xl': '6px',
        '3xl': '6px',
        full: '9999px',
      },
      boxShadow: {
        // One subtle level on dropdowns and the cart summary only
        DEFAULT: '0 4px 12px rgba(0, 0, 0, 0.06)',
        subtle: '0 4px 12px rgba(0, 0, 0, 0.06)',
        none: 'none',
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [],
}
