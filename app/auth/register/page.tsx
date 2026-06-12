'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CONFIRM_EMAIL_BANNER_URL = 'https://esxkbfyphnthqcxfpkte.supabase.co/storage/v1/object/public/Brand%20kit/Confirmar%20registro.png'

export default function Page() {
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('')
  const [successEmail, setSuccessEmail] = useState('')

  const getEmailRedirectTo = () => {
    if (typeof window === 'undefined') return undefined
    return `${window.location.origin}/auth/login?confirmed=1`
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = fullName.trim()

    if (!normalizedName) {
      setMessage('Escribe tu nombre completo.')
      setLoading(false)
      return
    }

    if (!normalizedEmail) {
      setMessage('Escribe tu correo electrónico.')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setMessage('La contraseña debe tener al menos 8 caracteres.')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: getEmailRedirectTo(),
          data: {
            full_name: normalizedName,
          },
        },
      })

      if (error) {
        setMessage(
          error.message ||
            'No se pudo crear la cuenta. Revisa tus datos e intenta nuevamente.'
        )
        setLoading(false)
        return
      }

      setSuccessEmail(normalizedEmail)
      setMessage('')
      setPassword('')
    } catch (error) {
      console.error('Unexpected signup error:', error)

      setMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al crear la cuenta. Intenta nuevamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!successEmail) return

    setResending(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: successEmail,
        options: {
          emailRedirectTo: getEmailRedirectTo(),
        },
      })

      if (error) {
        setMessage(
          error.message ||
            'No se pudo reenviar el correo de confirmación. Intenta nuevamente.'
        )
        return
      }

      setMessage('Te reenviamos el correo de confirmación.')
    } catch (error) {
      console.error('Unexpected resend error:', error)

      setMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al reenviar el correo.'
      )
    } finally {
      setResending(false)
    }
  }

  if (successEmail) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-6 py-10 sm:py-16">
        <div className="mx-auto max-w-md">
          <Card className="overflow-hidden rounded-[32px] border-white/70 bg-white/95 shadow-2xl">
            <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-800 to-orange-200 sm:h-44">
              <img
                src={CONFIRM_EMAIL_BANNER_URL}
                alt="RAMX"
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                  RAMX
                </p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-white">
                  Confirma tu registro
                </p>
              </div>
            </div>

            <CardContent className="p-7 sm:p-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-100 text-2xl text-emerald-800">
                ✓
              </div>

              <h1 className="mt-6 text-center text-3xl font-semibold tracking-tight text-neutral-950">
                Revisa tu correo
              </h1>

              <p className="mt-3 text-center text-sm leading-6 text-neutral-600">
                Te enviamos un enlace para confirmar tu cuenta y activar tu acceso a RAMX.
              </p>

              <p className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-center text-sm font-semibold text-neutral-950">
                {successEmail}
              </p>

              <div className="mt-6 rounded-3xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  Antes de iniciar sesión
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  Confirma tu cuenta desde el correo que acabamos de enviarte.
                  Si no aparece en tu bandeja principal, revisa spam, promociones
                  o correo no deseado.
                </p>
              </div>

              {message ? (
                <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                  {message}
                </div>
              ) : null}

              <div className="mt-6 grid gap-3">
                <Link
                  href="/auth/login"
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
                >
                  Ir a iniciar sesión
                </Link>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="rounded-2xl"
                >
                  {resending ? 'Reenviando...' : 'Reenviar correo'}
                </Button>
              </div>

              <p className="mt-6 text-center text-xs leading-5 text-neutral-500">
                RAMX · Registro Animal MX
              </p>
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
              RAMX · Cuenta de tutor
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
              Crear cuenta
            </h1>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Registra tu cuenta para crear la identidad digital de tu mascota,
              proteger su perfil y administrar su expediente.
            </p>

            <form onSubmit={handleRegister} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="José Rosas"
                  autoComplete="name"
                  required
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  required
                />
              </div>

              {message ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {message}
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full rounded-2xl bg-neutral-950 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
                disabled={loading}
              >
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </form>

            <p className="mt-6 text-sm text-neutral-600">
              ¿Ya tienes cuenta?{' '}
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