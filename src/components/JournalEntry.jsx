import { useState } from 'react'
import { useTranslation } from '../i18n/LanguageContext'
import Button from './ui/Button'

export default function JournalEntry({ value, onSave }) {
  const { t } = useTranslation()
  const [text, setText] = useState(value)
  const dirty = text !== value

  return (
    <div className="rounded-3xl border-2 border-border bg-surface p-4">
      <div className="text-[11px] uppercase font-extrabold tracking-wide text-textMuted mb-2">
        {t('journalPrompt')}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder={t('journalPlaceholder')}
        className="w-full text-[13px] font-semibold px-3 py-2 rounded-xl border-2 border-border outline-none resize-none focus:border-accent"
      />
      {dirty && (
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={() => onSave(text)}>
            {t('save')}
          </Button>
        </div>
      )}
    </div>
  )
}
