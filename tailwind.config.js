/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FAF9F6',
          100: '#F5F4F0',
          200: '#E6E4DD',
          300: '#D4D0C7',
          400: '#A39E93',
          500: '#736E65',
          600: '#524E48',
          700: '#383531',
          800: '#211F1D',
          900: '#121110',
          950: '#0A0A0A',
        },
        accent: {
          gold: '#D4AF37',
          sand: '#E6DFD5',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      letterSpacing: {
        superwide: '0.25em',
        ultra: '0.35em',
      },
      aspectRatio: {
        'portrait': '3 / 4',
        'editorial': '4 / 5',
        'tall': '2 / 3',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
