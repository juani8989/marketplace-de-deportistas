'use server'

import { and, count, desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { comments, follows, posts, reactions, reports } from '@/lib/db/schema'
import { describeParties, getViewer, requireViewer, userKey, type Party } from '@/lib/viewer'
import { events, seedAthleteKey, seedDaily, type DailyKind } from '@/lib/catalog'

export type ReactionKind = 'like' | 'apoyo' | 'asistir'

export type FeedPost = {
  id: string
  author: Party
  kind: DailyKind
  body: string
  image: string | null
  createdAt: string
  likes: number
  apoyos: number
  comments: number
  liked: boolean
  supported: boolean
  mine: boolean
}

export type FeedComment = { id: string; author: string; body: string; createdAt: string }

type Result = { ok: true } | { ok: false; error: string }

const DAILY_KINDS: DailyKind[] = ['diario', 'idea', 'colab', 'meta']
const REACTION_KINDS: ReactionKind[] = ['like', 'apoyo', 'asistir']
const TARGET_PATTERN = /^(seed:d\d+|post:\d+|event:[a-z0-9-]+|athlete:(user:[\w-]+|seed:at-[a-z]+))$/
const MAX_IMAGE_CHARS = 1_400_000

function validTarget(targetId: string) {
  return typeof targetId === 'string' && TARGET_PATTERN.test(targetId)
}

async function reactionCounts(targetIds: string[], viewerId?: string) {
  const totals = new Map<string, Record<string, number>>()
  const mine = new Set<string>()
  if (!targetIds.length) return { totals, mine }

  const rows = await db
    .select({ targetId: reactions.targetId, kind: reactions.kind, n: count() })
    .from(reactions)
    .where(inArray(reactions.targetId, targetIds))
    .groupBy(reactions.targetId, reactions.kind)
  for (const row of rows) {
    const entry = totals.get(row.targetId) ?? {}
    entry[row.kind] = Number(row.n)
    totals.set(row.targetId, entry)
  }

  if (viewerId) {
    const own = await db
      .select({ targetId: reactions.targetId, kind: reactions.kind })
      .from(reactions)
      .where(and(eq(reactions.userId, viewerId), inArray(reactions.targetId, targetIds)))
    for (const row of own) mine.add(`${row.targetId}|${row.kind}`)
  }
  return { totals, mine }
}

export async function getCompanerosFeed(): Promise<FeedPost[]> {
  const viewer = await getViewer()
  const realPosts = await db.select().from(posts).orderBy(desc(posts.createdAt)).limit(40)

  const hidden = new Set<string>()
  if (viewer) {
    const reported = await db.select({ targetId: reports.targetId }).from(reports).where(eq(reports.userId, viewer.id))
    for (const r of reported) hidden.add(r.targetId)
  }

  const targetIds = [...realPosts.map((p) => `post:${p.id}`), ...seedDaily.map((s) => s.id)].filter((id) => !hidden.has(id))
  const [{ totals, mine }, commentRows, parties] = await Promise.all([
    reactionCounts(targetIds, viewer?.id),
    targetIds.length
      ? db.select({ targetId: comments.targetId, n: count() }).from(comments).where(inArray(comments.targetId, targetIds)).groupBy(comments.targetId)
      : Promise.resolve([]),
    describeParties([...realPosts.map((p) => userKey(p.userId)), ...seedDaily.map((s) => seedAthleteKey(s.athleteId))]),
  ])
  const commentTotals = new Map(commentRows.map((r) => [r.targetId, Number(r.n)]))

  const build = (id: string, author: Party | undefined, base: Omit<FeedPost, 'id' | 'author' | 'likes' | 'apoyos' | 'comments' | 'liked' | 'supported'>, baseLikes = 0, baseComments = 0): FeedPost | null => {
    if (!author || hidden.has(id)) return null
    const t = totals.get(id) ?? {}
    return {
      id,
      author,
      ...base,
      likes: baseLikes + (t.like ?? 0),
      apoyos: Math.round(baseLikes / 6) + (t.apoyo ?? 0),
      comments: baseComments + (commentTotals.get(id) ?? 0),
      liked: mine.has(`${id}|like`),
      supported: mine.has(`${id}|apoyo`),
    }
  }

  const now = Date.now()
  const feed = [
    ...realPosts.map((p) =>
      build(`post:${p.id}`, parties.get(userKey(p.userId)), {
        kind: p.kind as DailyKind,
        body: p.body,
        image: p.mediaUrl,
        createdAt: p.createdAt.toISOString(),
        mine: p.userId === viewer?.id,
      }),
    ),
    ...seedDaily.map((s) =>
      build(
        s.id,
        parties.get(seedAthleteKey(s.athleteId)),
        { kind: s.kind, body: s.body, image: s.image, createdAt: new Date(now - s.minutesAgo * 60_000).toISOString(), mine: false },
        s.baseLikes,
        s.baseComments.length,
      ),
    ),
  ].filter((p): p is FeedPost => p !== null)

  return feed.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createPost(input: { kind: DailyKind; body: string; image?: string | null }): Promise<Result> {
  const viewer = await requireViewer()
  if (viewer.role !== 'deportista') return { ok: false, error: 'Solo los deportistas pueden publicar en Compañeros.' }

  const body = typeof input.body === 'string' ? input.body.trim() : ''
  if (!DAILY_KINDS.includes(input.kind)) return { ok: false, error: 'Tipo de publicación inválido.' }
  if (body.length < 2 || body.length > 500) return { ok: false, error: 'Escribí entre 2 y 500 caracteres.' }

  const image = input.image ?? null
  if (image && (!/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > MAX_IMAGE_CHARS)) {
    return { ok: false, error: 'La imagen no es válida o es muy pesada.' }
  }

  await db.insert(posts).values({ userId: viewer.id, authorName: viewer.name, kind: input.kind, body, mediaUrl: image })
  return { ok: true }
}

export async function deletePost(postId: string): Promise<Result> {
  const viewer = await requireViewer()
  const id = Number(postId.replace(/^post:/, ''))
  if (!Number.isInteger(id)) return { ok: false, error: 'Publicación inválida.' }
  await db.delete(posts).where(and(eq(posts.id, id), eq(posts.userId, viewer.id)))
  return { ok: true }
}

export async function toggleReaction(targetId: string, kind: ReactionKind): Promise<Result> {
  const viewer = await requireViewer()
  if (!validTarget(targetId) || !REACTION_KINDS.includes(kind)) return { ok: false, error: 'Acción inválida.' }

  const removed = await db
    .delete(reactions)
    .where(and(eq(reactions.targetId, targetId), eq(reactions.userId, viewer.id), eq(reactions.kind, kind)))
    .returning({ targetId: reactions.targetId })
  if (!removed.length) await db.insert(reactions).values({ targetId, userId: viewer.id, kind })
  return { ok: true }
}

export async function getComments(targetId: string): Promise<FeedComment[]> {
  if (!validTarget(targetId)) return []
  const seed = seedDaily.find((s) => s.id === targetId)
  const seedComments: FeedComment[] = (seed?.baseComments ?? []).map((c, i) => ({
    id: `${targetId}-c${i}`,
    author: c.author,
    body: c.body,
    createdAt: new Date(Date.now() - (seed!.minutesAgo - 5 - i) * 60_000).toISOString(),
  }))
  const rows = await db.select().from(comments).where(eq(comments.targetId, targetId)).orderBy(comments.createdAt).limit(100)
  return [...seedComments, ...rows.map((r) => ({ id: String(r.id), author: r.authorName, body: r.body, createdAt: r.createdAt.toISOString() }))]
}

export async function addComment(targetId: string, body: string): Promise<Result> {
  const viewer = await requireViewer()
  const text = typeof body === 'string' ? body.trim() : ''
  if (!validTarget(targetId)) return { ok: false, error: 'Publicación inválida.' }
  if (!text || text.length > 300) return { ok: false, error: 'El comentario debe tener entre 1 y 300 caracteres.' }
  await db.insert(comments).values({ targetId, userId: viewer.id, authorName: viewer.name, body: text })
  return { ok: true }
}

const REPORT_REASONS = ['Spam', 'Contenido inapropiado', 'Información falsa', 'Acoso', 'Otro']

export async function reportPost(targetId: string, reason: string): Promise<Result> {
  const viewer = await requireViewer()
  if (!validTarget(targetId) || !REPORT_REASONS.includes(reason)) return { ok: false, error: 'Denuncia inválida.' }
  await db.insert(reports).values({ targetId, userId: viewer.id, reason }).onConflictDoNothing()
  return { ok: true }
}

export async function toggleFollow(targetKey: string): Promise<Result> {
  const viewer = await requireViewer()
  if (!/^(user:[\w-]+|seed:at-[a-z]+)$/.test(targetKey) || targetKey === viewer.key) return { ok: false, error: 'Acción inválida.' }
  const removed = await db
    .delete(follows)
    .where(and(eq(follows.followerId, viewer.id), eq(follows.targetId, targetKey)))
    .returning({ targetId: follows.targetId })
  if (!removed.length) await db.insert(follows).values({ followerId: viewer.id, targetId: targetKey })
  return { ok: true }
}

export type EventState = Record<string, { going: number; mine: boolean }>

export async function getEventsState(): Promise<EventState> {
  const viewer = await getViewer()
  const ids = events.map((e) => `event:${e.id}`)
  const { totals, mine } = await reactionCounts(ids, viewer?.id)
  return Object.fromEntries(
    events.map((e) => {
      const id = `event:${e.id}`
      return [e.id, { going: e.attendees.length + (totals.get(id)?.asistir ?? 0), mine: mine.has(`${id}|asistir`) }]
    }),
  )
}
