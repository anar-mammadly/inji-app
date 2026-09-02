import { AnimatePresence, motion } from 'framer-motion'

// Centered dialog on desktop, bottom sheet on mobile (driven by Tailwind's
// `sm:` breakpoint so no JS viewport detection is needed).
export default function Modal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-textPrimary/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full sm:w-[420px] max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border-2 border-border bg-surface shadow-pop p-5"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            {title && <div className="text-[17px] font-extrabold text-textPrimary mb-3">{title}</div>}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
