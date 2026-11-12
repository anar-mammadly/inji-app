// Sədəf — Inji's own companion: a pearl resting in its shell.
//
// This file is only the drawing. Behaviour (dragging, speech, the timer) lives
// in Companion.jsx, so the character can be redrawn or replaced by editing
// this one component. It must accept:
//   mood      'idle' | 'focus' | 'break' | 'sleepy' | 'cheer' | 'dizzy' | 'held'
//   progress  0–1 for the ring around the pearl, or null for no ring
//   ringColor colour of that ring
import { useId } from 'react'

const INK = '#2B2F3A'
const RING_R = 32
const RING_C = 2 * Math.PI * RING_R

function Eyes({ mood }) {
  if (mood === 'focus') {
    // eyes lowered to the work: two calm downward arcs
    return (
      <g fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round">
        <path d="M34.5 43.5q4 3.6 8 0" />
        <path d="M53.5 43.5q4 3.6 8 0" />
      </g>
    )
  }
  if (mood === 'sleepy') {
    return (
      <g fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round">
        <path d="M34.5 44.5h8" />
        <path d="M53.5 44.5h8" />
      </g>
    )
  }
  if (mood === 'cheer') {
    // squeezed shut with joy
    return (
      <g fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M34.5 45.5l4-3.6 4 3.6" />
        <path d="M53.5 45.5l4-3.6 4 3.6" />
      </g>
    )
  }
  const wide = mood === 'held' || mood === 'dizzy'
  const ry = wide ? 5 : 4.2
  return (
    <g className="companion-blink">
      <ellipse cx="38.5" cy="44" rx={wide ? 4.2 : 3.4} ry={ry} fill={INK} />
      <ellipse cx="57.5" cy="44" rx={wide ? 4.2 : 3.4} ry={ry} fill={INK} />
      <circle cx="39.7" cy="42.4" r="1.2" fill="#fff" />
      <circle cx="58.7" cy="42.4" r="1.2" fill="#fff" />
    </g>
  )
}

function Mouth({ mood }) {
  if (mood === 'held' || mood === 'dizzy') return <ellipse cx="48" cy="53.5" rx="2.6" ry="3.2" fill={INK} />
  if (mood === 'cheer' || mood === 'break') {
    return <path d="M42 51.5q6 8 12 0z" fill="#C2415B" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
  }
  if (mood === 'sleepy') return <path d="M45 53.5h6" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
  return <path d="M43 51.5q5 4.2 10 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
}

export default function CompanionCharacter({ mood = 'idle', progress = null, ringColor = '#58CC02', size = 76 }) {
  const id = useId()
  const nacre = `nacre-${id}`
  const shell = `shell-${id}`

  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={`companion-body companion-${mood}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={nacre} cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="42%" stopColor="#FFF4F8" />
          <stop offset="74%" stopColor="#ECE7FC" />
          <stop offset="100%" stopColor="#CFE6F8" />
        </radialGradient>
        <linearGradient id={shell} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFA9DD" />
          <stop offset="100%" stopColor="#F26DB8" />
        </linearGradient>
      </defs>

      <ellipse cx="48" cy="88" rx="24" ry="3.6" fill="#000" opacity="0.1" />

      {/* the open shell it sits in */}
      <path
        d="M16 66c2 13 14 21 32 21s30-8 32-21c-4 2.4-7 2.6-10.5.4-3.4 2.4-7.4 2.4-10.8 0-3.4 2.4-7.4 2.4-10.7 0-3.3 2.4-7.3 2.4-10.7 0-3.5 2.2-7 2-10.5-.4-3.6 2.2-7.3 2.4-10.8 0z"
        fill={`url(#${shell})`}
        stroke="#D94C9F"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <g stroke="#D94C9F" strokeWidth="1.6" strokeLinecap="round" opacity="0.55">
        <path d="M48 72v11" />
        <path d="M36 71l4 11" />
        <path d="M60 71l-4 11" />
      </g>

      {/* progress of the current session, drawn as a ring of fresh nacre */}
      {progress !== null && (
        <g transform="rotate(-90 48 45)">
          <circle cx="48" cy="45" r={RING_R} fill="none" stroke="#E5E7EB" strokeWidth="3.4" />
          <circle
            cx="48"
            cy="45"
            r={RING_R}
            fill="none"
            stroke={ringColor}
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - Math.min(1, Math.max(0, progress)))}
            style={{ transition: 'stroke-dashoffset 0.9s linear' }}
          />
        </g>
      )}

      {/* the pearl */}
      <circle cx="48" cy="45" r="26" fill={`url(#${nacre})`} stroke="#B4BFD6" strokeWidth="2" />
      <ellipse cx="38" cy="30" rx="8" ry="4.6" fill="#fff" opacity="0.9" transform="rotate(-28 38 30)" />
      <circle cx="29.5" cy="38.5" r="1.8" fill="#fff" opacity="0.85" />

      <ellipse cx="32" cy="50.5" rx="4" ry="2.4" fill="#FF8FB7" opacity="0.5" />
      <ellipse cx="64" cy="50.5" rx="4" ry="2.4" fill="#FF8FB7" opacity="0.5" />
      <Eyes mood={mood} />
      <Mouth mood={mood} />

      {mood === 'cheer' && (
        <g fill="#FFC800" stroke="#E0A800" strokeWidth="0.8" strokeLinejoin="round" className="companion-sparkle">
          <path d="M82 22l1.8 4.6 4.6 1.8-4.6 1.8L82 34.8l-1.8-4.6-4.6-1.8 4.6-1.8z" />
          <path d="M14 26l1.3 3.3 3.3 1.3-3.3 1.3L14 35.5l-1.3-3.3-3.3-1.3 3.3-1.3z" />
          <path d="M70 6l1 2.6 2.6 1-2.6 1L70 13.2l-1-2.6-2.6-1 2.6-1z" />
        </g>
      )}
      {mood === 'sleepy' && (
        <g fill="#636B78" fontFamily="inherit" fontWeight="800">
          <text x="74" y="24" fontSize="11">z</text>
          <text x="82" y="15" fontSize="8">z</text>
        </g>
      )}
    </svg>
  )
}

// The pearl alone, for buttons that call or dismiss the companion.
export function PearlIcon({ size = 20 }) {
  const id = useId()
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" focusable="false" className="shrink-0">
      <defs>
        <radialGradient id={`pi-${id}`} cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#FBEAF3" />
          <stop offset="100%" stopColor="#C7DFF5" />
        </radialGradient>
      </defs>
      <circle cx="10" cy="10" r="8" fill={`url(#pi-${id})`} stroke="#9FACC7" strokeWidth="1.6" />
      <ellipse cx="7.2" cy="6.6" rx="2.6" ry="1.5" fill="#fff" transform="rotate(-28 7.2 6.6)" />
    </svg>
  )
}
