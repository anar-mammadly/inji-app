import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colors } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function defaultDueDate() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

function timeLeft(dueDateISO, lang) {
  const diff = new Date(dueDateISO) - Date.now()
  if (diff <= 0) return { label: lang === 'az' ? 'Vaxt keçib' : 'Overdue', color: colors.coral, pct: 0 }
  const h = diff / 3600000
  const d = diff / 86400000
  let label
  if (h < 24)       label = lang === 'az' ? `${Math.ceil(h)} saat`  : `${Math.ceil(h)}h left`
  else if (d < 7)   label = lang === 'az' ? `${Math.ceil(d)} gün`   : `${Math.ceil(d)}d left`
  else if (d < 31)  label = lang === 'az' ? `${Math.ceil(d/7)} həftə` : `${Math.ceil(d/7)}w left`
  else              label = lang === 'az' ? `${Math.ceil(d/30)} ay` : `${Math.ceil(d/30)}mo left`
  const pct = Math.min(100, Math.max(0, (diff / (30 * 86400000)) * 100))
  const col = h < 24 ? colors.coral : h < 72 ? colors.amber : colors.accent
  return { label, color: col, pct }
}

function GoalCard({ goal, onComplete, onUncomplete, onDelete, lang }) {
  const { t } = useTranslation()
  const tl = goal.done ? null : timeLeft(goal.dueDate, lang)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18 }}
      className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0"
      style={{ borderColor: colors.border }}
    >
      {/* checkbox */}
      <button
        onClick={() => goal.done ? onUncomplete(goal.id) : onComplete(goal.id)}
        className="-m-1 p-1 mt-0.5 shrink-0"
        aria-label="Toggle"
      >
        <span
          className="flex items-center justify-center rounded-full border-2 transition-colors"
          style={{
            width: 18, height: 18,
            borderColor: goal.done ? colors.accent : colors.borderStrong,
            background: goal.done ? colors.accent : 'transparent',
          }}
        >
          {goal.done && (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M1 5 L4 8 L9 1.5" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
      </button>

      <div className="flex-1 min-w-0">
        <div
          className="text-sm leading-snug"
          style={{
            color: goal.done ? colors.textMuted : colors.textPrimary,
            textDecoration: goal.done ? 'line-through' : 'none',
          }}
        >
          {goal.text}
        </div>
        {!goal.done && tl && (
          <span className="mt-1 inline-block text-[11px] font-medium" style={{ color: tl.color }}>
            {tl.label}
          </span>
        )}
        {goal.done && goal.completedAt && (
          <span className="mt-1 inline-block text-[11px]" style={{ color: colors.textMuted }}>
            {new Date(goal.completedAt).toLocaleDateString(lang === 'az' ? 'az-AZ' : 'en-US')}
          </span>
        )}
      </div>

      <button
        onClick={() => onDelete(goal.id)}
        className="-m-1.5 p-2.5 shrink-0"
        style={{ color: colors.textMuted }}
        aria-label="Delete"
      >
        <svg width="11" height="11" viewBox="0 0 11 11">
          <path d="M1 1 L10 10 M10 1 L1 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </button>
    </motion.div>
  )
}

