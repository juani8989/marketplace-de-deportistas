import 'server-only'

import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import type { Account, AthleteProfile, OrgProfile, Role } from '@/lib/profile-types'

export async function getCurrentAccount(): Promise<Account | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const [row] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id)).limit(1)
  if (!row) return null

  return {
    id: session.user.id,
    role: row.role as Role,
    email: session.user.email,
    name: session.user.name,
    createdAt: row.createdAt.toISOString(),
    profile: row.data as AthleteProfile | OrgProfile,
  }
}
