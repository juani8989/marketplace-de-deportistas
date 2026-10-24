'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setRouteRefresher, useIsGuest, type Account } from '@/lib/auth-store'
import type { FamousAthlete } from '@/lib/wikipedia'
import { WhoAmI } from '@/components/auth/who-am-i'
import { AppShell } from '@/components/app-shell'
import { AppStoreProvider } from '@/components/app-store'

export function RootGate({ athletes, account }: { athletes: FamousAthlete[]; account: Account | null }) {
  const router = useRouter()
  const isGuest = useIsGuest()

  useEffect(() => {
    setRouteRefresher(() => router.refresh())
  }, [router])

  if (account) {
    const viewer = { role: account.role, name: account.name, account }
    return (
      <AppStoreProvider key={account.id} initialMode={account.role === 'deportista' ? 'deportista' : 'empresa'}>
        <AppShell viewer={viewer} />
      </AppStoreProvider>
    )
  }

  if (isGuest === null) return <div className="min-h-dvh bg-olympic-black" aria-busy="true" />
  if (!isGuest) return <WhoAmI athletes={athletes} />

  return (
    <AppStoreProvider key="guest" initialMode="deportista">
      <AppShell viewer={{ role: 'invitado', name: 'Invitado' }} />
    </AppStoreProvider>
  )
}
