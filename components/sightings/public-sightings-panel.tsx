type SightingItem = {
    id: string
    report_type: 'sighting' | 'found_safe'
    seen_at: string | null
    location_text: string | null
    notes: string | null
    status: string | null
    lat: number | null
    lng: number | null
    created_at?: string | null
    reporter_name?: string | null
  }
  
  type Props = {
    petName: string
    sightings: SightingItem[]
  }
  
  export default function PublicSightingsPanel({
    petName,
    sightings,
  }: Props) {
    const ordered = [...sightings].sort((a, b) => {
      const aTime = a.seen_at ? new Date(a.seen_at).getTime() : 0
      const bTime = b.seen_at ? new Date(b.seen_at).getTime() : 0
      return bTime - aTime
    })
  
    const totalReports = ordered.length
    const last24hCount = ordered.filter((item) => isWithinHours(item.seen_at, 24)).length
    const geolocatedCount = ordered.filter(hasGeo).length
    const foundSafeCount = ordered.filter(
      (item) => item.report_type === 'found_safe'
    ).length
    const activeCount = ordered.filter(
      (item) => item.status === 'new' || item.status === 'reviewed'
    ).length
  
    const latestReport = ordered[0] || null
    const geolocatedReports = ordered.filter(hasGeo)
  
    const movementInsight = buildMovementInsight(geolocatedReports)
    const coverageInsight = buildCoverageInsight(geolocatedReports)
    const signalInsight = buildSignalInsight(ordered)
  
    return (
      <section className="space-y-4 rounded-[30px] border border-white/70 bg-white/95 p-5 shadow-2xl backdrop-blur sm:p-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
            Inteligencia de avistamientos
          </h2>
          <p className="text-sm leading-6 text-neutral-600">
            Vista consolidada de los reportes públicos recibidos para {petName}. Aquí puedes detectar recencia, concentración y señales útiles del caso.
          </p>
        </div>
  
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <InsightStat
            label="Reportes totales"
            value={String(totalReports)}
            tone="neutral"
          />
          <InsightStat
            label="Últimas 24 horas"
            value={String(last24hCount)}
            tone="amber"
          />
          <InsightStat
            label="Con geolocalización"
            value={String(geolocatedCount)}
            tone="sky"
          />
          <InsightStat
            label="Resguardada"
            value={String(foundSafeCount)}
            tone="emerald"
          />
          <InsightStat
            label="Pendientes"
            value={String(activeCount)}
            tone="rose"
          />
        </div>
  
        <div className="grid gap-4 lg:grid-cols-3">
          <InsightBox
            title="Señal más reciente"
            body={
              latestReport
                ? `${getReportTypeLabel(latestReport.report_type)} · ${formatRelativeTime(
                    latestReport.seen_at
                  )}`
                : 'Aún no hay reportes públicos.'
            }
            subtext={
              latestReport?.location_text ||
              'Cuando lleguen nuevos avistamientos aparecerán aquí.'
            }
          />
  
          <InsightBox
            title="Tendencia probable"
            body={movementInsight.title}
            subtext={movementInsight.description}
          />
  
          <InsightBox
            title="Cobertura geográfica"
            body={coverageInsight.title}
            subtext={coverageInsight.description}
          />
        </div>
  
        <div className="rounded-[26px] border border-neutral-200 bg-neutral-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Lectura rápida del caso
          </p>
          <p className="mt-2 text-sm leading-7 text-neutral-800">
            {signalInsight}
          </p>
        </div>
  
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-neutral-950">
              Cronología de reportes
            </h3>
            <p className="mt-1 text-sm text-neutral-600">
              Ordenados del más reciente al más antiguo.
            </p>
          </div>
  
          {ordered.length === 0 ? (
            <div className="rounded-[24px] border border-neutral-200 bg-white p-5 text-sm text-neutral-600">
              Aún no hay reportes públicos registrados.
            </div>
          ) : (
            <div className="space-y-3">
              {ordered.slice(0, 10).map((item) => (
                <article
                  key={item.id}
                  className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm"
                >
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
  
                    <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                      {formatRelativeTime(item.seen_at)}
                    </span>
  
                    {hasGeo(item) ? (
                      <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
                        Con GPS
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                        Sin GPS
                      </span>
                    )}
                  </div>
  
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <MiniInfo
                      label="Ubicación"
                      value={item.location_text || 'No disponible'}
                    />
                    <MiniInfo
                      label="Fecha del reporte"
                      value={item.seen_at ? formatDateTime(item.seen_at) : 'No disponible'}
                    />
                  </div>
  
                  {item.notes ? (
                    <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                        Comentario
                      </p>
                      <p className="mt-2 text-sm leading-7 text-neutral-800">
                        {item.notes}
                      </p>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    )
  }
  
  function InsightStat({
    label,
    value,
    tone,
  }: {
    label: string
    value: string
    tone: 'neutral' | 'amber' | 'sky' | 'emerald' | 'rose'
  }) {
    const toneClass =
      tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : tone === 'sky'
        ? 'border-sky-200 bg-sky-50 text-sky-900'
        : tone === 'emerald'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : tone === 'rose'
        ? 'border-rose-200 bg-rose-50 text-rose-900'
        : 'border-neutral-200 bg-neutral-50 text-neutral-900'
  
    return (
      <div className={`rounded-2xl border p-4 ${toneClass}`}>
        <p className="text-[11px] uppercase tracking-[0.18em] opacity-70">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      </div>
    )
  }
  
  function InsightBox({
    title,
    body,
    subtext,
  }: {
    title: string
    body: string
    subtext: string
  }) {
    return (
      <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm">
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
        <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium leading-6 text-neutral-950">{value}</p>
      </div>
    )
  }
  
  function buildMovementInsight(items: SightingItem[]) {
    if (items.length < 2) {
      return {
        title: 'Aún sin patrón sólido',
        description:
          'Se necesitan al menos dos reportes con GPS para sugerir un desplazamiento probable.',
      }
    }
  
    const ordered = [...items].sort((a, b) => {
      const aTime = a.seen_at ? new Date(a.seen_at).getTime() : 0
      const bTime = b.seen_at ? new Date(b.seen_at).getTime() : 0
      return aTime - bTime
    })
  
    const first = ordered[0]
    const last = ordered[ordered.length - 1]
  
    const direction = getDirectionLabel(
      bearingDegrees(first.lat as number, first.lng as number, last.lat as number, last.lng as number)
    )
  
    const distanceKm = haversineKm(
      first.lat as number,
      first.lng as number,
      last.lat as number,
      last.lng as number
    )
  
    return {
      title: `Desplazamiento probable hacia ${direction}`,
      description: `Entre el primer y el último punto geolocalizado hay aproximadamente ${distanceKm.toFixed(
        2
      )} km de diferencia.`,
    }
  }
  
  function buildCoverageInsight(items: SightingItem[]) {
    if (items.length === 0) {
      return {
        title: 'Sin cobertura GPS',
        description:
          'Todavía no hay reportes geolocalizados para estimar dispersión del caso.',
      }
    }
  
    const center = centroid(items)
    const farthest = Math.max(
      ...items.map((item) =>
        haversineKm(center.lat, center.lng, item.lat as number, item.lng as number)
      )
    )
  
    return {
      title: `${items.length} punto${items.length > 1 ? 's' : ''} geolocalizado${
        items.length > 1 ? 's' : ''
      }`,
      description: `La concentración aproximada de reportes cubre un radio cercano a ${Math.max(
        farthest,
        0.05
      ).toFixed(2)} km.`,
    }
  }
  
  function buildSignalInsight(items: SightingItem[]) {
    if (items.length === 0) {
      return 'Todavía no hay señales suficientes. En cuanto entren avistamientos, aquí verás una lectura rápida del caso.'
    }
  
    const latest = items[0]
    const hasSafe = items.some((item) => item.report_type === 'found_safe')
    const recentCount = items.filter((item) => isWithinHours(item.seen_at, 24)).length
    const geoCount = items.filter(hasGeo).length
  
    if (hasSafe) {
      return 'Ya existe al menos un reporte donde alguien indica que la mascota está resguardada. Este tipo de señal debe priorizarse por encima del resto.'
    }
  
    if (recentCount >= 2 && geoCount >= 2) {
      return 'Hay actividad reciente y suficiente geolocalización para considerar que el caso tiene movimiento útil de seguimiento. Conviene revisar primero los reportes más nuevos.'
    }
  
    return `La señal más fresca es un ${getReportTypeLabel(
      latest.report_type
    ).toLowerCase()} ${formatRelativeTime(latest.seen_at).toLowerCase()}. Aún conviene seguir acumulando puntos para mejorar la precisión del mapa.`
  }
  
  function getReportTypeLabel(type: 'sighting' | 'found_safe') {
    return type === 'found_safe' ? 'La tienen resguardada' : 'Avistamiento'
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
  
  function hasGeo(item: { lat: number | null; lng: number | null }) {
    return typeof item.lat === 'number' && typeof item.lng === 'number'
  }
  
  function centroid(items: SightingItem[]) {
    const lat =
      items.reduce((acc, item) => acc + (item.lat as number), 0) / items.length
    const lng =
      items.reduce((acc, item) => acc + (item.lng as number), 0) / items.length
  
    return { lat, lng }
  }
  
  function isWithinHours(value: string | null, hours: number) {
    if (!value) return false
    const time = new Date(value).getTime()
    if (Number.isNaN(time)) return false
    return Date.now() - time <= hours * 60 * 60 * 1000
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
  
    return formatDateTime(value)
  }
  
  function formatDateTime(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
  
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  function bearingDegrees(lat1: number, lng1: number, lat2: number, lng2: number) {
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const toDeg = (rad: number) => (rad * 180) / Math.PI
  
    const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2))
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.cos(toRad(lng2 - lng1))
  
    const brng = toDeg(Math.atan2(y, x))
    return (brng + 360) % 360
  }
  
  function getDirectionLabel(bearing: number) {
    if (bearing >= 337.5 || bearing < 22.5) return 'el norte'
    if (bearing < 67.5) return 'el noreste'
    if (bearing < 112.5) return 'el este'
    if (bearing < 157.5) return 'el sureste'
    if (bearing < 202.5) return 'el sur'
    if (bearing < 247.5) return 'el suroeste'
    if (bearing < 292.5) return 'el oeste'
    return 'el noroeste'
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