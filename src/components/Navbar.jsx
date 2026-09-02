import { Flame } from 'lucide-react'
import { colors } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'
import { useBakuClock } from '../hooks/useBakuClock'

const EN_TO_AZ_WEEKDAY = {
  Sunday: 'Bazar',
  Monday: 'Bazar ertəsi',
  Tuesday: 'Çərşənbə axşamı',
  Wednesday: 'Çərşənbə',
  Thursday: 'Cümə axşamı',
  Friday: 'Cümə',
  Saturday: 'Şənbə',
}

const EN_TO_AZ_MONTH = {
  January: 'Yanvar',
  February: 'Fevral',
  March: 'Mart',
  April: 'Aprel',
  May: 'May',
  June: 'İyun',
  July: 'İyul',
  August: 'Avqust',
  September: 'Sentyabr',
  October: 'Oktyabr',
  November: 'Noyabr',
  December: 'Dekabr',
}

function getBakuDateParts(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Baku',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).formatToParts(date)

  return Object.fromEntries(parts.map((p) => [p.type, p.value]))
}

function formatBakuTime(date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Baku',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatDateTime(lang, date, { short } = {}) {
  const { weekday, month, day, year } = getBakuDateParts(date)
  const time = formatBakuTime(date)

  if (short) {
    return lang === 'az' ? `${day} ${EN_TO_AZ_MONTH[month]} · ${time}` : `${month} ${day} · ${time}`
  }
  if (lang === 'az') {
    return `${EN_TO_AZ_WEEKDAY[weekday]}, ${day} ${EN_TO_AZ_MONTH[month]} ${year} · ${time}`
  }
  return `${weekday}, ${month} ${day}, ${year} · ${time}`
}

export default function Navbar({ streakDays, page, onNavigate, user, onSignIn, onSignOut, profileName, profileAvatar }) {
  const { lang, setLang, t } = useTranslation()
  const now = useBakuClock()

  const initials = profileName?.trim()
    ? profileName.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase()

  const AuthButton = user ? (
    <button
      onClick={() => onNavigate('profile')}
      className="flex items-center justify-center rounded-full text-white text-[12px] font-extrabold shrink-0 overflow-hidden border-2"
      style={{
        width: 32,
        height: 32,
        background: colors.accent,
        borderColor: page === 'profile' ? colors.accentDark : 'transparent',
      }}
      aria-label="Profile"
    >
      {profileAvatar ? (
        <img src={profileAvatar} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials
      )}
    </button>
  ) : (
    <button
      onClick={onSignIn}
      className="text-[12px] font-extrabold px-3 py-1.5 rounded-xl border-2 shrink-0"
      style={{ borderColor: colors.accent, color: colors.accent }}
    >
      {t('authLoginButton')}
    </button>
  )

  return (
    <div className="border-b border-border bg-surface">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 sm:px-6 py-3 sm:h-14 sm:py-0">
        <div className="text-lg font-extrabold lowercase shrink-0">
          i<span className="text-accent">n</span>ji
        </div>

        <div className="flex items-center gap-1 text-[12px] font-extrabold">
          {[
            { id: 'board', label: t('navBoard') },
            { id: 'stats', label: t('navStats') },
            { id: 'habits', label: t('navHabits') },
            { id: 'learning', label: t('navLearning') },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap ${
                page === id ? 'bg-accentSoft text-accentDark' : 'text-textSecondary hover:bg-surfaceAlt'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="order-last sm:order-none sm:ml-auto text-[11px] sm:text-sm font-bold text-textSecondary whitespace-nowrap">
          <span className="sm:hidden">{formatDateTime(lang, now, { short: true })}</span>
          <span className="hidden sm:inline">{formatDateTime(lang, now)}</span>
        </div>

        <span className="flex items-center gap-1 text-sm font-extrabold text-orange whitespace-nowrap">
          <Flame size={16} className="text-orange" strokeWidth={2.5} fill="#FF9600" />
          {t('streak', { n: streakDays })}
        </span>

        <div className="flex items-center rounded-xl border-2 border-border overflow-hidden text-[11px] font-extrabold shrink-0">
          {['az', 'en'].map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`px-2.5 py-1 transition-colors ${lang === code ? 'bg-accent text-white' : 'text-textSecondary'}`}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="shrink-0 ml-auto sm:ml-0">{AuthButton}</div>
      </div>
    </div>
  )
}
