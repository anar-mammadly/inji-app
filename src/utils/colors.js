export const colors = {
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
}

export const beadColors = ['#D85A30', '#1D9E75', '#EF9F27', '#7F77DD', '#D4537E']

export const categoryStyles = {
  study: { bg: '#EDE9FC', text: '#534AB7' },
  work: { bg: '#E1F5EE', text: '#0F6E56' },
  personal: { bg: '#FAECE7', text: '#993C1D' },
}

export function darken(hex, amount) {
  const num = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - amount)))
  const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - amount)))
  const b = Math.max(0, Math.floor((num & 0xff) * (1 - amount)))
  return `rgb(${r}, ${g}, ${b})`
}
