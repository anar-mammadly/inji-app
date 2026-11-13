import { useState } from 'react'
import { useTranslation } from '../../i18n/LanguageContext'
import Button from './Button'

export default function ConfirmButton({
  onConfirm,
  triggerLabel,
  confirmMessage,
  confirmLabel,
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
      <div className={`flex flex-col gap-2 ${align === 'end' ? 'items-end' : 'items-center'} ${className}`}>
        <span className={`text-[12px] text-textSecondary ${align === 'end' ? 'text-right' : 'text-center'}`}>
          {confirmMessage}
        </span>
        <div className="flex gap-2 w-full">
          <Button variant="danger" size="sm" onClick={handleConfirm} className="flex-1">
            {confirmLabel || t('confirm')}
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
      className={`text-[12px] font-semibold text-textMuted transition-colors hover:text-coralInk disabled:opacity-40 ${className}`}
    >
      {triggerLabel}
    </button>
  )
}
