import { useState } from 'react'
import { motion } from 'framer-motion'
import { colors } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { authErrorMessage } from '../utils/authErrors'

// Shown after the user opens a "reset password" email link. The link already
// signed them in, so all that's left is picking the new password.
export default function ResetPasswordModal() {
  const { t } = useTranslation()
  const { user, updatePassword, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError(t('authPasswordTooShort'))
    if (password !== confirm) return setError(t('authPasswordsMismatch'))
    setSubmitting(true)
    const { error } = await updatePassword(password)
    if (error) setError(authErrorMessage(error, t))
    setSubmitting(false)
  }

  const inputClass = 'px-3 py-2.5 rounded-[8px] border text-sm outline-none'
  const inputStyle = { borderColor: colors.border, color: colors.textPrimary }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(44,44,42,0.4)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-sm rounded-[14px] border p-6"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <div className="text-base font-semibold text-center mb-1" style={{ color: colors.textPrimary }}>
          {t('authNewPasswordTitle')}
        </div>
        <div className="text-center text-sm mb-5" style={{ color: colors.textSecondary }}>
          {t('authNewPasswordSubtitle')}
          {user?.email && <div className="mt-0.5" style={{ color: colors.textMuted }}>{user.email}</div>}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* hidden username field so password managers save the new password for the right account */}
          <input type="email" autoComplete="username" value={user?.email ?? ''} readOnly hidden />
          <input
            type="password"
            required
            minLength={6}
            autoFocus
            autoComplete="new-password"
            placeholder={t('authNewPassword')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder={t('authConfirmPassword')}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
            style={inputStyle}
          />

          {error && <div className="text-sm" style={{ color: colors.coral }}>{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 py-2.5 rounded-[8px] text-sm font-medium text-white disabled:opacity-60"
            style={{ background: colors.accent }}
          >
            {t('authSavePassword')}
          </button>
        </form>

        <div className="text-center text-sm mt-4">
          <button type="button" className="underline" style={{ color: colors.textSecondary }} onClick={signOut}>
            {t('cancel')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
