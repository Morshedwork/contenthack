import type { BrandThemeColor } from '@/types'
import { cn } from '@/lib/utils'

export function BrandThemeSwatches({
  colors,
  size = 'md',
  className,
}: {
  colors: BrandThemeColor[]
  size?: 'sm' | 'md'
  className?: string
}) {
  const sizeClass = size === 'sm' ? 'size-4' : 'size-5'
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {colors.slice(0, 5).map((color) => (
        <span
          key={`${color.role}-${color.hex}`}
          title={`${color.role}: ${color.hex}`}
          className={cn('rounded-full border border-border/60 shrink-0', sizeClass)}
          style={{ backgroundColor: color.hex }}
        />
      ))}
    </div>
  )
}
