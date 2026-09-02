// A plain-text HH:mm input instead of the native <input type="time">, whose
// 12h/24h AM-PM display follows the browser's locale (not the `lang`
// attribute) and can't be reliably forced to 24h across browsers.
export default function TimeInput24({ value, onChange, className }) {
  function handleChange(e) {
    let digits = e.target.value.replace(/\D/g, '').slice(0, 4)
    let next = digits
    if (digits.length >= 3) next = `${digits.slice(0, 2)}:${digits.slice(2)}`
    onChange(next)
  }

  function handleBlur() {
    const match = value.match(/^(\d{1,2}):?(\d{1,2})?$/)
    if (!match) {
      onChange('')
      return
    }
    const hh = Math.min(23, parseInt(match[1], 10) || 0).toString().padStart(2, '0')
    const mm = Math.min(59, parseInt(match[2] || '0', 10) || 0).toString().padStart(2, '0')
    onChange(`${hh}:${mm}`)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="22:30"
      maxLength={5}
      className={className}
    />
  )
}
