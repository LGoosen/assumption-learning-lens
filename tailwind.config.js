/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Calm, school-appropriate palette
        navy: {
          50: '#f3f5f9',
          100: '#e3e8f1',
          200: '#c1cce0',
          300: '#94a4c5',
          400: '#6478a4',
          500: '#445888',
          600: '#33446c',
          700: '#283556',
          800: '#1f2a45',
          900: '#171f33',
        },
        ivory: {
          50: '#fdfbf6',
          100: '#faf6ec',
          200: '#f4ecd8',
        },
        stone: {
          50: '#f7f5f1',
          100: '#ece8df',
          200: '#dcd6c8',
          300: '#c4bcab',
          400: '#a89e8a',
        },
        gold: {
          300: '#dcc28a',
          400: '#cca96a',
          500: '#b88f4a',
          600: '#9a7536',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Source Serif Pro"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgba(23, 31, 51, 0.04), 0 1px 3px 0 rgba(23, 31, 51, 0.06)',
        card: '0 4px 16px -4px rgba(23, 31, 51, 0.08), 0 2px 6px -2px rgba(23, 31, 51, 0.04)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};