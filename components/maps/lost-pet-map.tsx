'use client'

import { useEffect, useMemo, useState } from 'react'
import { Circle, MapContainer, Marker, Popup, Polyline, TileLayer } from 'react-leaflet'
import L from 'leaflet'

type SightingItem = {
  id: string
  report_type: 'sighting' | 'found_safe'
  lat: number | null
  lng: number | null
  location_text: string | null
  seen_at: string | null
  notes: string | null
  reporter_name?: string | null
}

type Props = {
  centerLat: number
  centerLng: number
  radiusKm?: number | null
  petName: string
  sightings: SightingItem[]
}

type WeightedPoint = {
  id: string
  lat: number
  lng: number
  report_type: 'sighting' | 'found_safe'
  weight: number
  seen_at: string | null
  location_text: string | null
  notes: string | null
  reporter_name?: string | null
}

const lostCenterIcon = new L.DivIcon({
  html: `
    <div style="
      width: 18px;
      height: 18px;
      border-radius: 9999px;
      background: #dc2626;
      border: 3px solid white;
      box-shadow: 0 6px 16px rgba(0,0,0,0.20);
    "></div>
  `,
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const sightingIcon = new L.DivIcon({
  html: `
    <div style="
      width: 16px;
      height: 16px;
      border-radius: 9999px;
      background: #f59e0b;
      border: 3px solid white;
      box-shadow: 0 6px 16px rgba(0,0,0,0.18);
    "></div>
  `,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const foundSafeIcon = new L.DivIcon({
  html: `
    <div style="
      width: 16px;
      height: 16px;
      border-radius: 9999px;
      background: #059669;
      border: 3px solid white;
      box-shadow: 0 6px 16px rgba(0,0,0,0.18);
    "></div>
  `,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const suggestedCenterIcon = new L.DivIcon({
  html: `
    <div style="
      width: 18px;
      height: 18px;
      border-radius: 9999px;
      background: #7c3aed;
      border: 3px solid white;
      box-shadow: 0 6px 16px rgba(0,0,0,0.22);
    "></div>
  `,
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

export default function LostPetMap({
  centerLat,
  centerLng,
  radiusKm,
  petName,
  sightings,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const [mapKey, setMapKey] = useState('')

  useEffect(() => {
    setMounted(true)
    setMapKey(`lost-map-${centerLat}-${centerLng}-${Date.now()}`)
  }, [centerLat, centerLng])

  const baseRadiusKm = clamp(radiusKm || 1, 0.3, 8)
  const baseRadiusMeters = baseRadiusKm * 1000

  const validSightings: WeightedPoint[] = useMemo(() => {
    return sightings
      .filter((item) => typeof item.lat === 'number' && typeof item.lng === 'number')
      .map((item) => ({
        id: item.id,
        lat: item.lat as number,
        lng: item.lng as number,
        report_type: item.report_type,
        weight: getPointWeight(item),
        seen_at: item.seen_at,
        location_text: item.location_text,
        notes: item.notes,
        reporter_name: item.reporter_name,
      }))
  }, [sightings])

  const suggestedZone = useMemo(() => {
    if (validSightings.length === 0) return null

    return buildSuggestedZone({
      baseLat: centerLat,
      baseLng: centerLng,
      baseRadiusKm,
      points: validSightings,
    })
  }, [baseLatKey(centerLat, centerLng, baseRadiusKm), validSightings])

  if (!mounted) {
    return (
      <section className="overflow-hidden rounded-[30px] border border-white/70 bg-white/95 shadow-2xl backdrop-blur">
        <div className="border-b border-neutral-200 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-neutral-950">
            Mapa de búsqueda
          </h2>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            Cargando mapa…
          </p>
        </div>

        <div className="flex h-[440px] items-center justify-center bg-neutral-50 text-sm text-neutral-500">
          Preparando mapa…
        </div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-white/70 bg-white/95 shadow-2xl backdrop-blur">
      <div className="border-b border-neutral-200 px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-neutral-950">
          Mapa de búsqueda
        </h2>
        <p className="mt-1 text-sm leading-6 text-neutral-600">
          Aquí puedes ver la zona base del extravío y una zona sugerida de búsqueda calculada con los reportes recibidos.
        </p>

        {suggestedZone ? (
          <p className="mt-2 text-sm font-medium text-violet-700">
            Zona sugerida calculada con {validSightings.length}{' '}
            {validSightings.length === 1 ? 'reporte geolocalizado' : 'reportes geolocalizados'}.
          </p>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">
            Aún no hay reportes geolocalizados suficientes para estimar una zona sugerida. Por ahora se muestra la zona base.
          </p>
        )}
      </div>

      <div className="h-[440px] w-full">
        <MapContainer
          key={mapKey}
          center={[centerLat, centerLng]}
          zoom={14}
          scrollWheelZoom
          className="h-full w-full"
          preferCanvas={true}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Circle
            center={[centerLat, centerLng]}
            radius={baseRadiusMeters}
            pathOptions={{
              color: '#dc2626',
              fillColor: '#fca5a5',
              fillOpacity: 0.15,
              weight: 2,
            }}
          />

          {suggestedZone ? (
            <>
              <Circle
                center={[suggestedZone.lat, suggestedZone.lng]}
                radius={suggestedZone.outerRadiusKm * 1000}
                pathOptions={{
                  color: '#f59e0b',
                  fillColor: '#fde68a',
                  fillOpacity: 0.16,
                  weight: 1.5,
                }}
              />

              <Circle
                center={[suggestedZone.lat, suggestedZone.lng]}
                radius={suggestedZone.midRadiusKm * 1000}
                pathOptions={{
                  color: '#f97316',
                  fillColor: '#fdba74',
                  fillOpacity: 0.18,
                  weight: 1.5,
                }}
              />

              <Circle
                center={[suggestedZone.lat, suggestedZone.lng]}
                radius={suggestedZone.innerRadiusKm * 1000}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#fca5a5',
                  fillOpacity: 0.2,
                  weight: 1.5,
                }}
              />

              <Polyline
                positions={[
                  [centerLat, centerLng],
                  [suggestedZone.lat, suggestedZone.lng],
                ]}
                pathOptions={{
                  color: '#7c3aed',
                  weight: 2,
                  opacity: 0.55,
                  dashArray: '6 8',
                }}
              />
            </>
          ) : null}

          <Marker position={[centerLat, centerLng]} icon={lostCenterIcon}>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold text-neutral-900">
                  Punto base del extravío
                </p>
                <p className="text-sm text-neutral-700">
                  Referencia principal desde donde se perdió {petName}.
                </p>
              </div>
            </Popup>
          </Marker>

          {suggestedZone ? (
            <Marker
              position={[suggestedZone.lat, suggestedZone.lng]}
              icon={suggestedCenterIcon}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold text-neutral-900">
                    Centro sugerido de búsqueda
                  </p>
                  <p className="text-sm text-neutral-700">
                    Estimado con base en ubicación inicial, recencia y reportes geolocalizados.
                  </p>
                  <p className="text-sm text-neutral-700">
                    <span className="font-medium">Radio estimado:</span>{' '}
                    {suggestedZone.midRadiusKm.toFixed(2)} km
                  </p>
                </div>
              </Popup>
            </Marker>
          ) : null}

          {validSightings.map((item) => (
            <Marker
              key={item.id}
              position={[item.lat, item.lng]}
              icon={item.report_type === 'found_safe' ? foundSafeIcon : sightingIcon}
            >
              <Popup>
                <div className="max-w-[240px] space-y-1">
                  <p className="font-semibold text-neutral-900">
                    {item.report_type === 'found_safe'
                      ? 'La tienen resguardada'
                      : 'Avistamiento'}
                  </p>

                  {item.location_text ? (
                    <p className="text-sm text-neutral-700">
                      <span className="font-medium">Ubicación:</span> {item.location_text}
                    </p>
                  ) : null}

                  {item.seen_at ? (
                    <p className="text-sm text-neutral-700">
                      <span className="font-medium">Fecha:</span>{' '}
                      {new Date(item.seen_at).toLocaleString('es-MX')}
                    </p>
                  ) : null}

                  {item.reporter_name ? (
                    <p className="text-sm text-neutral-700">
                      <span className="font-medium">Reportó:</span> {item.reporter_name}
                    </p>
                  ) : null}

                  {item.notes ? (
                    <p className="text-sm text-neutral-700">
                      <span className="font-medium">Comentario:</span> {item.notes}
                    </p>
                  ) : null}

                  <p className="pt-1 text-xs text-neutral-500">
                    Peso del punto: {item.weight.toFixed(2)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="flex flex-wrap gap-4 border-t border-neutral-200 px-5 py-4 text-sm text-neutral-600 sm:px-6">
        <div className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
          Punto base
        </div>

        <div className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
          La vi
        </div>

        <div className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-emerald-600" />
          La tienen resguardada
        </div>

        <div className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-orange-400" />
          Zona sugerida
        </div>

        <div className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-violet-600" />
          Centro estimado
        </div>
      </div>
    </section>
  )
}

function getPointWeight(item: SightingItem) {
  let weight = item.report_type === 'found_safe' ? 1.35 : 1

  if (!item.seen_at) return weight

  const seenTime = new Date(item.seen_at).getTime()
  if (Number.isNaN(seenTime)) return weight

  const hoursAgo = (Date.now() - seenTime) / (1000 * 60 * 60)

  if (hoursAgo <= 6) return weight * 1.2
  if (hoursAgo <= 24) return weight * 1
  if (hoursAgo <= 72) return weight * 0.8
  if (hoursAgo <= 168) return weight * 0.65

  return weight * 0.5
}

function buildSuggestedZone({
  baseLat,
  baseLng,
  baseRadiusKm,
  points,
}: {
  baseLat: number
  baseLng: number
  baseRadiusKm: number
  points: WeightedPoint[]
}) {
  const totalWeight = points.reduce((acc, point) => acc + point.weight, 0)

  if (!totalWeight) {
    return null
  }

  const weightedLat =
    points.reduce((acc, point) => acc + point.lat * point.weight, 0) / totalWeight
  const weightedLng =
    points.reduce((acc, point) => acc + point.lng * point.weight, 0) / totalWeight

  const distances = points.map((point) =>
    haversineKm(weightedLat, weightedLng, point.lat, point.lng)
  )

  const farthestPointKm = distances.length ? Math.max(...distances) : 0
  const driftFromBaseKm = haversineKm(baseLat, baseLng, weightedLat, weightedLng)

  const midRadiusKm = clamp(
    Math.max(baseRadiusKm * 0.55, farthestPointKm * 1.35, driftFromBaseKm * 0.9, 0.35),
    0.35,
    6
  )

  const innerRadiusKm = clamp(midRadiusKm * 0.55, 0.2, 3.2)
  const outerRadiusKm = clamp(midRadiusKm * 1.55, 0.45, 8)

  return {
    lat: weightedLat,
    lng: weightedLng,
    innerRadiusKm,
    midRadiusKm,
    outerRadiusKm,
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const earthRadiusKm = 6371

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function baseLatKey(lat: number, lng: number, radius: number) {
  return `${lat}-${lng}-${radius}`
}