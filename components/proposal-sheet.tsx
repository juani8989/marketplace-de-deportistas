'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useAppStore, type DealType } from '@/components/app-store'
import { athletes } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const templates: { type: DealType; description: string; message: string }[] = [
  { type: 'Producto', description: 'Equipamiento a cambio de contenido', message: 'Te mandamos equipamiento completo para la temporada.' },
  { type: 'Dinero', description: 'Apoyo económico para tu objetivo', message: 'Queremos cubrir tus pasajes al próximo torneo.' },
  { type: 'Embajador', description: 'Cara de la marca por 12 meses', message: 'Queremos que seas la cara de nuestra campaña de invierno.' },
]

export function ProposalSheet({ athleteId, onClose }: { athleteId: string; onClose: () => void }) {
  const { sendProposal, setTab } = useAppStore()
  const athlete = athletes[athleteId]
  const [deal, setDeal] = useState<DealType>('Embajador')
  const [message, setMessage] = useState(templates[2].message)

  return (
    <div className="absolute inset-0 z-40 flex items-end bg-background/70 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="proposal-title"
        className="flex w-full flex-col gap-4 rounded-t-3xl bg-card p-5 pb-8 animate-in slide-in-from-bottom duration-300"
      >
        <div className="flex items-center justify-between">
          <h2 id="proposal-title" className="font-display text-2xl font-semibold">
            Propuesta para {athlete.name.split(' ')[0]}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="size-5" />
          </Button>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="pb-2 text-xs font-semibold uppercase text-muted-foreground">Tipo de acuerdo</legend>
          {templates.map((t) => (
            <label
              key={t.type}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors',
                deal === t.type ? 'border-accent bg-accent/10' : 'border-border',
              )}
            >
              <span className="flex flex-col">
                <span className="font-semibold">{t.type}</span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </span>
              <input
                type="radio"
                name="deal"
                value={t.type}
                checked={deal === t.type}
                onChange={() => {
                  setDeal(t.type)
                  setMessage(t.message)
                }}
                className="size-4 accent-[var(--accent)]"
              />
            </label>
          ))}
        </fieldset>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Mensaje</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={200}
            className="resize-none rounded-xl border border-input bg-background p-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <Button
          className="h-12 font-semibold"
          disabled={message.trim().length === 0}
          onClick={() => {
            sendProposal(athleteId, deal, message.trim())
            onClose()
            setTab('vitrina')
          }}
        >
          Enviar y desbloquear Top Secret
        </Button>
      </div>
    </div>
  )
}
