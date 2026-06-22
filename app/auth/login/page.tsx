'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShellFallback />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const confirmed = searchParams.get('confirmed') === '1'

  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(
    confirmed
      ? 'Tu correo fue confirmado. Ya puedes iniciar sesión.'
      : ''
  )
  const [messageTone, setMessageTone] = useState<'neutral' | 'success' | 'error'>(
    confirmed ? 'success' : 'neutral'
  )

  const getResetRedirectTo = () => {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}/auth/callback?next=/auth/update-password`
}

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageTone('neutral')

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail || !password) {
      setMessage('Escribe tu correo y contraseña.')
      setMessageTone('error')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (error) {
        setMessage(getFriendlyAuthError(error.message))
        setMessageTone('error')
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Unexpected login error:', error)

      setMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al iniciar sesión. Intenta nuevamente.'
      )
      setMessageTone('error')
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageTone('neutral')

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      setMessage('Escribe el correo asociado a tu cuenta.')
      setMessageTone('error')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: getResetRedirectTo(),
        }
      )

      if (error) {
        setMessage(
          error.message ||
            'No se pudo enviar el correo para restablecer tu contraseña.'
        )
        setMessageTone('error')
        setLoading(false)
        return
      }

      setMessage(
        'Te enviamos un correo para restablecer tu contraseña. Revisa también spam o promociones.'
      )
      setMessageTone('success')
    } catch (error) {
      console.error('Unexpected password reset error:', error)

      setMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al enviar el correo de recuperación.'
      )
      setMessageTone('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <Card className="rounded-[32px] border-white/70 bg-white/95 shadow-2xl">
          <CardContent className="p-7 sm:p-8">
            <p className="text-sm font-medium text-neutral-500">
              RAMX · Acceso seguro
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
              {mode === 'login' ? 'Iniciar sesión' : 'Recuperar contraseña'}
            </h1>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              {mode === 'login'
                ? 'Accede a tu cuenta para administrar tus mascotas, alertas y expediente clínico.'
                : 'Te enviaremos un enlace seguro para crear una nueva contraseña.'}
            </p>

            <form
              onSubmit={mode === 'login' ? handleLogin : handleForgotPassword}
              className="mt-8 space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  required
                />
              </div>

              {mode === 'login' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="password">Contraseña</Label>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot')
                        setMessage('')
                        setMessageTone('neutral')
                      }}
                      className="text-xs font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-950"
                    >
                      Olvidé mi contraseña
                    </button>
                  </div>

                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    autoComplete="current-password"
                    required
                  />
                </div>
              ) : null}

              {message ? (
                <div
                  className={`rounded-2xl border p-4 text-sm leading-6 ${
                    messageTone === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : messageTone === 'error'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  {message}
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full rounded-2xl bg-neutral-950 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
                disabled={loading}
              >
                {loading
                  ? mode === 'login'
                    ? 'Entrando...'
                    : 'Enviando...'
                  : mode === 'login'
                    ? 'Entrar'
                    : 'Enviar enlace'}
              </Button>
            </form>

            {mode === 'forgot' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setMessage('')
                  setMessageTone('neutral')
                }}
                className="mt-5 text-sm font-medium text-neutral-700 underline underline-offset-4 hover:text-neutral-950"
              >
                Volver a iniciar sesión
              </button>
            ) : (
              <p className="mt-6 text-sm text-neutral-600">
                ¿No tienes cuenta?{' '}
                <Link
                  href="/auth/register"
                  className="font-medium text-neutral-950 underline underline-offset-4"
                >
                  Crear cuenta
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function LoginShellFallback() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <Card className="rounded-[32px] border-white/70 bg-white/95 shadow-2xl">
          <CardContent className="p-8">
            <p className="text-sm text-neutral-500">Cargando acceso seguro...</p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function getFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes('email not confirmed')) {
    return 'Tu correo aún no está confirmado. Revisa tu bandeja de entrada o spam.'
  }

  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid credentials')
  ) {
    return 'Correo o contraseña incorrectos.'
  }

  return message || 'No se pudo iniciar sesión. Intenta nuevamente.'
}