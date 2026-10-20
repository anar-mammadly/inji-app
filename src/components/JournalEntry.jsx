import { useRef, useState } from 'react'
import { format } from 'date-fns'
import { Pencil, X, PenLine, Plus } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import Button from './ui/Button'
import Card from './ui/Card'
import { chipClass, iconButtonClass, textareaClass } from './ui/styles'
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
    <div className="rounded-2xl border-2 border-border bg-white p-3 sm:p-4 shadow-[0_2px_0_#E5E7EB]">
      <div className="flex items-center gap-2 mb-2">
        <span className="h-2.5 w-2.5 rounded-full bg-accent shrink-0" />
        <span className="text-[12px] font-bold tabular-nums text-textMuted">{format(new Date(entry.createdAt), 'HH:mm')}</span>
        {!editing && (
          <div className="ml-auto -my-1 -mr-1.5 flex items-center shrink-0">
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
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accentSoft">
          <PenLine size={20} strokeWidth={2.5} className="text-accentDark" />
        </div>
        <h2 className="flex-1 min-w-0 text-[18px] leading-snug font-extrabold text-textPrimary">{t('journalPrompt')}</h2>
        <span className={`${chipClass} shrink-0 bg-accentSoft text-accentDark tabular-nums`}>{format(new Date(), 'd MMM')}</span>
      </div>

      <div>
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
          className={`${textareaClass} font-mono text-[13px]`}
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={submit} className="w-full sm:w-auto">
            <Plus size={18} strokeWidth={3} />
            {t('addEntry')}
          </Button>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="flex flex-col gap-3">
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
    </Card>
  )
}
