import { BookOpen, Briefcase, Heart, Layers, Tags, Trophy } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import { CATEGORIES, CATEGORY_LABEL_KEYS, categoryStyles } from '../utils/categories'
import { getBoardName } from '../utils/boards'
import { colors } from '../utils/colors'
import ConfirmButton from './ui/ConfirmButton'
import ProgressBar from './ui/ProgressBar'
import Card from './ui/Card'
import Page from './ui/Page'
import PageHeader from './ui/PageHeader'
import { chipClass } from './ui/styles'

const BOARD_PROGRESS_COLORS = [colors.accent, colors.blue, colors.purple, colors.orange, colors.coral]
const CATEGORY_ICONS = { study: BookOpen, work: Briefcase, personal: Heart }

function SectionTitle({ icon: Icon, color, bg, children }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: bg }}>
        <Icon size={18} strokeWidth={2.6} style={{ color }} />
      </span>
      <h2 className="text-[18px] font-extrabold text-textPrimary">{children}</h2>
    </div>
  )
}

function EmptyLine({ children }) {
  return <p className="py-4 text-center text-[14px] font-bold text-textMuted">{children}</p>
}

export default function StatsPage({ categoryCounts, completedTasks = [], onResetStats, boards = [], tasks = [] }) {
  const { t } = useTranslation()
  const total = CATEGORIES.reduce((sum, c) => sum + (categoryCounts[c] || 0), 0)
  const boardTotal = tasks.filter((task) => task.col === 'done').length

  return (
    <Page width="normal">
      <PageHeader
        title={t('statsTitle')}
        subtitle={t('statsSubtitle')}
        actions={
          <ConfirmButton
            onConfirm={onResetStats}
            triggerLabel={t('resetStats')}
            confirmMessage={t('resetStatsConfirm')}
            disabled={total === 0}
            align="end"
          />
        }
      />

      {/* headline numbers */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-5">
        <div className="col-span-3 sm:col-span-1 flex items-center gap-3 rounded-3xl bg-accent p-4 sm:p-5 text-white shadow-[0_4px_0_#46A302]">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/25">
            <Trophy size={24} strokeWidth={2.6} />
          </span>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-white/90 truncate">{t('totalCompleted')}</div>
            <div className="text-[32px] font-extrabold leading-none tabular-nums mt-0.5">{total}</div>
          </div>
        </div>
        {CATEGORIES.map((cat) => {
          const cs = categoryStyles[cat]
          const Icon = CATEGORY_ICONS[cat] ?? Tags
          return (
            <Card key={cat} padded={false} className="min-w-0 p-3 sm:p-5 flex flex-col gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: cs.bg }}>
                <Icon size={18} strokeWidth={2.6} style={{ color: cs.text }} />
              </span>
              <div className="min-w-0">
                <div className="text-[24px] sm:text-[28px] font-extrabold leading-none tabular-nums" style={{ color: cs.text }}>
                  {categoryCounts[cat] || 0}
                </div>
                <div className="mt-1 text-[12px] sm:text-[13px] font-bold text-textSecondary truncate">{t(CATEGORY_LABEL_KEYS[cat])}</div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
        <Card className="min-w-0">
          <SectionTitle icon={Tags} color={colors.purpleDark} bg="#F3E4FF">
            {t('byCategory')}
          </SectionTitle>

          {total === 0 ? (
            <EmptyLine>{t('noCompletedYet')}</EmptyLine>
          ) : (
            <div className="flex flex-col gap-3">
              {CATEGORIES.map((cat) => {
                const count = categoryCounts[cat] || 0
                const pct = Math.round((count / total) * 100)
                const cs = categoryStyles[cat]
                const tasksInCat = completedTasks.filter((task) => task.category === cat)
                return (
                  <div key={cat} className="rounded-2xl border-2 border-border bg-white p-3 shadow-[0_2px_0_#E5E7EB]">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="flex items-center gap-2 min-w-0 text-[14px] font-bold text-textPrimary">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: cs.dot }} />
                        <span className="truncate">{t(CATEGORY_LABEL_KEYS[cat])}</span>
                      </span>
                      <span className="shrink-0 text-[13px] font-bold tabular-nums text-textSecondary">
                        {count} <span className="text-textMuted">· {pct}%</span>
                      </span>
                    </div>
                    <ProgressBar value={count} max={total} color={cs.dot} height={12} />

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tasksInCat.length === 0 ? (
                        <span className="text-[13px] font-medium text-textMuted">{t('noTasksInCategory')}</span>
                      ) : (
                        tasksInCat.map((task) => (
                          <span
                            key={task.id}
                            className={`${chipClass} max-w-full`}
                            style={{ background: cs.bg, color: cs.text }}
                            title={task.name}
                          >
                            <span className="truncate">{task.name}</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {boards.length > 0 && (
          <Card className="min-w-0">
            <SectionTitle icon={Layers} color={colors.blueDark} bg="#DDF4FF">
              {t('byBoard')}
            </SectionTitle>
            {boardTotal === 0 ? (
              <EmptyLine>{t('noCompletedYet')}</EmptyLine>
            ) : (
              <div className="flex flex-col gap-4">
                {boards.map((board, i) => {
                  const count = tasks.filter((task) => task.boardId === board.id && task.col === 'done').length
                  return (
                    <div key={board.id}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="min-w-0 truncate text-[14px] font-bold text-textPrimary">{getBoardName(board, t)}</span>
                        <span className="shrink-0 text-[13px] font-bold tabular-nums text-textSecondary">{count}</span>
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
          </Card>
        )}
      </div>
    </Page>
  )
}
