import { useState } from 'react'
import { colors, categoryStyles } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'

const CATEGORIES = [
  { value: 'study', labelKey: 'categoryStudy' },
  { value: 'work', labelKey: 'categoryWork' },
  { value: 'personal', labelKey: 'categoryPersonal' },
]

export default function AddTaskForm({ onAdd, onCancel }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('study')

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed, category)
  }

  return (
    <div
      className="p-2 rounded-[10px] border flex flex-col gap-2"
      style={{ borderColor: colors.border, background: colors.surface }}
    >
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder={t('taskNamePlaceholder')}
        className="w-full px-2 py-1.5 text-[13px] rounded-[6px] border outline-none"
        style={{ borderColor: colors.border }}
      />

      <div className="flex gap-1.5">
        {CATEGORIES.map(({ value, labelKey }) => {
          const cat = categoryStyles[value]
          const selected = category === value
          return (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className="flex-1 px-2 py-1.5 rounded-[8px] text-[12px] border transition-colors"
              style={{
                background: selected ? cat.bg : 'transparent',
                color: selected ? cat.text : colors.textMuted,
                borderColor: selected ? cat.bg : colors.border,
              }}
            >
              {t(labelKey)}
            </button>
          )
        })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          className="flex-1 text-[12px] py-1.5 rounded-[8px]"
          style={{ background: colors.accent, color: '#fff' }}
        >
          {t('add')}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 text-[12px] py-1.5 rounded-[8px] border"
          style={{ borderColor: colors.border, color: colors.textSecondary }}
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  )
}
