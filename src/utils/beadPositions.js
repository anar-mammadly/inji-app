import { beadColors } from './colors'

const BEAD_RADIUS = 8
const BEAD_SPACING = 16
const JAR_CENTER_X = 65

// Bottom-up rows, matching the jar's actual inner width at each height.
const ROWS = [
  { y: 148, count: 4 },
  { y: 132, count: 5 },
  { y: 116, count: 5 },
  { y: 100, count: 4 },
  { y: 84, count: 4 },
]

const MAX_VISIBLE_BEADS = ROWS.reduce((sum, row) => sum + row.count, 0)

export function getBeadPosition(index) {
  let remaining = index
  for (const row of ROWS) {
    if (remaining < row.count) {
      const start = JAR_CENTER_X - ((row.count - 1) * BEAD_SPACING) / 2
      return {
        x: start + remaining * BEAD_SPACING,
        y: row.y,
        r: BEAD_RADIUS,
        color: beadColors[index % beadColors.length],
      }
    }
    remaining -= row.count
  }
  return null
}

export function getVisibleBeads(count) {
  const visibleCount = Math.min(count, MAX_VISIBLE_BEADS)
  return Array.from({ length: visibleCount }, (_, i) => getBeadPosition(i)).filter(Boolean)
}

export { MAX_VISIBLE_BEADS, BEAD_RADIUS }
