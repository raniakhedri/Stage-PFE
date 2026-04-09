/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "sage": "#7C8B6F",
        "dark-green": "#2D4A3E",
        "beige": "#F5F0EB",
        "gold": "#C4A55A",
        "dark-text": "#1A1A1A",
        "primary": "#163328",
        "primary-container": "#2d4a3e",
        "secondary": "#546349",
        "secondary-container": "#d8e8c7",
        "tertiary": "#3b2c00",
        "tertiary-container": "#574100",
        "tertiary-fixed": "#ffdf96",
        "surface": "#fef8f3",
        "surface-container": "#f2ede8",
        "surface-container-low": "#f8f3ee",
        "surface-container-high": "#ece7e2",
        "surface-container-highest": "#e6e2dd",
        "on-primary": "#ffffff",
        "on-primary-container": "#99b9a9",
        "on-secondary-container": "#5a694f",
        "on-surface": "#1d1b19",
        "on-surface-variant": "#424844",
        "on-tertiary-container": "#ceae62",
        "outline": "#727974",
        "outline-variant": "#c1c8c3",
        "error": "#ba1a1a",
      },
      fontFamily: {
        "headline": ['"DM Sans"', '"Plus Jakarta Sans"', 'sans-serif'],
        "body": ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
