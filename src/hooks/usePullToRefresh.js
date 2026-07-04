import { useEffect, useRef, useState } from 'react'

const VISUAL_THRESHOLD = 44  // px of visual travel before triggering
const RESISTANCE      = 2.8  // how much actual touch travel shrinks
const MAX_PULL        = 72   // cap on visual travel

export function usePullToRefresh(onRefresh) {
  const [pullY, setPullY]       = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const startY   = useRef(null)
  const startX   = useRef(null)
  const pullYRef = useRef(0)
  const active   = useRef(false)
  const busy     = useRef(false)

  useEffect(() => {
    function onTouchStart(e) {
      if (busy.current) return
      if (window.scrollY > 5) return  // not at the top
      startY.current = e.touches[0].clientY
      startX.current = e.touches[0].clientX
      active.current = false
    }

    function onTouchMove(e) {
      if (startY.current === null) return
      if (window.scrollY > 5) { startY.current = null; return }

      const dy = e.touches[0].clientY - startY.current
      const dx = e.touches[0].clientX - startX.current

      // Ignore if movement is more horizontal than vertical
      if (!active.current && Math.abs(dx) > Math.abs(dy)) {
        startY.current = null
        return
      }
      // Must be pulling downward
      if (dy <= 0) return

      active.current = true
      const visual = Math.min(MAX_PULL, dy / RESISTANCE)
      pullYRef.current = visual
      setPullY(visual)
    }

    function onTouchEnd() {
      if (!active.current) {
        startY.current = null
        return
      }
      const y = pullYRef.current
      startY.current = null
      active.current = false

      if (y >= VISUAL_THRESHOLD) {
        busy.current = true
        setRefreshing(true)
        setPullY(VISUAL_THRESHOLD)
        Promise.resolve(onRefresh()).finally(() => {
          // page reloads via onRefresh so this cleanup is just a safety net
          setTimeout(() => {
            busy.current = false
            setRefreshing(false)
            setPullY(0)
            pullYRef.current = 0
          }, 800)
        })
      } else {
        setPullY(0)
        pullYRef.current = 0
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove',  onTouchMove,  { passive: true })
    document.addEventListener('touchend',   onTouchEnd,   { passive: true })

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove',  onTouchMove)
      document.removeEventListener('touchend',   onTouchEnd)
    }
  }, [onRefresh])

  return { pullY, refreshing }
}
