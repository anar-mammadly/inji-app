import { format, parseISO } from 'date-fns'
import { useTranslation } from '../i18n/LanguageContext'

export default function JournalArchive({ entries }) {
  const { t } = useTranslation()

  if (entries.length === 0) {
    return <div className="text-sm font-bold text-textMuted">{t('noJournalEntries')}</div>
  }

  const groups = {}
  entries.forEach((entry) => {
    if (!groups[entry.date]) groups[entry.date] = []
    groups[entry.date].push(entry)
  })
  const dates = Object.keys(groups).sort((a, b) => (a < b ? 1 : -1))

  return (
    <div className="flex flex-col gap-3">
      {dates.map((date) => (
        <div key={date} className="rounded-2xl border-2 border-border bg-surface p-3.5">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-textMuted mb-2">
            {format(parseISO(date), 'd MMMM yyyy')}
          </div>
          <div className="flex flex-col gap-2">
            {groups[date]
              .slice()
              .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
              .map((entry) => (
                <div key={entry.id} className="flex items-start gap-2.5">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple shrink-0" />
                  <div className="text-[13px] font-semibold text-textPrimary whitespace-pre-wrap">{entry.text}</div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
