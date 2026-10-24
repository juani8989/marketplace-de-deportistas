'use client'

import { useAuth } from '@/lib/auth-store'
import type { FamousAthlete } from '@/lib/wikipedia'
import { WhoAmI } from '@/components/auth/who-am-i'
import { AppShell } from '@/components/app-shell'
import { AppStoreProvider } from '@/components/app-store'

export function RootGate({ athletes }: { athletes: FamousAthlete[] }) {
  const auth = useAuth()

  if (auth.status === 'loading') return <div className="min-h-dvh bg-olympic-black" aria-busy="true" />
  if (auth.status === 'signed-out') return <WhoAmI athletes={athletes} />

  const viewer =
    auth.status === 'guest'
      ? ({ role: 'invitado', name: 'Invitado' } as const)
      : { role: auth.account.role, name: auth.account.name, account: auth.account }

  return (
    <AppStoreProvider key={auth.status === 'guest' ? 'guest' : auth.account.id} initialMode={viewer.role === 'deportista' || viewer.role === 'invitado' ? 'deportista' : 'empresa'}>
      <AppShell viewer={viewer} />
    </AppStoreProvider>
  )
}
