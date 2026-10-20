import { List, Code2 } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'

function insertWrap(textareaRef, value, setValue, before, after, placeholder) {
  const el = textareaRef.current
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = value.slice(start, end) || placeholder
  const next = value.slice(0, start) + before + selected + after + value.slice(end)
  setValue(next)
  requestAnimationFrame(() => {
    el.focus()
    const cursor = start + before.length + selected.length
    el.setSelectionRange(cursor, cursor)
  })
}

export default function MarkdownToolbar({ textareaRef, value, setValue }) {
  const { t } = useTranslation()

  function insertBullet() {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const needsNewline = start > 0 && value[start - 1] !== '\n'
    const prefix = (needsNewline ? '\n' : '') + '- '
    const next = value.slice(0, start) + prefix + value.slice(start)
    setValue(next)
    requestAnimationFrame(() => {
      el.focus()
      const cursor = start + prefix.length
      el.setSelectionRange(cursor, cursor)
    })
  }

  function insertCodeBlock() {
    insertWrap(textareaRef, value, setValue, '\n```js\n', '\n```\n', 'kod...')
  }

  const btn =
    'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl border-2 border-border bg-white text-[12px] font-bold text-textSecondary transition-colors hover:border-blue hover:bg-blueSoft hover:text-blueDark'

  return (
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <button type="button" onClick={insertBullet} className={btn} aria-label={t('insertBullet')}>
        <List size={14} strokeWidth={2.5} />
        {t('insertBullet')}
      </button>
      <button type="button" onClick={insertCodeBlock} className={btn} aria-label={t('insertCodeBlock')}>
        <Code2 size={14} strokeWidth={2.5} />
        {t('insertCodeBlock')}
      </button>
    </div>
  )
}
