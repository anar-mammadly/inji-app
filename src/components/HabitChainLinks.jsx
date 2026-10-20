import { useEffect, useRef } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { darken } from '../utils/colors'

const LINK_SIZE = 36
const CONNECTOR_WIDTH = 12

// Chain of day "beads". Scrolls horizontally inside its own container so long
// challenges (100 days) never widen the page on a phone.
export default function HabitChainLinks({ startDate, targetDays, log, color = '#FF4B4B', onToggleDay }) {
  const scrollRef = useRef(null)
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const start = parseISO(startDate)
  const ledge = color.startsWith('#') ? darken(color, 0.18) : color

  const links = Array.from({ length: targetDays }, (_, i) => {
    const date = addDays(start, i)
    const key = format(date, 'yyyy-MM-dd')
    return { day: i + 1, key, filled: !!log[key], isToday: key === todayKey, isPast: key < todayKey }
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
    <div ref={scrollRef} className="w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-2xl bg-surfaceAlt px-3 pt-3 pb-3.5">
      <div className="flex items-center" style={{ width: 'max-content' }}>
        {links.map((link, i) => {
          const linked = link.filled && i > 0 && links[i - 1].filled
          return (
            <div key={link.key} className="flex items-center">
              {i > 0 && (
                <div
                  className="shrink-0 rounded-full"
                  style={{ width: CONNECTOR_WIDTH, height: 6, background: linked ? color : '#D1D5DB' }}
                />
              )}
              <motion.button
                type="button"
                onClick={() => onToggleDay(link.key)}
                title={link.key}
                aria-pressed={link.filled}
                whileTap={{ scale: 0.85 }}
                animate={link.filled ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
                className={`relative shrink-0 flex items-center justify-center rounded-full text-[13px] font-extrabold tabular-nums cursor-pointer transition-colors ${
                  link.isToday && !link.filled ? 'ring-[3px] ring-offset-2 ring-offset-surfaceAlt ring-orange' : ''
                }`}
                style={{
                  width: LINK_SIZE,
                  height: LINK_SIZE,
                  background: link.filled ? color : '#fff',
                  color: link.filled ? '#fff' : link.isToday ? '#E07C00' : link.isPast ? '#9CA0A8' : '#6B7280',
                  border: `2px solid ${link.filled ? ledge : '#E5E7EB'}`,
                  boxShadow: `0 3px 0 ${link.filled ? ledge : '#E5E7EB'}`,
                }}
              >
                {link.filled && (
                  <span className="absolute left-[9px] top-[6px] h-[6px] w-[9px] rounded-full bg-white/40" aria-hidden="true" />
                )}
                {link.filled && link.isToday ? <Check size={18} strokeWidth={3.5} /> : link.day}
              </motion.button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
