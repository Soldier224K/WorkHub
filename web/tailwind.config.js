/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--paper)',
          dark: 'var(--paper)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          dark: 'var(--surface)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
          hairline: 'var(--ink-hairline)',
          dark: 'var(--ink)',
          'dark-muted': 'var(--ink-muted)',
          'dark-hairline': 'var(--ink-hairline)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: '#4F46E5', // indigo-600
          light: 'rgba(99, 102, 241, 0.1)',
          'dark-light': 'rgba(129, 140, 248, 0.1)',
        },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '16px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        'glass': '12px',
      }
    },
  },
  plugins: [],
};
