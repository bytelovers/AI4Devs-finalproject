import { cn } from '@/lib/utils'
import type { Person } from '@/lib/types'

interface AvatarProps {
  person?: Person
  name?: string
  color?: string
  initials?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
}

export function Avatar({
  person,
  name,
  color,
  initials,
  size = 'sm',
  className,
}: AvatarProps) {
  const c = person?.color ?? color ?? '#10b981'
  const init = person?.initials ?? initials ?? name?.slice(0, 2).toUpperCase() ?? '?'
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 ring-2 ring-white/80',
        SIZES[size],
        className
      )}
      style={{ backgroundColor: c }}
      aria-label={person?.name ?? name}
    >
      {init}
    </div>
  )
}

/** Pila de avatares (overlapping). */
export function AvatarStack({
  people,
  max = 4,
  size = 'sm',
}: {
  people: Person[]
  max?: number
  size?: AvatarProps['size']
}) {
  const visible = people.slice(0, max)
  const extra = people.length - visible.length
  return (
    <div className="flex items-center -space-x-2">
      {visible.map((p) => (
        <Avatar key={p.id} person={p} size={size} />
      ))}
      {extra > 0 && (
        <div
          className={cn(
            'inline-flex items-center justify-center rounded-full font-semibold text-white bg-muted-foreground ring-2 ring-white',
            SIZES[size!]
          )}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}
