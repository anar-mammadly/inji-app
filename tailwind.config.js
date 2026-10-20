/** @type {import('tailwindcss').Config} */
// Playful, Duolingo-like: bright green, candy colors, chunky 3D buttons.
// Keep in sync with src/utils/colors.js (the JS mirror used for SVG / motion).
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      screens: {
        // desktop/tablet windows too short for the board sidebar at full size
        short: { raw: '(min-width: 640px) and (max-height: 860px)' },
      },
      colors: {
        bg: '#F7F9FB',
        surface: '#FFFFFF',
        surfaceAlt: '#F1F4F9',
        border: '#E5E7EB',
        borderStrong: '#D1D5DB',
        textPrimary: '#3C3C3C',
        textSecondary: '#6B7280',
        textMuted: '#9CA0A8',
        ink: '#3C3C3C',
        inkSoft: '#4B4B4B',
        accent: '#58CC02',
        accentDark: '#46A302',
        accentSoft: '#DFFAB8',
        green: '#58CC02',
        greenDark: '#46A302',
        pom: '#FF4B4B',
        pomSoft: '#FFE3E3',
        blue: '#1CB0F6',
        blueDark: '#0E8FCE',
        blueSoft: '#DDF4FF',
        purple: '#CE82FF',
        purpleDark: '#A855F7',
        purpleSoft: '#F3E4FF',
        orange: '#FF9600',
        orangeDark: '#E07C00',
        orangeSoft: '#FFE8CC',
        coral: '#FF4B4B',
        coralDark: '#EA2B2B',
        yellow: '#FFC800',
        yellowDark: '#E0A800',
        yellowSoft: '#FFF4C2',
        pink: '#FF86D0',
        pinkDark: '#E5559F',
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        display: ['Nunito', 'system-ui', 'sans-serif'],
      },
      // Nunito is a variable font; these keep the rounded Duolingo feel
      // without the text turning heavy everywhere
      fontWeight: {
        medium: '550',
        semibold: '600',
        bold: '650',
        extrabold: '750',
        black: '800',
      },
      boxShadow: {
        card: '0 2px 0 #E5E7EB',
        lift: '0 4px 0 #D1D5DB',
        pop: '0 16px 40px rgba(0,0,0,0.18)',
        glow: '0 4px 0 #46A302',
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
