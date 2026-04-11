'use client'

import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

type SightingItem = {
  id: string
  report_type: 'sighting' | 'found_safe'
  lat: number | null
  lng: number | null
  location_text: string | null
  seen_at: string | null
  notes: string | null
}

type Props = {
  centerLat: number
  centerLng: number
  radiusKm?: number | null
  petName: string
  sightings: SightingItem[]
}

const sightingIcon = new L.DivIcon({
  html: `
    <div style="
      width:16px;
      height:16px;
      border-radius:9999px;
      background:#f59e0b;
      border:3px solid white;
      box-shadow:0 4px 14px rgba(0,0,0,0.18);
    "></div>
  `,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const foundSafeIcon = new L.DivIcon({
  html: `
    <div style="
      width:16px;
      height:16px;
      border-radius:9999px;
      background:#10b981;
      border:3px solid white;
      box-shadow:0 4px 14px rgba(0,0,0,0.18);
    "></div>
  `,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const lostCenterIcon = new L.DivIcon({
  html: `
    <div style="
      width:18px;
      height:18px;
      border-radius:9999px;
      background:#ef4444;
      border:3px solid white;
      box-shadow:0 4px 14px rgba(0,0,0,0.22);
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
  const radiusMeters = (radiusKm || 1) * 1000
  const mapSightings = sightings.filter(
    (item) => typeof item.lat === 'number' && typeof item.lng === 'number'
  )

  return (
    <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-lg">
      <div className="border-b border-neutral-200 px-5 py-4">
        <h3 className="text-lg font-semibold tracking-tight text-neutral-950">
          Mapa de búsqueda
        </h3>
        <p className="mt-1 text-sm text-neutral-600">
          Zona inicial de referencia y reportes recibidos para {petName}.
        </p>
      </div>

      <div className="h-[420px] w-full">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={14}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Circle
            center={[centerLat, centerLng]}
            radius={radiusMeters}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#fca5a5',
              fillOpacity: 0.18,
              weight: 2,
            }}
          />

          <Marker position={[centerLat, centerLng]} icon={lostCenterIcon}>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold text-neutral-900">Punto base de búsqueda</p>
                <p className="text-sm text-neutral-700">
                  Referencia principal del caso de extravío.
                </p>
              </div>
            </Popup>
          </Marker>

          {mapSightings.map((item) => (
            <Marker
              key={item.id}
              position={[item.lat as number, item.lng as number]}
              icon={item.report_type === 'found_safe' ? foundSafeIcon : sightingIcon}
            >
              <Popup>
                <div className="max-w-[220px] space-y-1">
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
                  {item.notes ? (
                    <p className="text-sm text-neutral-700">
                      <span className="font-medium">Comentario:</span> {item.notes}
                    </p>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-neutral-200 px-5 py-4 text-sm text-neutral-600">
        <div className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
          Punto base
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
          Avistamiento
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
          La tienen resguardada
        </div>
      </div>
    </div>
  )
}