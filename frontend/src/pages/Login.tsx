import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthProvider'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { isAxiosError } from '@/lib/api'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})
type FormValues = z.infer<typeof schema>

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as any
  const [lockUntil, setLockUntil] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (!lockUntil) {
      setSecondsLeft(0)
      return
    }
    const update = () => {
      const diff = Math.ceil((lockUntil - Date.now()) / 1000)
      if (diff <= 0) {
        setLockUntil(null)
        setSecondsLeft(0)
      } else {
        setSecondsLeft(diff)
      }
    }
    update()
    const id = window.setInterval(update, 1000)
    return () => window.clearInterval(id)
  }, [lockUntil])

  const isLocked = lockUntil !== null
  const onSubmit = async (values: FormValues) => {
    if (isLocked) {
      toast.info('Bitte warte, bevor du es erneut versuchst.')
      return
    }
    try {
      await login(values.email, values.password)
      setLockUntil(null)
      setSecondsLeft(0)
      toast.success('Erfolgreich angemeldet')
      const to = location.state?.from?.pathname || '/dashboard'
      if (import.meta.env.DEV) {
        console.debug('Login redirect', { to, state: location.state })
      }
      await new Promise((resolve) => setTimeout(resolve, 0))
      navigate(to, { replace: true })
    } catch (e: any) {
      if (isAxiosError(e) && e.response?.status === 429) {
        const headers = e.response.headers || {}
        const retryAfterRaw = headers['retry-after'] ?? headers['Retry-After']
        const resetRaw = headers['ratelimit-reset'] ?? headers['RateLimit-Reset']
        const retryAfter = Number(retryAfterRaw ?? resetRaw)
        const waitSeconds = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.max(1, Math.min(Math.floor(retryAfter), 900))
          : 60
        setLockUntil(Date.now() + waitSeconds * 1000)
        setSecondsLeft(waitSeconds)
        toast.error(`Zu viele Versuche. Bitte in ${waitSeconds}s erneut anmelden.`)
        return
      }
      if (isAxiosError(e)) {
        if (!e.response) {
          toast.error('Server nicht erreichbar. Bitte Netzwerk prüfen oder Backend starten.')
        } else {
          const apiMessage = e.response?.data?.message || e.message
          toast.error(apiMessage || 'Anmeldung fehlgeschlagen')
        }
      } else {
        toast.error('Anmeldung fehlgeschlagen')
      }
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-sm border rounded-md p-6 bg-card">
        <h1 className="text-xl font-semibold mb-2">Login</h1>
        <div className="space-y-1">
          <label className="text-sm" htmlFor="email">E-Mail</label>
          <input id="email" className="w-full border rounded-md px-3 py-2 bg-background" type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm" htmlFor="password">Passwort</label>
          <input id="password" className="w-full border rounded-md px-3 py-2 bg-background" type="password" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" disabled={isSubmitting || isLocked} className="w-full">
          {isLocked ? `Warte ${secondsLeft}s…` : isSubmitting ? 'Bitte warten…' : 'Anmelden'}
        </Button>
        {isLocked && secondsLeft > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Zu viele Login-Versuche. Bitte versuche es in {secondsLeft}s erneut.
          </p>
        )}
      </form>
    </div>
  )
}
