import { useRef, useState } from 'react'
import { Share2 } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import CompanionCharacter from '../companion/CompanionCharacter'
import { useTranslation } from '../i18n/LanguageContext'

const W = 1080
const H = 1350

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// A 1080×1350 card of the finished session, drawn on a canvas: the companion
// (taken from the drawing on screen), the three numbers, the app's name.
async function drawCard({ svg, title, stats, footnote }) {
  await document.fonts?.ready
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const font = getComputedStyle(document.body).fontFamily

  ctx.fillStyle = '#F7F9FB'
  ctx.fillRect(0, 0, W, H)
  roundRect(ctx, 60, 60, W - 120, H - 120, 72)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.lineWidth = 6
  ctx.strokeStyle = '#E5E7EB'
  ctx.stroke()

  if (svg) {
    const copy = svg.cloneNode(true)
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    copy.setAttribute('width', '460')
    copy.setAttribute('height', '460')
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }))
    try {
      ctx.drawImage(await loadImage(url), (W - 460) / 2, 150, 460, 460)
    } catch {
      // the card is still worth sharing without the drawing
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = '#3C3C3C'
  ctx.font = `800 76px ${font}`
  ctx.fillText(title, W / 2, 730)

  const colW = (W - 200) / stats.length
  stats.forEach(([value, label], i) => {
    const cx = 100 + colW * i + colW / 2
    roundRect(ctx, cx - colW / 2 + 14, 800, colW - 28, 250, 44)
    ctx.fillStyle = '#F1F4F9'
    ctx.fill()
    ctx.fillStyle = '#3C3C3C'
    ctx.font = `800 112px ${font}`
    ctx.fillText(String(value), cx, 940)
    ctx.fillStyle = '#4B5563'
    ctx.font = `700 36px ${font}`
    ctx.fillText(label, cx, 1005)
  })

  ctx.fillStyle = '#4B5563'
  ctx.font = `700 40px ${font}`
  ctx.fillText(footnote, W / 2, 1135)
  ctx.fillStyle = '#2A6E00'
  ctx.font = `800 56px ${font}`
  ctx.fillText('inji', W / 2, 1225)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

// Shown once when a whole run of focus blocks has been finished.
export default function RunSummary({ run, onClose }) {
  const { t } = useTranslation()
  const figure = useRef(null)
  const [busy, setBusy] = useState(false)
  const open = !!run && !run.seen
  const stats = run
    ? [
        [run.blocks, t('runSummaryBlocks')],
        [run.focusMin, t('runSummaryFocus')],
        [run.moveMin, t('runSummaryMove')],
      ]
    : []
  const footnote = run?.streakDays > 1 ? t('runSummaryStreak', { n: run.streakDays }) : t('runSummaryTomorrow')

  // hand the card to the phone's share sheet, or save it where that is missing
  async function share() {
    setBusy(true)
    try {
      const blob = await drawCard({ svg: figure.current?.querySelector('svg'), title: t('runSummaryTitle'), stats, footnote })
      if (!blob) return
      const file = new File([blob], 'inji.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t('runSummaryTitle') })
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'inji.png'
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    } catch {
      // the share sheet was dismissed
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('runSummaryTitle')}>
      <div ref={figure} className="-mt-1 mb-3 flex justify-center">
        <CompanionCharacter mood="cheer" size={112} />
      </div>
      <dl className="grid grid-cols-3 gap-2.5">
        {stats.map(([value, label]) => (
          <div key={label} className="rounded-2xl bg-surfaceAlt px-2 py-3 text-center">
            <dd className="text-[26px] font-extrabold leading-none tabular-nums text-textPrimary">{value}</dd>
            <dt className="mt-1 text-[12px] font-bold text-textSecondary">{label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[14px] font-semibold text-textSecondary">{footnote}</p>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Button variant="secondary" onClick={share} disabled={busy} className="w-full">
          <Share2 size={16} strokeWidth={2.6} />
          {t('share')}
        </Button>
        <Button onClick={onClose} className="w-full">
          {t('ok')}
        </Button>
      </div>
    </Modal>
  )
}
