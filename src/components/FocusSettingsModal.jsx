import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import Modal from './ui/Modal'
import ConfirmButton from './ui/ConfirmButton'
import { useTranslation } from '../i18n/LanguageContext'
import { FOCUS_LIMITS, runLengthMinutes } from '../lib/focusRun'
import { awayDetectionSupported, requestAwayPermission } from '../hooks/useAwayDetection'
import { canUseNotifications } from '../hooks/useReminders'

function Toggle({ label, note, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border px-3.5 py-3 text-left"
    >
      <span className="min-w-0">
        <span className="block text-[14px] font-extrabold text-textPrimary">{label}</span>
        {note && <span className="block text-[12px] font-semibold text-textMuted">{note}</span>}
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-borderStrong'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-[left] duration-150 ${checked ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  )
}

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
  const [permission, setPermission] = useState(() => (canUseNotifications() ? Notification.permission : 'unsupported'))
  const today = timer.today

  // turning "notice when I get up" on needs the browser's permission first
  async function toggleAutoAway() {
    if (!settings.autoAway && (await requestAwayPermission()) !== 'granted') return
    changeSetting('autoAway')
  }

  async function allowNotifications() {
    try {
      setPermission(await Notification.requestPermission())
    } catch {
      setPermission(Notification.permission)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('focusSettingsTitle')}>
      <div className="flex flex-col gap-4">
        {(today.blocks > 0 || today.focusMin >= 1) && (
          <p className="-mt-1 rounded-2xl bg-surfaceAlt px-3.5 py-2.5 text-[13px] font-bold text-textSecondary tabular-nums">
            {t('todayStats', { blocks: today.blocks, focus: Math.round(today.focusMin), move: Math.round(today.moveMin) })}
          </p>
        )}
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

        <Toggle label={t('settingAuto')} checked={settings.autoContinue} onChange={() => changeSetting('autoContinue')} />
        <Toggle label={t('settingSound')} checked={settings.sound} onChange={() => changeSetting('sound')} />
        {awayDetectionSupported && (
          <Toggle label={t('settingAutoAway')} note={t('settingAutoAwayNote')} checked={settings.autoAway} onChange={toggleAutoAway} />
        )}
        {permission !== 'unsupported' && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border px-3.5 py-3">
            <span className="min-w-0">
              <span className="block text-[14px] font-extrabold text-textPrimary">{t('settingNotify')}</span>
              <span className="block text-[12px] font-semibold text-textMuted">
                {permission === 'denied' ? t('notifyBlocked') : t('settingNotifyNote')}
              </span>
            </span>
            {permission === 'default' ? (
              <button
                type="button"
                onClick={allowNotifications}
                className="press h-9 shrink-0 rounded-xl bg-blueSoft px-3 text-[13px] font-extrabold text-blueInk shadow-[0_3px_0_#B5E5FB]"
              >
                {t('notifyAllow')}
              </button>
            ) : (
              permission === 'granted' && <span className="shrink-0 text-[13px] font-extrabold text-accentInk">{t('notifyOn')}</span>
            )}
          </div>
        )}

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
