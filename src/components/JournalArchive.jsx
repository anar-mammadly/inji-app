import { format, parseISO } from 'date-fns'
import { useTranslation } from '../i18n/LanguageContext'

export default function JournalArchive({ entries }) {
  const { t } = useTranslation()
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1))

  if (sorted.length === 0) {
    return <div className="text-sm font-bold text-textMuted">{t('noJournalEntries')}</div>
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((entry) => (
        <div key={entry.id} className="rounded-2xl border-2 border-border bg-surface p-3.5">
          <div className="text-[11px] font-bold text-textMuted mb-1">{format(parseISO(entry.date), 'd MMMM yyyy')}</div>
          <div className="text-[13px] font-semibold text-textPrimary whitespace-pre-wrap">{entry.text}</div>
        </div>
      ))}
    </div>
  )
}
