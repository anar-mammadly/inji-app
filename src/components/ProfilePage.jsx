import { useRef, useState } from 'react'
import { Camera, UserRound, Mail, KeyRound, LogOut } from 'lucide-react'
import { colors } from '../utils/colors'
import Page from './ui/Page'
import PageHeader from './ui/PageHeader'
import Card from './ui/Card'
import Button from './ui/Button'
import { inputClass, labelClass } from './ui/styles'
import { useTranslation } from '../i18n/LanguageContext'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../contexts/AuthContext'
import { authErrorMessage } from '../utils/authErrors'

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <label className="flex flex-col">
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={inputClass}
      />
    </label>
  )
}

function Section({ title, icon: Icon, color, children }) {
  return (
    <Card>
      <h2 className="flex items-center gap-2.5 mb-4 text-[17px] font-extrabold text-textPrimary">
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: color + '22', color }}>
            <Icon size={17} strokeWidth={2.5} />
          </span>
        )}
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </Card>
  )
}

function SaveBtn({ loading, label }) {
  return (
    <Button type="submit" disabled={loading} className="self-start">
      {loading ? '...' : label}
    </Button>
  )
}

function StatusMsg({ status }) {
  if (!status) return null
  const isErr = status.type === 'error'
  return (
    <p className={`text-[13px] font-bold px-3 py-2 rounded-xl ${isErr ? 'bg-pomSoft text-coralDark' : 'bg-accentSoft text-accentDark'}`}>
      {status.msg}
    </p>
  )
}

