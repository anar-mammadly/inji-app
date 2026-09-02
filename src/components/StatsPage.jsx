import { useTranslation } from '../i18n/LanguageContext'
import { CATEGORIES, CATEGORY_LABEL_KEYS, categoryStyles } from '../utils/categories'
import { getBoardName } from '../utils/boards'
import { colors } from '../utils/colors'
import ConfirmButton from './ui/ConfirmButton'
import ProgressBar from './ui/ProgressBar'

const BOARD_PROGRESS_COLORS = [colors.accent, colors.blue, colors.purple, colors.orange, colors.coral]

export default function StatsPage({ categoryCounts, completedTasks = [], onResetStats, boards = [], tasks = [] }) {
  const { t } = useTranslation()
  const total = CATEGORIES.reduce((sum, c) => sum + (categoryCounts[c] || 0), 0)
  const boardTotal = tasks.filter((task) => task.col === 'done').length

  return (
    <div className="flex-1 px-6 py-8 max-w-[640px] mx-auto w-full">
      <div className="flex items-start justify-between gap-2 mb-6">
        <h1 className="text-xl font-extrabold text-textPrimary">{t('statsTitle')}</h1>
        <ConfirmButton
          onConfirm={onResetStats}
          triggerLabel={t('resetStats')}
          confirmMessage={t('resetStatsConfirm')}
          disabled={total === 0}
          align="end"
        />
      </div>

      <div className="rounded-3xl border-2 border-border bg-surface p-4 mb-4">
        <div className="text-[11px] uppercase font-extrabold tracking-wide text-textMuted">{t('totalCompleted')}</div>
        <div className="text-[36px] font-extrabold mt-1 leading-none text-accent">{total}</div>
      </div>

      {boards.length > 0 && (
        <div className="rounded-3xl border-2 border-border bg-surface p-4 mb-4">
          <div className="text-[11px] uppercase font-extrabold tracking-wide mb-3 text-textMuted">{t('byBoard')}</div>
          {boardTotal === 0 ? (
            <div className="text-sm font-bold text-textMuted">{t('noCompletedYet')}</div>
          ) : (
            <div className="flex flex-col gap-4">
              {boards.map((board, i) => {
                const count = tasks.filter((task) => task.boardId === board.id && task.col === 'done').length
                return (
                  <div key={board.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-bold text-textPrimary">{getBoardName(board, t)}</span>
                      <span className="text-[12px] font-bold text-textMuted">{count}</span>
                    </div>
                    <ProgressBar
                      value={count}
                      max={Math.max(boardTotal, 1)}
                      color={BOARD_PROGRESS_COLORS[i % BOARD_PROGRESS_COLORS.length]}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border-2 border-border bg-surface p-4">
        <div className="text-[11px] uppercase font-extrabold tracking-wide mb-3 text-textMuted">{t('byCategory')}</div>

        {total === 0 ? (
          <div className="text-sm font-bold text-textMuted">{t('noCompletedYet')}</div>
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
                    <span className="text-[13px] font-bold text-textPrimary">{t(CATEGORY_LABEL_KEYS[cat])}</span>
                    <span className="text-[12px] font-bold text-textMuted">
                      {count} · {pct}%
                    </span>
                  </div>
                  <div className="w-full rounded-full bg-surfaceAlt" style={{ height: 10 }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: cs.text }}
                    />
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {tasksInCat.length === 0 ? (
                      <span className="text-[12px] font-bold text-textMuted">{t('noTasksInCategory')}</span>
                    ) : (
                      tasksInCat.map((task) => (
                        <span
                          key={task.id}
                          className="text-[12px] font-bold px-2.5 py-0.5 rounded-full"
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
