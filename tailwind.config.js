/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './{App,types,constants}.tsx',
    './{index,vite}.ts*',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito Sans', 'sans-serif'],
      },
      colors: {
  // Brand accents (kept soft for light mode)
  'brand-primary': '#9EB8FF',
  'brand-secondary': '#BFAEE6',
  'brand-secondary-dark': '#8363B9',
  'brand-secondary-deep-dark': '#5C3F8A',

  // Light mode surfaces (reduced brightness and warmer neutrals)
  'surface-main': '#F5F7FA',        // app background
  'surface-card': '#FBFCFE',        // cards/panels
  'surface-header': '#F2F4F8',      // headers, sticky bars
  'surface-table-header': '#F2F4F8',
  'surface-input': '#EFF2F6',       // inputs/selects
  'surface-hover': '#EAF1FF',       // hover/tint
  'surface-border': '#D6DEE8',      // softer, slightly darker border

  // Text
  'text-primary': '#2F3A4B',        // slightly darker for contrast on softer bg
  'text-secondary': '#6B778C',
  'text-tertiary': '#9DA8B8',
  'text-on-color': '#243041',

  // Status
  'status-green': '#51BD85',
  'status-yellow': '#F7C54A',
  'status-red': '#FF7A7A',

  // Tinted backgrounds for alerts
  'brand-primary-light': '#E8EFFF',
  'brand-secondary-light': '#F2EDFA',
  'status-green-light': '#E6F6ED',
  'status-yellow-light': '#FFF4DA',
  'status-red-light': '#FFE7E7',
      },
    },
  },
  plugins: [],
};
