import { useState } from 'react'
import { colors, categoryStyles } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'

const CATEGORIES = ['study', 'work', 'personal']
const LABEL_KEYS = { study: 'categoryStudy', work: 'categoryWork', personal: 'categoryPersonal' }

export default function StatsPage({ categoryCounts, completedTasks = [], onResetStats }) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const total = CATEGORIES.reduce((sum, c) => sum + (categoryCounts[c] || 0), 0)

  function handleReset() {
    onResetStats()
    setConfirming(false)
  }

  return (
    <div className="flex-1 px-6 py-8 max-w-[640px] mx-auto w-full">
      <div className="flex items-start justify-between gap-2 mb-6">
        <h1 className="text-lg font-medium" style={{ color: colors.textPrimary }}>
          {t('statsTitle')}
        </h1>

        {confirming ? (
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-[11px] text-right" style={{ color: colors.textSecondary }}>
              {t('resetStatsConfirm')}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="text-[11px] px-2 py-1 rounded-[8px]"
                style={{ background: colors.coral, color: '#fff' }}
              >
                {t('confirm')}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-[11px] px-2 py-1 rounded-[8px] border"
                style={{ borderColor: colors.border, color: colors.textSecondary }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            disabled={total === 0}
            className="text-[11px] shrink-0 whitespace-nowrap transition-opacity disabled:opacity-40"
            style={{ color: colors.textMuted }}
          >
            {t('resetStats')}
          </button>
        )}
      </div>

      <div
        className="rounded-[10px] border p-4 mb-4"
        style={{ borderColor: colors.border, background: colors.surface }}
      >
        <div className="text-[11px] uppercase font-medium" style={{ color: colors.textMuted }}>
          {t('totalCompleted')}
        </div>
        <div className="text-[32px] font-medium mt-1 leading-none" style={{ color: colors.textPrimary }}>
          {total}
        </div>
      </div>

      <div
        className="rounded-[10px] border p-4"
        style={{ borderColor: colors.border, background: colors.surface }}
      >
        <div className="text-[11px] uppercase font-medium mb-3" style={{ color: colors.textMuted }}>
          {t('byCategory')}
        </div>

        {total === 0 ? (
          <div className="text-sm" style={{ color: colors.textMuted }}>
            {t('noCompletedYet')}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat] || 0
              const pct = Math.round((count / total) * 100)
              const cs = categoryStyles[cat]
              const tasksInCat = completedTasks.filter((task) => task.category === cat)
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px]" style={{ color: colors.textPrimary }}>
                      {t(LABEL_KEYS[cat])}
                    </span>
                    <span className="text-[12px]" style={{ color: colors.textMuted }}>
                      {count} · {pct}%
                    </span>
                  </div>
                  <div className="w-full rounded-full" style={{ height: 8, background: colors.bg }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: cs.text }}
                    />
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {tasksInCat.length === 0 ? (
                      <span className="text-[12px]" style={{ color: colors.textMuted }}>
                        {t('noTasksInCategory')}
                      </span>
                    ) : (
                      tasksInCat.map((task) => (
                        <span
                          key={task.id}
                          className="text-[12px] px-2 py-0.5 rounded-full"
                          style={{ background: cs.bg, color: cs.text }}
                        >
                          {task.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
