/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables toggleable class-based dark mode
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffdf0',
          100: '#fef9c3',
          200: '#fde047',
          500: '#FDD017', // Premium Gold Accent
          550: '#FDD017',
          600: '#E5B800', // Hover Gold
          650: '#E5B800',
          655: '#E5B800',
          700: '#C89B00', // Pressed Gold
          900: '#713f12',
        },
        accent: {
          50: '#fdf2f8',
          500: '#ec4899', // Pink Accent
          600: '#db2777',
        },
        success: {
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          500: '#f59e0b',
        },
        danger: {
          500: '#ef4444',
          600: '#dc2626',
        },
        darkbg: {
          900: '#0B1220', // Background
          800: '#1A2335', // Cards
          700: '#2B3548', // Borders
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#CBD5E1', // Secondary Text
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#2B3548', // Borders
          800: '#2B3548', // Borders
          900: '#1A2335', // Cards
          950: '#0B1220', // Background
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 8px 30px rgb(0 0 0 / 0.04)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
      }
    },
  },
  plugins: [],
}
