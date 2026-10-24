'use client'

import { useState } from 'react'
import { mutate as globalMutate } from 'swr'
import { Gift, Heart, Search, Target, Trophy, Zap } from 'lucide-react'
import { companies, type Challenge, type Company } from '@/lib/catalog'
import { swipe } from '@/app/actions/match'
import { useNav } from '@/components/app/nav'
import { Sheet } from '@/components/app/kit'

export function EmpresasFeed() {
  const [applying, setApplying] = useState<{ company: Company; challenge?: Challenge } | null>(null)

  return (
    <>
      {companies.map((company, index) => (
        <article key={company.key} className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={company.image} alt="" loading={index > 1 ? 'lazy' : 'eager'} className="absolute inset-0 size-full object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/30" />

          <div className="relative flex h-full flex-col justify-end gap-4 overflow-y-auto px-4 pb-24 pt-36">
            <header className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-xl bg-olympic-yellow font-display text-lg font-bold text-olympic-black">{company.initials}</span>
              <div className="flex min-w-0 flex-col leading-tight">
                <h2 className="font-display text-3xl font-bold uppercase tracking-tight">{company.name}</h2>
                <span className="text-sm text-muted-foreground">{company.industry}</span>
              </div>
            </header>
            <p className="text-pretty text-sm leading-relaxed">{company.about}</p>

            <div className="grid grid-cols-2 gap-3">
              <InfoList icon={<Search className="size-4 text-olympic-blue" />} title="Qué buscan" items={company.lookingFor} />
              <InfoList icon={<Gift className="size-4 text-olympic-green" />} title="Beneficios" items={company.benefits} />
            </div>
            <InfoList icon={<Target className="size-4 text-olympic-red" />} title="Cómo acceder" items={company.howToAccess} />

            <div className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-olympic-yellow">
                <Trophy className="size-4" />
                Desafíos abiertos
              </h3>
              {company.challenges.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setApplying({ company, challenge: ch })}
                  className="flex flex-col gap-1 rounded-xl border border-olympic-yellow/40 bg-background/70 p-3 text-left backdrop-blur"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{ch.title}</span>
                    <span className="shrink-0 rounded-full bg-olympic-yellow px-2 py-0.5 text-[11px] font-bold text-olympic-black">Postularme</span>
                  </span>
                  <span className="text-xs leading-relaxed text-muted-foreground">{ch.detail}</span>
                  <span className="text-xs font-semibold text-olympic-green">Premio: {ch.reward}</span>
                  <span className="text-[11px] text-muted-foreground">{ch.deadline}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setApplying({ company })}
              className="flex items-center justify-center gap-2 rounded-full bg-olympic-blue px-5 py-3 font-bold text-olympic-white"
            >
              <Heart className="size-4" />
              Quiero ser su cara
            </button>
          </div>
        </article>
      ))}
      {applying ? <ApplySheet company={applying.company} challenge={applying.challenge} onClose={() => setApplying(null)} /> : null}
    </>
  )
}

function InfoList({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-background/70 p-3 backdrop-blur">
      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
        {icon}
        {title}
      </h3>
      <ul className="flex flex-col gap-1 text-xs leading-relaxed text-muted-foreground">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  )
}

export function ApplySheet({ company, challenge, onClose }: { company: Company; challenge?: Challenge; onClose: () => void }) {
  const nav = useNav()
  const [pitch, setPitch] = useState('')
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<{ matched: boolean; matchId?: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pitch.trim().length < 15) return setError('Contales en al menos 15 caracteres por qué sos la persona indicada.')
    setPending(true)
    setError(null)
    const res = await swipe({ targetKey: company.key, liked: true, pitch, challengeId: challenge?.id })
    setPending(false)
    if (!res.ok) return setError(res.error)
    setResult({ matched: res.matched, matchId: res.matchId })
    globalMutate('deck')
    globalMutate('matches')
  }

  return (
    <Sheet title={challenge ? challenge.title : `Postularme a ${company.name}`} onClose={onClose}>
      {result ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-olympic-green text-olympic-white">
            <Zap className="size-8" />
          </span>
          <h3 className="font-display text-3xl font-bold uppercase">{result.matched ? '¡Es un match!' : 'Postulación enviada'}</h3>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {result.matched
              ? `${company.name} también quiere trabajar con vos. Ya tenés una propuesta esperando en Mensajes.`
              : `${company.name} va a revisar tu perfil. Te avisamos si hay match.`}
          </p>
          {result.matched && result.matchId ? (
            <button type="button" onClick={() => nav.openChat(result.matchId!)} className="rounded-full bg-olympic-blue px-6 py-3 font-bold text-olympic-white">
              Ver propuesta
            </button>
          ) : (
            <button type="button" onClick={onClose} className="rounded-full bg-secondary px-6 py-3 font-bold">
              Seguir explorando
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          {challenge ? (
            <div className="flex flex-col gap-1 rounded-xl bg-secondary p-3 text-sm">
              <span className="leading-relaxed">{challenge.detail}</span>
              <span className="font-semibold text-olympic-green">Premio: {challenge.reward}</span>
            </div>
          ) : null}
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Tu pitch para {company.name}
            <textarea
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              maxLength={400}
              rows={4}
              placeholder="Soy… entreno… y con su apoyo lograría…"
              className="rounded-xl border border-input bg-background px-4 py-3 font-normal leading-relaxed"
            />
          </label>
          <p className="text-xs leading-relaxed text-muted-foreground">Tu perfil completo (logros, metas y lo que necesitás) se envía junto con la postulación.</p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button type="submit" disabled={pending} className="rounded-full bg-olympic-yellow px-5 py-3 font-bold text-olympic-black disabled:opacity-60">
            {pending ? 'Enviando…' : 'Enviar postulación'}
          </button>
        </form>
      )}
    </Sheet>
  )
}
