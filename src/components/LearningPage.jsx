import { useState } from 'react'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslation } from '../i18n/LanguageContext'
import LearningGoalCard, { SUB_CATEGORY_STYLES } from './LearningGoalCard'
import JournalEntry from './JournalEntry'
import JournalArchive from './JournalArchive'
import Button from './ui/Button'
import Card from './ui/Card'
import Page from './ui/Page'
import PageHeader from './ui/PageHeader'
import Segmented from './ui/Segmented'
import { inputClass, labelClass } from './ui/styles'

const SUB_CATEGORIES = ['books', 'courses', 'skills']
const SUB_CATEGORY_LABEL_KEYS = { books: 'subCategoryBooks', courses: 'subCategoryCourses', skills: 'subCategorySkills' }

function AddGoalForm({ onAdd, onCancel, initialSubCategory = 'books' }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [subCategory, setSubCategory] = useState(initialSubCategory)
  const [targetProgress, setTargetProgress] = useState(10)
  const [unit, setUnit] = useState('pages')
  const [targetDate, setTargetDate] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title, subCategory, targetProgress, unit, targetDate: targetDate || null })
  }

  return (
    <Card as="form" onSubmit={handleSubmit} className="mb-4 flex flex-col gap-4">
      <input
        autoFocus
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('goalTitlePlaceholder')}
        className={inputClass}
      />

      <div className="grid grid-cols-3 gap-2">
        {SUB_CATEGORIES.map((sc) => {
          const s = SUB_CATEGORY_STYLES[sc]
          const Icon = s.icon
          const active = subCategory === sc
          return (
            <button
              key={sc}
              type="button"
              onClick={() => setSubCategory(sc)}
              aria-pressed={active}
              className={`min-w-0 h-10 px-2 inline-flex items-center justify-center gap-1.5 rounded-xl border-2 text-[13px] font-bold transition-colors ${
                active ? '' : 'border-border bg-white text-textMuted hover:text-textSecondary'
              }`}
              style={active ? { background: s.soft, borderColor: s.color, color: s.dark } : undefined}
            >
              <Icon size={15} strokeWidth={2.5} className="shrink-0" />
              <span className="truncate">{t(SUB_CATEGORY_LABEL_KEYS[sc])}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-[96px_1fr] sm:grid-cols-[96px_1fr_180px] gap-3">
        <div>
          <label className={labelClass}>{t('goalTarget')}</label>
          <input
            type="number"
            min="1"
            value={targetProgress}
            onChange={(e) => setTargetProgress(e.target.value)}
            className={`${inputClass} tabular-nums`}
          />
        </div>
        <div className="min-w-0">
          <label className={labelClass}>{t('goalUnit')}</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder={t('unitPlaceholder')}
            className={inputClass}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass}>{t('goalsDeadline')}</label>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" className="flex-1">
          {t('add')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          {t('cancel')}
        </Button>
      </div>
    </Card>
  )
}

export default function LearningPage({
  learningGoals,
  journalEntries,
  onAddGoal,
  onUpdateProgress,
  onSetReminder,
  onDeleteGoal,
  onAddJournalEntry,
  onEditJournalEntry,
  onDeleteJournalEntry,
}) {
  const { t } = useTranslation()
  const [isJournal, setIsJournal] = useState(false)
  const [activeSub, setActiveSub] = useState('books')
  const [adding, setAdding] = useState(false)

  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const todayEntries = journalEntries.filter((e) => e.date === todayKey)
  const visibleGoals = learningGoals.filter((g) => g.subCategory === activeSub)
  const activeStyle = SUB_CATEGORY_STYLES[activeSub]
  const EmptyIcon = activeStyle.icon

  return (
    <Page width="normal">
      <PageHeader
        title={t('learningTitle')}
        subtitle={t('learningSubtitle')}
        actions={
          <Segmented
            value={isJournal ? 'journal' : 'goals'}
            onChange={(v) => setIsJournal(v === 'journal')}
            options={[
              { value: 'goals', label: t('learningGoalsTab') },
              { value: 'journal', label: t('learningJournalTab') },
            ]}
          />
        }
      />

      {isJournal ? (
        <div className="max-w-[760px] flex flex-col gap-4">
          <JournalEntry
            entries={todayEntries}
            onAdd={(text) => onAddJournalEntry(todayKey, text)}
            onEdit={onEditJournalEntry}
            onDelete={onDeleteJournalEntry}
          />
          <JournalArchive
            entries={journalEntries.filter((e) => e.date !== todayKey)}
            onEdit={onEditJournalEntry}
            onDelete={onDeleteJournalEntry}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <Segmented
              className="w-full sm:w-auto"
              value={activeSub}
              onChange={setActiveSub}
              options={SUB_CATEGORIES.map((sc) => ({
                value: sc,
                label: t(SUB_CATEGORY_LABEL_KEYS[sc]),
                count: learningGoals.filter((g) => g.subCategory === sc).length,
              }))}
            />
            {!adding && (
              <Button size="sm" onClick={() => setAdding(true)} className="w-full sm:w-auto">
                <Plus size={16} strokeWidth={3} />
                {t('addGoal')}
              </Button>
            )}
          </div>

          {adding && (
            <div className="max-w-[640px]">
              <AddGoalForm
                initialSubCategory={activeSub}
                onAdd={(data) => {
                  onAddGoal(data)
                  setActiveSub(data.subCategory) // show the tab the new goal landed in
                  setAdding(false)
                }}
                onCancel={() => setAdding(false)}
              />
            </div>
          )}

          {visibleGoals.length === 0 ? (
            <Card className="flex flex-col items-center text-center gap-3 py-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: activeStyle.soft }}>
                <EmptyIcon size={28} strokeWidth={2.5} style={{ color: activeStyle.color }} />
              </div>
              <p className="text-[15px] font-bold text-textSecondary">{t('noLearningGoals')}</p>
              {!adding && (
                <Button size="sm" onClick={() => setAdding(true)}>
                  <Plus size={16} strokeWidth={3} />
                  {t('addGoal')}
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleGoals.map((goal) => (
                <LearningGoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdateProgress={(v) => onUpdateProgress(goal.id, v)}
                  onSetReminder={(minutes) => onSetReminder(goal.id, minutes)}
                  onDelete={() => onDeleteGoal(goal.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </Page>
  )
}