function Section({ title, goals, accentColor, onComplete, onUncomplete, onDelete, lang, t }) {
  const todo = goals.filter((g) => !g.done)
  const done = goals.filter((g) => g.done)
  const [showDone, setShowDone] = useState(false)

  return (
    <div className="rounded-[12px] border overflow-hidden mb-4" style={{ borderColor: colors.border }}>
      {/* section header */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block rounded-full"
            style={{ width: 8, height: 8, background: accentColor }}
          />
          <span className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textMuted }}>
            {title}
          </span>
        </div>
        <span
          className="text-[11px] px-2 py-0.5 rounded-[6px]"
          style={{ background: colors.surface, color: colors.textSecondary }}
        >
          {todo.length} {t('goalsTodo')} · {done.length} {t('goalsDone')}
        </span>
      </div>

      {/* todo goals */}
      <div style={{ background: colors.surface }}>
        {todo.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm" style={{ color: colors.textMuted }}>
            {t('goalsEmpty')}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {todo.map((g) => (
              <GoalCard key={g.id} goal={g} onComplete={onComplete} onUncomplete={onUncomplete} onDelete={onDelete} lang={lang} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* done toggle */}
      {done.length > 0 && (
        <div style={{ borderTop: `1px solid ${colors.border}`, background: colors.surface }}>
          <button
            onClick={() => setShowDone((v) => !v)}
            className="w-full px-4 py-2.5 text-left text-[12px] flex items-center gap-2"
            style={{ color: colors.textSecondary }}
          >
            <span style={{ color: colors.accent }}>✓</span>
            {t('goalsDone')} ({done.length})
            <span className="ml-auto" style={{ fontSize: 10 }}>{showDone ? '▲' : '▼'}</span>
          </button>
          <AnimatePresence>
            {showDone && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ overflow: 'hidden' }}
              >
                {done.map((g) => (
                  <GoalCard key={g.id} goal={g} onComplete={onComplete} onUncomplete={onUncomplete} onDelete={onDelete} lang={lang} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default function GoalsPage({ goals = [], onAdd, onComplete, onUncomplete, onDelete }) {
  const { lang, t } = useTranslation()
  const [text, setText] = useState('')
  const [type, setType] = useState('short')
  const [dueDate, setDueDate] = useState(defaultDueDate)
  const [adding, setAdding] = useState(false)

  function handleAdd() {
    const trimmed = text.trim()
    if (!trimmed || !dueDate) return
    onAdd(trimmed, type, new Date(dueDate).toISOString())
    setText('')
    setDueDate(defaultDueDate())
    setAdding(false)
  }

  const shortGoals = goals.filter((g) => g.type === 'short')
  const longGoals  = goals.filter((g) => g.type === 'long')

  return (
    <div className="flex-1 px-4 sm:px-6 py-6 max-w-[640px] mx-auto w-full">

      {/* ── Add button / form ── */}
      <div className="mb-5">
        {!adding ? (
          <button
            onClick={() => setAdding(true)}
            className="w-full py-2.5 rounded-[10px] border border-dashed text-sm"
            style={{ borderColor: colors.borderStrong, color: colors.textSecondary }}
          >
            + {t('goalsAdd')}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[12px] border p-4 flex flex-col gap-3"
            style={{ borderColor: colors.accent, background: colors.surface }}
          >
            <textarea
              autoFocus
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
              placeholder={t('goalsPlaceholder')}
              className="w-full resize-none text-sm outline-none bg-transparent leading-relaxed"
              style={{ color: colors.textPrimary }}
            />

            {/* type */}
            <div className="flex gap-2">
              {[
                { v: 'short', labelAz: 'Qısa müddətli', labelEn: 'Short-term' },
                { v: 'long',  labelAz: 'Uzun müddətli', labelEn: 'Long-term' },
              ].map(({ v, labelAz, labelEn }) => (
                <button
                  key={v}
                  onClick={() => setType(v)}
                  className="flex-1 py-1.5 rounded-[8px] border text-[12px] font-medium transition-colors"
                  style={{
                    background: type === v ? colors.accent : 'transparent',
                    color: type === v ? '#fff' : colors.textSecondary,
                    borderColor: type === v ? colors.accent : colors.border,
                  }}
                >
                  {lang === 'az' ? labelAz : labelEn}
                </button>
              ))}
            </div>

            {/* deadline date picker */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase font-medium" style={{ color: colors.textMuted }}>
                {t('goalsDeadline')}
              </label>
              <input
                type="date"
                value={dueDate}
                min={todayISO()}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-[8px] border text-sm outline-none"
                style={{
                  borderColor: colors.purple,
                  color: colors.textPrimary,
                  colorScheme: 'light',
                }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!text.trim()}
                className="flex-1 py-2 rounded-[8px] text-sm font-medium text-white disabled:opacity-40"
                style={{ background: colors.accent }}
              >
                {t('learnAdd')}
              </button>
              <button
                onClick={() => { setAdding(false); setText('') }}
                className="flex-1 py-2 rounded-[8px] border text-sm"
                style={{ borderColor: colors.border, color: colors.textSecondary }}
              >
                {t('cancel')}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Short-term ── */}
      <Section
        title={t('goalsShort')}
        goals={shortGoals}
        accentColor={colors.accent}
        onComplete={onComplete}
        onUncomplete={onUncomplete}
        onDelete={onDelete}
        lang={lang}
        t={t}
      />

      {/* ── Long-term ── */}
      <Section
        title={t('goalsLong')}
        goals={longGoals}
        accentColor={colors.purple}
        onComplete={onComplete}
        onUncomplete={onUncomplete}
        onDelete={onDelete}
        lang={lang}
        t={t}
      />
    </div>
  )
}
