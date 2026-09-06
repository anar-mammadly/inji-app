import { useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Pencil, X } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import Button from './ui/Button'
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
    <div className="flex items-start gap-2.5 group">
      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple shrink-0" />
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
              className="w-full text-[13px] font-semibold text-textPrimary outline-none bg-surfaceAlt border-2 border-accent rounded-xl px-2.5 py-2 resize-none font-mono"
            />
            <div className="flex justify-end mt-1.5">
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
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="text-textMuted hover:text-textSecondary transition-colors"
            aria-label={t('editEntry')}
          >
            <Pencil size={12} strokeWidth={2.5} />
          </button>
          <button onClick={onDelete} className="text-textMuted hover:text-coral transition-colors" aria-label={t('deleteEntry')}>
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function JournalArchive({ entries, onEdit, onDelete }) {
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
          <div className="flex flex-col gap-2.5">
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
        </div>
      ))}
    </div>
  )
}
