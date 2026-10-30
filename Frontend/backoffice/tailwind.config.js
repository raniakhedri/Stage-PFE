/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // brand & brand-dark are defined as CSS utilities in index.css
        // using CSS custom properties for dynamic runtime color changes
        // Sellio's own palette (platform pages): orange, purple and near-black.
        flame: {
          300: '#FFB37A',
          400: '#FF8A3D',
          500: '#FF6A1A',
          600: '#E8550A',
        },
        plum: {
          300: '#C4A6FF',
          400: '#A07BFA',
          500: '#7C3AED',
          600: '#6425D0',
          700: '#4C1D95',
        },
        ink: {
          700: '#211B2E',
          800: '#16121F',
          900: '#0E0B16',
          950: '#08060D',
        },
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
      },
      borderRadius: {
        'custom': 'var(--border-radius, 12px)',
      },
      keyframes: {
        slideInRight: {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
      },
      animation: {
        'slideInRight': 'slideInRight 0.25s ease-out',
      },
    },
  },
  plugins: [],
}
