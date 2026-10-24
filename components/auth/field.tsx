import { useId } from 'react'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full rounded-lg border border-olympic-white/20 bg-olympic-white/5 px-3 py-2.5 text-base text-olympic-white placeholder:text-olympic-white/40 outline-none transition-colors focus:border-olympic-white/70 aria-[invalid=true]:border-olympic-red'

type BaseProps = {
  label: string
  error?: string
  hint?: string
  className?: string
}

export function Field({
  label,
  error,
  hint,
  className,
  ...props
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-olympic-white/80">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-olympic-red">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-olympic-white/50">{hint}</p>
      ) : null}
    </div>
  )
}

export function TextareaField({
  label,
  error,
  hint,
  className,
  ...props
}: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-olympic-white/80">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(inputClass, 'resize-none leading-relaxed')}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-olympic-red">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-olympic-white/50">{hint}</p>
      ) : null}
    </div>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg border border-olympic-red/50 bg-olympic-red/10 px-3 py-2 text-sm text-olympic-white">
      {message}
    </p>
  )
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateCredentials(email: string, password: string, confirm?: string) {
  const errors: Record<string, string> = {}
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Ingresá un email válido.'
  if (password.length < 8) errors.password = 'Mínimo 8 caracteres.'
  if (confirm !== undefined && confirm !== password) errors.confirm = 'Las contraseñas no coinciden.'
  return errors
}
