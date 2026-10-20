// Standard page frame: centered column with responsive gutters. `width`
// picks the max line of the page — narrow for forms, wide for grids.
const WIDTHS = {
  narrow: 'max-w-[640px]',
  normal: 'max-w-[1040px]',
  wide: 'max-w-[1360px]',
}

export default function Page({ width = 'normal', className = '', children }) {
  return (
    <div className={`w-full ${WIDTHS[width]} mx-auto px-4 sm:px-6 lg:px-8 pt-5 md:pt-8 pb-8 md:pb-12 ${className}`}>
      {children}
    </div>
  )
}
