import { WIKI_HEADERS } from '@/lib/wikipedia'

export type AthleteCandidate = {
  title: string
  lang: 'es' | 'en'
  description: string
  image: string | null
  url: string
  score: number
}

type WikiPage = {
  title: string
  index?: number
  extract?: string
  fullurl?: string
  thumbnail?: { source: string }
}

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

async function searchWiki(lang: 'es' | 'en', query: string): Promise<WikiPage[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: '8',
    prop: 'pageimages|extracts|info',
    piprop: 'thumbnail',
    pithumbsize: '500',
    exintro: '1',
    explaintext: '1',
    exsentences: '3',
    exlimit: 'max',
    inprop: 'url',
    redirects: '1',
  })
  const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`, {
    headers: WIKI_HEADERS,
  })
  if (!res.ok) return []
  const data = (await res.json()) as { query?: { pages?: WikiPage[] } }
  return data.query?.pages ?? []
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = (searchParams.get('name') ?? '').trim().slice(0, 80)
  const discipline = (searchParams.get('discipline') ?? '').trim().slice(0, 40)
  const country = (searchParams.get('country') ?? '').trim().slice(0, 40)

  if (name.split(/\s+/).length < 2) {
    return Response.json({ error: 'Ingresá nombre y apellido.' }, { status: 400 })
  }

  const nameTokens = normalize(name).split(/\s+/).filter((t) => t.length > 1)
  const surname = nameTokens[nameTokens.length - 1]

  try {
    const searches = await Promise.all([
      searchWiki('es', `${name} ${discipline}`),
      searchWiki('en', `${name} ${discipline}`),
      searchWiki('es', name),
    ])
    const langs: ('es' | 'en')[] = ['es', 'en', 'es']

    const seen = new Set<string>()
    const candidates: AthleteCandidate[] = []

    searches.forEach((pages, i) => {
      for (const page of pages) {
        const title = normalize(page.title)
        if (!title.includes(surname)) continue
        const matchedTokens = nameTokens.filter((t) => title.includes(t)).length
        if (matchedTokens / nameTokens.length < 0.5) continue

        const text = normalize(`${page.title} ${page.extract ?? ''}`)
        let score = matchedTokens / nameTokens.length
        if (discipline && text.includes(normalize(discipline))) score += 0.5
        if (country && text.includes(normalize(country).slice(0, 6))) score += 0.3
        if (page.thumbnail) score += 0.2

        const key = page.thumbnail?.source ?? title
        if (seen.has(key)) continue
        seen.add(key)

        candidates.push({
          title: page.title,
          lang: langs[i],
          description: page.extract ?? '',
          image: page.thumbnail?.source ?? null,
          url: page.fullurl ?? `https://${langs[i]}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
          score,
        })
      }
    })

    candidates.sort((a, b) => b.score - a.score)
    return Response.json({ candidates: candidates.slice(0, 3) })
  } catch (error) {
    console.error('athlete-search failed', error)
    return Response.json({ error: 'No pudimos buscar en la web ahora.' }, { status: 502 })
  }
}
