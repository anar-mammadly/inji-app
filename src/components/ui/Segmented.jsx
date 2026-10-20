// Segmented control: a row of mutually exclusive options in a sunken track.
// options: [{ value, label, count? }]
export default function Segmented({ options, value, onChange, className = '', size = 'md' }) {
  const h = size === 'sm' ? 'h-8 text-[13px]' : 'h-10 text-[14px]'
  return (
    <div role="tablist" className={`inline-flex rounded-2xl bg-surfaceAlt p-1 gap-1 ${className}`}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-1.5 sm:px-3 rounded-xl font-extrabold whitespace-nowrap transition-colors ${h} ${
              active ? 'bg-white text-blueDark border-2 border-border shadow-[0_2px_0_#E5E7EB]' : 'text-textMuted hover:text-textSecondary border-2 border-transparent'
            }`}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={`tabular-nums text-[12px] px-1.5 rounded-full ${active ? 'bg-blueSoft text-blueDark' : 'bg-white/70 text-textMuted'}`}>
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
