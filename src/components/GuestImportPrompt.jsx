import Modal from './ui/Modal'
import Button from './ui/Button'
import { chipClass } from './ui/styles'
import { useTranslation } from '../i18n/LanguageContext'

const COUNT_KEYS = {
  tasks: 'guestCountTasks',
  notes: 'guestCountNotes',
  events: 'guestCountEvents',
  habits: 'guestCountHabits',
  goals: 'guestCountGoals',
  journal: 'guestCountJournal',
  todos: 'guestCountTodos',
}

// Shown once after logging in to an account that already has data, when this
// browser also holds things made as a guest. Nothing is merged or thrown away
// until the user chooses.
export default function GuestImportPrompt({ summary, onAccept, onDismiss }) {
  const { t } = useTranslation()
  const counts = Object.entries(COUNT_KEYS).filter(([key]) => summary?.[key] > 0)

  return (
    <Modal open={!!summary} title={t('guestImportTitle')}>
      <p className="-mt-1 mb-3 text-[14px] font-semibold text-textSecondary">{t('guestImportBody')}</p>
      {counts.length > 0 && (
        <ul className="mb-5 flex flex-wrap gap-1.5">
          {counts.map(([key, labelKey]) => (
            <li key={key} className={`${chipClass} h-7 bg-blueSoft text-blueInk tabular-nums`}>
              {t(labelKey, { n: summary[key] })}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onDismiss}>
          {t('guestImportDismiss')}
        </Button>
        <Button onClick={onAccept}>{t('guestImportAccept')}</Button>
      </div>
    </Modal>
  )
}
