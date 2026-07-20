/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js}', './index.html'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Great Vibes"', 'cursive'],
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        lavender: {
          DEFAULT: '#C4B5FD',
          dark: '#7C6BC4',
        },
        mint: {
          DEFAULT: '#A7F3D0',
          dark: '#34D399',
        },
        cream: '#FFFBEB',
        rose: {
          DEFAULT: '#FBCFE8',
          dark: '#BE185D',
        },
        gold: {
          DEFAULT: '#FDE68A',
          dark: '#D97706',
        },
        sky: '#BAE6FD',
        coral: '#FECACA',
        surface: {
          DEFAULT: 'var(--bg)',
          elevated: 'var(--bg-elevated)',
        },
        content: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
        },
        line: 'var(--border)',
      },
    },
  },
  plugins: [],
};
