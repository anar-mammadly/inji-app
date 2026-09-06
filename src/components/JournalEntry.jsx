import { useRef, useState } from 'react'
import { format } from 'date-fns'
import { Pencil, X } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import Button from './ui/Button'
import MarkdownToolbar from './MarkdownToolbar'
import MarkdownContent from './MarkdownContent'

function JournalItem({ entry, onEdit, onDelete }) {
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
    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-surfaceAlt">
      <div className="mt-2 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
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
              className="w-full text-[13px] font-semibold text-textPrimary outline-none bg-surface border-2 border-accent rounded-xl px-2.5 py-2 resize-none font-mono"
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
        <div className="text-[10px] font-bold text-textMuted mt-1">{format(new Date(entry.createdAt), 'HH:mm')}</div>
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

export default function JournalEntry({ entries, onAdd, onEdit, onDelete }) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const composeRef = useRef(null)

  function submit() {
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setText('')
  }

  const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="rounded-3xl border-2 border-border bg-surface p-4">
      <div className="text-[11px] uppercase font-extrabold tracking-wide text-textMuted mb-2">{t('journalPrompt')}</div>

      <MarkdownToolbar textareaRef={composeRef} value={text} setValue={setText} />
      <textarea
        ref={composeRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            submit()
          }
        }}
        rows={4}
        placeholder={t('journalPlaceholder')}
        className="w-full text-[13px] font-semibold px-3 py-2 rounded-xl border-2 border-border outline-none resize-none focus:border-accent font-mono"
      />
      <div className="mt-2 flex justify-end">
        <Button size="sm" onClick={submit}>
          {t('addEntry')}
        </Button>
      </div>

      {sorted.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {sorted.map((entry) => (
            <JournalItem
              key={entry.id}
              entry={entry}
              onEdit={(text) => onEdit(entry.id, text)}
              onDelete={() => onDelete(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
