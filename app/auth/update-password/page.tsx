'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<UpdatePasswordFallback />}>
      <UpdatePasswordContent />
    </Suspense>
  )
}

function UpdatePasswordContent() {
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [canUpdatePassword, setCanUpdatePassword] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'neutral' | 'success' | 'error'>(
    'neutral'
  )
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let mounted = true

    const prepareRecoverySession = async () => {
      setCheckingSession(true)
      setMessage('')
      setMessageTone('neutral')

      try {
        const code = searchParams.get('code')

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            if (!mounted) return

            setCanUpdatePassword(false)
            setMessage(
              'El enlace de recuperación no pudo validarse. Solicita un nuevo correo para restablecer tu contraseña.'
            )
            setMessageTone('error')
            setCheckingSession(false)
            return
          }

          if (mounted) {
            setCanUpdatePassword(true)
            setCheckingSession(false)
          }

          return
        }

        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(
            window.location.hash.replace(/^#/, '')
          )

          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            window.history.replaceState(
              null,
              '',
              window.location.pathname + window.location.search
            )

            if (error) {
              if (!mounted) return

              setCanUpdatePassword(false)
              setMessage(
                'El enlace de recuperación no pudo crear una sesión válida. Solicita un nuevo correo.'
              )
              setMessageTone('error')
              setCheckingSession(false)
              return
            }

            if (mounted) {
              setCanUpdatePassword(true)
              setCheckingSession(false)
            }

            return
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (session) {
          setCanUpdatePassword(true)
          setMessage('')
          setMessageTone('neutral')
        } else {
          setCanUpdatePassword(false)
          setMessage(
            'No hay una sesión de recuperación activa. Abre el enlace desde el correo más reciente o solicita uno nuevo.'
          )
          setMessageTone('error')
        }
      } catch (error) {
        console.error('Recovery session error:', error)

        if (!mounted) return

        setCanUpdatePassword(false)
        setMessage(
          error instanceof Error
            ? error.message
            : 'No se pudo validar la sesión de recuperación.'
        )
        setMessageTone('error')
      } finally {
        if (mounted) {
          setCheckingSession(false)
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setCanUpdatePassword(true)
        setMessage('')
        setMessageTone('neutral')
      }
    })

    prepareRecoverySession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [searchParams, supabase])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageTone('neutral')

    if (!canUpdatePassword) {
      setMessage(
        'No hay una sesión válida para cambiar la contraseña. Solicita un nuevo enlace de recuperación.'
      )
      setMessageTone('error')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setMessage('La contraseña debe tener al menos 8 caracteres.')
      setMessageTone('error')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.')
      setMessageTone('error')
      setLoading(false)
      return
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setMessage(
          'La sesión de recuperación expiró. Solicita un nuevo correo para restablecer tu contraseña.'
        )
        setMessageTone('error')
        setCanUpdatePassword(false)
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        setMessage(
          error.message ||
            'No se pudo actualizar la contraseña. Solicita un nuevo enlace.'
        )
        setMessageTone('error')
        setLoading(false)
        return
      }

      await supabase.auth.signOut()

      setSuccess(true)
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Unexpected update password error:', error)

      setMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al actualizar tu contraseña.'
      )
      setMessageTone('error')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-md">
          <Card className="rounded-[32px] border-white/70 bg-white/95 shadow-2xl">
            <CardContent className="p-7 text-center sm:p-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-100 text-2xl">
                ✓
              </div>

              <h1 className="mt-6 text-3xl font-semibold tracking-tight text-neutral-950">
                Contraseña actualizada
              </h1>

              <p className="mt-3 text-sm leading-6 text-neutral-600">
                Ya puedes iniciar sesión nuevamente con tu nueva contraseña.
              </p>

              <Link
                href="/auth/login"
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
              >
                Ir a iniciar sesión
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <Card className="rounded-[32px] border-white/70 bg-white/95 shadow-2xl">
          <CardContent className="p-7 sm:p-8">
            <p className="text-sm font-medium text-neutral-500">
              RAMX · Seguridad
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
              Nueva contraseña
            </h1>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Crea una nueva contraseña para recuperar el acceso a tu cuenta.
            </p>

            {checkingSession ? (
              <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
                Validando enlace seguro...
              </div>
            ) : null}

            {message ? (
              <div
                className={`mt-6 rounded-2xl border p-4 text-sm leading-6 ${
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

            <form onSubmit={handleUpdatePassword} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  required
                  disabled={checkingSession || !canUpdatePassword || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  required
                  disabled={checkingSession || !canUpdatePassword || loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || checkingSession || !canUpdatePassword}
                className="w-full rounded-2xl bg-neutral-950 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg disabled:opacity-60"
              >
                {loading ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </form>

            <p className="mt-6 text-sm text-neutral-600">
              ¿Recordaste tu contraseña?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-neutral-950 underline underline-offset-4"
              >
                Inicia sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function UpdatePasswordFallback() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-md rounded-[32px] border border-white/70 bg-white/95 p-8 text-center text-sm text-neutral-600 shadow-2xl">
        Cargando recuperación de contraseña...
      </div>
    </main>
  )
}