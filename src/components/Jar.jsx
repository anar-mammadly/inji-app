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

// CSS twin of the SVG bead, for the bead rendered as HTML (the one flying
// into the jar).
export function pearlBackground(color) {
  return `radial-gradient(circle at 34% 30%, rgba(255,255,255,0.75) 0 18%, transparent 40%), ${color}`
}

export default function Jar({ beadCount, jarRef, onReset }) {
  const { t } = useTranslation()
  const beads = getVisibleBeads(beadCount)

  return (
    <div className="flex items-center gap-5 lg:flex-col lg:gap-1">
      <motion.div
        whileHover={{ scale: 1.04, rotate: -2 }}
        whileTap={{ scale: 0.97 }}
        ref={jarRef}
        data-jar="true"
        className="shrink-0"
      >
        <svg
          viewBox="0 0 130 172"
          className="w-[82px] h-[108px] sm:w-[96px] sm:h-[127px] lg:w-[150px] lg:h-[198px] lg:short:w-[112px] lg:short:h-[148px]"
          role="img"
          aria-label={`${beadCount} ${t('todayBeads')}`}
        >
          <defs>
            <clipPath id="jarInner">
              <path d={JAR_BODY_PATH} />
            </clipPath>
            <linearGradient id="glassFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
              <stop offset="45%" stopColor="#DFFAB8" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="lidFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE066" />
              <stop offset="100%" stopColor={colors.yellowDark} />
            </linearGradient>
          </defs>

          {/* lid */}
          <rect x="42" y="2" width="46" height="16" rx="6" fill="url(#lidFill)" stroke={colors.yellowDark} strokeWidth="2.5" />
          <rect x="46" y="7" width="38" height="2" rx="1" fill="#fff" opacity="0.55" />

          {/* neck */}
          <rect x="46" y="16" width="38" height="18" fill="rgba(88,204,2,0.08)" stroke={colors.borderStrong} strokeWidth="2.5" />

          {/* body */}
          <path d={JAR_BODY_PATH} fill="url(#glassFill)" stroke={colors.borderStrong} strokeWidth="2.5" />

          {/* beads, clipped to the jar's interior */}
          <g clipPath="url(#jarInner)">
            {beads.map((b, i) => (
              <g key={i}>
                <circle cx={b.x} cy={b.y} r={b.r} fill={b.color} stroke={darken(b.color, 0.22)} strokeWidth="1" />
                <circle cx={b.x - 2.5} cy={b.y - 2.5} r="2.6" fill="#fff" fillOpacity="0.65" />
              </g>
            ))}
          </g>

          {/* glass shine */}
          <path d="M 30 48 Q 24 90 32 150" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" opacity="0.4" />
        </svg>
      </motion.div>

      <div className="min-w-0 flex-1 lg:flex-none lg:text-center">
        <div className="text-[44px] lg:text-[48px] lg:short:text-[40px] font-extrabold tracking-tight leading-none text-textPrimary">
          {beadCount}
        </div>
        <div className="mt-1 text-[13px] font-bold text-textMuted">{t('todayBeads')}</div>
        <ConfirmButton
          onConfirm={onReset}
          triggerLabel={t('resetJar')}
          confirmMessage={t('resetJarConfirm')}
          disabled={beadCount === 0}
          className="mt-2 lg:mt-1.5"
        />
      </div>
    </div>
  )
}
