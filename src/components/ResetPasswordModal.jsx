import { useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { inputClass } from './ui/styles'
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

  return (
    <Modal open title={t('authNewPasswordTitle')}>
      <p className="-mt-2 mb-4 text-[14px] font-semibold text-textSecondary">
        {t('authNewPasswordSubtitle')}
        {user?.email && <span className="block mt-0.5 font-bold text-textPrimary break-all">{user.email}</span>}
      </p>

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
        />

        {error && <p className="text-[13px] font-bold px-3 py-2 rounded-xl bg-pomSoft text-coralDark">{error}</p>}

        <Button type="submit" disabled={submitting} className="mt-1 w-full">
          {t('authSavePassword')}
        </Button>
        <Button type="button" variant="ghost" onClick={signOut} className="w-full">
          {t('cancel')}
        </Button>
      </form>
    </Modal>
  )
}
