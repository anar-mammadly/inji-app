import { motion } from 'framer-motion'
import { getVisibleBeads } from '../utils/beadPositions'
import { colors, darken } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'
import ConfirmButton from './ui/ConfirmButton'

const JAR_BODY_PATH = `
  M 20 46
  Q 20 32 34 32
  L 96 32
  Q 110 32 110 46
  L 110 128
  Q 110 158 65 158
  Q 20 158 20 128
  Z
`

export default function Jar({ beadCount, jarRef, onReset }) {
  const { t } = useTranslation()
  const beads = getVisibleBeads(beadCount)

  return (
    <div className="flex flex-col items-center">
      <motion.div whileHover={{ scale: 1.04, rotate: -2 }} whileTap={{ scale: 0.97 }} ref={jarRef} data-jar="true">
        <svg width="150" height="198" viewBox="0 0 130 172">
          <defs>
            <clipPath id="jarInner">
              <path d={JAR_BODY_PATH} />
            </clipPath>
            <linearGradient id="glassFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
              <stop offset="45%" stopColor="#DFFAB8" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="lidFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE066" />
              <stop offset="100%" stopColor={colors.yellowDark} />
            </linearGradient>
          </defs>

          {/* lid */}
          <rect x="42" y="2" width="46" height="16" rx="6" fill="url(#lidFill)" stroke={colors.yellowDark} strokeWidth="2.5" />
          <rect x="42" y="7" width="46" height="1.5" fill="#fff" opacity="0.5" />

          {/* neck */}
          <rect x="46" y="14" width="38" height="20" fill="rgba(88,204,2,0.08)" stroke={colors.borderStrong} strokeWidth="2.5" />

          {/* body */}
          <path d={JAR_BODY_PATH} fill="url(#glassFill)" stroke={colors.borderStrong} strokeWidth="2.5" />

          {/* beads, clipped to the jar's interior */}
          <g clipPath="url(#jarInner)">
            {beads.map((b, i) => (
              <g key={i}>
                <circle cx={b.x} cy={b.y} r={b.r} fill={b.color} stroke={darken(b.color, 0.25)} strokeWidth="0.75" />
                <circle cx={b.x - 2.5} cy={b.y - 2.5} r="2.5" fill="#fff" fillOpacity="0.6" />
              </g>
            ))}
          </g>

          {/* glass shine */}
          <path
            d="M 30 48 Q 24 90 32 150"
            fill="none"
            stroke="#fff"
            strokeWidth="9"
            strokeLinecap="round"
            opacity="0.35"
          />
        </svg>
      </motion.div>

      <div className="mt-2 text-center">
        <div className="text-[28px] font-extrabold leading-none text-textPrimary">{beadCount}</div>
        <div className="text-xs font-bold text-textMuted">{t('todayBeads')}</div>
      </div>

      <div className="mt-2 w-full">
        <ConfirmButton
          onConfirm={onReset}
          triggerLabel={t('resetJar')}
          confirmMessage={t('resetJarConfirm')}
          disabled={beadCount === 0}
          className="w-full"
        />
      </div>
    </div>
  )
}
