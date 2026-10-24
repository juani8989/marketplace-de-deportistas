'use client'

import { useState } from 'react'
import { Check, MessageCircle, Send } from 'lucide-react'
import { invite } from '@/app/actions/org'
import { useNav } from '@/components/app/nav'
import { Sheet } from '@/components/app/kit'
import type { Candidate } from '@/app/actions/org'

export function InviteButton({ candidate, onInvited }: { candidate: Candidate; onInvited: () => void }) {
  const nav = useNav()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  if (candidate.invited && candidate.matchId !== null) {
    const matchId = candidate.matchId
    return (
      <button
        type="button"
        onClick={() => nav.openChat(matchId)}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground"
      >
        <MessageCircle className="size-3.5" />
        Chat
      </button>
    )
  }

  async function submit() {
    setSending(true)
    setError('')
    const res = await invite(candidate.party.key, note)
    setSending(false)
    if (!res.ok) return setError(res.error)
    setOpen(false)
    onInvited()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-olympic-green px-3 py-2 text-xs font-bold text-olympic-white"
      >
        <Send className="size-3.5" />
        Invitar
      </button>
      {open ? (
        <Sheet title={`Invitar a ${candidate.party.name}`} onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3">
            <label htmlFor="invite-note" className="text-sm font-semibold">
              Mensaje (opcional)
            </label>
            <textarea
              id="invite-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Contale por qué querés que se sume…"
              className="resize-none rounded-xl border border-border bg-input p-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring"
            />
            {error ? (
              <p role="alert" className="text-sm text-olympic-red">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              disabled={sending}
              onClick={submit}
              className="flex items-center justify-center gap-2 rounded-full bg-olympic-green py-3 font-bold text-olympic-white disabled:opacity-60"
            >
              <Check className="size-4" />
              {sending ? 'Enviando…' : 'Enviar invitación'}
            </button>
          </div>
        </Sheet>
      ) : null}
    </>
  )
}
