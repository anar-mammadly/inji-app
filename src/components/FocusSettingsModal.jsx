import { Minus, Plus } from 'lucide-react'
import Modal from './ui/Modal'
import ConfirmButton from './ui/ConfirmButton'
import { useTranslation } from '../i18n/LanguageContext'
import { FOCUS_LIMITS, runLengthMinutes } from '../lib/focusRun'

function Stepper({ label, note, value, display, limits, onStep }) {
  const { t } = useTranslation()
  const [min, max] = limits
  const buttonClass =
    'press flex h-9 w-9 items-center justify-center rounded-xl border-2 border-border bg-white text-textSecondary shadow-[0_3px_0_#E5E7EB] disabled:opacity-40 disabled:pointer-events-none'
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[15px] font-extrabold text-textPrimary">{label}</div>
        {note && <div className="text-[12px] font-semibold text-textMuted">{note}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={() => onStep(-1)} disabled={value <= min} aria-label={`${label}: ${t('decrease')}`} className={buttonClass}>
          <Minus size={16} strokeWidth={3} />
        </button>
        <span aria-live="polite" className="w-[68px] text-center text-[15px] font-extrabold tabular-nums text-textPrimary">
          {display}
        </span>
        <button type="button" onClick={() => onStep(1)} disabled={value >= max} aria-label={`${label}: ${t('increase')}`} className={buttonClass}>
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  )
}

// Length of the run and of its parts. Changes apply straight away; a block
// that is already running keeps the length it started with.
export default function FocusSettingsModal({ open, onClose, timer }) {
  const { t } = useTranslation()
  const { settings, changeSetting } = timer
  const total = runLengthMinutes(settings)
  const h = Math.floor(total / 60)
  const m = total % 60
  const length = h && m ? t('durationHM', { h, m }) : h ? t('durationH', { h }) : t('durationM', { m })
  const minutes = (n) => t('settingMinutes', { n })

  return (
    <Modal open={open} onClose={onClose} title={t('focusSettingsTitle')}>
      <div className="flex flex-col gap-4">
        <Stepper
          label={t('settingBlocks')}
          note={t('runLength', { time: length })}
          value={settings.blocks}
          display={settings.blocks}
          limits={FOCUS_LIMITS.blocks}
          onStep={(d) => changeSetting('blocks', d)}
        />
        <Stepper label={t('settingFocus')} value={settings.focusMin} display={minutes(settings.focusMin)} limits={FOCUS_LIMITS.focusMin} onStep={(d) => changeSetting('focusMin', d)} />
        <Stepper label={t('settingBreak')} value={settings.breakMin} display={minutes(settings.breakMin)} limits={FOCUS_LIMITS.breakMin} onStep={(d) => changeSetting('breakMin', d)} />
        <Stepper
          label={t('settingLongBreak')}
          note={t('settingLongEvery', { n: settings.longEvery })}
          value={settings.longBreakMin}
          display={minutes(settings.longBreakMin)}
          limits={FOCUS_LIMITS.longBreakMin}
          onStep={(d) => changeSetting('longBreakMin', d)}
        />

        <button
          type="button"
          role="switch"
          aria-checked={settings.autoContinue}
          onClick={() => changeSetting('autoContinue')}
          className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border px-3.5 py-3 text-left"
        >
          <span className="text-[14px] font-extrabold text-textPrimary">{t('settingAuto')}</span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${settings.autoContinue ? 'bg-accent' : 'bg-borderStrong'}`}>
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-[left] duration-150 ${settings.autoContinue ? 'left-6' : 'left-1'}`}
            />
          </span>
        </button>

        <div className="border-t-2 border-border pt-3">
          <ConfirmButton
            onConfirm={timer.resetRun}
            triggerLabel={t('resetRun')}
            confirmMessage={t('resetRunConfirm')}
            disabled={!timer.activeSession && timer.run.progress === 0 && timer.run.blocks === 0}
          />
        </div>
      </div>
    </Modal>
  )
}
