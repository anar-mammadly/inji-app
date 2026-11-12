import { useRef, useState } from 'react'
import { Camera, UserRound, Mail, KeyRound, LogOut, Trash2 } from 'lucide-react'
import { colors } from '../utils/colors'
import Page from './ui/Page'
import PageHeader from './ui/PageHeader'
import Card from './ui/Card'
import Button from './ui/Button'
import { inputClass, labelClass } from './ui/styles'
import { useTranslation } from '../i18n/LanguageContext'
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
  const { t } = useTranslation()
  return (
    <Button type="submit" disabled={loading} className="self-start">
      {loading ? t('saving') : label}
    </Button>
  )
}

function StatusMsg({ status }) {
  if (!status) return null
  const isErr = status.type === 'error'
  return (
    <p
      role={isErr ? 'alert' : 'status'}
      className={`text-[13px] font-bold px-3 py-2 rounded-xl ${isErr ? 'bg-pomSoft text-coralInk' : 'bg-accentSoft text-accentInk'}`}
    >
      {status.msg}
    </p>
  )
}

// `account` is the object from useProfile (held by App, so the sidebar shows
// the same name and photo the moment they change here).
export default function ProfilePage({ userEmail, account, onSignOut, onAccountDeleted }) {
  const { t } = useTranslation()
  const { profile, loading, saveProfile, uploadAvatar, changePassword, changeEmail, deleteAccount } = account
  const { resetPassword } = useAuth()

  // General info form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [profession, setProfession] = useState('')
  const [infoInit, setInfoInit] = useState(false)
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
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confPw, setConfPw] = useState('')
  const [pwStatus, setPwStatus] = useState(null)
  const [pwSaving, setPwSaving] = useState(false)

  // Email form
  const [newEmail, setNewEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState(null)
  const [emailSaving, setEmailSaving] = useState(false)

  // Avatar
  const fileInputRef = useRef(null)
  const [avatarSaving, setAvatarSaving] = useState(false)

  // Delete account
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleteStatus, setDeleteStatus] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const initials = ((profile.first_name?.[0] ?? '') + (profile.last_name?.[0] ?? '')).toUpperCase()
    || (userEmail?.[0] ?? '?').toUpperCase()

  async function handleInfoSubmit(e) {
    e.preventDefault()
    setInfoSaving(true)
    setInfoStatus(null)
    const { error } = await saveProfile({ first_name: firstName.trim(), last_name: lastName.trim(), profession: profession.trim() })
    setInfoStatus(error ? { type: 'error', msg: authErrorMessage(error, t) } : { type: 'ok', msg: t('profileSaved') })
    setInfoSaving(false)
  }

  async function handlePwSubmit(e) {
    e.preventDefault()
    if (newPw !== confPw) return setPwStatus({ type: 'error', msg: t('authPasswordsMismatch') })
    if (newPw.length < 6) return setPwStatus({ type: 'error', msg: t('authPasswordTooShort') })
    setPwSaving(true)
    setPwStatus(null)
    const { error } = await changePassword(oldPw, newPw)
    setPwStatus(error ? { type: 'error', msg: authErrorMessage(error, t) } : { type: 'ok', msg: t('profilePasswordChanged') })
    if (!error) {
      setOldPw('')
      setNewPw('')
      setConfPw('')
    }
    setPwSaving(false)
  }

  async function handleForgotPw() {
    setPwStatus(null)
    const { error } = await resetPassword(userEmail)
    setPwStatus(error ? { type: 'error', msg: authErrorMessage(error, t) } : { type: 'ok', msg: t('authResetSent') })
  }

  async function handleEmailSubmit(e) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setEmailSaving(true)
    setEmailStatus(null)
    const { error } = await changeEmail(newEmail.trim())
    setEmailStatus(error ? { type: 'error', msg: authErrorMessage(error, t) } : { type: 'ok', msg: t('profileEmailSent') })
    if (!error) setNewEmail('')
    setEmailSaving(false)
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarSaving(true)
    setInfoStatus(null)
    const { error } = await uploadAvatar(file)
    if (error) setInfoStatus({ type: 'error', msg: authErrorMessage(error, t) })
    setAvatarSaving(false)
    e.target.value = '' // allow picking the same file again after a failure
  }

  async function handleDelete(e) {
    e.preventDefault()
    if (deleteText.trim().toLowerCase() !== (userEmail || '').toLowerCase()) return
    setDeleting(true)
    setDeleteStatus(null)
    const { error } = await deleteAccount()
    if (error) {
      setDeleteStatus({ type: 'error', msg: authErrorMessage(error, t) })
      setDeleting(false)
      return
    }
    onAccountDeleted()
  }

  const displayName = `${profile.first_name} ${profile.last_name}`.trim()
  const deleteArmed = deleteText.trim().toLowerCase() === (userEmail || '').toLowerCase()

  return (
    <Page width="narrow">
      <PageHeader title={t('navProfile')} />
      <div className="flex flex-col gap-4">
        {/* ── Avatar + name header ── */}
        <Card className="flex items-center gap-4">
          <div className="relative shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarSaving}
              className="group relative rounded-full overflow-hidden flex items-center justify-center text-onAccent text-2xl font-extrabold border-[3px] border-accentDark"
              style={{ width: 80, height: 80, background: colors.accent, opacity: avatarSaving ? 0.6 : 1 }}
              aria-label={t('profileChangePhoto')}
              title={t('profileChangePhoto')}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                initials
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                <Camera size={22} />
              </span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="min-w-0">
            <div className="text-[18px] font-extrabold truncate text-textPrimary">{displayName || t('profileAddName')}</div>
            <div className="text-[14px] truncate text-textMuted">{userEmail}</div>
            {profile.profession && (
              <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full bg-blueSoft text-blueInk text-[12px] font-bold truncate max-w-full">
                {profile.profession}
              </span>
            )}
            <p className="mt-1 text-[12px] font-semibold text-textMuted">{t('profilePhotoHint')}</p>
          </div>
        </Card>

        {/* ── General info ── */}
        <Section icon={UserRound} color={colors.blue} title={t('profileGeneral')}>
          <form onSubmit={handleInfoSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('profileFirstName')} value={firstName} onChange={setFirstName} autoComplete="given-name" />
              <Field label={t('profileLastName')} value={lastName} onChange={setLastName} autoComplete="family-name" />
            </div>
            <Field
              label={t('profileProfession')}
              value={profession}
              onChange={setProfession}
              placeholder={t('profileProfessionPlaceholder')}
              autoComplete="organization-title"
            />
            <StatusMsg status={infoStatus} />
            <SaveBtn loading={infoSaving} label={t('save')} />
          </form>
        </Section>

        {/* ── Email ── */}
        <Section icon={Mail} color={colors.purple} title={t('authEmail')}>
          <div className="text-[14px] text-textSecondary">
            {t('profileCurrentEmail')} <span className="font-bold text-textPrimary break-all">{userEmail}</span>
          </div>
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <Field label={t('profileNewEmail')} type="email" value={newEmail} onChange={setNewEmail} autoComplete="email" />
            <StatusMsg status={emailStatus} />
            <SaveBtn loading={emailSaving} label={t('profileChangeEmail')} />
          </form>
        </Section>

        {/* ── Password ── */}
        <Section icon={KeyRound} color={colors.orange} title={t('authPassword')}>
          <form onSubmit={handlePwSubmit} className="flex flex-col gap-4">
            <Field label={t('profileCurrentPassword')} type="password" value={oldPw} onChange={setOldPw} autoComplete="current-password" />
            <Field label={t('authNewPassword')} type="password" value={newPw} onChange={setNewPw} autoComplete="new-password" />
            <Field label={t('authConfirmPassword')} type="password" value={confPw} onChange={setConfPw} autoComplete="new-password" />
            <StatusMsg status={pwStatus} />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <SaveBtn loading={pwSaving} label={t('profileChangePassword')} />
              <button type="button" onClick={handleForgotPw} className="text-[13px] font-bold text-blueInk hover:underline">
                {t('authForgotPassword')}
              </button>
            </div>
          </form>
        </Section>

        {/* ── Sign out ── */}
        <Button variant="secondary" onClick={onSignOut} className="w-full !text-coralInk">
          <LogOut size={17} strokeWidth={2.5} />
          {t('profileSignOut')}
        </Button>

        {/* ── Delete account ── */}
        <Section icon={Trash2} color={colors.coral} title={t('accountDeleteTitle')}>
          <p className="text-[14px] text-textSecondary">{t('accountDeleteBody')}</p>
          {deleteOpen ? (
            <form onSubmit={handleDelete} className="flex flex-col gap-3">
              <Field
                label={t('accountDeleteConfirmLabel', { email: userEmail })}
                type="email"
                value={deleteText}
                onChange={setDeleteText}
                autoComplete="off"
              />
              <StatusMsg status={deleteStatus} />
              <div className="flex gap-2">
                <Button type="submit" variant="danger" disabled={!deleteArmed || deleting}>
                  {deleting ? t('saving') : t('accountDeleteButton')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setDeleteOpen(false)
                    setDeleteText('')
                    setDeleteStatus(null)
                  }}
                >
                  {t('cancel')}
                </Button>
              </div>
            </form>
          ) : (
            <Button variant="secondary" onClick={() => setDeleteOpen(true)} className="self-start !text-coralInk">
              {t('accountDeleteButton')}
            </Button>
          )}
        </Section>
      </div>
    </Page>
  )
}
