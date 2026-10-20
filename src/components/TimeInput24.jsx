const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const SIZES = {
  sm: { select: 'h-9 pl-2 pr-1 text-[13px] rounded-xl', sep: 'text-[13px]' },
  md: { select: 'h-11 pl-2.5 pr-1.5 text-[14px] rounded-xl', sep: 'text-[14px]' },
}

const SELECT_BASE =
  'font-bold tabular-nums text-textPrimary border-2 border-border bg-white outline-none cursor-pointer transition-colors hover:border-borderStrong focus:border-blue'

// Two native <select> dropdowns (00-23 / 00-59) instead of a free-text field
// or the native <input type="time">, whose 12h/24h display follows the
// browser's locale and can't be forced to 24h reliably across browsers.
export default function TimeInput24({ value, onChange, size = 'md', className = '' }) {
  const [hh, mm] = value ? value.split(':') : ['', '']
  const s = SIZES[size]

  return (
    <div className={`flex items-center gap-1 shrink-0 ${className}`}>
      <select
        value={hh || ''}
        onChange={(e) => onChange(`${e.target.value}:${mm || '00'}`)}
        className={`${SELECT_BASE} ${s.select}`}
      >
        <option value="" disabled>
          --
        </option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className={`font-extrabold text-textMuted ${s.sep}`}>:</span>
      <select
        value={mm || ''}
        onChange={(e) => onChange(`${hh || '00'}:${e.target.value}`)}
        className={`${SELECT_BASE} ${s.select}`}
      >
        <option value="" disabled>
          --
        </option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  )
}
