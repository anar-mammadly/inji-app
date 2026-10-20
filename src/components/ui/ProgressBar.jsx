import { motion } from 'framer-motion'

// Fat, rounded bar with a light shine stripe on the fill.
export default function ProgressBar({ value, max, color = '#58CC02', height = 12, showLabel = false, trackClassName = 'bg-surfaceAlt' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 rounded-full overflow-hidden ${trackClassName}`} style={{ height }}>
        <motion.div
          className="relative rounded-full h-full"
          style={{ background: color }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 20 }}
        >
          {pct > 6 && (
            <span
              className="absolute left-2 right-2 rounded-full bg-white/35"
              style={{ top: Math.max(2, height * 0.22), height: Math.max(2, height * 0.22) }}
            />
          )}
        </motion.div>
      </div>
      {showLabel && (
        <span className="w-10 text-right text-[12px] font-extrabold tabular-nums text-textMuted">{Math.round(pct)}%</span>
      )}
    </div>
  )
}
