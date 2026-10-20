import { useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Pencil, X, CalendarDays, BookMarked } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import Button from './ui/Button'
import Card from './ui/Card'
import { chipClass, iconButtonClass, textareaClass } from './ui/styles'
import MarkdownToolbar from './MarkdownToolbar'
import MarkdownContent from './MarkdownContent'

function ArchiveItem({ entry, onEdit, onDelete }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(entry.text)
  const editRef = useRef(null)

  function commit() {
    const trimmed = value.trim()
    if (trimmed) onEdit(trimmed)
    setEditing(false)
  }

  return (
    <div className="flex items-start gap-3">
      <span className="mt-[9px] h-2.5 w-2.5 rounded-full bg-purple shrink-0" />
      <div className="flex-1 min-w-0">
        {editing ? (
          <div>
            <MarkdownToolbar textareaRef={editRef} value={value} setValue={setValue} />
            <textarea
              ref={editRef}
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  commit()
                }
              }}
              rows={4}
              className={`${textareaClass} font-mono text-[13px] !border-blue`}
            />
            <div className="flex justify-end mt-2">
              <Button size="sm" onClick={commit}>
                {t('save')}
              </Button>
            </div>
          </div>
        ) : (
          <MarkdownContent text={entry.text} />
        )}
      </div>
      {!editing && (
        <div className="-mt-0.5 -mr-1.5 flex items-center shrink-0">
          <button onClick={() => setEditing(true)} className={iconButtonClass} aria-label={t('editEntry')}>
            <Pencil size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={onDelete}
            className={`${iconButtonClass} hover:!bg-pomSoft hover:!text-coral`}
            aria-label={t('deleteEntry')}
          >
            <X size={16} strokeWidth={2.6} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function JournalArchive({ entries, onEdit, onDelete }) {
  const { t } = useTranslation()

  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border-2 border-dashed border-borderStrong px-4 py-5">
        <BookMarked size={22} strokeWidth={2.5} className="shrink-0 text-purple" />
        <p className="text-[14px] font-bold text-textMuted">{t('noJournalEntries')}</p>
      </div>
    )
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
        <Card key={date}>
          <div className="mb-3">
            <span className={`${chipClass} h-7 px-3 text-[13px] bg-purpleSoft text-purpleDark`}>
              <CalendarDays size={14} strokeWidth={2.5} />
              {format(parseISO(date), 'd MMMM yyyy')}
            </span>
          </div>
          <div className="flex flex-col gap-3 divide-y-2 divide-surfaceAlt [&>*:not(:first-child)]:pt-3">
            {groups[date]
              .slice()
              .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
              .map((entry) => (
                <ArchiveItem
                  key={entry.id}
                  entry={entry}
                  onEdit={(text) => onEdit(entry.id, text)}
                  onDelete={() => onDelete(entry.id)}
                />
              ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
