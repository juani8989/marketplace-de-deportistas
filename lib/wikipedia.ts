export const WIKI_HEADERS = { 'User-Agent': 'DorsalHackathon/1.0 (sponsor marketplace demo)' }

export type FamousAthlete = { name: string; sport: string; image: string }

const FAMOUS = [
  { title: 'Manu_Ginóbili', name: 'Manu Ginóbili', sport: 'Básquet' },
  { title: 'Paula_Pareto', name: 'Paula Pareto', sport: 'Judo' },
  { title: 'Michael_Phelps', name: 'Michael Phelps', sport: 'Natación' },
  { title: 'Usain_Bolt', name: 'Usain Bolt', sport: 'Atletismo' },
  { title: 'Simone_Biles', name: 'Simone Biles', sport: 'Gimnasia' },
  { title: 'Muhammad_Ali', name: 'Muhammad Ali', sport: 'Boxeo' },
  { title: 'Mijaín_López', name: 'Mijaín López', sport: 'Lucha' },
  { title: 'Katie_Ledecky', name: 'Katie Ledecky', sport: 'Natación' },
  { title: 'Luciana_Aymar', name: 'Luciana Aymar', sport: 'Hockey' },
]

export async function getFamousAthletes(): Promise<FamousAthlete[]> {
  const results = await Promise.all(
    FAMOUS.map(async (a) => {
      try {
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(a.title)}`,
          { headers: WIKI_HEADERS, next: { revalidate: 86400 } },
        )
        if (!res.ok) return null
        const data = (await res.json()) as { thumbnail?: { source?: string } }
        const image = data.thumbnail?.source
        return image ? { name: a.name, sport: a.sport, image } : null
      } catch {
        return null
      }
    }),
  )
  return results.filter((a): a is FamousAthlete => a !== null)
}

export function isWikimediaUrl(value: string) {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      (url.hostname.endsWith('.wikimedia.org') || url.hostname.endsWith('.wikipedia.org'))
    )
  } catch {
    return false
  }
}
