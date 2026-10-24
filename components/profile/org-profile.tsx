'use client'

import useSWR from 'swr'
import { Globe, Handshake, MapPin, MessageCircle, Search } from 'lucide-react'
import { getMatches } from '@/app/actions/match'
import { useNav } from '@/components/app/nav'
import { PartyAvatar } from '@/components/app/kit'
import type { Viewer } from '@/components/app-shell'

export function OrgProfileView({ viewer }: { viewer: Viewer }) {
  const nav = useNav()
  const { data: matches } = useSWR('matches', () => getMatches())
  const profile = viewer.account?.profile
  if (!profile || profile.kind === 'deportista') return null

  const deals = matches?.filter((m) => m.dealStatus === 'aceptada').length ?? 0

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-4 pb-24 pt-20">
      <section className="flex flex-col items-center gap-3 text-center">
        <PartyAvatar party={{ name: profile.orgName, initials: profile.orgName.slice(0, 2).toUpperCase(), role: profile.kind }} className="size-24 ring-4" />
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">{profile.orgName}</h1>
          <p className="text-sm text-muted-foreground">{profile.category}</p>
        </div>
        <dl className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-card p-3">
          <div className="flex flex-col items-center">
            <dd className="font-display text-2xl font-bold">{matches?.length ?? 0}</dd>
            <dt className="text-[11px] text-muted-foreground">Matches</dt>
          </div>
          <div className="flex flex-col items-center">
            <dd className="font-display text-2xl font-bold">{deals}</dd>
            <dt className="text-[11px] text-muted-foreground">Acuerdos</dt>
          </div>
        </dl>
      </section>

      <ul className="flex flex-col gap-2 text-sm">
        <li className="flex items-center gap-3 rounded-xl bg-card p-3">
          <MapPin className="size-4 text-olympic-red" />
          {profile.city}, {profile.country}
        </li>
        {profile.website ? (
          <li className="flex items-center gap-3 rounded-xl bg-card p-3">
            <Globe className="size-4 text-olympic-blue" />
            <span className="truncate">{profile.website}</span>
          </li>
        ) : null}
        {profile.lookingFor ? (
          <li className="flex items-start gap-3 rounded-xl bg-card p-3 leading-relaxed">
            <Search className="mt-0.5 size-4 shrink-0 text-olympic-yellow" />
            {profile.lookingFor}
          </li>
        ) : null}
      </ul>

      <div className="flex gap-2">
        <button type="button" onClick={() => nav.goTo('match')} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-olympic-green py-3 text-sm font-bold text-olympic-white">
          <Handshake className="size-4" />
          Buscar deportistas
        </button>
        <button type="button" onClick={() => nav.goTo('mensajes')} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-olympic-blue py-3 text-sm font-bold text-olympic-white">
          <MessageCircle className="size-4" />
          Mensajes
        </button>
      </div>
    </div>
  )
}
