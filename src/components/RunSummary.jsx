import Modal from './ui/Modal'
import Button from './ui/Button'
import { useTranslation } from '../i18n/LanguageContext'

// Shown once when a whole run of focus blocks has been finished.
export default function RunSummary({ run, onClose }) {
  const { t } = useTranslation()
  const open = !!run && !run.seen
  const stats = run
    ? [
        [run.blocks, t('runSummaryBlocks')],
        [run.focusMin, t('runSummaryFocus')],
        [run.moveMin, t('runSummaryMove')],
      ]
    : []

  return (
    <Modal open={open} onClose={onClose} title={t('runSummaryTitle')}>
      <dl className="grid grid-cols-3 gap-2.5">
        {stats.map(([value, label]) => (
          <div key={label} className="rounded-2xl bg-surfaceAlt px-2 py-3 text-center">
            <dd className="text-[26px] font-extrabold leading-none tabular-nums text-textPrimary">{value}</dd>
            <dt className="mt-1 text-[12px] font-bold text-textSecondary">{label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[14px] font-semibold text-textSecondary">
        {run?.streakDays > 1 ? t('runSummaryStreak', { n: run.streakDays }) : t('runSummaryTomorrow')}
      </p>
      <Button onClick={onClose} className="mt-4 w-full">
        {t('ok')}
      </Button>
    </Modal>
  )
}
