import { useState } from 'react'
import { useTranslation } from '../i18n/LanguageContext'
import { CATEGORIES, CATEGORY_LABEL_KEYS, categoryStyles } from '../utils/categories'
import Button from './ui/Button'

export default function AddTaskForm({ onAdd, onCancel }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed, category)
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      className="rounded-2xl border-2 border-blue bg-white p-3 flex flex-col gap-2.5"
    >
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('taskNamePlaceholder')}
        className="w-full h-10 px-3 rounded-xl border-2 border-border text-[14px] font-bold outline-none focus:border-blue placeholder:font-semibold placeholder:text-textMuted"
      />

      <div className="flex gap-1.5" role="radiogroup">
        {CATEGORIES.map((value) => {
          const cat = categoryStyles[value]
          const selected = category === value
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setCategory(value)}
              className="flex-1 h-8 px-2 rounded-xl text-[12px] font-extrabold border-2 transition-colors"
              style={
                selected
                  ? { background: cat.bg, color: cat.text, borderColor: cat.dot }
                  : { borderColor: '#E5E7EB', color: '#9CA0A8' }
              }
            >
              {t(CATEGORY_LABEL_KEYS[value])}
            </button>
          )
        })}
      </div>

      <div className="flex gap-2 pt-0.5">
        <Button type="submit" size="sm" className="flex-1" disabled={!name.trim()}>
          {t('add')}
        </Button>
        <Button type="button" onClick={onCancel} variant="secondary" size="sm" className="flex-1">
          {t('cancel')}
        </Button>
      </div>
    </form>
  )
}
