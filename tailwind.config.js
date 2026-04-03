/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cricket: {
          50: '#eef5fa',
          100: '#d5e8f2',
          200: '#b0d4e8',
          300: '#7ab8d8',
          400: '#4a9bc4',
          500: '#2a6080',
          600: '#225070',
          700: '#1e4a60',
          800: '#173a4d',
          900: '#112d3c',
          950: '#0a1e2a',
        },
        brand: {
          green: '#2a6080',
          dark: '#1e4a60',
          light: '#4a8aa8',
          bg: '#1D3466',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
