import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import NoteCard from './NoteCard'
import Button from './ui/Button'

function AddNoteForm({ onAdd, onCancel }) {
  const { t } = useTranslation()
  const [text, setText] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(text)
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 rounded-2xl border-2 border-border bg-surface flex flex-col gap-2 mb-4">
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('noteTextPlaceholder')}
        rows={3}
        className="px-3 py-2 text-[14px] font-semibold rounded-xl border-2 border-border outline-none focus:border-accent resize-none"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1">
          {t('add')}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel} className="flex-1">
          {t('cancel')}
        </Button>
      </div>
    </form>
  )
}

export default function NotesPage({ notes, onAddNote, onEditNote, onDeleteNote }) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)

  return (
    <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-[960px] mx-auto w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-extrabold text-textPrimary">{t('notesTitle')}</h1>
        <button
          onClick={() => setAdding((a) => !a)}
          className="flex items-center gap-1 text-[12px] font-extrabold text-accent"
        >
          <Plus size={16} strokeWidth={3} />
          {t('addNote')}
        </button>
      </div>

      {adding && (
        <AddNoteForm
          onAdd={(text) => {
            onAddNote(text)
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {notes.length === 0 ? (
        <div className="text-sm font-bold text-textMuted">{t('noNotes')}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 p-1">
          {notes.map((note, i) => (
            <NoteCard
              key={note.id}
              note={note}
              index={i}
              onEdit={(text) => onEditNote(note.id, text)}
              onDelete={() => onDeleteNote(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
