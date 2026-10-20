import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

// Centered dialog on desktop, bottom sheet on mobile (driven by Tailwind's
// `sm:` breakpoint so no JS viewport detection is needed).
export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

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
            role="dialog"
            aria-modal="true"
            className="relative w-full sm:w-[440px] max-h-[88dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border-2 border-border bg-surface shadow-pop px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-6"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            <div className="sm:hidden mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-borderStrong" />
            {title && (
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2 className="font-display text-[20px] leading-tight text-textPrimary">{title}</h2>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="-mr-1.5 -mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl text-textMuted hover:bg-surfaceAlt hover:text-textSecondary"
                    aria-label="Close"
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
