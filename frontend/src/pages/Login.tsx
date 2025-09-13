import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthProvider'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'

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
  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.email, values.password)
      toast.success('Erfolgreich angemeldet')
      const to = location.state?.from?.pathname || '/dashboard'
      navigate(to, { replace: true })
    } catch (e: any) {
      toast.error('Anmeldung fehlgeschlagen')
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
        <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Bitte warten…' : 'Anmelden'}</Button>
      </form>
    </div>
  )
}
