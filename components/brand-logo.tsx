import { cn } from '@/lib/utils'

const boostLetters = [
  { letter: 'B', className: 'text-olympic-blue' },
  { letter: 'O', className: 'text-olympic-yellow' },
  // Black ring letter gets a white outline so it stays legible on the dark UI.
  { letter: 'O', className: 'text-olympic-black [-webkit-text-stroke:1.5px_var(--color-olympic-white)]' },
  { letter: 'S', className: 'text-olympic-green' },
  { letter: 'T', className: 'text-olympic-red' },
]

export function BrandLogo({ className, sportClassName }: { className?: string; sportClassName?: string }) {
  return (
    <span className={cn('font-display font-extrabold uppercase tracking-tight', className)}>
      <span className="sr-only">BoostSport</span>
      <span aria-hidden="true">
        {boostLetters.map(({ letter, className: color }, i) => (
          <span key={i} className={color}>
            {letter}
          </span>
        ))}
        <span className={cn('text-olympic-white', sportClassName)}>Sport</span>
      </span>
    </span>
  )
}
