'use client'

import { useSyncExternalStore } from 'react'

export type Role = 'deportista' | 'empresa' | 'evento'

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
}

export type Account = {
  id: string
  role: Role
  email: string
  name: string
  salt: string
  passwordHash: string
  createdAt: string
  profile: AthleteProfile | OrgProfile
}

type Session = { type: 'account'; accountId: string } | { type: 'guest' }

export type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'guest' }
  | { status: 'account'; account: Account }

const ACCOUNTS_KEY = 'dorsal:accounts'
const SESSION_KEY = 'dorsal:session'
const CHANGE_EVENT = 'dorsal:auth-change'

const LOADING: AuthState = { status: 'loading' }
const SIGNED_OUT: AuthState = { status: 'signed-out' }
const GUEST: AuthState = { status: 'guest' }

function readAccounts(): Account[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '[]') as Account[]
  } catch {
    return []
  }
}

function writeAccounts(accounts: Account[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

function setSession(session: Session | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

let cachedKey: string | null = null
let cachedState: AuthState = SIGNED_OUT

function getSnapshot(): AuthState {
  const sessionRaw = localStorage.getItem(SESSION_KEY)
  const accountsRaw = localStorage.getItem(ACCOUNTS_KEY)
  const key = `${sessionRaw}|${accountsRaw}`
  if (key === cachedKey) return cachedState
  cachedKey = key

  let next: AuthState = SIGNED_OUT
  try {
    const session = sessionRaw ? (JSON.parse(sessionRaw) as Session) : null
    if (session?.type === 'guest') next = GUEST
    else if (session?.type === 'account') {
      const account = readAccounts().find((a) => a.id === session.accountId)
      if (account) next = { status: 'account', account }
    }
  } catch {
    next = SIGNED_OUT
  }
  cachedState = next
  return next
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, getSnapshot, () => LOADING)
}

async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export class AuthError extends Error {}

export async function registerAccount(input: {
  role: Role
  email: string
  password: string
  name: string
  profile: AthleteProfile | OrgProfile
}) {
  const email = input.email.trim().toLowerCase()
  const accounts = readAccounts()
  if (accounts.some((a) => a.email === email)) {
    throw new AuthError('Ya existe un usuario con ese email. Probá ingresar.')
  }
  const salt = crypto.randomUUID()
  const account: Account = {
    id: crypto.randomUUID(),
    role: input.role,
    email,
    name: input.name.trim(),
    salt,
    passwordHash: await hashPassword(input.password, salt),
    createdAt: new Date().toISOString(),
    profile: input.profile,
  }
  try {
    writeAccounts([...accounts, account])
  } catch {
    throw new AuthError('No hay espacio en el navegador para guardar el perfil.')
  }
  setSession({ type: 'account', accountId: account.id })
}

export async function signIn(role: Role, email: string, password: string) {
  const account = readAccounts().find((a) => a.email === email.trim().toLowerCase())
  const valid = account && (await hashPassword(password, account.salt)) === account.passwordHash
  if (!account || !valid) throw new AuthError('Email o contraseña incorrectos.')
  if (account.role !== role) {
    throw new AuthError('Ese usuario está registrado con otro perfil. Volvé y elegí el correcto.')
  }
  setSession({ type: 'account', accountId: account.id })
}

export function enterAsGuest() {
  setSession({ type: 'guest' })
}

export function signOut() {
  setSession(null)
}