export default function ProfilePage({ userId, userEmail, onSignOut }) {
  const { t, lang } = useTranslation()
  const { profile, loading, saveProfile, uploadAvatar, changePassword, changeEmail } = useProfile(userId)
  const { resetPassword } = useAuth()

  // General info form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [profession, setProfession] = useState('')
  const [infoInit, setInfoInit]   = useState(false)
  const [infoStatus, setInfoStatus] = useState(null)
  const [infoSaving, setInfoSaving] = useState(false)

  // Keep form in sync with loaded profile (once)
  if (!infoInit && !loading && (profile.first_name || profile.last_name || profile.profession)) {
    setFirstName(profile.first_name)
    setLastName(profile.last_name)
    setProfession(profile.profession)
    setInfoInit(true)
  }

  // Password form
  const [oldPw,  setOldPw]  = useState('')
  const [newPw,  setNewPw]  = useState('')
  const [confPw, setConfPw] = useState('')
  const [pwStatus, setPwStatus]   = useState(null)
  const [pwSaving, setPwSaving]   = useState(false)

  // Email form
  const [newEmail, setNewEmail]       = useState('')
  const [emailStatus, setEmailStatus] = useState(null)
  const [emailSaving, setEmailSaving] = useState(false)

  // Avatar
  const fileInputRef = useRef(null)
  const [avatarSaving, setAvatarSaving] = useState(false)

  const initials = ((profile.first_name?.[0] ?? '') + (profile.last_name?.[0] ?? '')).toUpperCase()
    || (userEmail?.[0] ?? '?').toUpperCase()

  async function handleInfoSubmit(e) {
    e.preventDefault()
    setInfoSaving(true)
    setInfoStatus(null)
    const { error } = await saveProfile({ first_name: firstName.trim(), last_name: lastName.trim(), profession: profession.trim() })
    setInfoStatus(error
      ? { type: 'error', msg: error.message }
      : { type: 'ok',    msg: lang === 'az' ? 'Yadda saxlandı ✓' : 'Saved ✓' }
    )
    setInfoSaving(false)
  }

  async function handlePwSubmit(e) {
    e.preventDefault()
    if (newPw !== confPw) { setPwStatus({ type: 'error', msg: lang === 'az' ? 'Yeni şifrələr uyğun gəlmir' : 'Passwords do not match' }); return }
    if (newPw.length < 6)  { setPwStatus({ type: 'error', msg: lang === 'az' ? 'Şifrə ən az 6 simvol olmalıdır' : 'Min 6 characters' }); return }
    setPwSaving(true); setPwStatus(null)
    const { error } = await changePassword(oldPw, newPw)
    setPwStatus(error
      ? { type: 'error', msg: authErrorMessage(error, t) }
      : { type: 'ok',    msg: lang === 'az' ? 'Şifrə dəyişdirildi ✓' : 'Password changed ✓' }
    )
    if (!error) { setOldPw(''); setNewPw(''); setConfPw('') }
    setPwSaving(false)
  }

  async function handleForgotPw() {
    setPwStatus(null)
    const { error } = await resetPassword(userEmail)
    setPwStatus(error
      ? { type: 'error', msg: authErrorMessage(error, t) }
      : { type: 'ok',    msg: t('authResetSent') }
    )
  }

  async function handleEmailSubmit(e) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setEmailSaving(true); setEmailStatus(null)
    const { error } = await changeEmail(newEmail.trim())
    setEmailStatus(error
      ? { type: 'error', msg: authErrorMessage(error, t) }
      : { type: 'ok',    msg: lang === 'az' ? 'Yoxlama linki göndərildi. E-poçtunuzu yoxlayın.' : 'Confirmation link sent. Check your email.' }
    )
    if (!error) setNewEmail('')
    setEmailSaving(false)
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarSaving(true)
    setInfoStatus(null)
    const { error } = await uploadAvatar(file)
    if (error) setInfoStatus({ type: 'error', msg: error.message })
    setAvatarSaving(false)
    e.target.value = '' // allow picking the same file again after a failure
  }

  return (
    <Page width="narrow">
      <PageHeader title={t('navProfile')} />
      <div className="flex flex-col gap-4">

      {/* ── Avatar + name header ── */}
      <Card className="flex items-center gap-4">
        <div className="relative shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group relative rounded-full overflow-hidden flex items-center justify-center text-white text-2xl font-extrabold border-[3px] border-accentDark"
            style={{ width: 80, height: 80, background: colors.accent, opacity: avatarSaving ? 0.6 : 1 }}
            aria-label="Change avatar"
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : initials}
            <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={22} />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div className="min-w-0">
          <div className="text-[18px] font-extrabold truncate text-textPrimary">
            {profile.first_name || profile.last_name
              ? `${profile.first_name} ${profile.last_name}`.trim()
              : (lang === 'az' ? 'Adınızı əlavə edin' : 'Add your name')}
          </div>
          <div className="text-[14px] truncate text-textMuted">{userEmail}</div>
          {profile.profession && (
            <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full bg-blueSoft text-blueDark text-[12px] font-bold truncate max-w-full">{profile.profession}</span>
          )}
        </div>
      </Card>

      {/* ── General info ── */}
      <Section icon={UserRound} color={colors.blue} title={lang === 'az' ? 'Ümumi məlumat' : 'General info'}>
        <form onSubmit={handleInfoSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label={lang === 'az' ? 'Ad' : 'First name'}
              value={firstName}
              onChange={setFirstName}
              placeholder={lang === 'az' ? 'Adınız' : 'First name'}
              autoComplete="given-name"
            />
            <Field
              label={lang === 'az' ? 'Soyad' : 'Last name'}
              value={lastName}
              onChange={setLastName}
              placeholder={lang === 'az' ? 'Soyadınız' : 'Last name'}
              autoComplete="family-name"
            />
          </div>
          <Field
            label={lang === 'az' ? 'Peşə' : 'Profession'}
            value={profession}
            onChange={setProfession}
            placeholder={lang === 'az' ? 'Peşəniz (müəllim, mühəndis...)' : 'Your profession'}
            autoComplete="organization-title"
          />
          <StatusMsg status={infoStatus} />
          <SaveBtn loading={infoSaving} label={lang === 'az' ? 'Yadda saxla' : 'Save'} />
        </form>
      </Section>

      {/* ── Email ── */}
      <Section icon={Mail} color={colors.purple} title={lang === 'az' ? 'E-poçt' : 'Email'}>
        <div className="text-[14px] text-textSecondary">
          {lang === 'az' ? 'Cari:' : 'Current:'}{' '}
          <span className="font-bold text-textPrimary break-all">{userEmail}</span>
        </div>
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
          <Field
            label={lang === 'az' ? 'Yeni e-poçt' : 'New email'}
            type="email"
            value={newEmail}
            onChange={setNewEmail}
            placeholder={lang === 'az' ? 'Yeni e-poçt ünvanı' : 'New email address'}
            autoComplete="email"
          />
          <StatusMsg status={emailStatus} />
          <SaveBtn loading={emailSaving} label={lang === 'az' ? 'E-poçtu dəyişdir' : 'Change email'} />
        </form>
      </Section>

      {/* ── Password ── */}
      <Section icon={KeyRound} color={colors.orange} title={lang === 'az' ? 'Şifrə' : 'Password'}>
        <form onSubmit={handlePwSubmit} className="flex flex-col gap-4">
          <Field
            label={lang === 'az' ? 'Köhnə şifrə' : 'Current password'}
            type="password"
            value={oldPw}
            onChange={setOldPw}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <Field
            label={lang === 'az' ? 'Yeni şifrə' : 'New password'}
            type="password"
            value={newPw}
            onChange={setNewPw}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <Field
            label={lang === 'az' ? 'Yeni şifrəni təsdiqlə' : 'Confirm new password'}
            type="password"
            value={confPw}
            onChange={setConfPw}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <StatusMsg status={pwStatus} />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <SaveBtn loading={pwSaving} label={lang === 'az' ? 'Şifrəni dəyişdir' : 'Change password'} />
            <button
              type="button"
              onClick={handleForgotPw}
              className="text-[13px] font-bold text-blueDark hover:underline"
            >
              {t('authForgotPassword')}
            </button>
          </div>
        </form>
      </Section>

      {/* ── Sign out ── */}
      <Button variant="secondary" onClick={onSignOut} className="w-full !text-coral">
        <LogOut size={17} strokeWidth={2.5} />
        {lang === 'az' ? 'Hesabdan çıx' : 'Sign out'}
      </Button>
      </div>
    </Page>
  )
}
