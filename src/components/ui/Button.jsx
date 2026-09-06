const VARIANTS = {
  primary: { bg: '#58CC02', shadow: '#46A302', text: '#fff', border: 'transparent' },
  secondary: { bg: '#fff', shadow: '#D1D5DB', text: '#6B7280', border: '#E5E7EB' },
  danger: { bg: '#FF4B4B', shadow: '#EA2B2B', text: '#fff', border: 'transparent' },
}

const SIZES = {
  sm: 'text-[12px] px-3 py-1.5 rounded-xl',
  md: 'text-[13px] px-4 py-2.5 rounded-2xl',
}

export default function Button({ variant = 'primary', size = 'md', className = '', style = {}, disabled, ...props }) {
  if (variant === 'ghost') {
    return (
      <button
        className={`font-bold text-textMuted hover:text-textSecondary transition-colors disabled:opacity-40 ${SIZES[size]} ${className}`}
        disabled={disabled}
        {...props}
      />
    )
  }

  const v = VARIANTS[variant]

  return (
    <button
      disabled={disabled}
      className={`font-bold border-2 transition-transform active:translate-y-[3px] disabled:opacity-40 disabled:active:translate-y-0 ${SIZES[size]} ${className}`}
      style={{
        background: v.bg,
        color: v.text,
        borderColor: v.border,
        boxShadow: `0 4px 0 ${v.shadow}`,
        ...style,
      }}
      {...props}
    />
  )
}
