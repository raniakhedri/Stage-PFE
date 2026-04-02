/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dynamic via CSS custom properties (set by AppearanceContext)
        brand: 'rgb(var(--fo-brand) / <alpha-value>)',
        'brand-dark': 'rgb(var(--fo-brand) / <alpha-value>)',
        primary: 'rgb(var(--fo-primary) / <alpha-value>)',
        surface: '#f9f9f9',
        'surface-container': '#eeeeee',
        'surface-container-low': '#f3f3f3',
        'surface-container-high': '#e8e8e8',
        'surface-container-highest': '#e2e2e2',
        'surface-container-lowest': '#ffffff',
        'surface-dim': '#dadada',
        'on-surface': '#1a1c1c',
        'on-surface-variant': '#474747',
        outline: '#777777',
        'outline-variant': '#c6c6c6',
        'on-primary': '#ffffff',
        'primary-container': '#3b3b3b',
        secondary: '#5f5e5e',
        'secondary-container': '#d6d4d3',
      },
      fontFamily: {
        headline: ['var(--fo-font-headline)', 'Public Sans', 'Inter', 'system-ui', 'sans-serif'],
        body: ['var(--fo-font-body)', 'Public Sans', 'Inter', 'system-ui', 'sans-serif'],
        label: ['var(--fo-font-body)', 'Public Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0px',
        lg: '0px',
        xl: '0px',
        full: '9999px',
        custom: '12px',
      },
      keyframes: {
        slideFormIn: {
          '0%':   { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideFormOut: {
          '0%':   { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(40px)' },
        },
        slideImageIn: {
          '0%':   { opacity: '0', transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        navFadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        navImageIn: {
          '0%':   { opacity: '0', transform: 'scale(1.03)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'slide-form-in':  'slideFormIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-form-out': 'slideFormOut 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-image-in': 'slideImageIn 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-up':        'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-in':       'slideIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'nav-fade-in':    'navFadeIn 0.4s ease-out forwards',
        'nav-image-in':   'navImageIn 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
}
