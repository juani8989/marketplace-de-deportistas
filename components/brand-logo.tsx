import { cn } from '@/lib/utils'

export function BrandLogo({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tone === 'dark' ? '/brand/logo-oscuro.svg' : '/brand/logo-claro.svg'}
      alt="BoostSport"
      width={110}
      height={32}
      className={cn('h-8 w-auto', className)}
    />
  )
}

export function BrandMark({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tone === 'dark' ? '/brand/isotipo-oscuro.svg' : '/brand/isotipo-claro.svg'}
      alt=""
      aria-hidden="true"
      width={32}
      height={32}
      className={cn('size-8', className)}
    />
  )
}

export function BrandLine({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('h-0.5 w-full bg-brand-line', className)} />
}
