// JS-side mirror of tailwind.config.js theme colors — used only where Tailwind
// classes can't reach (SVG fill/stroke attributes, framer-motion animate props,
// runtime-computed values like darken()). Components should prefer Tailwind
// utility classes (bg-accent, text-textMuted, ...) over importing this object.
export const colors = {
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
}

export const beadColors = ['#58CC02', '#1CB0F6', '#FF9600', '#CE82FF', '#FF4B4B', '#FFC800']

export function darken(hex, amount) {
  const num = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - amount)))
  const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - amount)))
  const b = Math.max(0, Math.floor((num & 0xff) * (1 - amount)))
  return `rgb(${r}, ${g}, ${b})`
}
