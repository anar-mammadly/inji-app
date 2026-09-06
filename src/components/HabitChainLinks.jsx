import { useEffect, useRef } from 'react'
import { addDays, format } from 'date-fns'
import { motion } from 'framer-motion'

const LINK_SIZE = 34
const CONNECTOR_WIDTH = 14

export default function HabitChainLinks({ startDate, targetDays, log, color = '#FF4B4B', onToggleDay }) {
  const scrollRef = useRef(null)
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const start = new Date(startDate)

  const links = Array.from({ length: targetDays }, (_, i) => {
    const date = addDays(start, i)
    const key = format(date, 'yyyy-MM-dd')
    return { day: i + 1, key, filled: !!log[key], isToday: key === todayKey }
  })

  // find today's link (or the first not-yet-done one) so the chain auto-scrolls to "where you are"
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const activeIndex = links.findIndex((l) => l.isToday)
    const targetIndex = activeIndex >= 0 ? activeIndex : links.findIndex((l) => !l.filled)
    if (targetIndex < 0) return
    const linkStride = LINK_SIZE + CONNECTOR_WIDTH
    el.scrollLeft = Math.max(0, targetIndex * linkStride - el.clientWidth / 2 + LINK_SIZE)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDays, startDate])

  return (
    <div ref={scrollRef} className="w-full overflow-x-auto py-1">
      <div className="flex items-center" style={{ width: 'max-content' }}>
        {links.map((link, i) => (
          <div key={link.key} className="flex items-center">
            {i > 0 && (
              <div
                className="shrink-0"
                style={{
                  width: CONNECTOR_WIDTH,
                  height: 6,
                  background: link.filled && links[i - 1].filled ? color : '#E5E7EB',
                  borderRadius: 3,
                }}
              />
            )}
            <motion.button
              type="button"
              onClick={() => onToggleDay(link.key)}
              title={link.key}
              whileTap={{ scale: 0.85 }}
              animate={link.filled ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={`shrink-0 flex items-center justify-center rounded-full font-extrabold text-[12px] cursor-pointer transition-colors hover:brightness-95 ${
                link.isToday && !link.filled ? 'ring-2 ring-offset-2 ring-textMuted' : ''
              }`}
              style={{
                width: LINK_SIZE,
                height: LINK_SIZE,
                background: link.filled ? color : '#fff',
                color: link.filled ? '#fff' : '#6B7280',
                border: `3px solid ${link.filled ? color : '#E5E7EB'}`,
              }}
            >
              {link.day}
            </motion.button>
          </div>
        ))}
      </div>
    </div>
  )
}
