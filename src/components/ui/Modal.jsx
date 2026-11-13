import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useTranslation } from '../../i18n/LanguageContext'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// The element that had focus before a dialog took it. Tracked globally because
// a field with autoFocus grabs focus while the dialog mounts — by the time the
// dialog's own effect runs, document.activeElement is already inside it.
let lastFocusOutside = null
if (typeof document !== 'undefined') {
  document.addEventListener(
    'focusin',
    (e) => {
      if (e.target instanceof HTMLElement && !e.target.closest('[role="dialog"]')) lastFocusOutside = e.target
    },
    true,
  )
}

// Centered dialog on desktop, bottom sheet on mobile (driven by Tailwind's
// `sm:` breakpoint so no JS viewport detection is needed).
//
// Keyboard: focus moves into the dialog when it opens, Tab cycles inside it,
// Escape closes it, and focus returns to whatever opened it.
export default function Modal({ open, onClose, title, children }) {
  const { t } = useTranslation()
  const titleId = useId()
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const active = document.activeElement
    const opener = panel && panel.contains(active) ? lastFocusOutside : active

    // don't steal focus from a field that focused itself (autoFocus)
    if (panel && !panel.contains(document.activeElement)) {
      const first = panel.querySelector('input:not([type="hidden"]), textarea, select') || panel
      first.focus({ preventScroll: true })
    }

    function onKey(e) {
      if (e.key === 'Escape') {
        onCloseRef.current?.()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus({ preventScroll: true })
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            className="relative w-full sm:w-[440px] max-h-[88dvh] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-3xl border-2 border-border bg-surface shadow-pop px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] outline-none sm:p-6"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          >
            <div className="sm:hidden mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-borderStrong" />
            {title && (
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2 id={titleId} className="font-display text-[20px] leading-tight text-textPrimary">
                  {title}
                </h2>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="hit -mr-1.5 -mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl text-textMuted hover:bg-surfaceAlt hover:text-textSecondary"
                    aria-label={t('close')}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
