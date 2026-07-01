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

  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  return lookup
}

function formatBakuTime(date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Baku',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatDateTime(lang, date) {
  const { weekday, month, day, year } = getBakuDateParts(date)
  const time = formatBakuTime(date)

  if (lang === 'az') {
    return `${EN_TO_AZ_WEEKDAY[weekday]}, ${day} ${EN_TO_AZ_MONTH[month]} ${year} · ${time}`
  }
  return `${weekday}, ${month} ${day}, ${year} · ${time}`
}

export default function Navbar({ streakDays, page, onNavigate, user, onSignIn, onSignOut }) {
  const { lang, setLang, t } = useTranslation()
  const now = useBakuClock()

  const Logo = (
    <div className="text-base font-semibold lowercase shrink-0">
      i<span style={{ color: colors.accent }}>n</span>ji
    </div>
  )

  const NavTabs = ({ full } = {}) => (
    <div
      className={`flex items-center rounded-[8px] border overflow-hidden text-[12px] font-medium ${full ? 'w-full' : ''}`}
      style={{ borderColor: colors.border }}
    >
      {[
        { id: 'board', label: t('navBoard') },
        { id: 'stats', label: t('navStats') },
        { id: 'learn', label: t('navLearn') },
      ].map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={`px-3 py-1.5 transition-colors ${full ? 'flex-1' : ''}`}
          style={{
            background: page === id ? colors.accent : 'transparent',
            color: page === id ? '#fff' : colors.textSecondary,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )

  const LangToggle = (
    <div
      className="flex items-center rounded-[8px] border overflow-hidden text-[11px] font-medium shrink-0"
      style={{ borderColor: colors.border }}
    >
      {['az', 'en'].map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className="px-2 py-1 transition-colors"
          style={{
            background: lang === code ? colors.accent : 'transparent',
            color: lang === code ? '#fff' : colors.textSecondary,
          }}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )

  const Streak = (
    <span className="text-sm whitespace-nowrap" style={{ color: colors.textSecondary }}>
      🔥 {t('streak', { n: streakDays })}
    </span>
  )

  const AuthButton = user ? (
    <button
      onClick={onSignOut}
      className="text-[12px] font-medium px-2 py-1 rounded-[8px] border shrink-0"
      style={{ borderColor: colors.border, color: colors.textSecondary }}
    >
      {t('logout')}
    </button>
  ) : (
    <button
      onClick={onSignIn}
      className="text-[12px] font-medium px-2 py-1 rounded-[8px] border shrink-0"
      style={{ borderColor: colors.accent, color: colors.accent }}
    >
      {t('authLoginButton')}
    </button>
  )

  return (
    <div className="border-b" style={{ borderColor: colors.border, background: colors.surface }}>
      {/* mobile layout */}
      <div className="sm:hidden flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between">
          {Logo}
          <div className="flex items-center gap-2">
            {LangToggle}
            {AuthButton}
          </div>
        </div>
        <NavTabs full />
        <div className="text-center text-[11px]" style={{ color: colors.textSecondary }}>
          {formatDateTime(lang, now)} · 🔥 {streakDays}
        </div>
      </div>

      {/* desktop layout */}
      <div className="hidden sm:flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-5">
          {Logo}
          <NavTabs />
        </div>
        <div className="text-sm" style={{ color: colors.textSecondary }}>
          {formatDateTime(lang, now)}
        </div>
        <div className="flex items-center gap-4">
          {Streak}
          {LangToggle}
          {AuthButton}
        </div>
      </div>
    </div>
  )
}
