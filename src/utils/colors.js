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
  textSecondary: '#4B5563',
  textMuted: '#636B78',
  ink: '#3C3C3C',
  accent: '#58CC02',
  accentDark: '#46A302',
  accentSoft: '#DFFAB8',
  green: '#58CC02',
  greenDark: '#46A302',
  pom: '#FF4B4B',
  pomSoft: '#FFE3E3',
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
  pink: '#FF86D0',
  pinkDark: '#E5559F',
  onAccent: '#12340A',
  onBlue: '#06293D',
  orangeInk: '#8F4B00',
}

export const beadColors = ['#58CC02', '#1CB0F6', '#FF9600', '#CE82FF', '#FF4B4B', '#FFC800']

// Pastel sticky-note backgrounds, rotated by note index. Each pairs a soft fill
// with a slightly deeper "fold" tint for the corner shadow accent.
export const stickyNoteColors = [
  { bg: '#FFF3B0', fold: '#F5DE7A' },
  { bg: '#C9F2C7', fold: '#A6E3A3' },
  { bg: '#BFE3FF', fold: '#93CDFB' },
  { bg: '#FFD3E0', fold: '#FBB3C7' },
  { bg: '#E6D6FF', fold: '#CDB3F7' },
  { bg: '#FFDDB0', fold: '#F7C285' },
]

function luminance(hex) {
  const num = parseInt(hex.slice(1), 16)
  const channel = (v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel((num >> 16) & 0xff) + 0.7152 * channel((num >> 8) & 0xff) + 0.0722 * channel(num & 0xff)
}

const INK = '#1F2430'

// Text colour that stays readable on an arbitrary fill (habit and board
// colours are user-facing data, so the right ink has to be worked out).
export function readableOn(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return INK
  const bg = luminance(hex)
  const onDark = 1.05 / (bg + 0.05) // contrast of white text
  const onLight = (bg + 0.05) / (luminance(INK) + 0.05) // contrast of dark ink
  return onLight >= onDark ? INK : '#FFFFFF'
}

export function darken(hex, amount) {
  const num = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - amount)))
  const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - amount)))
  const b = Math.max(0, Math.floor((num & 0xff) * (1 - amount)))
  return `rgb(${r}, ${g}, ${b})`
}
