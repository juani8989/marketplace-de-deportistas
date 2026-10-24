'use client'

import { useEffect, useState } from 'react'
import { Check, Clock, Gift, Heart, Video, X } from 'lucide-react'
import { useAppStore } from '@/components/app-store'
import { ProposalSheet } from '@/components/proposal-sheet'
import { affinityByAthlete, athletes, callouts, companyFeedAthletes, type Callout } from '@/lib/data'
import { AthleteTag, Chip, Slide } from './slide'
import { Button } from '@/components/ui/button'

function AffinityBib({ value, label = 'afinidad' }: { value: number; label?: string }) {
  return (
    <div className="flex w-24 shrink-0 flex-col items-center rounded-lg border-2 border-accent-foreground/20 bg-accent px-2 py-2 text-accent-foreground shadow-lg">
      <span className="text-[10px] font-bold uppercase tracking-widest">Dorsal</span>
      <span className="font-display text-4xl font-extrabold leading-none">{value}%</span>
      <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </div>
  )
}

function CalloutSlide({ callout, index }: { callout: Callout; index: number }) {
  const { toggled, toggle, pushNotification } = useAppStore()
  const applied = toggled.has(`applied-${callout.id}`)
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    if (!recording) return
    const t = setTimeout(() => {
      setRecording(false)
      toggle(`applied-${callout.id}`)
      pushNotification({
        title: 'Pitch enviado',
        body: `${callout.brand} recibió tu video de 15 s. Te avisamos cuando lo vean.`,
      })
    }, 3000)
    return () => clearTimeout(t)
  }, [recording, callout, toggle, pushNotification])

  return (
    <Slide image={callout.image} alt={`Campaña de ${callout.brand}`} priority={index === 0}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Chip tone="blue">Convocatoria · {callout.dealType}</Chip>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-foreground font-display text-sm font-bold text-background">
              {callout.brandInitials}
            </span>
            <span className="font-semibold">{callout.brand}</span>
          </div>
        </div>
        <AffinityBib value={callout.affinity} />
      </div>
      <h2 className="font-display text-3xl font-bold uppercase leading-none text-balance">{callout.headline}</h2>
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-background/75 p-3 text-sm backdrop-blur">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Buscan</span>
          {callout.requirements.map((r) => (
            <span key={r} className="flex gap-1.5 leading-snug">
              <Check className="mt-0.5 size-3.5 shrink-0 text-accent" /> {r}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Ofrecen</span>
          {callout.benefits.map((b) => (
            <span key={b} className="flex gap-1.5 leading-snug">
              <Gift className="mt-0.5 size-3.5 shrink-0 text-accent" /> {b}
            </span>
          ))}
        </div>
      </div>
      <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
        <Clock className="size-3.5" /> {callout.deadline}
      </span>
      {recording ? (
        <div className="flex flex-col gap-2 rounded-xl bg-destructive/90 p-3" role="status">
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="size-2.5 animate-pulse rounded-full bg-foreground" /> Grabando tu pitch de 15 s…
          </span>
          <div className="h-1.5 overflow-hidden rounded-full bg-foreground/30">
            <div className="animate-record h-full bg-foreground" />
          </div>
        </div>
      ) : (
        <Button
          disabled={applied}
          onClick={() => setRecording(true)}
          className="h-12 w-full gap-2 font-semibold"
        >
          {applied ? (
            <>
              <Check className="size-4" /> Pitch enviado
            </>
          ) : (
            <>
              <Video className="size-4" /> Responder con video
            </>
          )}
        </Button>
      )}
    </Slide>
  )
}

function CompanyAthleteSlide({
  athleteId,
  index,
  onPropose,
}: {
  athleteId: string
  index: number
  onPropose: (id: string) => void
}) {
  const { toggled, toggle, matchedAthletes } = useAppStore()
  const athlete = athletes[athleteId]
  const saved = toggled.has(`co-save-${athleteId}`)
  const matched = matchedAthletes.has(athleteId)

  return (
    <Slide image={athlete.image} alt={`${athlete.name} en acción`} priority={index === 0}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Chip>{athlete.level}</Chip>
          {athlete.seekingSponsor ? <Chip tone="blue">Busca sponsor ahora</Chip> : null}
          {matched ? <Chip tone="gold">Match</Chip> : null}
        </div>
        <AffinityBib value={affinityByAthlete[athleteId] ?? 70} label="con tu marca" />
      </div>
      <AthleteTag athlete={athlete} />
      <dl className="grid grid-cols-3 gap-2 rounded-xl bg-background/75 p-3 text-center backdrop-blur">
        <div className="flex flex-col">
          <dt className="text-[11px] uppercase text-muted-foreground">Seguidores</dt>
          <dd className="font-display text-xl font-bold">{athlete.followers}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-[11px] uppercase text-muted-foreground">Listo sponsor</dt>
          <dd className="font-display text-xl font-bold">{athlete.sponsorReady}%</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-[11px] uppercase text-muted-foreground">Ciudad</dt>
          <dd className="truncate font-display text-xl font-bold">{athlete.city}</dd>
        </div>
      </dl>
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="icon" className="size-12 rounded-full" aria-label="Descartar" onClick={() => toggle(`co-skip-${athleteId}`)}>
          <X className="size-5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          aria-label={saved ? 'Quitar de guardados' : 'Guardar deportista'}
          aria-pressed={saved}
          className={saved ? 'size-12 rounded-full bg-accent text-accent-foreground hover:bg-accent/90' : 'size-12 rounded-full'}
          onClick={() => toggle(`co-save-${athleteId}`)}
        >
          <Heart className="size-5" />
        </Button>
        <Button disabled={matched} onClick={() => onPropose(athleteId)} className="h-12 flex-1 font-semibold">
          {matched ? 'Propuesta enviada' : 'Enviar propuesta'}
        </Button>
      </div>
    </Slide>
  )
}

export function MatchFeed() {
  const { mode } = useAppStore()
  const [proposalFor, setProposalFor] = useState<string | null>(null)

  if (mode === 'deportista') {
    return (
      <>
        {callouts.map((c, i) => (
          <CalloutSlide key={c.id} callout={c} index={i} />
        ))}
      </>
    )
  }

  return (
    <>
      {companyFeedAthletes.map((id, i) => (
        <CompanyAthleteSlide key={id} athleteId={id} index={i} onPropose={setProposalFor} />
      ))}
      {proposalFor ? <ProposalSheet athleteId={proposalFor} onClose={() => setProposalFor(null)} /> : null}
    </>
  )
}
