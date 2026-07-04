import { useRef, useState } from 'react'
import { colors } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'
import { useProfile } from '../hooks/useProfile'

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] uppercase font-medium tracking-wide" style={{ color: colors.textMuted }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-3 py-2.5 rounded-[10px] border outline-none bg-white"
        style={{ borderColor: colors.border, color: colors.textPrimary }}
      />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div
      className="rounded-[14px] border overflow-hidden"
      style={{ borderColor: colors.border, background: colors.surface }}
    >
      <div className="px-4 py-3 border-b" style={{ borderColor: colors.border }}>
        <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>
          {title}
        </span>
      </div>
      <div className="px-4 py-4 flex flex-col gap-4">{children}</div>
    </div>
  )
}

function SaveBtn({ loading, label = 'Yadda saxla' }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="self-start px-5 py-2 rounded-[10px] text-sm font-medium text-white disabled:opacity-50"
      style={{ background: colors.accent }}
    >
      {loading ? '...' : label}
    </button>
  )
}

function StatusMsg({ status }) {
  if (!status) return null
  const isErr = status.type === 'error'
  return (
    <p className="text-[13px]" style={{ color: isErr ? colors.coral : colors.accent }}>
      {status.msg}
    </p>
  )
}

export default function ProfilePage({ userId, userEmail, onSignOut }) {
  const { t, lang } = useTranslation()
  const { profile, loading, saveProfile, uploadAvatar, changePassword, changeEmail } = useProfile(userId)

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
      ? { type: 'error', msg: error.message }
      : { type: 'ok',    msg: lang === 'az' ? 'Şifrə dəyişdirildi ✓' : 'Password changed ✓' }
    )
    if (!error) { setOldPw(''); setNewPw(''); setConfPw('') }
    setPwSaving(false)
  }

  async function handleEmailSubmit(e) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setEmailSaving(true); setEmailStatus(null)
    const { error } = await changeEmail(newEmail.trim())
    setEmailStatus(error
      ? { type: 'error', msg: error.message }
      : { type: 'ok',    msg: lang === 'az' ? 'Yoxlama linki göndərildi. E-poçtunuzu yoxlayın.' : 'Confirmation link sent. Check your email.' }
    )
    if (!error) setNewEmail('')
    setEmailSaving(false)
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarSaving(true)
    await uploadAvatar(file)
    setAvatarSaving(false)
  }

  return (
    <div className="flex-1 px-4 sm:px-6 py-6 max-w-[520px] mx-auto w-full flex flex-col gap-5">

      {/* ── Avatar + name header ── */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative rounded-full overflow-hidden flex items-center justify-center text-white text-xl font-semibold"
            style={{ width: 72, height: 72, background: colors.accent, opacity: avatarSaving ? 0.6 : 1 }}
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
            <span
              className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.35)', fontSize: 22 }}
            >
              📷
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
          <div className="text-base font-semibold truncate" style={{ color: colors.textPrimary }}>
            {profile.first_name || profile.last_name
              ? `${profile.first_name} ${profile.last_name}`.trim()
              : (lang === 'az' ? 'Adınızı əlavə edin' : 'Add your name')}
          </div>
          <div className="text-sm truncate" style={{ color: colors.textMuted }}>{userEmail}</div>
          {profile.profession && (
            <div className="text-[12px] truncate" style={{ color: colors.textSecondary }}>{profile.profession}</div>
          )}
        </div>
      </div>

      {/* ── General info ── */}
      <Section title={lang === 'az' ? 'Ümumi məlumat' : 'General info'}>
        <form onSubmit={handleInfoSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
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
      <Section title={lang === 'az' ? 'E-poçt' : 'Email'}>
        <div className="text-sm" style={{ color: colors.textSecondary }}>
          {lang === 'az' ? 'Cari:' : 'Current:'}{' '}
          <span style={{ color: colors.textPrimary }}>{userEmail}</span>
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
      <Section title={lang === 'az' ? 'Şifrə' : 'Password'}>
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
          <SaveBtn loading={pwSaving} label={lang === 'az' ? 'Şifrəni dəyişdir' : 'Change password'} />
        </form>
      </Section>

      {/* ── Sign out ── */}
      <button
        onClick={onSignOut}
        className="w-full py-2.5 rounded-[10px] border text-sm font-medium"
        style={{ borderColor: colors.coral, color: colors.coral }}
      >
        {lang === 'az' ? 'Hesabdan çıx' : 'Sign out'}
      </button>
    </div>
  )
}
