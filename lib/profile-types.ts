export type Role = 'deportista' | 'empresa' | 'evento'

export const ROLES: Role[] = ['deportista', 'empresa', 'evento']

export type TimelineEntry = { year: string; text: string }

export type AthleteProfile = {
  kind: 'deportista'
  firstName: string
  lastName: string
  country: string
  discipline: string
  famous: boolean
  identityVerified: boolean
  photo?: string
  selfie?: string
  wikiUrl?: string
  summary?: string
  age: string
  goals: string
  achievements: string
  studies: string
  recognitions: string
  timeline: TimelineEntry[]
  socials: { instagram: string; tiktok: string; x: string; youtube: string }
  needs: string[]
  needsDetail: string
}

export type OrgProfile = {
  kind: 'empresa' | 'evento'
  orgName: string
  category: string
  country: string
  city: string
  website: string
  lookingFor: string
  eventDate?: string
  description?: string
  logo?: string
  sponsored?: SponsoredAthlete[]
  merch?: MerchItem[]
  eventInfo?: { distance: string; place: string; requirements: string; signup: string; reach: string }
}

export type SponsoredAthlete = { key: string; name: string; discipline: string; image?: string; since: string }
export type MerchItem = { name: string; price: string; image?: string }

export type Account = {
  id: string
  role: Role
  email: string
  name: string
  createdAt: string
  profile: AthleteProfile | OrgProfile
}
