import { useState } from 'react'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslation } from '../i18n/LanguageContext'
import LearningGoalCard from './LearningGoalCard'
import JournalEntry from './JournalEntry'
import JournalArchive from './JournalArchive'
import Button from './ui/Button'

const SUB_CATEGORIES = ['books', 'courses', 'skills']
const SUB_CATEGORY_LABEL_KEYS = { books: 'subCategoryBooks', courses: 'subCategoryCourses', skills: 'subCategorySkills' }

function AddGoalForm({ onAdd, onCancel }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [subCategory, setSubCategory] = useState('books')
  const [targetProgress, setTargetProgress] = useState(10)
  const [unit, setUnit] = useState('pages')
  const [targetDate, setTargetDate] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title, subCategory, targetProgress, unit, targetDate: targetDate || null })
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 rounded-2xl border-2 border-border bg-surface flex flex-col gap-2 mb-4">
      <input
        autoFocus
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('goalTitlePlaceholder')}
        className="px-3 py-1.5 text-[13px] font-semibold rounded-xl border-2 border-border outline-none focus:border-accent"
      />
      <div className="flex gap-1.5">
        {SUB_CATEGORIES.map((sc) => (
          <button
            key={sc}
            type="button"
            onClick={() => setSubCategory(sc)}
            className={`flex-1 px-2 py-1.5 rounded-xl text-[12px] font-bold border-2 ${
              subCategory === sc ? 'bg-accentSoft text-accentDark border-accentSoft' : 'border-border text-textMuted'
            }`}
          >
            {t(SUB_CATEGORY_LABEL_KEYS[sc])}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          value={targetProgress}
          onChange={(e) => setTargetProgress(e.target.value)}
          className="w-20 px-2 py-1.5 text-[12px] font-bold rounded-xl border-2 border-border outline-none"
        />
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder={t('unitPlaceholder')}
          className="flex-1 px-2 py-1.5 text-[12px] font-bold rounded-xl border-2 border-border outline-none"
        />
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="px-2 py-1.5 text-[12px] font-bold rounded-xl border-2 border-border outline-none"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1">
          {t('add')}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel} className="flex-1">
          {t('cancel')}
        </Button>
      </div>
    </form>
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

  return (
    <div className="flex-1 px-6 py-8 max-w-[640px] mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-extrabold text-textPrimary">{t('learningTitle')}</h1>
        <div className="flex items-center rounded-xl border-2 border-border overflow-hidden text-[12px] font-extrabold">
          <button onClick={() => setIsJournal(false)} className={`px-3 py-1.5 ${!isJournal ? 'bg-accent text-white' : 'text-textSecondary'}`}>
            {t('learningGoalsTab')}
          </button>
          <button onClick={() => setIsJournal(true)} className={`px-3 py-1.5 ${isJournal ? 'bg-accent text-white' : 'text-textSecondary'}`}>
            {t('learningJournalTab')}
          </button>
        </div>
      </div>

      {isJournal ? (
        <div className="flex flex-col gap-4">
          <JournalEntry
            entries={todayEntries}
            onAdd={(text) => onAddJournalEntry(todayKey, text)}
            onEdit={onEditJournalEntry}
            onDelete={onDeleteJournalEntry}
          />
          <JournalArchive entries={journalEntries.filter((e) => e.date !== todayKey)} />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1.5">
              {SUB_CATEGORIES.map((sc) => (
                <button
                  key={sc}
                  onClick={() => setActiveSub(sc)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-extrabold border-2 ${
                    activeSub === sc ? 'bg-accent text-white border-accent' : 'border-border text-textSecondary'
                  }`}
                >
                  {t(SUB_CATEGORY_LABEL_KEYS[sc])}
                </button>
              ))}
            </div>
            <button
              onClick={() => setAdding((a) => !a)}
              className="flex items-center gap-1 text-[12px] font-extrabold text-accent"
            >
              <Plus size={16} strokeWidth={3} />
              {t('addGoal')}
            </button>
          </div>

          {adding && (
            <AddGoalForm
              onAdd={(data) => {
                onAddGoal({ ...data, subCategory: activeSub })
                setAdding(false)
              }}
              onCancel={() => setAdding(false)}
            />
          )}

          <div className="flex flex-col gap-3">
            {learningGoals
              .filter((g) => g.subCategory === activeSub)
              .map((goal) => (
                <LearningGoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdateProgress={(v) => onUpdateProgress(goal.id, v)}
                  onSetReminder={(minutes) => onSetReminder(goal.id, minutes)}
                  onDelete={() => onDeleteGoal(goal.id)}
                />
              ))}
            {learningGoals.filter((g) => g.subCategory === activeSub).length === 0 && (
              <div className="text-sm font-bold text-textMuted">{t('noLearningGoals')}</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
