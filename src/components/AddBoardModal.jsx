import { useState } from 'react'
import { useTranslation } from '../i18n/LanguageContext'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { inputClass } from './ui/styles'

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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('boardNamePlaceholder')}
          className={inputClass}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onClose} variant="ghost">
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            {t('add')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
