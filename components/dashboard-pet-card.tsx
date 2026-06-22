import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import LostPetMap from '@/components/maps/lost-pet-map-dynamic'
import PublicProfileQrCard from '@/components/pets/public-profile-qr-card'
import { markPetRecoveredAction } from '@/app/dashboard/actions'

type DashboardSighting = {
  id: string
  pet_id: string
  report_type: 'sighting' | 'found_safe'
  reporter_name: string | null
  seen_at: string | null
  location_text: string | null
  notes: string | null
  status: string | null
  lat: number | null
  lng: number | null
  created_at: string | null
}

type LostReport = {
  id: string
  status: string | null
  lost_at: string | null
  last_seen_text: string | null
  lat: number | null
  lng: number | null
  radius_km: number | null
  reward_text: string | null
  circumstances: string | null
  public_contact_instructions: string | null
  poster_image_url: string | null
  closed_at: string | null
  created_at: string | null
  updated_at: string | null
}

type Pet = {
  id: string
  name: string
  species: string | null
  breed: string | null
  sex: string | null
  color: string | null
  status: string | null
  public_slug: string | null
  microchip_number: string | null
  internal_id: string | null
  profile_photo_url: string | null
  has_active_lost_report?: boolean
  active_lost_report?: LostReport | null
  dashboard_sightings?: DashboardSighting[]
}

export default function DashboardPetCard({ pet }: { pet: Pet }) {
  const activeLostReport = pet.active_lost_report || null
  const isCurrentlyLost = pet.status === 'lost' || !!pet.has_active_lost_report

  const sightings = (pet.dashboard_sightings || []).filter(
    (item) => item.report_type === 'sighting' || item.report_type === 'found_safe'
  )

  const geolocatedSightings = sightings.filter(
    (item) => typeof item.lat === 'number' && typeof item.lng === 'number'
  )

  const foundSafeCount = sightings.filter(
    (item) => item.report_type === 'found_safe'
  ).length

  const latestSighting = sightings[0] || null

  const canShowDashboardMap =
    isCurrentlyLost &&
    typeof activeLostReport?.lat === 'number' &&
    typeof activeLostReport?.lng === 'number'

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-lg">
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-sky-50">
        {pet.profile_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pet.profile_photo_url}
            alt={pet.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            Sin foto
          </div>
        )}

        <div className="absolute left-4 top-4">
          <Badge
            variant={isCurrentlyLost ? 'destructive' : 'secondary'}
            className="rounded-full px-3 py-1"
          >
            {isCurrentlyLost ? 'Extraviada' : 'Activa'}
          </Badge>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-neutral-950">
            {pet.name}
          </h3>

          <p className="mt-1 text-sm text-neutral-600">
            {pet.species || 'Mascota'} {pet.breed ? `· ${pet.breed}` : ''}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <MiniInfo label="Sexo" value={pet.sex || 'No disponible'} />
          <MiniInfo label="Color" value={pet.color || 'No disponible'} />
          <MiniInfo
            label="Microchip / ID"
            value={pet.microchip_number || pet.internal_id || 'No disponible'}
          />
          <MiniInfo
            label="Slug público"
            value={pet.public_slug || 'No disponible'}
          />
        </div>

        {pet.public_slug ? (
          <PublicProfileQrCard
            petName={pet.name}
            publicSlug={pet.public_slug}
            identifier={pet.microchip_number || pet.internal_id}
            photoUrl={pet.profile_photo_url}
          />
        ) : (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-950">
              QR público no disponible todavía
            </p>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Esta mascota aún no tiene slug público. Revisa que tenga microchip
              o ID interno asignado.
            </p>
          </div>
        )}

        {isCurrentlyLost ? (
          <div className="space-y-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
            <div>
              <p className="text-sm font-semibold text-amber-950">
                Esta mascota sigue marcada como extraviada.
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Si ya volvió a casa, puedes cerrar el caso y ocultar el aviso público.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <SignalCard
                label="Reportes"
                value={String(sightings.length)}
                helper="Públicos recibidos"
              />
              <SignalCard
                label="Con GPS"
                value={String(geolocatedSightings.length)}
                helper="Útiles para mapa"
              />
              <SignalCard
                label="Resguardada"
                value={String(foundSafeCount)}
                helper="Reportes tipo segura"
              />
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Inteligencia de avistamientos
              </p>

              <p className="mt-2 text-sm leading-6 text-neutral-800">
                {getIntelMessage({
                  total: sightings.length,
                  geolocated: geolocatedSightings.length,
                  foundSafe: foundSafeCount,
                  latestLocation: latestSighting?.location_text || null,
                })}
              </p>

              {latestSighting ? (
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Última señal:{' '}
                  {latestSighting.location_text || 'sin ubicación escrita'} ·{' '}
                  {latestSighting.seen_at
                    ? formatDateTime(latestSighting.seen_at)
                    : 'sin fecha'}
                </p>
              ) : null}
            </div>

            {canShowDashboardMap ? (
              <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-sm">
                <LostPetMap
                  centerLat={activeLostReport.lat as number}
                  centerLng={activeLostReport.lng as number}
                  radiusKm={activeLostReport.radius_km}
                  petName={pet.name}
                  sightings={geolocatedSightings}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
                <p className="text-sm font-medium text-amber-950">
                  Aún no hay punto base para mostrar mapa.
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Entra a editar perfil, activa modo extraviado y guarda
                  latitud/longitud en la ubicación base.
                </p>
              </div>
            )}

            <form action={markPetRecoveredAction}>
              <input type="hidden" name="petId" value={pet.id} />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 sm:w-auto"
              >
                Marcar como recuperada
              </button>
            </form>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {pet.public_slug ? (
            <Link
              href={`/p/${pet.public_slug}`}
              className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Ver perfil público
            </Link>
          ) : null}

          <Link
            href={`/dashboard/pets/${pet.id}/edit`}
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition-all duration-200 hover:bg-white hover:shadow-md"
          >
            Editar perfil
          </Link>

          <Link
            href={`/dashboard/pets/${pet.id}/medical`}
            className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-900 transition-all duration-200 hover:bg-white hover:shadow-md"
          >
            Expediente clínico
          </Link>
        </div>
      </div>
    </div>
  )
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3">
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-5 text-neutral-950">
        {value}
      </p>
    </div>
  )
}

function SignalCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/85 p-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-neutral-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-neutral-500">{helper}</p>
    </div>
  )
}

function getIntelMessage({
  total,
  geolocated,
  foundSafe,
  latestLocation,
}: {
  total: number
  geolocated: number
  foundSafe: number
  latestLocation: string | null
}) {
  if (total === 0) {
    return 'Aún no hay reportes públicos. Mantén visible el perfil y comparte el cartel para aumentar la posibilidad de recibir señales.'
  }

  if (foundSafe > 0) {
    return 'Hay al menos un reporte indicando que la mascota podría estar resguardada. Prioriza revisar ese contacto desde el centro de reportes.'
  }

  if (geolocated >= 2) {
    return `Ya existen ${geolocated} reportes con ubicación. RAMX puede mostrar una zona sugerida de búsqueda a partir del punto base y los avistamientos.`
  }

  if (geolocated === 1) {
    return 'Hay un reporte geolocalizado. Úsalo como señal inicial y confirma la zona antes de ampliar la búsqueda.'
  }

  return latestLocation
    ? `Hay reportes sin GPS exacto. La última ubicación escrita fue: ${latestLocation}.`
    : 'Hay reportes recibidos, pero todavía no tienen coordenadas suficientes para estimar una zona de búsqueda.'
}

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible'
  }

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}