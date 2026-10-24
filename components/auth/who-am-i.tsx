'use client'

import { useState } from 'react'
import { ArrowRight, Eye } from 'lucide-react'
import { enterAsGuest, type Role } from '@/lib/auth-store'
import { brandLogos, eventImages, roleConfig } from '@/lib/roles'
import type { FamousAthlete } from '@/lib/wikipedia'
import { AuthPanel } from '@/components/auth/auth-panel'
import { BrandLine, BrandLogo } from '@/components/brand-logo'
import { cn } from '@/lib/utils'

function OlympicRings({ className }: { className?: string }) {
  const rings = [
    { cx: 60, cy: 60, color: 'var(--color-olympic-blue)' },
    { cx: 190, cy: 60, color: 'var(--color-olympic-white)' },
    { cx: 320, cy: 60, color: 'var(--color-olympic-red)' },
    { cx: 125, cy: 120, color: 'var(--color-olympic-yellow)' },
    { cx: 255, cy: 120, color: 'var(--color-olympic-green)' },
  ]
  return (
    <svg viewBox="0 0 380 185" aria-hidden className={className}>
      {rings.map((r) => (
        <circle key={r.cx} cx={r.cx} cy={r.cy} r={52} fill="none" stroke={r.color} strokeWidth={11} />
      ))}
    </svg>
  )
}

const reveal =
  'translate-y-6 opacity-0 transition-all duration-500 ease-out md:group-hover:translate-y-0 md:group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100'

function AthleteCollage({ athletes }: { athletes: FamousAthlete[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {athletes.slice(0, 9).map((a, i) => (
        <figure key={a.name} className={cn(reveal, 'relative aspect-[3/4] overflow-hidden rounded-md')} style={{ transitionDelay: `${i * 45}ms` }}>
          <img src={a.image} alt={a.name} referrerPolicy="no-referrer" className="size-full object-cover object-top" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-olympic-black/70 px-1.5 py-1 text-[10px] font-semibold leading-tight text-olympic-white">
            {a.name}
            <span className="block font-normal opacity-70">{a.sport}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

function BrandCollage() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {brandLogos.map((b, i) => (
        <div key={b.name} className={cn(reveal, 'flex aspect-square items-center justify-center rounded-md bg-olympic-white p-4')} style={{ transitionDelay: `${i * 45}ms` }}>
          <img src={b.src} alt={b.name} className="max-h-full max-w-full object-contain" />
        </div>
      ))}
    </div>
  )
}

function EventCollage() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {eventImages.map((e, i) => (
        <figure key={e.name} className={cn(reveal, 'relative aspect-[4/5] overflow-hidden rounded-md')} style={{ transitionDelay: `${i * 70}ms` }}>
          <img src={e.src} alt={e.name} className="size-full object-cover" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-olympic-black/70 px-2 py-1 text-xs font-semibold text-olympic-white">
            {e.name}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

function RolePanel({ role, onSelect, children }: { role: Role; onSelect: () => void; children: React.ReactNode }) {
  const config = roleConfig[role]
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative flex flex-1 flex-col overflow-hidden border-olympic-white/25 text-left md:first:border-l-0 outline-none transition-[flex-grow] duration-500 ease-out md:border-l md:hover:grow-[1.7] md:focus-visible:grow-[1.7] max-md:border-t',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500 ease-out md:group-hover:scale-y-100 group-focus-visible:scale-y-100',
          config.bg,
        )}
      />
      <div className="relative z-10 hidden flex-1 items-start justify-center overflow-hidden px-5 pt-52 md:flex">
        <div className="w-full max-w-72">{children}</div>
      </div>
      <div
        className={cn(
          'relative z-10 flex flex-col gap-2 p-5 text-olympic-white transition-colors duration-300 md:p-6',
          role === 'empresa' && 'md:group-hover:text-olympic-black group-focus-visible:text-olympic-black',
        )}
      >
        <span aria-hidden className={cn('h-1.5 w-10 rounded-full', config.bg, 'transition-colors md:group-hover:bg-current')} />
        <span className="font-display text-3xl font-semibold leading-none text-balance md:text-4xl">
          {config.label}
        </span>
        <span className="text-sm opacity-80 text-pretty">{config.tagline}</span>
        <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold">
          Ingresar <ArrowRight className="size-4 transition-transform md:group-hover:translate-x-1" />
        </span>
      </div>
    </button>
  )
}

export function WhoAmI({ athletes }: { athletes: FamousAthlete[] }) {
  const [selected, setSelected] = useState<Role | null>(null)

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-olympic-black text-olympic-white">
      <OlympicRings className="pointer-events-none absolute left-1/2 top-1/2 w-[min(1100px,140vw)] -translate-x-1/2 -translate-y-1/2 opacity-15" />
      <BrandLine className="relative z-30" />
      <header className="pointer-events-none relative z-20 flex flex-col items-center gap-3 px-6 pt-6 text-center md:absolute md:inset-x-0 md:top-0.5">
        <BrandLogo className="h-11 md:h-14" />
        <div className="flex flex-col items-center gap-1">
          <p className="eyebrow text-xs text-olympic-white/60">El marketplace del deporte</p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">{'¿Quién sos?'}</h1>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col pt-8 md:flex-row md:pt-0">
        <RolePanel role="deportista" onSelect={() => setSelected('deportista')}>
          <AthleteCollage athletes={athletes} />
        </RolePanel>
        <RolePanel role="empresa" onSelect={() => setSelected('empresa')}>
          <BrandCollage />
        </RolePanel>
        <RolePanel role="evento" onSelect={() => setSelected('evento')}>
          <EventCollage />
        </RolePanel>
      </div>

      <footer className="relative z-20 flex flex-wrap items-center justify-center gap-3 border-t border-olympic-white/10 bg-olympic-black px-6 py-4 text-sm">
        <span className="text-olympic-white/60">¿Solo querés mirar?</span>
        <button
          type="button"
          onClick={enterAsGuest}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Eye className="size-4" /> Entrar como invitado
        </button>
      </footer>

      {selected ? <AuthPanel role={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  )
}
