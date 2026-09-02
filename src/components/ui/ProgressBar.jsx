import { motion } from 'framer-motion'

export default function ProgressBar({ value, max, color = '#58CC02', height = 10, showLabel = false }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const reached = max > 0 && value >= max

  return (
    <div>
      <div className="w-full rounded-full bg-surfaceAlt" style={{ height }}>
        <motion.div
          className="rounded-full"
          style={{ height, background: color }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 20 }}
        />
      </div>
      {showLabel && (
        <div className="text-right text-[11px] font-bold mt-1 text-textMuted">
          {Math.round(pct)}%{reached && ' 🎉'}
        </div>
      )}
    </div>
  )
}
