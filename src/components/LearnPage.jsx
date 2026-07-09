import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colors } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'

// ── Date helpers ─────────────────────────────────────────────────────────────

const MONTHS_AZ = ['Yanvar','Fevral','Mart','Aprel','May','İyun','İyul','Avqust','Sentyabr','Oktyabr','Noyabr','Dekabr']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_AZ   = ['B','BE','ÇA','Ç','CA','C','Ş']
const DAYS_EN   = ['Su','Mo','Tu','We','Th','Fr','Sa']

function toISO(d) { return d.toISOString().slice(0, 10) }
function todayDate() { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Baku' })) }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }

function formatDateLabel(dateObj, lang) {
  const today = toISO(todayDate())
  const iso   = toISO(dateObj)
  const months = lang === 'az' ? MONTHS_AZ : MONTHS_EN
  const label  = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`
  if (iso === today) return lang === 'az' ? `Bu gün · ${label}` : `Today · ${label}`
  const yest = new Date(todayDate()); yest.setDate(yest.getDate() - 1)
  if (iso === toISO(yest)) return lang === 'az' ? `Dünən · ${label}` : `Yesterday · ${label}`
  return label
}

function formatShortDate(iso, lang) {
  const d = new Date(iso)
  const months = lang === 'az' ? MONTHS_AZ : MONTHS_EN
  const today = toISO(todayDate())
  const yest  = toISO(addDays(todayDate(), -1))
  if (iso === today) return lang === 'az' ? 'Bu gün' : 'Today'
  if (iso === yest)  return lang === 'az' ? 'Dünən'  : 'Yesterday'
  return `${d.getDate()} ${months[d.getMonth()]}`
}

function buildCalendarDays(year, month) {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const pad   = first.getDay()
  const days  = []
  for (let i = 0; i < pad; i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

// ── Category colours ──────────────────────────────────────────────────────────

const CAT_COLORS = ['#1D9E75','#7F77DD','#D85A30','#EF9F27','#D4537E','#4DA6CC','#E84393','#20B2AA']

// ── Shared UI ────────────────────────────────────────────────────────────────

function DeleteBtn({ onClick }) {
  return (
    <button onClick={onClick} className="-m-1 p-2 shrink-0" style={{ color: colors.textMuted }} aria-label="Delete">
      <svg width="11" height="11" viewBox="0 0 11 11">
        <path d="M1 1 L10 10 M10 1 L1 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    </button>
  )
}

function BackBtn({ onClick, label }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: colors.accent }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 4 L6 8 L10 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {label}
    </button>
  )
}

function AddItemInput({ onAdd, placeholder, hint }) {
  const [text, setText] = useState('')
  const ref = useRef(null)
  function submit() {
    const t = text.trim(); if (!t) return
    onAdd(t); setText(''); ref.current?.focus()
  }
  return (
    <div>
      <div className="rounded-[12px] border p-3 flex gap-2" style={{ borderColor: colors.border, background: colors.surface }}>
        <textarea
          ref={ref}
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
          placeholder={placeholder}
          className="flex-1 resize-none outline-none bg-transparent leading-relaxed"
          style={{ color: colors.textPrimary }}
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="self-end px-3 py-1.5 rounded-[8px] text-sm font-medium text-white disabled:opacity-40 shrink-0"
          style={{ background: colors.accent }}
        >
          +
        </button>
      </div>
      {hint && <p className="mt-1.5 text-center text-[11px]" style={{ color: colors.textMuted }}>{hint}</p>}
    </div>
  )
}

// ── Date-based view (Hamısı) ──────────────────────────────────────────────────

function DateView({ learnings, learningCategories, onAdd, onDelete, onBack, lang, t }) {
  const [selectedDate, setSelectedDate] = useState(todayDate())
  const [showCal, setShowCal]  = useState(false)
  const [calMonth, setCalMonth] = useState(() => { const d = todayDate(); return { year: d.getFullYear(), month: d.getMonth() } })

  const iso      = toISO(selectedDate)
  const today    = todayDate()
  const isToday  = iso === toISO(today)
  const dayItems = learnings[iso] || []
  const activeDates = new Set(Object.keys(learnings).filter((k) => learnings[k]?.length > 0))
  const months   = lang === 'az' ? MONTHS_AZ : MONTHS_EN
  const dayLbls  = lang === 'az' ? DAYS_AZ : DAYS_EN
  const calDays  = buildCalendarDays(calMonth.year, calMonth.month)

  return (
    <div className="flex flex-col gap-4">
      <BackBtn onClick={onBack} label={lang === 'az' ? 'Kateqoriyalar' : 'Categories'} />

      {/* Date navigation */}
      <div className="flex items-center gap-2">
        <button onClick={() => setSelectedDate((d) => addDays(d, -1))}
          className="flex items-center justify-center rounded-[8px] border"
          style={{ width: 36, height: 36, borderColor: colors.border, color: colors.textSecondary }}>‹</button>
        <button onClick={() => setShowCal((v) => !v)}
          className="flex-1 text-center text-sm font-medium py-1.5 rounded-[8px] border"
          style={{ borderColor: showCal ? colors.accent : colors.border, color: colors.textPrimary }}>
          {formatDateLabel(selectedDate, lang)}
        </button>
        <button onClick={() => setSelectedDate((d) => addDays(d, 1))} disabled={isToday}
          className="flex items-center justify-center rounded-[8px] border disabled:opacity-30"
          style={{ width: 36, height: 36, borderColor: colors.border, color: colors.textSecondary }}>›</button>
        {!isToday && (
          <button onClick={() => { setSelectedDate(todayDate()); setShowCal(false) }}
            className="text-[12px] px-2.5 py-1.5 rounded-[8px] border"
            style={{ borderColor: colors.border, color: colors.accent }}>
            {t('learnToday')}
          </button>
        )}
      </div>

      {/* Calendar */}
      <AnimatePresence>
        {showCal && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
            className="rounded-[12px] border p-4" style={{ borderColor: colors.border, background: colors.surface }}>
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setCalMonth(({ year, month }) => month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 })}
                className="px-2 py-1 rounded-[6px] text-sm" style={{ color: colors.textSecondary }}>‹</button>
              <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{months[calMonth.month]} {calMonth.year}</span>
              <button onClick={() => setCalMonth(({ year, month }) => month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 })}
                className="px-2 py-1 rounded-[6px] text-sm" style={{ color: colors.textSecondary }}>›</button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {dayLbls.map((d) => <div key={d} className="text-center text-[11px] font-medium py-1" style={{ color: colors.textMuted }}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {calDays.map((d, i) => {
                if (!d) return <div key={`p${i}`} />
                const dISO = toISO(d); const isS = dISO === iso; const isT = dISO === toISO(today)
                return (
                  <button key={dISO} disabled={d > today} onClick={() => { setSelectedDate(d); setShowCal(false) }}
                    className="relative flex flex-col items-center py-1 rounded-[6px] disabled:opacity-25"
                    style={{ background: isS ? colors.accent : isT ? colors.bg : 'transparent', color: isS ? '#fff' : isT ? colors.accent : colors.textPrimary, fontWeight: isT ? '600' : '400' }}>
                    <span className="text-[13px] leading-none">{d.getDate()}</span>
                    {activeDates.has(dISO) && <span className="mt-0.5 rounded-full" style={{ width: 4, height: 4, background: isS ? 'rgba(255,255,255,0.8)' : colors.accent }} />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items */}
      <div className="rounded-[12px] border" style={{ borderColor: colors.border, background: colors.surface }}>
        {dayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <span className="text-2xl">📖</span>
            <span className="text-sm text-center px-4" style={{ color: colors.textMuted }}>{t('learnEmpty')}</span>
          </div>
        ) : (
          <ul>
            {dayItems.map((item, idx) => {
              const cat = learningCategories?.find((c) => c.id === item.categoryId)
              return (
                <motion.li key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.12, delay: idx * 0.03 }}
                  className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0" style={{ borderColor: colors.border }}>
                  <span className="shrink-0 rounded-full mt-[7px]" style={{ width: 7, height: 7, background: cat?.color ?? colors.accent }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm leading-relaxed" style={{ color: colors.textPrimary }}>{item.text}</span>
                    {cat && <div className="text-[11px] mt-0.5" style={{ color: cat.color }}>{cat.name}</div>}
                  </div>
                  <DeleteBtn onClick={() => onDelete(iso, item.id)} />
                </motion.li>
              )
            })}
          </ul>
        )}
      </div>

      <AddItemInput
        onAdd={(text) => onAdd(iso, text, null)}
        placeholder={t('learnPlaceholder')}
        hint={t('learnHint')}
      />
    </div>
  )
}

// ── Category detail view ──────────────────────────────────────────────────────

function CategoryView({ category, learnings, onAdd, onDelete, onBack, lang }) {
  const today = toISO(todayDate())

  // Gather all items for this category, grouped by date, sorted newest first
  const groups = Object.entries(learnings)
    .map(([date, items]) => ({ date, items: items.filter((i) => i.categoryId === category.id) }))
    .filter((g) => g.items.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))

  const totalCount = groups.reduce((s, g) => s + g.items.length, 0)

  return (
    <div className="flex flex-col gap-4">
      <BackBtn onClick={onBack} label={lang === 'az' ? 'Kateqoriyalar' : 'Categories'} />

      {/* Category header */}
      <div className="flex items-center gap-3">
        <span className="rounded-full shrink-0" style={{ width: 12, height: 12, background: category.color }} />
        <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>{category.name}</h2>
        <span className="text-[12px] px-2 py-0.5 rounded-[6px]" style={{ background: colors.bg, color: colors.textMuted }}>
          {totalCount}
        </span>
      </div>

      {/* Items grouped by date */}
      {groups.length === 0 ? (
        <div className="rounded-[12px] border py-12 flex flex-col items-center gap-2" style={{ borderColor: colors.border, background: colors.surface }}>
          <span className="text-2xl">📖</span>
          <span className="text-sm" style={{ color: colors.textMuted }}>
            {lang === 'az' ? 'Hələ heç nə yoxdur' : 'Nothing yet'}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map(({ date, items }) => (
            <div key={date} className="rounded-[12px] border overflow-hidden" style={{ borderColor: colors.border }}>
              <div className="px-4 py-2 text-[11px] font-medium uppercase tracking-wide" style={{ background: colors.bg, color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>
                {formatShortDate(date, lang)}
              </div>
              <div style={{ background: colors.surface }}>
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0" style={{ borderColor: colors.border }}>
                    <span className="shrink-0 rounded-full mt-[7px]" style={{ width: 7, height: 7, background: category.color }} />
                    <span className="flex-1 text-sm leading-relaxed" style={{ color: colors.textPrimary }}>{item.text}</span>
                    <DeleteBtn onClick={() => onDelete(date, item.id)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add to today */}
      <AddItemInput
        onAdd={(text) => onAdd(today, text, category.id)}
        placeholder={lang === 'az' ? `${category.name} haqqında nə öyrəndin?` : `What did you learn about ${category.name}?`}
      />
    </div>
  )
}

// ── Category list view (default) ──────────────────────────────────────────────

function CategoryList({ learnings, learningCategories, onAdd, onDelete, onSelectCategory, onSelectAll, onAddCategory, onDeleteCategory, lang, t }) {
  const [addingCat, setAddingCat] = useState(false)
  const [catName, setCatName]     = useState('')
  const catInputRef = useRef(null)

  function submitCategory() {
    const name = catName.trim()
    if (!name) return
    const color = CAT_COLORS[learningCategories.length % CAT_COLORS.length]
    onAddCategory(name, color)
    setCatName('')
    setAddingCat(false)
  }

  // Total items per category
  const allItems = Object.values(learnings).flat()
  const countFor = (id) => allItems.filter((i) => i.categoryId === id).length
  const totalAll = allItems.length

  return (
    <div className="flex flex-col gap-3">
      {/* "Hamısı" card */}
      <button
        onClick={onSelectAll}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] border text-left"
        style={{ borderColor: colors.border, background: colors.surface }}
      >
        <span className="rounded-full shrink-0" style={{ width: 10, height: 10, background: colors.textMuted }} />
        <span className="flex-1 text-sm font-medium" style={{ color: colors.textPrimary }}>
          {lang === 'az' ? 'Tarixə görə' : 'By date'}
        </span>
        <span className="text-[12px] px-2 py-0.5 rounded-[6px]" style={{ background: colors.bg, color: colors.textMuted }}>{totalAll}</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: colors.textMuted }}>
          <path d="M5 3 L9 7 L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Category cards */}
      <AnimatePresence initial={false}>
        {learningCategories.map((cat) => (
          <motion.div key={cat.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-[12px] border"
            style={{ borderColor: colors.border, background: colors.surface, borderLeft: `3px solid ${cat.color}` }}>
            <button className="flex-1 flex items-center gap-3 text-left" onClick={() => onSelectCategory(cat)}>
              <span className="flex-1 text-sm font-medium" style={{ color: colors.textPrimary }}>{cat.name}</span>
              <span className="text-[12px] px-2 py-0.5 rounded-[6px]" style={{ background: colors.bg, color: colors.textMuted }}>{countFor(cat.id)}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: colors.textMuted }}>
                <path d="M5 3 L9 7 L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <DeleteBtn onClick={() => onDeleteCategory(cat.id)} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add category */}
      {addingCat ? (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[12px] border p-3 flex gap-2 items-center"
          style={{ borderColor: colors.accent, background: colors.surface }}>
          <input
            ref={catInputRef}
            autoFocus
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitCategory()
              if (e.key === 'Escape') { setAddingCat(false); setCatName('') }
            }}
            placeholder={lang === 'az' ? 'Kateqoriya adı...' : 'Category name...'}
            className="flex-1 outline-none bg-transparent text-sm"
            style={{ color: colors.textPrimary }}
          />
          <button onClick={submitCategory} disabled={!catName.trim()}
            className="px-3 py-1.5 rounded-[8px] text-sm font-medium text-white disabled:opacity-40 shrink-0"
            style={{ background: colors.accent }}>
            {lang === 'az' ? 'Əlavə et' : 'Add'}
          </button>
          <button onClick={() => { setAddingCat(false); setCatName('') }}
            className="px-2 py-1.5 rounded-[8px] text-sm shrink-0"
            style={{ color: colors.textSecondary }}>
            ✕
          </button>
        </motion.div>
      ) : (
        <button
          onClick={() => setAddingCat(true)}
          className="w-full py-3 rounded-[12px] border border-dashed text-sm"
          style={{ borderColor: colors.borderStrong, color: colors.textSecondary }}>
          + {lang === 'az' ? 'Kateqoriya əlavə et' : 'Add category'}
        </button>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function LearnPage({ learnings = {}, learningCategories = [], onAdd, onDelete, onAddCategory, onDeleteCategory }) {
  const { lang, t } = useTranslation()
  // view: 'list' | 'all' | { type: 'cat', cat }
  const [view, setView] = useState('list')

  if (view === 'all') {
    return (
      <div className="flex-1 px-4 sm:px-6 py-6 max-w-[640px] mx-auto w-full">
        <DateView
          learnings={learnings}
          learningCategories={learningCategories}
          onAdd={onAdd}
          onDelete={onDelete}
          onBack={() => setView('list')}
          lang={lang}
          t={t}
        />
      </div>
    )
  }

  if (view?.type === 'cat') {
    return (
      <div className="flex-1 px-4 sm:px-6 py-6 max-w-[640px] mx-auto w-full">
        <CategoryView
          category={view.cat}
          learnings={learnings}
          onAdd={onAdd}
          onDelete={onDelete}
          onBack={() => setView('list')}
          lang={lang}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 px-4 sm:px-6 py-6 max-w-[640px] mx-auto w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>
          {t('navLearn')}
        </h2>
      </div>
      <CategoryList
        learnings={learnings}
        learningCategories={learningCategories}
        onAdd={onAdd}
        onDelete={onDelete}
        onSelectCategory={(cat) => setView({ type: 'cat', cat })}
        onSelectAll={() => setView('all')}
        onAddCategory={onAddCategory}
        onDeleteCategory={onDeleteCategory}
        lang={lang}
        t={t}
      />
    </div>
  )
}
