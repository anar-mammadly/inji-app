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
  // a gentle, deterministic tilt so the wall feels hand-placed but stays tidy
  const tilt = (index % 2 === 0 ? 1 : -1) * ((index % 3) + 1) * 0.4

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

  const iconBtn =
    'flex h-8 w-8 items-center justify-center rounded-xl text-textPrimary/45 transition-colors hover:bg-white/60 hover:text-textPrimary/80'

  return (
    <div
      className="group relative flex flex-col gap-2 min-h-[180px] rounded-2xl border-2 p-4 pt-3 transition-transform duration-200 rotate-[var(--tilt)] hover:-translate-y-1 hover:rotate-0"
      style={{ background: bg, borderColor: fold, boxShadow: `0 4px 0 ${fold}`, "--tilt": `${tilt}deg` }}
    >
      {/* folded corner */}
      <div
        className="absolute -top-0.5 -right-0.5 h-6 w-6 rounded-bl-xl"
        style={{ background: `linear-gradient(225deg, #F7F9FB 50%, ${fold} 50%)` }}
      />

      <div className="flex items-center justify-between gap-2 pr-4">
        <div className="text-[12px] font-bold tabular-nums text-textPrimary/55">
          {format(new Date(note.createdAt), 'd MMM, HH:mm')}
        </div>
        <div className="-mr-2 flex items-center shrink-0">
          <button onClick={() => setEditing((e) => !e)} className={iconBtn} aria-label={t('editNote')}>
            <Pencil size={14} strokeWidth={2.5} />
          </button>
          <button onClick={onDelete} className={`${iconBtn} hover:!text-coral`} aria-label={t('deleteNote')}>
            <X size={16} strokeWidth={2.6} />
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
          className="flex-1 -mx-1.5 px-1.5 py-1 rounded-xl bg-white/50 outline-none ring-2 ring-white/80 text-[15px] leading-relaxed font-medium text-textPrimary resize-none placeholder:text-textPrimary/40"
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="flex-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed font-medium text-textPrimary cursor-text"
        >
          {note.text}
        </div>
      )}
    </div>
  )
}
