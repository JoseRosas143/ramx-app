import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { getTutorPets } from '@/lib/dashboard'
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
                  Aquí puedes ver las mascotas registradas en tu cuenta y acceder
                  a su perfil público.
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

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Mascotas registradas" value={String(pets.length)} />
            <StatCard
              label="Mascotas activas"
              value={String(pets.filter((pet) => pet.status !== 'lost').length)}
            />
            <StatCard
              label="Extraviadas"
              value={String(pets.filter((pet) => pet.status === 'lost').length)}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
              Mis mascotas
            </h2>
          </div>

          {pets.length === 0 ? (
            <div className="rounded-[28px] border border-neutral-200 bg-white/95 p-8 text-center shadow-lg">
              <h3 className="text-lg font-semibold text-neutral-950">
                Aún no tienes mascotas registradas
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                Registra tu primera mascota para activar su perfil público en RAMX.
              </p>

              <div className="mt-5">
                <a
                  href="/onboarding"
                  className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Registrar mascota
                </a>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {pets.map((pet) => (
                <DashboardPetCard key={pet.id} pet={pet} />
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