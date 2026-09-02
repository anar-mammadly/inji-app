import { useState } from 'react'
import { useTranslation } from '../../i18n/LanguageContext'
import Button from './Button'

export default function ConfirmButton({
  onConfirm,
  triggerLabel,
  confirmMessage,
  disabled = false,
  align = 'center',
  className = '',
}) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)

  function handleConfirm() {
    onConfirm()
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className={`flex flex-col gap-1.5 ${align === 'end' ? 'items-end' : 'items-center'} ${className}`}>
        <span className="text-[11px] text-textSecondary text-center">{confirmMessage}</span>
        <div className="flex gap-2 w-full">
          <Button variant="danger" size="sm" onClick={handleConfirm} className="flex-1">
            {t('confirm')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} className="flex-1">
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
      className={`text-[11px] font-bold text-textMuted text-center transition-opacity disabled:opacity-40 hover:text-textSecondary ${className}`}
    >
      {triggerLabel}
    </button>
  )
}
