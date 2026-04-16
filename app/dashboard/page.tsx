import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { getTutorPets, getTutorSightings } from '@/lib/dashboard'
import DashboardPetCard from '@/components/dashboard-pet-card'
import LogoutButton from './logout-button'
import { updateSightingStatusAction } from './actions'

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

  const visibleSightings = sightings.filter((item: any) => item.status !== 'archived')
  const pendingSightings = visibleSightings.filter(
    (item: any) => item.status === 'new' || item.status === 'reviewed'
  )
  const resolvedSightings = visibleSightings.filter(
    (item: any) => item.status === 'resolved'
  )

  const lostPetsCount = pets.filter(
    (pet: any) => pet.status === 'lost' || pet.has_active_lost_report
  ).length
  const activePetsCount = pets.length - lostPetsCount

  const newCount = visibleSightings.filter((item: any) => item.status === 'new').length
  const reviewedCount = visibleSightings.filter((item: any) => item.status === 'reviewed').length
  const resolvedCount = visibleSightings.filter((item: any) => item.status === 'resolved').length
  const geolocatedCount = visibleSightings.filter(
    (item: any) => typeof item.lat === 'number' && typeof item.lng === 'number'
  ).length
  const safeCount = visibleSightings.filter(
    (item: any) => item.report_type === 'found_safe'
  ).length

  const latestSignal = visibleSightings[0] || null

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
                  Aquí puedes ver tus mascotas y gestionar los reportes públicos recibidos.
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

          <div className="mt-6 grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Mascotas" value={String(pets.length)} />
            <StatCard label="Activas" value={String(activePetsCount)} />
            <StatCard label="Extraviadas" value={String(lostPetsCount)} />
            <StatCard label="Pendientes" value={String(pendingSightings.length)} />
            <StatCard label="Con GPS" value={String(geolocatedCount)} />
            <StatCard label="Resguardada" value={String(safeCount)} />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <SignalBox
            title="Última señal"
            body={
              latestSignal
                ? `${getReportTypeLabel(latestSignal.report_type)} · ${latestSignal.pets?.name || 'Mascota'}`
                : 'Sin reportes todavía'
            }
            subtext={
              latestSignal?.seen_at
                ? `${formatRelativeTime(latestSignal.seen_at)} · ${
                    latestSignal.location_text || 'Ubicación no especificada'
                  }`
                : 'En cuanto lleguen avistamientos aparecerán aquí.'
            }
          />
          <SignalBox
            title="Estados activos"
            body={`${newCount} nuevos · ${reviewedCount} revisados`}
            subtext="Estos son los reportes que aún requieren atención o seguimiento."
          />
          <SignalBox
            title="Historial resuelto"
            body={`${resolvedCount} resueltos`}
            subtext="Mantener este bloque te ayuda a entender qué señales sí terminaron en cierre útil."
          />
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
              {pets.map((pet: any) => (
                <DashboardPetCard key={pet.id} pet={pet} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
              Avistamientos y reportes pendientes
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Este bloque prioriza lo nuevo y lo que sigue en revisión.
            </p>
          </div>

          {pendingSightings.length === 0 ? (
            <div className="rounded-[28px] border border-neutral-200 bg-white/95 p-6 shadow-lg">
              <p className="text-sm text-neutral-600">
                No tienes reportes pendientes en este momento.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingSightings.map((item: any) => (
                <SightingCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
              Historial de reportes procesados
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Reportes resueltos para trazabilidad del caso.
            </p>
          </div>

          {resolvedSightings.length === 0 ? (
            <div className="rounded-[28px] border border-neutral-200 bg-white/95 p-6 shadow-lg">
              <p className="text-sm text-neutral-600">
                Aún no hay reportes resueltos.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {resolvedSightings.map((item: any) => (
                <SightingCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function SightingCard({ item }: { item: any }) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white/95 p-5 shadow-lg">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            item.report_type === 'found_safe'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {getReportTypeLabel(item.report_type)}
        </span>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
            item.status
          )}`}
        >
          {getStatusLabel(item.status)}
        </span>

        <span className="text-sm text-neutral-500">
          {item.pets?.name || 'Mascota'}
        </span>

        <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
          {formatRelativeTime(item.seen_at)}
        </span>

        {typeof item.lat === 'number' && typeof item.lng === 'number' ? (
          <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
            Con GPS
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <MiniInfo
          label="Ubicación"
          value={item.location_text || 'No disponible'}
        />
        <MiniInfo
          label="Fecha"
          value={
            item.seen_at
              ? new Date(item.seen_at).toLocaleString('es-MX')
              : 'No disponible'
          }
        />
        <MiniInfo
          label="Nombre"
          value={item.reporter_name || 'No disponible'}
        />
        <MiniInfo
          label="Teléfono / WhatsApp"
          value={
            item.reporter_whatsapp || item.reporter_phone || 'No disponible'
          }
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

      <div className="mt-4 flex flex-wrap gap-2">
        {item.reporter_whatsapp ? (
          <a
            href={buildWhatsappLink(item.reporter_whatsapp, item.pets?.name)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
          >
            Abrir WhatsApp
          </a>
        ) : null}

        {item.reporter_phone ? (
          <a
            href={`tel:${item.reporter_phone}`}
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Llamar
          </a>
        ) : null}

        {item.status === 'new' ? (
          <form action={updateSightingStatusAction}>
            <input type="hidden" name="sightingId" value={item.id} />
            <input type="hidden" name="nextStatus" value="reviewed" />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800 transition hover:bg-sky-100"
            >
              Marcar revisado
            </button>
          </form>
        ) : null}

        {item.status !== 'resolved' ? (
          <form action={updateSightingStatusAction}>
            <input type="hidden" name="sightingId" value={item.id} />
            <input type="hidden" name="nextStatus" value="resolved" />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-50"
            >
              Marcar resuelto
            </button>
          </form>
        ) : null}

        {item.status !== 'archived' ? (
          <form action={updateSightingStatusAction}>
            <input type="hidden" name="sightingId" value={item.id} />
            <input type="hidden" name="nextStatus" value="archived" />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Archivar
            </button>
          </form>
        ) : null}
      </div>
    </div>
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

function SignalBox({
  title,
  body,
  subtext,
}: {
  title: string
  body: string
  subtext: string
}) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white/95 p-4 shadow-lg">
      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
        {title}
      </p>
      <p className="mt-2 text-base font-semibold text-neutral-950">{body}</p>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{subtext}</p>
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

function getReportTypeLabel(type: string | null) {
  return type === 'found_safe' ? 'La tiene resguardada' : 'Avistamiento'
}

function getStatusLabel(status: string | null) {
  switch (status) {
    case 'reviewed':
      return 'Revisado'
    case 'resolved':
      return 'Resuelto'
    case 'archived':
      return 'Archivado'
    case 'new':
    default:
      return 'Nuevo'
  }
}

function getStatusClass(status: string | null) {
  switch (status) {
    case 'reviewed':
      return 'bg-sky-100 text-sky-800'
    case 'resolved':
      return 'bg-emerald-100 text-emerald-800'
    case 'archived':
      return 'bg-neutral-200 text-neutral-700'
    case 'new':
    default:
      return 'bg-rose-100 text-rose-800'
  }
}

function formatRelativeTime(value: string | null) {
  if (!value) return 'Sin fecha'
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return value

  const diffMs = Date.now() - time
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Hace menos de 1 hora'
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
  if (diffDays < 30) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`

  return new Date(value).toLocaleString('es-MX')
}

function buildWhatsappLink(phone: string, petName?: string | null) {
  const cleanPhone = phone.replace(/\D/g, '')
  const message = encodeURIComponent(
    `Hola, te contacto por el reporte de ${petName || 'la mascota'} en RAMX.`
  )
  return `https://wa.me/${cleanPhone}?text=${message}`
}