import { useState } from 'react'
import { motion } from 'framer-motion'
import { colors } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

export default function AuthModal({ onClose }) {
  const { t } = useTranslation()
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)
    const { error } = mode === 'login' ? await signIn(email, password) : await signUp(email, password)
    if (error) {
      setError(error.message)
      setSubmitting(false)
    } else if (mode === 'register') {
      setInfo(t('authCheckEmail'))
      setSubmitting(false)
    } else {
      onClose()
    }
  }

  function switchMode(m) {
    setMode(m)
    setError('')
    setInfo('')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(44,44,42,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-sm rounded-[14px] border p-6 relative"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center justify-center rounded-[6px] hover:bg-bg transition-colors"
          style={{ width: 28, height: 28, color: colors.textMuted }}
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 1 L11 11 M11 1 L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="text-base font-semibold lowercase text-center mb-1">
          i<span style={{ color: colors.accent }}>n</span>ji
        </div>
        <div className="text-center text-sm mb-5" style={{ color: colors.textSecondary }}>
          {mode === 'login' ? t('authLoginSubtitle') : t('authRegisterSubtitle')}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="email"
            autoFocus
            placeholder={t('authEmail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-2.5 rounded-[8px] border text-sm outline-none"
            style={{ borderColor: colors.border, color: colors.textPrimary }}
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder={t('authPassword')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-2.5 rounded-[8px] border text-sm outline-none"
            style={{ borderColor: colors.border, color: colors.textPrimary }}
          />

          {error && <div className="text-sm" style={{ color: colors.coral }}>{error}</div>}
          {info  && <div className="text-sm" style={{ color: colors.accent }}>{info}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 py-2.5 rounded-[8px] text-sm font-medium text-white disabled:opacity-60"
            style={{ background: colors.accent }}
          >
            {mode === 'login' ? t('authLoginButton') : t('authRegisterButton')}
          </button>
        </form>

        <div className="text-center text-sm mt-4" style={{ color: colors.textSecondary }}>
          {mode === 'login' ? (
            <>
              {t('authNoAccount')}{' '}
              <button type="button" className="font-medium underline" style={{ color: colors.accent }}
                onClick={() => switchMode('register')}>
                {t('authRegisterButton')}
              </button>
            </>
          ) : (
            <>
              {t('authHaveAccount')}{' '}
              <button type="button" className="font-medium underline" style={{ color: colors.accent }}
                onClick={() => switchMode('login')}>
                {t('authLoginButton')}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
