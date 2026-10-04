import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import PlanDayCard from './PlanDayCard'
import PlanGoalCard from './PlanGoalCard'
import Button from './ui/Button'

function AddGoalForm({ onAdd, onCancel }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [targetProgress, setTargetProgress] = useState(100)
  const [unit, setUnit] = useState('%')
  const [targetDate, setTargetDate] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title, targetProgress, unit, targetDate: targetDate || null })
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

export default function PlanPage({
  planDays,
  planGoals,
  onSetDayTitle,
  onAddTodo,
  onToggleTodo,
  onEditTodo,
  onSetTodoTime,
  onDeleteTodo,
  onAddGoal,
  onUpdateGoalProgress,
  onDeleteGoal,
}) {
  const { t } = useTranslation()
  const [addingGoal, setAddingGoal] = useState(false)

  return (
    <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-[980px] mx-auto w-full overflow-x-hidden">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-textPrimary">{t('planWeekTitle')}</h1>
        <p className="text-[12px] font-semibold text-textMuted mt-0.5">{t('planWeekSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {planDays.map((day) => (
          <PlanDayCard
            key={day.id}
            day={day}
            onSetTitle={(title) => onSetDayTitle(day.id, title)}
            onAddTodo={(text, time) => onAddTodo(day.id, text, time)}
            onToggleTodo={(todoId) => onToggleTodo(day.id, todoId)}
            onEditTodo={(todoId, text) => onEditTodo(day.id, todoId, text)}
            onSetTodoTime={(todoId, time) => onSetTodoTime(day.id, todoId, time)}
            onDeleteTodo={(todoId) => onDeleteTodo(day.id, todoId)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between mt-9 mb-4 pt-5 border-t border-border">
        <h2 className="text-lg font-extrabold text-textPrimary">{t('planGoalsTitle')}</h2>
        <button
          onClick={() => setAddingGoal((a) => !a)}
          className="flex items-center gap-1 text-[12px] font-extrabold text-accent"
        >
          <Plus size={16} strokeWidth={3} />
          {t('addGoal')}
        </button>
      </div>

      {addingGoal && (
        <AddGoalForm
          onAdd={(data) => {
            onAddGoal(data)
            setAddingGoal(false)
          }}
          onCancel={() => setAddingGoal(false)}
        />
      )}

      <div className="flex flex-col gap-3">
        {planGoals.map((goal) => (
          <PlanGoalCard
            key={goal.id}
            goal={goal}
            onUpdateProgress={(v) => onUpdateGoalProgress(goal.id, v)}
            onDelete={() => onDeleteGoal(goal.id)}
          />
        ))}
        {planGoals.length === 0 && <div className="text-sm font-bold text-textMuted">{t('planNoGoals')}</div>}
      </div>
    </div>
  )
}
