'use client'

import Image from 'next/image'
import { Lock, Medal, ShieldCheck, TrendingDown, Unlock } from 'lucide-react'
import { useAppStore } from '@/components/app-store'
import { useNav } from '@/components/app/nav'
import { athletes, vitrinaPosts, type VitrinaPost } from '@/lib/data'
import { ActionRail, AthleteTag, Chip, ProgressBar, Slide } from './slide'
import { Button } from '@/components/ui/button'

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100
      const y = ((p - min) / (max - min)) * 80 + 10
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-24 w-full" aria-hidden>
      <polyline points={coords} fill="none" stroke="var(--accent)" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={(i / (points.length - 1)) * 100}
          cy={((p - min) / (max - min)) * 80 + 10}
          r="2"
          fill="var(--foreground)"
        />
      ))}
    </svg>
  )
}

function VitrinaSlide({ post, index }: { post: VitrinaPost; index: number }) {
  const { mode, unlockedSecrets } = useAppStore()
  const { goTo } = useNav()
  const setTab = goTo
  const athlete = athletes[post.athleteId]

  if (post.type === 'achievement') {
    return (
      <Slide image={post.image} alt={`${athlete.name} celebrando`} priority={index === 0} rail={<ActionRail postId={post.id} applause={5120} />}>
        <div className="flex flex-wrap gap-2">
          <Chip tone="gold">
            <Medal className="size-3.5" /> Medalla de {post.medal.toLowerCase()}
          </Chip>
          <Chip tone="blue">
            <ShieldCheck className="size-3.5" /> Verificado por {post.verifiedBy}
          </Chip>
        </div>
        <AthleteTag athlete={athlete} />
        <h2 className="font-display text-4xl font-semibold leading-none text-balance">{post.title}</h2>
        <p className="text-sm text-muted-foreground">{post.event}</p>
        <div className="flex flex-col gap-1.5 rounded-xl bg-background/70 p-3 backdrop-blur">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Listo para sponsor</span>
            <span className="font-semibold">{athlete.sponsorReady} %</span>
          </div>
          <ProgressBar value={athlete.sponsorReady} />
          {athlete.sponsoredBy ? (
            <span className="text-xs text-muted-foreground">Ya patrocinado por {athlete.sponsoredBy}</span>
          ) : null}
        </div>
      </Slide>
    )
  }

  if (post.type === 'stats') {
    return (
      <Slide image={post.image} alt="" rail={<ActionRail postId={post.id} applause={980} />}>
        <Chip>Tarjeta de estadísticas</Chip>
        <AthleteTag athlete={athlete} />
        <div className="flex flex-col gap-2 rounded-2xl bg-background/80 p-4 backdrop-blur">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{post.metric} · marca personal</span>
          <span className="font-display text-5xl font-semibold leading-none">{post.current}</span>
          <Sparkline points={post.points} />
          <span className="flex items-center gap-1.5 text-sm font-semibold text-accent">
            <TrendingDown className="size-4" /> {post.summary}
          </span>
        </div>
      </Slide>
    )
  }

  const unlocked = unlockedSecrets.has(post.athleteId)
  return (
    <article className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden">
      <Image
        src={post.image}
        alt=""
        fill
        sizes="420px"
        className={unlocked ? 'object-cover' : 'scale-110 object-cover blur-xl'}
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/40" />
      <div className="relative flex h-full items-end gap-3 px-4 pb-24 pt-28">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Chip tone="gold">
            {unlocked ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />} Top Secret
          </Chip>
          <AthleteTag athlete={athlete} />
          <h2 className="font-display text-3xl font-semibold leading-none text-balance">{post.title}</h2>
          {unlocked ? (
            <ul className="flex flex-col gap-2 rounded-xl bg-background/80 p-3 text-sm leading-relaxed backdrop-blur">
              {post.content.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-accent/40 bg-background/70 p-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Lock className="size-5" />
                </span>
                <p className="text-pretty text-sm leading-relaxed">{post.teaser}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Solo lo pueden abrir las empresas verificadas o las que hicieron match.
              </p>
              {mode === 'empresa' ? (
                <Button onClick={() => setTab('match')} className="h-11 w-full font-semibold">
                  Enviar propuesta para desbloquear
                </Button>
              ) : null}
            </div>
          )}
        </div>
        <ActionRail postId={post.id} applause={1430} />
      </div>
    </article>
  )
}

export function VitrinaFeed() {
  return (
    <>
      {vitrinaPosts.map((post, i) => (
        <VitrinaSlide key={post.id} post={post} index={i} />
      ))}
    </>
  )
}
