import { useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import PlanDayCard from './PlanDayCard'
import PlanGoalCard from './PlanGoalCard'
import Button from './ui/Button'
import Card from './ui/Card'
import Page from './ui/Page'
import PageHeader from './ui/PageHeader'
import { inputClass, labelClass } from './ui/styles'

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
    <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-3 mb-4">
      <input
        autoFocus
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('goalTitlePlaceholder')}
        className={inputClass}
      />
      <div className="grid grid-cols-[96px_minmax(0,1fr)] sm:grid-cols-[110px_minmax(0,1fr)_180px] gap-2">
        <input
          type="number"
          min="1"
          value={targetProgress}
          onChange={(e) => setTargetProgress(e.target.value)}
          className={`${inputClass} tabular-nums`}
        />
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder={t('unitPlaceholder')}
          className={inputClass}
        />
        <div className="col-span-2 sm:col-span-1">
          <label className={`${labelClass} sm:sr-only`}>{t('goalsDeadline')}</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            aria-label={t('goalsDeadline')}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1 sm:flex-none sm:min-w-[120px]">
          {t('add')}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel} className="flex-1 sm:flex-none sm:min-w-[120px]">
          {t('cancel')}
        </Button>
      </div>
    </Card>
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
    <Page width="normal">
      <PageHeader title={t('planWeekTitle')} subtitle={t('planWeekSubtitle')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="flex items-center gap-2 text-[20px] font-extrabold text-textPrimary">
            <Target size={20} strokeWidth={2.6} className="text-purple" />
            {t('planGoalsTitle')}
          </h2>
          {!addingGoal && (
            <Button size="sm" onClick={() => setAddingGoal(true)}>
              <Plus size={16} strokeWidth={3} />
              {t('addGoal')}
            </Button>
          )}
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

        {planGoals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {planGoals.map((goal) => (
              <PlanGoalCard
                key={goal.id}
                goal={goal}
                onUpdateProgress={(v) => onUpdateGoalProgress(goal.id, v)}
                onDelete={() => onDeleteGoal(goal.id)}
              />
            ))}
          </div>
        ) : (
          !addingGoal && (
            <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <Target size={34} strokeWidth={2.2} className="text-purple" />
              <p className="text-[15px] font-bold text-textSecondary">{t('planNoGoals')}</p>
              <Button size="sm" variant="soft" onClick={() => setAddingGoal(true)}>
                <Plus size={16} strokeWidth={3} />
                {t('addGoal')}
              </Button>
            </Card>
          )
        )}
      </section>
    </Page>
  )
}
