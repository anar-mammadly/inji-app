import { useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { inputClass } from './ui/styles'
import { useTranslation } from '../i18n/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { authErrorMessage } from '../utils/authErrors'

const SUBTITLE_KEY = { login: 'authLoginSubtitle', register: 'authRegisterSubtitle', forgot: 'authResetSubtitle' }
const SUBMIT_KEY = { login: 'authLoginButton', register: 'authRegisterButton', forgot: 'authResetButton' }

export default function AuthModal({ onClose, initialMode = 'login', initialError = '' }) {
  const { t } = useTranslation()
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(initialError)
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)
    const cleanEmail = email.trim()

    if (mode === 'forgot') {
      const { error } = await resetPassword(cleanEmail)
      if (error) setError(authErrorMessage(error, t))
      else setInfo(t('authResetSent'))
      setSubmitting(false)
      return
    }

    const { error } = mode === 'login' ? await signIn(cleanEmail, password) : await signUp(cleanEmail, password)
    if (error) {
      setError(authErrorMessage(error, t))
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

  const linkBtn = 'font-extrabold text-blueDark hover:underline'

  return (
    <Modal open onClose={onClose}>
      <div className="text-center mb-5">
        <div className="text-[30px] font-extrabold tracking-tight lowercase leading-none text-textPrimary">
          i<span className="text-accent">n</span>ji
        </div>
        <p className="mt-2 text-[15px] font-semibold text-textSecondary">{t(SUBTITLE_KEY[mode])}</p>
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
          className={inputClass}
        />
        {mode !== 'forgot' && (
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder={t('authPassword')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        )}

        {mode === 'login' && (
          <button type="button" className={`self-end -mt-0.5 text-[13px] ${linkBtn}`} onClick={() => switchMode('forgot')}>
            {t('authForgotPassword')}
          </button>
        )}

        {error && <p className="text-[13px] font-bold px-3 py-2 rounded-xl bg-pomSoft text-coralDark">{error}</p>}
        {info && <p className="text-[13px] font-bold px-3 py-2 rounded-xl bg-accentSoft text-accentDark">{info}</p>}

        <Button type="submit" disabled={submitting} className="mt-1 w-full">
          {t(SUBMIT_KEY[mode])}
        </Button>
      </form>

      <div className="text-center text-[14px] font-semibold mt-5 text-textSecondary">
        {mode === 'login' ? (
          <>
            {t('authNoAccount')}{' '}
            <button type="button" className={linkBtn} onClick={() => switchMode('register')}>
              {t('authRegisterButton')}
            </button>
          </>
        ) : mode === 'register' ? (
          <>
            {t('authHaveAccount')}{' '}
            <button type="button" className={linkBtn} onClick={() => switchMode('login')}>
              {t('authLoginButton')}
            </button>
          </>
        ) : (
          <button type="button" className={linkBtn} onClick={() => switchMode('login')}>
            {t('authBackToLogin')}
          </button>
        )}
      </div>
    </Modal>
  )
}
