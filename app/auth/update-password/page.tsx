'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function UpdatePasswordPage() {
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (password.length < 8) {
      setMessage('La contraseña debe tener al menos 8 caracteres.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        setMessage(
          error.message ||
            'No se pudo actualizar la contraseña. Solicita un nuevo enlace.'
        )
        setLoading(false)
        return
      }

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
                />
              </div>

              {message ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {message}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-neutral-950 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
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