import { useState } from 'react'
import { useTranslation } from '../../i18n/LanguageContext'
import Button from './Button'

// tone="onColor" for use on the vivid gradient card (white text)
export default function ConfirmButton({
  onConfirm,
  triggerLabel,
  confirmMessage,
  disabled = false,
  align = 'center',
  tone = 'default',
  className = '',
}) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const onColor = tone === 'onColor'

  function handleConfirm() {
    onConfirm()
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className={`flex flex-col gap-2 ${align === 'end' ? 'items-end' : 'items-center'} ${className}`}>
        <span className={`text-[12px] ${onColor ? 'text-white/90' : 'text-textSecondary'} ${align === 'end' ? 'text-right' : 'text-center'}`}>
          {confirmMessage}
        </span>
        <div className="flex gap-2 w-full">
          <Button variant="danger" size="sm" onClick={handleConfirm} className="flex-1">
            {t('confirm')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConfirming(false)}
            className={`flex-1 ${onColor ? '!bg-white/15 !text-white !border-white/30 hover:!bg-white/25' : ''}`}
          >
            {t('cancel')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      disabled={disabled}
      className={`text-[12px] font-semibold transition-colors disabled:opacity-40 ${
        onColor ? 'text-white/75 hover:text-white' : 'text-textMuted hover:text-pom'
      } ${className}`}
    >
      {triggerLabel}
    </button>
  )
}
