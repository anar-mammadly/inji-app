const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const SIZES = {
  sm: { select: 'px-1.5 py-1.5 text-[12px]', sep: 'text-[12px]' },
  md: { select: 'px-2 py-2 text-[13px]', sep: 'text-[13px]' },
}

// Two native <select> dropdowns (00-23 / 00-59) instead of a free-text field
// or the native <input type="time">, whose 12h/24h display follows the
// browser's locale and can't be forced to 24h reliably across browsers.
export default function TimeInput24({ value, onChange, size = 'md', className = '' }) {
  const [hh, mm] = value ? value.split(':') : ['', '']
  const s = SIZES[size]

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <select
        value={hh || ''}
        onChange={(e) => onChange(`${e.target.value}:${mm || '00'}`)}
        className={`font-bold rounded-lg border-2 border-border outline-none focus:border-accent bg-surface ${s.select}`}
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
        className={`font-bold rounded-lg border-2 border-border outline-none focus:border-accent bg-surface ${s.select}`}
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
