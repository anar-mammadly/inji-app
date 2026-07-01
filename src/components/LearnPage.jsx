import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colors } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'

const MONTHS_AZ = [
  'Yanvar','Fevral','Mart','Aprel','May','İyun',
  'İyul','Avqust','Sentyabr','Oktyabr','Noyabr','Dekabr',
]
const MONTHS_EN = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAYS_AZ = ['B','BE','ÇA','Ç','CA','C','Ş']
const DAYS_EN = ['Su','Mo','Tu','We','Th','Fr','Sa']

function toISO(date) {
  return date.toISOString().slice(0, 10)
}

function todayDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Baku' }))
}

function formatDateLabel(dateObj, lang) {
  const today = toISO(todayDate())
  const iso = toISO(dateObj)
  const months = lang === 'az' ? MONTHS_AZ : MONTHS_EN
  const label = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`
  if (iso === today) return lang === 'az' ? `Bu gün · ${label}` : `Today · ${label}`
  const yesterday = new Date(todayDate()); yesterday.setDate(yesterday.getDate() - 1)
  if (iso === toISO(yesterday)) return lang === 'az' ? `Dünən · ${label}` : `Yesterday · ${label}`
  return label
}

function addDays(dateObj, n) {
  const d = new Date(dateObj)
  d.setDate(d.getDate() + n)
  return d
}

function buildCalendarDays(year, month) {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const startPad = first.getDay()
  const days = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

export default function LearnPage({ learnings = {}, onAdd, onDelete }) {
  const { lang, t } = useTranslation()
  const [selectedDate, setSelectedDate] = useState(todayDate())
  const [showCal, setShowCal] = useState(false)
  const [calMonth, setCalMonth] = useState(() => {
    const d = todayDate(); return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  const iso = toISO(selectedDate)
  const dayItems = learnings[iso] || []
  const today = todayDate()
  const isToday = iso === toISO(today)

  function handleAdd() {
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(iso, trimmed)
    setText('')
    inputRef.current?.focus()
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
  }

  const calDays = buildCalendarDays(calMonth.year, calMonth.month)
  const months = lang === 'az' ? MONTHS_AZ : MONTHS_EN
  const dayLabels = lang === 'az' ? DAYS_AZ : DAYS_EN

  // dates that have content — for dot indicators
  const activeDates = new Set(Object.keys(learnings).filter((k) => learnings[k]?.length > 0))

  return (
    <div className="flex-1 px-4 sm:px-6 py-6 max-w-[640px] mx-auto w-full">

      {/* ── Date navigation ── */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setSelectedDate((d) => addDays(d, -1))}
          className="flex items-center justify-center rounded-[8px] border"
          style={{ width: 36, height: 36, borderColor: colors.border, color: colors.textSecondary }}
        >
          ‹
        </button>

        <button
          onClick={() => setShowCal((v) => !v)}
          className="flex-1 text-center text-sm font-medium py-1.5 rounded-[8px] border"
          style={{ borderColor: showCal ? colors.accent : colors.border, color: colors.textPrimary }}
        >
          {formatDateLabel(selectedDate, lang)}
        </button>

        <button
          onClick={() => setSelectedDate((d) => addDays(d, 1))}
          disabled={isToday}
          className="flex items-center justify-center rounded-[8px] border disabled:opacity-30"
          style={{ width: 36, height: 36, borderColor: colors.border, color: colors.textSecondary }}
        >
          ›
        </button>

        {!isToday && (
          <button
            onClick={() => { setSelectedDate(todayDate()); setShowCal(false) }}
            className="text-[12px] px-2.5 py-1.5 rounded-[8px] border"
            style={{ borderColor: colors.border, color: colors.accent }}
          >
            {t('learnToday')}
          </button>
        )}
      </div>

      {/* ── Calendar popover ── */}
      <AnimatePresence>
        {showCal && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="rounded-[12px] border p-4 mb-5"
            style={{ borderColor: colors.border, background: colors.surface }}
          >
            {/* Month header */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCalMonth(({ year, month }) =>
                  month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
                )}
                className="px-2 py-1 rounded-[6px] text-sm"
                style={{ color: colors.textSecondary }}
              >‹</button>
              <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                {months[calMonth.month]} {calMonth.year}
              </span>
              <button
                onClick={() => setCalMonth(({ year, month }) =>
                  month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
                )}
                className="px-2 py-1 rounded-[6px] text-sm"
                style={{ color: colors.textSecondary }}
              >›</button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
              {dayLabels.map((d) => (
                <div key={d} className="text-center text-[11px] font-medium py-1"
                  style={{ color: colors.textMuted }}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {calDays.map((d, i) => {
                if (!d) return <div key={`pad-${i}`} />
                const dISO = toISO(d)
                const isSelected = dISO === iso
                const isT = dISO === toISO(today)
                const hasContent = activeDates.has(dISO)
                const isFuture = d > today
                return (
                  <button
                    key={dISO}
                    disabled={isFuture}
                    onClick={() => { setSelectedDate(d); setShowCal(false) }}
                    className="relative flex flex-col items-center py-1 rounded-[6px] disabled:opacity-25"
                    style={{
                      background: isSelected ? colors.accent : isT ? colors.bg : 'transparent',
                      color: isSelected ? '#fff' : isT ? colors.accent : colors.textPrimary,
                      fontWeight: isT ? '600' : '400',
                    }}
                  >
                    <span className="text-[13px] leading-none">{d.getDate()}</span>
                    {hasContent && (
                      <span
                        className="mt-0.5 rounded-full"
                        style={{
                          width: 4, height: 4,
                          background: isSelected ? 'rgba(255,255,255,0.8)' : colors.accent,
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Learning items ── */}
      <div
        className="rounded-[12px] border mb-4"
        style={{ borderColor: colors.border, background: colors.surface }}
      >
        {dayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <span className="text-2xl">📖</span>
            <span className="text-sm text-center px-4" style={{ color: colors.textMuted }}>
              {t('learnEmpty')}
            </span>
          </div>
        ) : (
          <ul className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
            {dayItems.map((item, idx) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15, delay: idx * 0.04 }}
                className="flex items-start gap-3 px-4 py-3"
                style={{ borderColor: colors.border }}
              >
                <span
                  className="mt-1 shrink-0 rounded-full"
                  style={{ width: 7, height: 7, background: colors.accent, marginTop: 6 }}
                />
                <span className="flex-1 text-sm leading-relaxed" style={{ color: colors.textPrimary }}>
                  {item.text}
                </span>
                <button
                  onClick={() => onDelete(iso, item.id)}
                  className="-m-1 p-2 shrink-0 rounded-[6px]"
                  style={{ color: colors.textMuted }}
                  aria-label="Delete"
                >
                  <svg width="11" height="11" viewBox="0 0 11 11">
                    <path d="M1 1 L10 10 M10 1 L1 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Add input ── */}
      <div
        className="rounded-[12px] border p-3 flex gap-2"
        style={{ borderColor: colors.border, background: colors.surface }}
      >
        <textarea
          ref={inputRef}
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={t('learnPlaceholder')}
          className="flex-1 resize-none text-sm outline-none bg-transparent leading-relaxed"
          style={{ color: colors.textPrimary }}
        />
        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="self-end px-3 py-1.5 rounded-[8px] text-sm font-medium text-white disabled:opacity-40 shrink-0"
          style={{ background: colors.accent }}
        >
          {t('learnAdd')}
        </button>
      </div>

      <div className="mt-2 text-center text-[11px]" style={{ color: colors.textMuted }}>
        {t('learnHint')}
      </div>
    </div>
  )
}
