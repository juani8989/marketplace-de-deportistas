'use client'

import { useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { useAppStore } from '@/components/app-store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function NotificationBanner() {
  const { banner, dismissBanner } = useAppStore()

  useEffect(() => {
    if (!banner) return
    const t = setTimeout(dismissBanner, 4500)
    return () => clearTimeout(t)
  }, [banner, dismissBanner])

  if (!banner) return null

  return (
    <div
      role="status"
      aria-live="polite"
      key={banner.id}
      className="absolute inset-x-3 top-3 z-50 flex items-start gap-3 rounded-2xl bg-foreground p-3 text-background shadow-2xl animate-in slide-in-from-top duration-300"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Bell className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-bold">{banner.title}</span>
        <span className="line-clamp-2 text-xs leading-relaxed">{banner.body}</span>
      </div>
      <button type="button" onClick={dismissBanner} aria-label="Cerrar notificación" className="p-1">
        <X className="size-4" />
      </button>
    </div>
  )
}

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { notifications } = useAppStore()

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-background animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="notif-title">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <h2 id="notif-title" className="font-display text-2xl font-semibold">
          Notificaciones
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
          <X className="size-5" />
        </Button>
      </div>
      <ul className="flex flex-1 flex-col overflow-y-auto">
        {notifications.map((n) => (
          <li key={n.id} className={cn('flex gap-3 border-b border-border px-4 py-4', n.highlight && 'bg-accent/10')}>
            <span
              aria-hidden
              className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.highlight ? 'bg-accent' : 'bg-muted-foreground')}
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{n.title}</span>
              <span className="text-sm leading-relaxed text-muted-foreground">{n.body}</span>
              <span className="text-xs text-muted-foreground">{n.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
