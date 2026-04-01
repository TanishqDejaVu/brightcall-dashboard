/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: '#3b82f6',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse2: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '.3' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease forwards',
        pulse2: 'pulse2 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
