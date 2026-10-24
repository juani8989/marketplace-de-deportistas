'use server'

import { and, count, desc, eq, inArray, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { follows, matches, messages, posts, profiles, reactions } from '@/lib/db/schema'
import { describeParties, getViewer, requireViewer, userKey, type Party } from '@/lib/viewer'
import { seedAthleteFromKey, seedAthleteKey, seedDaily } from '@/lib/catalog'
import { rutaPosts, vitrinaPosts } from '@/lib/data'
import type { AthleteProfile } from '@/lib/profile-types'
import type { OfferMeta } from '@/app/actions/match'

export type ProfilePost = { id: string; body: string; image: string | null; kind: string; createdAt: string; likes: number }

export type PublicAthlete = {
  key: string
  party: Party
  isMe: boolean
  following: boolean
  supported: boolean
  canMessage: boolean
  matchId: number | null
  stats: { posts: number; followers: number; likes: number; apoyos: number }
  sponsors: string[]
  profile: Omit<AthleteProfile, 'selfie'>
  posts: ProfilePost[]
}

type Result = { ok: true } | { ok: false; error: string }

async function sumReactions(targetIds: string[], kind: string) {
  if (!targetIds.length) return 0
  const [row] = await db
    .select({ n: count() })
    .from(reactions)
    .where(and(inArray(reactions.targetId, targetIds), eq(reactions.kind, kind)))
  return Number(row?.n ?? 0)
}

export async function getAthleteProfile(key: string): Promise<PublicAthlete | null> {
  const viewer = await getViewer()
  const targetKey = key === 'me' && viewer ? viewer.key : key
  if (!/^(user:[\w-]+|seed:at-[a-z]+)$/.test(targetKey)) return null

  const [parties, followerRow, followingRow, supportRow, matchRow] = await Promise.all([
    describeParties([targetKey]),
    db.select({ n: count() }).from(follows).where(eq(follows.targetId, targetKey)),
    viewer
      ? db.select({ t: follows.targetId }).from(follows).where(and(eq(follows.followerId, viewer.id), eq(follows.targetId, targetKey))).limit(1)
      : Promise.resolve([]),
    viewer
      ? db
          .select({ t: reactions.targetId })
          .from(reactions)
          .where(and(eq(reactions.userId, viewer.id), eq(reactions.targetId, `athlete:${targetKey}`), eq(reactions.kind, 'apoyo')))
          .limit(1)
      : Promise.resolve([]),
    viewer && viewer.role !== 'deportista'
      ? db.select({ id: matches.id }).from(matches).where(and(eq(matches.athleteKey, targetKey), eq(matches.orgKey, viewer.key))).limit(1)
      : Promise.resolve([]),
  ])
  const party = parties.get(targetKey)
  if (!party || party.role !== 'deportista') return null

  const athleteMatches = await db.select({ id: matches.id, orgKey: matches.orgKey }).from(matches).where(eq(matches.athleteKey, targetKey))
  const sponsors: string[] = []
  if (athleteMatches.length) {
    const offers = await db
      .select({ matchId: messages.matchId, meta: messages.meta })
      .from(messages)
      .where(and(inArray(messages.matchId, athleteMatches.map((m) => m.id)), eq(messages.kind, 'offer')))
    const closed = new Set(offers.filter((o) => (o.meta as OfferMeta).status === 'aceptada').map((o) => o.matchId))
    const orgParties = await describeParties(athleteMatches.filter((m) => closed.has(m.id)).map((m) => m.orgKey))
    sponsors.push(...[...orgParties.values()].map((p) => p.name))
  }

  const athleteSupport = await sumReactions([`athlete:${targetKey}`], 'apoyo')
  const base = {
    key: targetKey,
    party,
    isMe: viewer?.key === targetKey,
    following: followingRow.length > 0,
    supported: supportRow.length > 0,
    canMessage: matchRow.length > 0,
    matchId: matchRow[0]?.id ?? null,
  }

  const seed = seedAthleteFromKey(targetKey)
  if (seed) {
    const seedPosts = seedDaily.filter((s) => s.athleteId === seed.id)
    const goals = rutaPosts.filter((p) => 'athleteId' in p && p.athleteId === seed.id && (p.type === 'goal' || p.type === 'project'))
    const wins = vitrinaPosts.filter((p) => 'athleteId' in p && p.athleteId === seed.id)
    const [first, ...rest] = seed.name.split(' ')
    if (seed.sponsoredBy) sponsors.unshift(seed.sponsoredBy)
    const baseLikes = seedPosts.reduce((acc, p) => acc + p.baseLikes, 0)
    return {
      ...base,
      stats: {
        posts: seedPosts.length + 12,
        followers: Math.round(parseFloat(seed.followers.replace(',', '.')) * 1000) + Number(followerRow[0]?.n ?? 0),
        likes: baseLikes + (await sumReactions(seedPosts.map((p) => p.id), 'like')),
        apoyos: Math.round(baseLikes / 6) + athleteSupport,
      },
      sponsors: [...new Set(sponsors)],
      profile: {
        kind: 'deportista',
        firstName: first,
        lastName: rest.join(' '),
        country: seed.city,
        discipline: seed.sport,
        famous: false,
        identityVerified: true,
        photo: seed.image,
        age: '',
        goals: goals.map((g) => ('title' in g ? g.title : '')).filter(Boolean).join('\n') || 'Clasificar al próximo Nacional',
        achievements: wins.map((w) => ('title' in w ? String(w.title) : '')).filter(Boolean).join('\n') || `Nivel ${seed.level} · ${seed.category}`,
        studies: '',
        recognitions: '',
        timeline: [],
        socials: { instagram: seed.handle, tiktok: '', x: '', youtube: '' },
        needs: ['Indumentaria', 'Viajes'],
        needsDetail: '',
      },
      posts: seedPosts.map((p) => ({ id: p.id, body: p.body, image: p.image, kind: p.kind, createdAt: new Date(Date.now() - p.minutesAgo * 60_000).toISOString(), likes: p.baseLikes })),
    }
  }

  const userId = targetKey.slice(5)
  const [row] = await db.select({ data: profiles.data }).from(profiles).where(eq(profiles.userId, userId)).limit(1)
  if (!row) return null
  const { selfie: _selfie, ...profile } = row.data as AthleteProfile

  const myPosts = await db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt)).limit(30)
  const postIds = myPosts.map((p) => `post:${p.id}`)
  const likeRows = postIds.length
    ? await db
        .select({ targetId: reactions.targetId, n: count() })
        .from(reactions)
        .where(and(inArray(reactions.targetId, postIds), eq(reactions.kind, 'like')))
        .groupBy(reactions.targetId)
    : []
  const likesBy = new Map(likeRows.map((r) => [r.targetId, Number(r.n)]))

  return {
    ...base,
    stats: {
      posts: myPosts.length,
      followers: Number(followerRow[0]?.n ?? 0),
      likes: [...likesBy.values()].reduce((a, b) => a + b, 0),
      apoyos: (await sumReactions(postIds, 'apoyo')) + athleteSupport,
    },
    sponsors,
    profile,
    posts: myPosts.map((p) => ({ id: `post:${p.id}`, body: p.body, image: p.mediaUrl, kind: p.kind, createdAt: p.createdAt.toISOString(), likes: likesBy.get(`post:${p.id}`) ?? 0 })),
  }
}

