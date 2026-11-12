// Chunky 3D buttons: a solid bottom "ledge" that the button sinks onto when
// pressed (see .press in index.css).
const VARIANTS = {
  primary: 'bg-accent text-onAccent border-2 border-transparent shadow-[0_4px_0_#46A302] hover:bg-[#61D90A]',
  secondary: 'bg-white text-textSecondary border-2 border-border shadow-[0_4px_0_#E5E7EB] hover:bg-surfaceAlt',
  soft: 'bg-blueSoft text-blueInk border-2 border-transparent shadow-[0_4px_0_#B5E5FB] hover:bg-[#CDEEFF]',
  danger: 'bg-danger text-white border-2 border-transparent shadow-[0_4px_0_#B91C1C] hover:bg-dangerDark',
  ghost: 'text-textMuted hover:text-textSecondary hover:bg-surfaceAlt',
}

const SIZES = {
  sm: 'text-[13px] h-9 px-3.5 rounded-xl gap-1.5',
  md: 'text-[15px] h-11 px-5 rounded-2xl gap-2',
}

export default function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      className={`press inline-flex items-center justify-center font-extrabold whitespace-nowrap transition-colors disabled:opacity-40 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  )
}
