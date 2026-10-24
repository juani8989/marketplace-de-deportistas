'use server'

import { and, eq, inArray } from 'drizzle-orm'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { db } from '@/lib/db'
import { matches, messages, profiles, user } from '@/lib/db/schema'
import { partyFromProfile, requireViewer, userKey, type Party } from '@/lib/viewer'
import { companies, companyFromKey, seedAthleteFromKey, seedAthleteKey } from '@/lib/catalog'
import { athletes } from '@/lib/data'
import type { AthleteProfile, OrgProfile } from '@/lib/profile-types'

export type SearchRole = 'deportista' | 'empresa' | 'evento'

export type Candidate = {
  party: Party
  needs: string[]
  summary: string
  invited: boolean
  matchId: number | null
}

export type ScoutResult = Candidate & { score: number; reason: string }

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

async function loadCandidates(viewerId: string, viewerKey: string, roles: SearchRole[]) {
  const rows = await db
    .select({ userId: profiles.userId, role: profiles.role, data: profiles.data, name: user.name })
    .from(profiles)
    .innerJoin(user, eq(user.id, profiles.userId))
    .where(inArray(profiles.role, roles))
    .limit(200)

  const list: Omit<Candidate, 'invited' | 'matchId'>[] = []
  if (roles.includes('deportista')) {
    for (const a of Object.values(athletes)) {
      const key = seedAthleteKey(a.id)
      list.push({
        party: { key, name: a.name, role: 'deportista', subtitle: `${a.sport} · ${a.city}`, image: a.image, initials: a.name.slice(0, 2).toUpperCase() },
        needs: a.sponsoredBy ? ['Indumentaria'] : ['Indumentaria', 'Viajes', 'Dinero'],
        summary: `${a.category} · ${a.level}. ${a.sponsoredBy ? `Patrocinado por ${a.sponsoredBy}.` : 'Busca su primer sponsor.'}`,
      })
    }
  }
  if (roles.includes('empresa')) {
    for (const c of companies) {
      list.push({
        party: { key: c.key, name: c.name, role: 'empresa', subtitle: c.industry, image: c.image, initials: c.initials },
        needs: [],
        summary: [c.lookingFor].flat().join(' · '),
      })
    }
  }
  for (const row of rows) {
    if (row.userId === viewerId) continue
    const key = userKey(row.userId)
    const data = row.data as AthleteProfile | OrgProfile
    list.push({
      party: partyFromProfile(key, data, row.name),
      needs: data.kind === 'deportista' ? data.needs ?? [] : [],
      summary:
        data.kind === 'deportista'
          ? [data.needsDetail, data.goals, data.achievements].filter(Boolean).join(' · ').slice(0, 400)
          : [data.lookingFor, data.description].filter(Boolean).join(' · ').slice(0, 400),
    })
  }

  const filtered = list.filter((c) => c.party.key !== viewerKey)
  const keys = filtered.map((c) => c.party.key)
  const existing = keys.length
    ? await db
        .select({ id: matches.id, athleteKey: matches.athleteKey, orgKey: matches.orgKey })
        .from(matches)
        .where(and(eq(matches.orgKey, viewerKey), inArray(matches.athleteKey, keys)))
    : []
  const byKey = new Map(existing.map((m) => [m.athleteKey, m.id]))
  return filtered.map((c) => ({ ...c, invited: byKey.has(c.party.key), matchId: byKey.get(c.party.key) ?? null }))
}

export async function searchPeople(query: string, role: SearchRole): Promise<Candidate[]> {
  const viewer = await requireViewer()
  if (viewer.role === 'deportista') return []
  const allowed: SearchRole[] = viewer.role === 'evento' ? ['deportista', 'empresa'] : ['deportista', 'evento']
  if (!allowed.includes(role)) return []
  const q = normalize(String(query ?? '').slice(0, 80).trim())
  const all = await loadCandidates(viewer.id, viewer.key, [role])
  if (!q) return all.slice(0, 30)
  return all.filter((c) => normalize(`${c.party.name} ${c.party.subtitle} ${c.summary}`).includes(q)).slice(0, 30)
}