export async function updateMyAthleteProfile(next: AthleteProfile): Promise<Result> {
  const viewer = await requireViewer()
  if (viewer.role !== 'deportista' || viewer.profile.kind !== 'deportista') return { ok: false, error: 'Solo deportistas.' }
  if (!next || next.kind !== 'deportista' || !next.firstName?.trim() || !next.discipline?.trim()) {
    return { ok: false, error: 'Completá nombre y disciplina.' }
  }
  const current = viewer.profile
  const merged: AthleteProfile = {
    ...next,
    famous: current.famous,
    identityVerified: current.identityVerified,
    selfie: current.selfie,
    wikiUrl: current.wikiUrl,
  }
  if (JSON.stringify(merged).length > 3_000_000) return { ok: false, error: 'El perfil es demasiado grande.' }
  await db.update(profiles).set({ data: merged, updatedAt: new Date() }).where(eq(profiles.userId, viewer.id))
  return { ok: true }
}

export async function getMyOrgSummary() {
  const viewer = await requireViewer()
  const rows = await db.select({ id: matches.id }).from(matches).where(or(eq(matches.orgKey, viewer.key), eq(matches.athleteKey, viewer.key)))
  return { matches: rows.length, key: viewer.key, seedKeyExample: seedAthleteKey('valentina'), userKey: userKey(viewer.id) }
}
