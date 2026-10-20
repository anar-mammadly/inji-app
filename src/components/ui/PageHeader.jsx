// Page title, an optional one-line description, and page-level actions on the
// right (wrapping under the title on mobile).
export default function PageHeader({ title, subtitle, actions, className = '' }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-4 gap-y-3 mb-5 sm:mb-6 ${className}`}>
      <div className="min-w-0">
        <h1 className="font-display text-[26px] sm:text-[30px] leading-tight text-textPrimary">{title}</h1>
        {subtitle && <p className="mt-1 text-[14px] font-semibold text-textMuted max-w-[60ch]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