export async function invite(targetKey: string, note: string): Promise<Result<{ matchId: number }>> {
  const viewer = await requireViewer()
  if (viewer.role === 'deportista') return { ok: false, error: 'Solo empresas y eventos pueden invitar.' }
  if (typeof targetKey !== 'string' || !/^(user:[\w-]+|seed:(co|at)-[a-z]+)$/.test(targetKey) || targetKey === viewer.key) {
    return { ok: false, error: 'Perfil inválido.' }
  }
  if (viewer.role === 'empresa' && companyFromKey(targetKey)) return { ok: false, error: 'Perfil inválido.' }

  const text = String(note ?? '').trim().slice(0, 500)
  const what = viewer.role === 'evento' ? `participar en ${viewer.name}` : `sumarte al equipo de ${viewer.name}`
  const body = text || `¡Hola! Te invitamos a ${what}. ¿Te interesa?`

  const [created] = await db.insert(matches).values({ athleteKey: targetKey, orgKey: viewer.key }).onConflictDoNothing().returning({ id: matches.id })
  let matchId = created?.id
  if (!matchId) {
    const [row] = await db.select({ id: matches.id }).from(matches).where(and(eq(matches.athleteKey, targetKey), eq(matches.orgKey, viewer.key))).limit(1)
    matchId = row?.id
  }
  if (!matchId) return { ok: false, error: 'No se pudo enviar la invitación.' }

  if (created) await db.insert(messages).values({ matchId, senderKey: 'system', kind: 'system', body: `${viewer.name} te envió una invitación.` })
  await db.insert(messages).values({ matchId, senderKey: viewer.key, kind: 'text', body })

  const seed = seedAthleteFromKey(targetKey) ?? companyFromKey(targetKey)
  if (seed) {
    await db.insert(messages).values({ matchId, senderKey: targetKey, kind: 'text', body: '¡Gracias por la invitación! Me encanta la propuesta, hablemos de los detalles.' })
  }
  return { ok: true, matchId }
}

const scoutSchema = z.object({
  results: z.array(
    z.object({
      key: z.string(),
      score: z.number().min(0).max(100),
      reason: z.string().describe('Una oración en español explicando por qué encaja o no'),
    }),
  ),
})

export async function aiScout(brief: string): Promise<Result<{ results: ScoutResult[]; usedAi: boolean }>> {
  const viewer = await requireViewer()
  if (viewer.role !== 'empresa' || viewer.profile.kind === 'deportista') return { ok: false, error: 'Solo empresas.' }
  const request = String(brief ?? '').trim().slice(0, 400)
  if (request.length < 5) return { ok: false, error: 'Contale a la IA qué perfil buscás.' }

  const candidates = await loadCandidates(viewer.id, viewer.key, ['deportista'])
  const byKey = new Map(candidates.map((c) => [c.party.key, c]))
  const roster = candidates.map((c) => ({ key: c.party.key, nombre: c.party.name, disciplina: c.party.subtitle, necesita: c.needs, resumen: c.summary }))

  try {
    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-5.5',
      output: Output.object({ schema: scoutSchema }),
      system:
        'Sos un scout de patrocinios deportivos. Evaluás candidatos para una marca y devolvés SOLO los que encajan con el pedido (score >= 50), ordenados de mayor a menor. Considerá la disciplina (deportes acuáticos incluyen natación, aguas abiertas, waterpolo, remo, surf, kayak, buceo, nado sincronizado, triatlón parcialmente) y si necesitan sponsor. Usá solo keys de la lista.',
      prompt: `Marca: ${viewer.profile.orgName} (${viewer.profile.category}). Busca: ${viewer.profile.lookingFor}\n\nPedido del usuario: ${request}\n\nCandidatos:\n${JSON.stringify(roster)}`,
    })
    const results = output.results
      .filter((r) => byKey.has(r.key))
      .sort((a, b) => b.score - a.score)
      .map((r) => ({ ...byKey.get(r.key)!, score: Math.round(r.score), reason: r.reason }))
    return { ok: true, results, usedAi: true }
  } catch (error) {
    console.error('aiScout failed, using keyword fallback', error)
    const water = /nata|agua|water|remo|surf|kayak|buceo|triat|canot/
    const results = candidates
      .filter((c) => water.test(normalize(`${c.party.subtitle} ${c.summary}`)))
      .map((c) => ({ ...c, score: 70 + Math.min(c.needs.length, 3) * 8, reason: 'Disciplina acuática y busca apoyo (filtro por palabras clave).' }))
      .sort((a, b) => b.score - a.score)
    return { ok: true, results, usedAi: false }
  }
}
