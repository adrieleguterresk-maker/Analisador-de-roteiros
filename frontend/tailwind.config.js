/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': {
          DEFAULT: '#3D6B4F',
          light: '#538F6A',
          dark: '#2A4A36'
        },
        'brand-brown': {
          DEFAULT: '#6B4423',
          light: '#8B5C35',
          dark: '#4A2F18'
        },
        'brand-gold': {
          DEFAULT: '#C9A84C',
          light: '#DEBC5C',
          dark: '#A6883A'
        },
        'brand-offwhite': '#F5F0E8',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Lato', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 20px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
