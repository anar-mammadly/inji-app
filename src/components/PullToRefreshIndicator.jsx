import { colors } from '../utils/colors'

const THRESHOLD = 44

export default function PullToRefreshIndicator({ pullY, refreshing }) {
  const visible = pullY > 0 || refreshing
  if (!visible) return null

  const progress  = Math.min(1, pullY / THRESHOLD)
  // rotate arc to show pull progress; full spin when refreshing
  const arcDeg    = refreshing ? 0 : progress * 300

  // Indicator slides down from above — starts hidden above viewport
  const translateY = refreshing
    ? 12                              // fixed position while spinning
    : Math.max(0, pullY - 16)         // follows finger

  const opacity = Math.min(1, pullY / 20)

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 200,
        transform: `translateY(${translateY}px)`,
        transition: refreshing ? 'transform 0.2s ease' : 'none',
        opacity: refreshing ? 1 : opacity,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: colors.surface,
          boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{
            transform: refreshing ? undefined : `rotate(${arcDeg}deg)`,
            animation: refreshing ? 'ptr-spin 0.75s linear infinite' : 'none',
            transformOrigin: '50% 50%',
          }}
        >
          {/* background track */}
          <circle
            cx="10" cy="10" r="7.5"
            stroke={colors.border}
            strokeWidth="2"
          />
          {/* coloured arc — grows as you pull */}
          <circle
            cx="10" cy="10" r="7.5"
            stroke={colors.accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${progress * 47.1} 47.1`}
            strokeDashoffset="11.8"   /* start from top */
            transform="rotate(-90 10 10)"
          />
        </svg>
      </div>
    </div>
  )
}
