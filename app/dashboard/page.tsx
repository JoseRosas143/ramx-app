import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import {
  getTutorNotifications,
  getTutorPets,
  getTutorSightings,
} from '@/lib/dashboard'
import DashboardPetCard from '@/components/dashboard-pet-card'
import LogoutButton from './logout-button'
import {
  archiveNotificationAction,
  markNotificationReadAction,
  updateSightingStatusAction,
} from './actions'
import { ensureWelcomeEmailSent } from '@/lib/welcome-email'

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

if (!profile) {
  redirect('/auth/login')
}

if (!profile.onboarding_completed) {
  redirect('/onboarding')
}

await ensureWelcomeEmailSent({
  profileId: user.id,
  email: user.email,
  fullName: profile.full_name,
})

const pets = await getTutorPets(user.id)
const sightings = await getTutorSightings(user.id)
const rawNotifications = await getTutorNotifications(user.id)

  const notifications = rawNotifications
    .filter((item: any) => {
      if (item.channel === 'email' && item.kind !== 'system') {
        return false
      }
      return true
    })
    .sort((a: any, b: any) => {
      if (a.is_read !== b.is_read) {
        return Number(a.is_read) - Number(b.is_read)
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

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

  const unreadNotifications = notifications.filter((item: any) => !item.is_read).length
  const geolocatedCount = visibleSightings.filter(
    (item: any) => typeof item.lat === 'number' && typeof item.lng === 'number'
  ).length
  const safeCount = visibleSightings.filter(
    (item: any) => item.report_type === 'found_safe'
  ).length

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
                  Aquí puedes ver tus mascotas, alertas nuevas y gestionar los reportes públicos recibidos.
                </p>
              </div>
            </div>

           <div className="flex flex-wrap gap-3">
  <a
    href="/dashboard/account"
    className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
  >
    ⚙️ Configuración
  </a>

  <a
    href="/tienda"
    className="inline-flex items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-800 transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-100 hover:shadow-md"
  >
    🏷️ Tienda RAMX
  </a>

  <a
    href="/dashboard/pets/new"
    className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
  >
    Agregar nueva mascota
  </a>

  <LogoutButton />
</div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Mascotas" value={String(pets.length)} />
            <StatCard label="Activas" value={String(activePetsCount)} />
            <StatCard label="Extraviadas" value={String(lostPetsCount)} />
            <StatCard label="Alertas nuevas" value={String(unreadNotifications)} />
            <StatCard label="Con GPS" value={String(geolocatedCount)} />
            <StatCard label="Resguardada" value={String(safeCount)} />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
              Centro de alertas
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Notificaciones internas y señales recientes del sistema.
            </p>
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-[28px] border border-neutral-200 bg-white/95 p-6 shadow-lg">
              <p className="text-sm text-neutral-600">
                Aún no hay alertas en tu cuenta.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {notifications.map((item: any) => (
                <div
                  key={item.id}
                  className={`rounded-[24px] border bg-white/95 p-5 shadow-lg ${
                    item.is_read ? 'border-neutral-200' : 'border-amber-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        item.is_read
                          ? 'bg-neutral-100 text-neutral-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.is_read ? 'Leída' : 'Nueva'}
                    </span>

                    <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                      {formatRelativeTime(item.created_at)}
                    </span>

                    <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                      {item.channel === 'email'
                        ? 'Correo'
                        : item.channel === 'whatsapp'
                        ? 'WhatsApp'
                        : 'Interna'}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-semibold text-neutral-950">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-neutral-700">
                    {item.body}
                  </p>

                  {item.meta?.locationText ? (
                    <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                        Ubicación reportada
                      </p>
                      <p className="mt-1 text-sm font-medium text-neutral-950">
                        {item.meta.locationText}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.action_url || item.meta?.publicSlug ? (
                      <a
                        href={item.action_url || `/p/${item.meta.publicSlug}`}
                        className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                      >
                        Ver perfil público
                      </a>
                    ) : null}

                    {!item.is_read ? (
                      <form action={markNotificationReadAction}>
                        <input type="hidden" name="notificationId" value={item.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                        >
                          Marcar como leída
                        </button>
                      </form>
                    ) : null}

                    <form action={archiveNotificationAction}>
                      <input type="hidden" name="notificationId" value={item.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                      >
                        Archivar
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              Reportes pendientes
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
        <MiniInfo label="Ubicación" value={item.location_text || 'No disponible'} />
        <MiniInfo
          label="Fecha"
          value={
            item.seen_at
              ? new Date(item.seen_at).toLocaleString('es-MX')
              : 'No disponible'
          }
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