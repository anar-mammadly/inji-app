export default function Card({ as: Tag = 'div', className = '', padded = true, ...props }) {
  return (
    <Tag
      className={`rounded-3xl border-2 border-border bg-surface shadow-card ${padded ? 'p-4' : ''} ${className}`}
      {...props}
    />
  )
}
