/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'custom-blue': {
          light: '#60a5fa',
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
        }
      }
    },
  },
  plugins: [],
};

