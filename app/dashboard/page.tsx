import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { getTutorPets, getTutorSightings } from '@/lib/dashboard'
import DashboardPetCard from '@/components/dashboard-pet-card'
import LogoutButton from './logout-button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile && !profile.onboarding_completed) {
    redirect('/onboarding')
  }

  const pets = await getTutorPets(user.id)
  const sightings = await getTutorSightings(user.id)

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Badge className="rounded-full bg-neutral-100 px-4 py-1 text-neutral-700 hover:bg-neutral-100">
                RAMX · Dashboard
              </Badge>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                  Hola, {profile?.full_name || 'Tutor'}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
                  Aquí puedes ver tus mascotas y los reportes públicos recibidos.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/onboarding"
                className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Registrar otra mascota
              </a>

              <LogoutButton />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <StatCard label="Mascotas" value={String(pets.length)} />
            <StatCard
              label="Activas"
              value={String(pets.filter((pet) => pet.status !== 'lost').length)}
            />
            <StatCard
              label="Extraviadas"
              value={String(pets.filter((pet) => pet.status === 'lost').length)}
            />
            <StatCard label="Reportes" value={String(sightings.length)} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
            Mis mascotas
          </h2>

          {pets.length === 0 ? (
            <div className="rounded-[28px] border border-neutral-200 bg-white/95 p-8 text-center shadow-lg">
              <h3 className="text-lg font-semibold text-neutral-950">
                Aún no tienes mascotas registradas
              </h3>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {pets.map((pet) => (
                <DashboardPetCard key={pet.id} pet={pet} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
            Reportes recibidos
          </h2>

          {sightings.length === 0 ? (
            <div className="rounded-[28px] border border-neutral-200 bg-white/95 p-6 shadow-lg">
              <p className="text-sm text-neutral-600">
                Aún no has recibido reportes públicos.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sightings.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-neutral-200 bg-white/95 p-5 shadow-lg"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        item.report_type === 'found_safe'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.report_type === 'found_safe'
                        ? 'La tiene resguardada'
                        : 'Avistamiento'}
                    </span>

                    <span className="text-sm text-neutral-500">
                      {item.pets?.name || 'Mascota'}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <MiniInfo label="Ubicación" value={item.location_text || 'No disponible'} />
                    <MiniInfo
                      label="Fecha"
                      value={item.seen_at ? new Date(item.seen_at).toLocaleString('es-MX') : 'No disponible'}
                    />
                    <MiniInfo label="Nombre" value={item.reporter_name || 'No disponible'} />
                    <MiniInfo
                      label="Teléfono / WhatsApp"
                      value={item.reporter_whatsapp || item.reporter_phone || 'No disponible'}
                    />
                  </div>

                  {item.notes ? (
                    <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        Comentario
                      </p>
                      <p className="mt-2 text-sm leading-6 text-neutral-800">
                        {item.notes}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
        {value}
      </p>
    </div>
  )
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3">
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-neutral-950">{value}</p>
    </div>
  )
}