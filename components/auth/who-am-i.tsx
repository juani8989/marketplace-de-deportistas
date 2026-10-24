'use client'

import { useState } from 'react'
import { ArrowRight, Eye } from 'lucide-react'
import { enterAsGuest, type Role } from '@/lib/auth-store'
import { roleConfig } from '@/lib/roles'
import type { FamousAthlete } from '@/lib/wikipedia'
import { AuthPanel } from '@/components/auth/auth-panel'
import { BrandLine } from '@/components/brand-logo'
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

const panelImages: Record<Role, { src: string; alt: string; position: string }> = {
  deportista: {
    src: '/images/hero-athlete.png',
    alt: 'Judoca argentina celebrando una medalla de oro olímpica',
    position: 'object-[50%_25%]',
  },
  empresa: {
    src: '/images/hero-sponsor.png',
    alt: 'Gimnasio con suplementos y banners de sponsors',
    position: 'object-center',
  },
  evento: {
    src: '/images/hero-event.png',
    alt: 'Estadio olímpico lleno de público con atletas en la pista',
    position: 'object-center',
  },
}

function RolePanel({ role, onSelect }: { role: Role; onSelect: () => void }) {
  const config = roleConfig[role]
  const image = panelImages[role]
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex min-h-48 flex-1 flex-col justify-end overflow-hidden border-olympic-white/25 text-left outline-none transition-[flex-grow] duration-500 ease-out max-md:border-t md:border-l md:first:border-l-0 md:hover:grow-[1.7] md:focus-visible:grow-[1.7]"
    >
      <img
        src={image.src}
        alt={image.alt}
        className={cn(
          'absolute inset-0 size-full scale-110 object-cover opacity-0 transition-all duration-700 ease-out md:group-hover:scale-100 md:group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100',
          image.position,
        )}
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-olympic-black via-olympic-black/40 to-transparent opacity-0 transition-opacity duration-700 md:group-hover:opacity-100 group-focus-visible:opacity-100"
      />
      <div className="relative z-10 flex flex-col gap-2 p-5 text-olympic-white md:p-6">
        <span aria-hidden className={cn('h-1.5 w-10 rounded-full transition-all duration-500 md:group-hover:w-16', config.bg)} />
        <span className="font-display text-3xl font-semibold leading-none text-balance md:text-4xl">{config.label}</span>
        <span className="text-sm opacity-80 text-pretty">{config.tagline}</span>
        <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold">
          Ingresar <ArrowRight className="size-4 transition-transform md:group-hover:translate-x-1" />
        </span>
      </div>
    </button>
  )
}

export function WhoAmI(_props: { athletes?: FamousAthlete[] }) {
  const [selected, setSelected] = useState<Role | null>(null)

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-olympic-black text-olympic-white">
      <OlympicRings className="pointer-events-none absolute left-1/2 top-[55%] w-[min(1500px,170vw)] -translate-x-1/2 -translate-y-1/2 opacity-45" />
      <BrandLine className="relative z-30" />
      <header className="pointer-events-none relative z-20 flex flex-col items-center gap-3 px-6 pt-6 text-center md:absolute md:inset-x-0 md:top-0.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-contorno.svg" alt="BoostSport" width={480} height={140} className="h-24 w-auto md:h-32" />
        <div className="flex flex-col items-center gap-1">
          <p className="eyebrow text-xs text-olympic-white/60">El marketplace del deporte</p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">{'¿Quién sos?'}</h1>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col pt-8 md:flex-row md:pt-0">
        <RolePanel role="deportista" onSelect={() => setSelected('deportista')} />
        <RolePanel role="empresa" onSelect={() => setSelected('empresa')} />
        <RolePanel role="evento" onSelect={() => setSelected('evento')} />
      </div>

      <footer className="relative z-20 flex flex-wrap items-center justify-center gap-3 border-t border-olympic-white/10 bg-olympic-black/80 px-6 py-4 text-sm backdrop-blur">
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
