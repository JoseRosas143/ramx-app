import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import {
  deleteAccountAction,
  deletePetAction,
  requestEmailChangeAction,
  updateAccountProfileAction,
} from './actions'
import AccountSettingsSubmitButton from './submit-button'
import ThemeToggle from './theme-toggle'

type PageProps = {
  searchParams?: Promise<{
    saved?: string
    email_change_sent?: string
    pet_deleted?: string
  }>
}

export default async function AccountSettingsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {}

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      phone,
      country_code,
      onboarding_completed
    `)
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  const { data: pets } = await supabase
    .from('pets')
    .select(`
      id,
      name,
      species,
      breed,
      public_slug,
      profile_photo_url,
      microchip_number,
      internal_id,
      status,
      created_at
    `)
    .eq('primary_tutor_profile_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10 dark:bg-neutral-950">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur sm:p-8 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Badge className="rounded-full bg-neutral-100 px-4 py-1 text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200">
                RAMX · Configuración
              </Badge>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
                  Configuración
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base dark:text-neutral-300">
                  Administra tu cuenta, seguridad, preferencias y acciones sensibles.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              Volver al dashboard
            </Link>
          </div>
        </section>

        {params.saved ? (
          <StatusBox text="Configuración actualizada correctamente." />
        ) : null}

        {params.email_change_sent ? (
          <StatusBox text="Te enviamos un correo para confirmar el cambio de email." />
        ) : null}

        {params.pet_deleted ? (
          <StatusBox text="Mascota eliminada correctamente." />
        ) : null}

        <Card className="rounded-[32px] border-white/70 bg-white/95 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <CardContent className="p-6 sm:p-8">
            <form action={updateAccountProfileAction} className="space-y-6">
              <SectionTitle
                title="Datos del tutor"
                description="Estos datos ayudan a contactarte en caso de extravío o emergencia."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre completo">
                  <input
                    name="fullName"
                    defaultValue={profile.full_name || ''}
                    className={inputClass}
                    required
                  />
                </Field>

                <Field label="Correo actual">
                  <input
                    value={profile.email || user.email || ''}
                    disabled
                    className={disabledInputClass}
                  />
                </Field>

                <Field label="Lada / código de país">
                  <input
                    name="countryCode"
                    defaultValue={profile.country_code || '+52'}
                    placeholder="+52"
                    className={inputClass}
                  />
                </Field>

                <Field label="Teléfono">
                  <input
                    name="phone"
                    defaultValue={profile.phone || ''}
                    placeholder="2321416236"
                    className={inputClass}
                  />
                </Field>
              </div>

              <AccountSettingsSubmitButton />
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-white/70 bg-white/95 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <SectionTitle
              title="Seguridad"
              description="Cambia tu email o contraseña mediante flujos verificados."
            />

            <form action={requestEmailChangeAction} className="space-y-4">
              <Field label="Nuevo email">
                <input
                  name="newEmail"
                  type="email"
                  placeholder="nuevo@correo.com"
                  className={inputClass}
                  required
                />
              </Field>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              >
                Cambiar email
              </button>
            </form>

            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                    Contraseña
                  </p>
                  <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                    Actualiza tu contraseña si sospechas que alguien tuvo acceso.
                  </p>
                </div>

                <Link
                  href="/auth/update-password"
                  className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
                >
                  Cambiar contraseña
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-white/70 bg-white/95 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <SectionTitle
              title="Preferencias"
              description="Ajusta la experiencia visual de RAMX en este dispositivo."
            />

            <ThemeToggle />
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-red-100 bg-white/95 shadow-xl dark:border-red-950 dark:bg-neutral-900">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <SectionTitle
              title="Eliminar mascota"
              description="Elimina una mascota y sus registros asociados. Úsalo solo si fue un registro de prueba o error."
            />

            {(pets || []).length === 0 ? (
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                No tienes mascotas registradas.
              </p>
            ) : (
              <div className="grid gap-4">
                {(pets || []).map((pet) => (
                  <div
                    key={pet.id}
                    className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        {pet.profile_photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={pet.profile_photo_url}
                            alt={pet.name}
                            className="h-14 w-14 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
                            🐾
                          </div>
                        )}

                        <div>
                          <p className="font-semibold text-neutral-950 dark:text-white">
                            {pet.name}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {pet.microchip_number ||
                              pet.internal_id ||
                              pet.public_slug ||
                              'Sin ID visible'}
                          </p>
                        </div>
                      </div>

                      <form action={deletePetAction} className="grid gap-2 sm:w-72">
                        <input type="hidden" name="petId" value={pet.id} />
                        <input
                          name="confirmPetName"
                          placeholder={`Escribe: ${pet.name}`}
                          className={inputClass}
                          required
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-2xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:bg-neutral-900 dark:text-red-300"
                        >
                          Eliminar mascota
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-red-200 bg-red-50 shadow-xl dark:border-red-950 dark:bg-red-950/20">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <SectionTitle
              title="Eliminar cuenta"
              description="Elimina tu cuenta, mascotas, reportes y datos asociados. Esta acción no se puede deshacer."
            />

            <form action={deleteAccountAction} className="grid gap-3 sm:max-w-md">
              <input
                name="confirmation"
                placeholder="Escribe ELIMINAR"
                className={inputClass}
                required
              />

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Eliminar mi cuenta
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function StatusBox({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
      {text}
    </div>
  )
}

function SectionTitle({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-white">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
        {description}
      </p>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {label}
      </span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100'

const disabledInputClass =
  'w-full rounded-2xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-500'