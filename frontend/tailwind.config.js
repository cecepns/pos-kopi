/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#fdf8f4',
          100: '#f7ede2',
          200: '#edd6c0',
          300: '#e0b897',
          400: '#ce936b',
          500: '#b77447',
          600: '#9d5835',
          700: '#7f422b',
          800: '#643425',
          900: '#432219',
          950: '#23100b',
        },
        espresso: {
          light: '#3d2b24',
          DEFAULT: '#261b17',
          dark: '#160e0b',
        },
        cream: {
          light: '#fbf9f6',
          DEFAULT: '#f5efe6',
          dark: '#e8dcce',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
