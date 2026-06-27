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

export default function Navbar({ streakDays }) {
  const { lang, setLang, t } = useTranslation()
  const now = useBakuClock()

  return (
    <div
      className="flex items-center justify-between px-6 h-14 border-b"
      style={{ borderColor: colors.border, background: colors.surface }}
    >
      <div className="text-base font-semibold lowercase">
        b<span style={{ color: colors.accent }}>o</span>ncuk
      </div>
      <div className="text-sm" style={{ color: colors.textSecondary }}>
        {formatDateTime(lang, now)}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm" style={{ color: colors.textSecondary }}>
          🔥 {t('streak', { n: streakDays })}
        </span>
        <div
          className="flex items-center rounded-[8px] border overflow-hidden text-[11px] font-medium"
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
      </div>
    </div>
  )
}
