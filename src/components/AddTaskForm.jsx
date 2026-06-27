import { useState } from 'react'
import { colors } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'

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
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full px-2 py-1.5 text-[13px] rounded-[6px] border outline-none"
        style={{ borderColor: colors.border }}
      >
        <option value="study">{t('categoryStudy')}</option>
        <option value="work">{t('categoryWork')}</option>
        <option value="personal">{t('categoryPersonal')}</option>
      </select>
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
