/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F7F9FB',
        surface: '#FFFFFF',
        surfaceAlt: '#F1F4F9',
        border: '#E5E7EB',
        borderStrong: '#D1D5DB',
        textPrimary: '#3C3C3C',
        textSecondary: '#6B7280',
        textMuted: '#AFAFAF',
        accent: '#58CC02',
        accentDark: '#46A302',
        accentSoft: '#DFFAB8',
        blue: '#1CB0F6',
        blueDark: '#0E8FCE',
        purple: '#CE82FF',
        purpleDark: '#A855F7',
        orange: '#FF9600',
        orangeDark: '#E07C00',
        coral: '#FF4B4B',
        coralDark: '#EA2B2B',
        yellow: '#FFC800',
        yellowDark: '#E0A800',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 0 rgba(0,0,0,0.04)',
        pop: '0 12px 28px rgba(0,0,0,0.16)',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        wiggle: 'wiggle 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
}
