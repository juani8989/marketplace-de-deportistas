'use client'

import { useState } from 'react'
import { Bell, Handshake, Route, Trophy } from 'lucide-react'
import { useAppStore, type Tab } from '@/components/app-store'
import { RutaFeed } from '@/components/feed/ruta-feed'
import { VitrinaFeed } from '@/components/feed/vitrina-feed'
import { MatchFeed } from '@/components/feed/match-feed'
import { NotificationBanner, NotificationsPanel } from '@/components/notifications'
import { companyName } from '@/lib/data'
import { cn } from '@/lib/utils'

const tabs: { id: Tab; label: string; icon: typeof Route }[] = [
  { id: 'ruta', label: 'Ruta', icon: Route },
  { id: 'match', label: 'Match', icon: Handshake },
  { id: 'vitrina', label: 'Vitrina', icon: Trophy },
]

const tabSubtitle: Record<Tab, { deportista: string; empresa: string }> = {
  ruta: { deportista: 'Hacia dónde van', empresa: 'Hacia dónde van' },
  vitrina: { deportista: 'Lo que ya demostraron', empresa: 'Lo que ya demostraron' },
  match: { deportista: 'Marcas que te buscan', empresa: `Deportistas para ${companyName}` },
}

function ModeSwitch() {
  const { mode, setMode } = useAppStore()
  return (
    <div role="radiogroup" aria-label="Ver como" className="flex rounded-full bg-background/60 p-1 text-xs font-semibold backdrop-blur">
      {(['deportista', 'empresa'] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => setMode(m)}
          className={cn(
            'rounded-full px-3 py-1.5 capitalize transition-colors',
            mode === m ? 'bg-foreground text-background' : 'text-foreground',
          )}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

export function AppShell() {
  const { tab, setTab, mode, unreadCount, markAllRead } = useAppStore()
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <main className="flex min-h-dvh items-center justify-center md:py-6">
      <div className="relative h-dvh w-full overflow-hidden bg-background md:h-[min(860px,calc(100dvh-3rem))] md:max-w-[420px] md:rounded-[2.5rem] md:border md:border-border md:shadow-2xl">
        <header className="absolute inset-x-0 top-0 z-30 flex flex-col gap-2 bg-gradient-to-b from-background/90 to-transparent px-4 pb-6 pt-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">
              Dorsal<span className="text-accent">.</span>
            </h1>
            <ModeSwitch />
            <button
              type="button"
              onClick={() => {
                setShowNotifications(true)
                markAllRead()
              }}
              aria-label={`Notificaciones${unreadCount ? `, ${unreadCount} sin leer` : ''}`}
              className="relative flex size-10 items-center justify-center rounded-full bg-background/60 backdrop-blur"
            >
              <Bell className="size-5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {unreadCount}
                </span>
              ) : null}
            </button>
          </div>
          <p className="text-xs font-medium text-muted-foreground">{tabSubtitle[tab][mode]}</p>
        </header>

        <div key={`${tab}-${mode}`} className="h-full snap-y snap-mandatory overflow-y-auto no-scrollbar">
          {tab === 'ruta' ? <RutaFeed /> : null}
          {tab === 'vitrina' ? <VitrinaFeed /> : null}
          {tab === 'match' ? <MatchFeed /> : null}
        </div>

        <nav aria-label="Secciones" className="absolute inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 px-6 pb-4 pt-2 backdrop-blur">
          <ul className="flex items-end justify-between">
            {tabs.map(({ id, label, icon: Icon }) => {
              const active = tab === id
              const isMatch = id === 'match'
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setTab(id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex flex-col items-center gap-1 text-xs font-semibold transition-colors',
                      active ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {isMatch ? (
                      <span
                        className={cn(
                          '-mt-6 flex size-14 items-center justify-center rounded-2xl shadow-lg transition-colors',
                          active ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground',
                        )}
                      >
                        <Icon className="size-6" />
                      </span>
                    ) : (
                      <Icon className="size-6" />
                    )}
                    {label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <NotificationBanner />
        {showNotifications ? <NotificationsPanel onClose={() => setShowNotifications(false)} /> : null}
      </div>
    </main>
  )
}
