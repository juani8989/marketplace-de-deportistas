'use client'

import Image from 'next/image'
import { CalendarClock, Flag, Users } from 'lucide-react'
import { useAppStore } from '@/components/app-store'
import { athletes, rutaPosts, type RutaPost } from '@/lib/data'
import { ActionRail, AthleteTag, Chip, ProgressBar, Slide } from './slide'
import { Button } from '@/components/ui/button'

const money = (n: number) => `US$ ${n.toLocaleString('es-AR')}`

function RutaSlide({ post, index }: { post: RutaPost; index: number }) {
  const { toggled, toggle } = useAppStore()

  if (post.type === 'project') {
    const athlete = athletes[post.athleteId]
    const pct = Math.round((post.raised / post.goal) * 100)
    return (
      <Slide image={post.image} alt={`${athlete.name} entrenando`} priority={index === 0} rail={<ActionRail postId={post.id} applause={1240} />}>
        <div className="flex flex-wrap gap-2">
          <Chip tone="gold">Proyecto con meta</Chip>
          {athlete.seekingSponsor ? <Chip>Busca sponsor</Chip> : null}
        </div>
        <AthleteTag athlete={athlete} />
        <h2 className="font-display text-3xl font-bold uppercase leading-none text-balance">{post.title}</h2>
        <div className="flex flex-col gap-2 rounded-xl bg-background/70 p-3 backdrop-blur">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-bold">{money(post.raised)}</span>
            <span className="text-xs text-muted-foreground">de {money(post.goal)} · {pct} %</span>
          </div>
          <ProgressBar value={pct} />
          <ul className="flex flex-col gap-1 pt-1">
            {post.breakdown.map((item) => (
              <li key={item.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold">{money(item.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      </Slide>
    )
  }

  if (post.type === 'goal') {
    const athlete = athletes[post.athleteId]
    const following = toggled.has(`goal-${post.id}`)
    return (
      <Slide image={post.image} alt={`${athlete.name} entrenando`} rail={<ActionRail postId={post.id} applause={860} />}>
        <Chip tone="blue">
          <Flag className="size-3.5" /> Objetivo próximo
        </Chip>
        <AthleteTag athlete={athlete} />
        <div className="flex items-end gap-3">
          <div className="flex flex-col items-center rounded-xl bg-accent px-3 py-2 text-accent-foreground">
            <span className="font-display text-4xl font-extrabold leading-none">{post.daysLeft}</span>
            <span className="text-[11px] font-bold uppercase">días</span>
          </div>
          <h2 className="font-display text-3xl font-bold uppercase leading-none text-balance">{post.title}</h2>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <CalendarClock className="size-3.5" /> {post.nextStep}
            </span>
            <span className="font-semibold">{post.progress} %</span>
          </div>
          <ProgressBar value={post.progress} tone="blue" />
        </div>
        <Button
          onClick={() => toggle(`goal-${post.id}`)}
          variant={following ? 'secondary' : 'default'}
          className="h-11 w-full font-semibold"
        >
          {following ? 'Siguiendo este objetivo' : 'Seguir este objetivo'}
        </Button>
      </Slide>
    )
  }

  if (post.type === 'colab') {
    const [a, b] = post.athleteIds.map((id) => athletes[id])
    return (
      <article className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-2">
          <div className="relative">
            <Image src={a.image} alt={a.name} fill sizes="210px" className="object-cover" />
          </div>
          <div className="relative border-l-2 border-accent">
            <Image src={b.image} alt={b.name} fill sizes="210px" className="object-cover" />
          </div>
        </div>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/20" />
        <div className="relative flex h-full items-end gap-3 px-4 pb-24 pt-28">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Chip tone="gold">
              <Users className="size-3.5" /> Dúo
            </Chip>
            <AthleteTag athlete={a} />
            <p className="text-pretty text-sm leading-relaxed">{post.caption}</p>
            <p className="text-xs text-muted-foreground">Alcance sumado: {a.followers} + {b.followers} seguidores</p>
          </div>
          <ActionRail postId={post.id} applause={2310} />
        </div>
      </article>
    )
  }

  if (post.type === 'diary') {
    const athlete = athletes[post.athleteId]
    return (
      <Slide rail={<ActionRail postId={post.id} applause={512} />}>
        <div className="absolute inset-x-0 top-24 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 no-scrollbar">
          {post.images.map((src, i) => (
            <div key={i} className="relative aspect-[3/4] w-4/5 shrink-0 snap-center overflow-hidden rounded-2xl">
              <Image src={src} alt={`Día ${i + 1} de la semana de ${athlete.name}`} fill sizes="320px" className="object-cover" />
              <span className="absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-xs font-semibold">
                Día {i + 1}
              </span>
            </div>
          ))}
        </div>
        <Chip>Diario semanal · desliza</Chip>
        <AthleteTag athlete={athlete} />
        <p className="text-pretty text-sm leading-relaxed">{post.caption}</p>
      </Slide>
    )
  }

  const athlete = athletes[post.athleteId]
  return (
    <Slide image={post.image} alt={`${athlete.name} en acción`} rail={<ActionRail postId={post.id} applause={3480} />}>
      <AthleteTag athlete={athlete} />
      <p className="text-pretty text-sm leading-relaxed">{post.caption}</p>
      <div className="flex flex-wrap gap-2">
        {post.tags.map((t) => (
          <Chip key={t}>#{t}</Chip>
        ))}
      </div>
    </Slide>
  )
}

export function RutaFeed() {
  return (
    <>
      {rutaPosts.map((post, i) => (
        <RutaSlide key={post.id} post={post} index={i} />
      ))}
    </>
  )
}
