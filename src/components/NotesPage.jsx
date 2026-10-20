import { useState } from 'react'
import { Plus, StickyNote } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import NoteCard from './NoteCard'
import Button from './ui/Button'
import Card from './ui/Card'
import Page from './ui/Page'
import PageHeader from './ui/PageHeader'
import { textareaClass } from './ui/styles'

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
    <Card as="form" onSubmit={handleSubmit} className="mb-5 max-w-[640px] flex flex-col gap-3">
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('noteTextPlaceholder')}
        rows={3}
        className={`${textareaClass} text-[15px]`}
      />
      <div className="flex gap-3">
        <Button type="submit" className="flex-1">
          {t('add')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          {t('cancel')}
        </Button>
      </div>
    </Card>
  )
}

export default function NotesPage({ notes, onAddNote, onEditNote, onDeleteNote }) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)

  return (
    <Page width="wide" className="overflow-x-hidden">
      <PageHeader
        title={t('notesTitle')}
        subtitle={t('notesSubtitle')}
        actions={
          <Button size="sm" onClick={() => setAdding((a) => !a)} aria-expanded={adding}>
            <Plus size={16} strokeWidth={3} />
            {t('addNote')}
          </Button>
        }
      />

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
        <Card className="flex flex-col items-center text-center gap-3 py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellowSoft">
            <StickyNote size={28} strokeWidth={2.5} className="text-yellowDark" />
          </div>
          <p className="text-[15px] font-bold text-textSecondary">{t('noNotes')}</p>
          {!adding && (
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus size={16} strokeWidth={3} />
              {t('addNote')}
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 p-1">
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
    </Page>
  )
}
