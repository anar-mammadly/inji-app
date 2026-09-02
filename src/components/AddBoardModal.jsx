import { useState } from 'react'
import { useTranslation } from '../i18n/LanguageContext'
import Modal from './ui/Modal'
import Button from './ui/Button'

export default function AddBoardModal({ open, onClose, onAdd }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }

  return (
    <Modal open={open} onClose={onClose} title={t('addBoard')}>
      <form onSubmit={handleSubmit}>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('boardNamePlaceholder')}
          className="w-full px-3 py-2.5 text-[14px] font-semibold rounded-xl border-2 border-border outline-none focus:border-accent mb-3"
        />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            {t('add')}
          </Button>
          <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
            {t('cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
