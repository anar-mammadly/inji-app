import { useState } from 'react'
import { motion } from 'framer-motion'
import { getVisibleBeads } from '../utils/beadPositions'
import { colors, darken } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'

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
  const [confirming, setConfirming] = useState(false)

  function handleReset() {
    onReset()
    setConfirming(false)
  }

  return (
    <div className="flex flex-col items-center">
      <motion.div whileHover={{ scale: 1.02 }} ref={jarRef} data-jar="true">
        <svg width="130" height="172" viewBox="0 0 130 172">
          <defs>
            <clipPath id="jarInner">
              <path d={JAR_BODY_PATH} />
            </clipPath>
            <linearGradient id="glassFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
              <stop offset="45%" stopColor="#CFE7DF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="lidFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D9D6CE" />
              <stop offset="100%" stopColor={colors.borderStrong} />
            </linearGradient>
          </defs>

          {/* lid */}
          <rect x="42" y="2" width="46" height="16" rx="4" fill="url(#lidFill)" stroke={colors.borderStrong} strokeWidth="1" />
          <rect x="42" y="7" width="46" height="1.5" fill="#fff" opacity="0.4" />
          <rect x="42" y="12" width="46" height="1.5" fill="#fff" opacity="0.25" />

          {/* neck */}
          <rect x="46" y="14" width="38" height="20" fill="rgba(200,220,210,0.15)" stroke="#B4B2A9" strokeWidth="1.5" />

          {/* body */}
          <path d={JAR_BODY_PATH} fill="url(#glassFill)" stroke="#B4B2A9" strokeWidth="1.5" />

          {/* beads, clipped to the jar's interior */}
          <g clipPath="url(#jarInner)">
            {beads.map((b, i) => (
              <g key={i}>
                <circle cx={b.x} cy={b.y} r={b.r} fill={b.color} stroke={darken(b.color, 0.2)} strokeWidth="0.5" />
                <circle cx={b.x - 2.5} cy={b.y - 2.5} r="2.5" fill="#fff" fillOpacity="0.5" />
              </g>
            ))}
          </g>

          {/* glass shine */}
          <path
            d="M 30 48 Q 24 90 32 150"
            fill="none"
            stroke="#fff"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.3"
          />
          <path
            d="M 44 40 Q 40 55 44 70"
            fill="none"
            stroke="#fff"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.35"
          />
        </svg>
      </motion.div>

      <div className="mt-2 text-center">
        <div className="text-[24px] font-medium leading-none" style={{ color: colors.textPrimary }}>
          {beadCount}
        </div>
        <div className="text-xs" style={{ color: colors.textMuted }}>
          {t('todayBeads')}
        </div>
      </div>

      <div className="mt-2 w-full">
        {confirming ? (
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] text-center" style={{ color: colors.textSecondary }}>
              {t('resetJarConfirm')}
            </span>
            <div className="flex gap-2 w-full">
              <button
                onClick={handleReset}
                className="flex-1 text-[11px] py-1 rounded-[8px]"
                style={{ background: colors.coral, color: '#fff' }}
              >
                {t('confirm')}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 text-[11px] py-1 rounded-[8px] border"
                style={{ borderColor: colors.border, color: colors.textSecondary }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            disabled={beadCount === 0}
            className="w-full text-[11px] text-center transition-opacity disabled:opacity-40"
            style={{ color: colors.textMuted }}
          >
            {t('resetJar')}
          </button>
        )}
      </div>
    </div>
  )
}
