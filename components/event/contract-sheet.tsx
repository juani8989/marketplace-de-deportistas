'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Send, Sparkles, X } from 'lucide-react'
import { draftContract, proposeContract, type BrandCard, type ContractDraft } from '@/app/actions/org'
import { useNav } from '@/components/app/nav'
import { Sheet, isComposing } from '@/components/app/kit'

export function ContractSheet({ brand, onClose, onSent }: { brand: BrandCard; onClose: () => void; onSent: () => void }) {
  const { data, error, isLoading } = useSWR(['contract-draft', brand.party.key], ([, key]) => draftContract(key), { revalidateOnFocus: false })

  return (
    <Sheet title={`Contrato con ${brand.party.name}`} onClose={onClose} tall>
      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 animate-pulse text-olympic-yellow" />
          Armando una propuesta equilibrada…
        </p>
      ) : error || !data || !data.ok ? (
        <p role="alert" className="text-sm text-olympic-red">
          {data && !data.ok ? data.error : 'No se pudo armar el borrador.'}
        </p>
      ) : (
        <ContractEditor brand={brand} initial={data.draft} usedAi={data.usedAi} onClose={onClose} onSent={onSent} />
      )}
    </Sheet>
  )
}

function ContractEditor({
  brand,
  initial,
  usedAi,
  onClose,
  onSent,
}: {
  brand: BrandCard
  initial: ContractDraft
  usedAi: boolean
  onClose: () => void
  onSent: () => void
}) {
  const nav = useNav()
  const [draft, setDraft] = useState(initial)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    setSending(true)
    setError('')
    const res = await proposeContract(brand.party.key, draft)
    setSending(false)
    if (!res.ok) return setError(res.error)
    onSent()
    onClose()
    nav.openChat(res.matchId)
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-muted-foreground">
        {usedAi ? 'Borrador sugerido con IA según el rubro de la marca y tu evento.' : 'Borrador sugerido según el rubro de la marca y tu evento.'} Editalo antes de enviarlo.
      </p>

      <div className="grid gap-4">
        <TermList
          title={`${brand.party.name} aporta`}
          tone="bg-olympic-yellow/20"
          items={draft.brandGives}
          onChange={(brandGives) => setDraft({ ...draft, brandGives })}
        />
        <TermList title="Tu evento da a cambio" tone="bg-olympic-green/20" items={draft.eventGives} onChange={(eventGives) => setDraft({ ...draft, eventGives })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Monto" value={draft.amount} onChange={(amount) => setDraft({ ...draft, amount })} />
        <Field label="Duración" value={draft.duration} onChange={(duration) => setDraft({ ...draft, duration })} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contract-rationale" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Por qué ganan ambos
        </label>
        <textarea
          id="contract-rationale"
          value={draft.rationale}
          onChange={(e) => setDraft({ ...draft, rationale: e.target.value })}
          maxLength={240}
          rows={3}
          className="resize-none rounded-xl border border-border bg-input p-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-olympic-red">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={sending}
        onClick={send}
        className="flex items-center justify-center gap-2 rounded-full bg-olympic-yellow py-3 font-bold text-olympic-black disabled:opacity-60"
      >
        <Send className="size-4" />
        {sending ? 'Enviando…' : 'Enviar propuesta'}
      </button>
    </div>
  )
}

function TermList({ title, tone, items, onChange }: { title: string; tone: string; items: string[]; onChange: (items: string[]) => void }) {
  const [value, setValue] = useState('')
  const add = () => {
    const v = value.trim()
    if (!v || items.includes(v) || items.length >= 6) return
    onChange([...items, v])
    setValue('')
  }

  return (
    <fieldset className="flex flex-col gap-2 rounded-2xl border border-border p-3">
      <legend className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</legend>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <li key={i} className={`flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-xs font-semibold ${tone}`}>
            {i}
            <button type="button" onClick={() => onChange(items.filter((x) => x !== i))} aria-label={`Quitar ${i}`} className="flex size-5 items-center justify-center rounded-full hover:bg-background/40">
              <X className="size-3" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isComposing(e)) {
              e.preventDefault()
              add()
            }
          }}
          maxLength={60}
          placeholder="Agregar término…"
          aria-label={`Agregar término a ${title}`}
          className="min-w-0 flex-1 rounded-full border border-border bg-input px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button type="button" onClick={add} aria-label="Agregar" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Plus className="size-4" />
        </button>
      </div>
    </fieldset>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={40}
        className="rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  )
}
