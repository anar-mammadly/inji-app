/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F9F7F4',
        surface: '#FFFFFF',
        border: '#E5E3DE',
        borderStrong: '#C5C2BC',
        textPrimary: '#2C2C2A',
        textSecondary: '#5F5E5A',
        textMuted: '#888780',
        accent: '#1D9E75',
        coral: '#D85A30',
        amber: '#EF9F27',
        purple: '#7F77DD',
        pink: '#D4537E',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
