import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import CompanionCharacter from './CompanionCharacter'
import { useTranslation } from '../i18n/LanguageContext'

// Shown the first time Sədəf is called: what she does, in three sentences,
// with the two states that matter drawn next to each other.
export default function CompanionIntro({ open, onClose }) {
  const { t } = useTranslation()
  return (
    <Modal open={open} onClose={onClose} title={t('introTitle')}>
      <div className="-mt-1 mb-4 flex items-end justify-center gap-6">
        <CompanionCharacter mood="idle" size={92} />
        <CompanionCharacter mood="dry" dry={0.9} size={92} />
      </div>
      <ol className="flex flex-col gap-2.5 text-[14px] font-semibold text-textSecondary">
        <li>{t('intro1')}</li>
        <li>{t('intro2')}</li>
        <li>{t('intro3')}</li>
      </ol>
      <Button onClick={onClose} className="mt-5 w-full">
        {t('introStart')}
      </Button>
    </Modal>
  )
}
