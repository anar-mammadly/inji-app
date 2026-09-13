import { useState } from 'react'
import { format } from 'date-fns'
import { X, Pencil } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import { stickyNoteColors } from '../utils/colors'

export default function NoteCard({ note, index, onEdit, onDelete }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.text)
  const { bg, fold } = stickyNoteColors[index % stickyNoteColors.length]
  const tilt = (index % 2 === 0 ? 1 : -1) * ((index % 3) + 1) * 0.6

  function commit() {
    const trimmed = draft.trim()
    if (!trimmed) {
      setDraft(note.text)
      setEditing(false)
      return
    }
    onEdit(trimmed)
    setEditing(false)
  }

  return (
    <div
      className="relative rounded-lg p-4 pt-5 flex flex-col gap-2 min-h-[160px] shadow-card transition-transform hover:-translate-y-0.5 hover:rotate-0"
      style={{ background: bg, transform: `rotate(${tilt}deg)` }}
    >
      <div
        className="absolute top-0 right-0 w-5 h-5 rounded-bl-lg"
        style={{
          background: `linear-gradient(135deg, transparent 50%, ${fold} 50%)`,
        }}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-bold text-textPrimary/50">
          {format(new Date(note.createdAt), 'd MMM, HH:mm')}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setEditing((e) => !e)}
            className="text-textPrimary/40 hover:text-textPrimary/80 transition-colors"
            aria-label={t('editNote')}
          >
            <Pencil size={13} strokeWidth={2.5} />
          </button>
          <button
            onClick={onDelete}
            className="text-textPrimary/40 hover:text-coral transition-colors"
            aria-label={t('deleteNote')}
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit()
            if (e.key === 'Escape') {
              setDraft(note.text)
              setEditing(false)
            }
          }}
          rows={5}
          className="flex-1 bg-transparent outline-none text-[14px] font-semibold text-textPrimary resize-none placeholder:text-textPrimary/40"
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="flex-1 whitespace-pre-wrap break-words text-[14px] font-semibold text-textPrimary cursor-text"
        >
          {note.text}
        </div>
      )}
    </div>
  )
}
