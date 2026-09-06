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
    <form onSubmit={handleSubmit} className="p-3 rounded-2xl border-2 border-border bg-surface flex flex-col gap-2">
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('taskNamePlaceholder')}
        className="w-full px-3 py-2 text-[13px] font-semibold rounded-xl border-2 border-border outline-none focus:border-accent"
      />

      <div className="flex gap-1.5">
        {CATEGORIES.map((value) => {
          const cat = categoryStyles[value]
          const selected = category === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className="flex-1 px-2 py-1.5 rounded-xl text-[12px] font-bold border-2 border-border transition-colors"
              style={{
                background: selected ? cat.bg : 'transparent',
                color: selected ? cat.text : undefined,
                borderColor: selected ? cat.bg : undefined,
              }}
            >
              <span className={selected ? '' : 'text-textMuted'}>{t(CATEGORY_LABEL_KEYS[value])}</span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1">
          {t('add')}
        </Button>
        <Button type="button" onClick={onCancel} variant="secondary" size="sm" className="flex-1">
          {t('cancel')}
        </Button>
      </div>
    </form>
  )
}
