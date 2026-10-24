'use client'

import { useState } from 'react'
import { useNav } from '@/components/app/nav'
import { CompanerosFeed } from '@/components/home/companeros-feed'
import { EmpresasFeed } from '@/components/home/empresas-feed'
import { EventosFeed } from '@/components/home/eventos-feed'
import { cn } from '@/lib/utils'

type Segment = 'companeros' | 'empresas' | 'eventos'

const labels: Record<Segment, string> = { companeros: 'Compañeros', empresas: 'Empresas', eventos: 'Eventos' }
const activeColor: Record<Segment, string> = {
  companeros: 'bg-olympic-blue text-olympic-white',
  empresas: 'bg-olympic-yellow text-olympic-black',
  eventos: 'bg-olympic-green text-olympic-white',
}

export function HomeFeed() {
  const { role } = useNav()
  const segments: Segment[] = role === 'deportista' ? ['companeros', 'empresas', 'eventos'] : ['companeros', 'eventos']
  const [segment, setSegment] = useState<Segment>('companeros')

  return (
    <div className="relative h-full">
      <div role="tablist" aria-label="Secciones del inicio" className="absolute inset-x-0 top-16 z-20 flex justify-center gap-1.5 px-4">
        {segments.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={segment === s}
            onClick={() => setSegment(s)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide backdrop-blur transition-colors',
              segment === s ? activeColor[s] : 'bg-background/60 text-muted-foreground',
            )}
          >
            {labels[s]}
          </button>
        ))}
      </div>
      <div key={segment} className="h-full snap-y snap-mandatory overflow-y-scroll [scrollbar-width:none]">
        {segment === 'companeros' ? <CompanerosFeed /> : segment === 'empresas' ? <EmpresasFeed /> : <EventosFeed />}
      </div>
    </div>
  )
}
