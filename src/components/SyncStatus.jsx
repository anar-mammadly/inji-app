import { CloudCheck, CloudOff, CloudUpload, Smartphone } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'

const VIEWS = {
  synced: { icon: CloudCheck, key: 'syncSynced', tone: 'text-textMuted' },
  loading: { icon: CloudUpload, key: 'loading', tone: 'text-textMuted' },
  pending: { icon: CloudUpload, key: 'syncSaving', tone: 'text-textMuted' },
  syncing: { icon: CloudUpload, key: 'syncSaving', tone: 'text-textMuted' },
  offline: { icon: CloudOff, key: 'syncOffline', tone: 'text-coralInk' },
  local: { icon: Smartphone, key: 'syncLocal', tone: 'text-textMuted' },
}

// Says, in a few words, whether what you see has reached the server. When a
// save fails it becomes a button: the edits are safe on this device, and
// pressing it tries again right away instead of waiting for the back-off.
export default function SyncStatus({ sync, compact = false, className = '' }) {
  const { t } = useTranslation()
  const view = VIEWS[sync.status] || VIEWS.synced
  const Icon = view.icon
  const label = t(view.key)
  const hint = sync.status === 'offline' ? t('syncOfflineHint') : sync.status === 'local' ? t('syncLocalHint') : label

  const content = (
    <>
      <Icon size={compact ? 18 : 16} strokeWidth={2.4} className="shrink-0" />
      {!compact && <span className="truncate">{label}</span>}
    </>
  )
  const shared = `inline-flex min-w-0 items-center gap-1.5 text-[12px] font-bold ${view.tone} ${className}`

  if (sync.status === 'offline') {
    return (
      <button
        type="button"
        onClick={sync.retry}
        title={`${hint} ${t('syncRetry')}`}
        aria-label={`${label}. ${t('syncRetry')}`}
        className={`${shared} hit rounded-lg underline decoration-2 underline-offset-2 hover:text-danger`}
      >
        {content}
      </button>
    )
  }

  return (
    <span role="status" title={hint} aria-label={compact ? label : undefined} className={shared}>
      {content}
    </span>
  )
}
