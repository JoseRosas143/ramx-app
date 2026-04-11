'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  petId: string
  petSlug: string
  petName: string
  reportType: 'sighting' | 'found_safe'
}

export default function PublicReportForm({
  petId,
  petSlug,
  petName,
  reportType,
}: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [reporterName, setReporterName] = useState('')
  const [reporterPhone, setReporterPhone] = useState('')
  const [reporterWhatsapp, setReporterWhatsapp] = useState('')
  const [seenAt, setSeenAt] = useState('')
  const [locationText, setLocationText] = useState('')
  const [notes, setNotes] = useState('')

  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationStatus, setLocationStatus] = useState('')

  const handleUseCurrentLocation = () => {
    setLocationStatus('')

    if (!navigator.geolocation) {
      setLocationStatus('Tu navegador no soporta geolocalización.')
      return
    }

    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLat = Number(position.coords.latitude.toFixed(6))
        const nextLng = Number(position.coords.longitude.toFixed(6))

        setLat(nextLat)
        setLng(nextLng)

        if (!locationText.trim()) {
          setLocationText(`Ubicación aproximada capturada por GPS (${nextLat}, ${nextLng})`)
        }

        setLocationStatus('Ubicación capturada correctamente.')
        setLocating(false)
      },
      () => {
        setLocationStatus(
          'No se pudo obtener tu ubicación. Revisa permisos del navegador o escribe la ubicación manualmente.'
        )
        setLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const clearCapturedLocation = () => {
    setLat(null)
    setLng(null)
    setLocationStatus('Ubicación GPS eliminada.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMessage('')

    const { error } = await supabase.from('sightings').insert({
      pet_id: petId,
      report_type: reportType,
      reporter_name: reporterName || null,
      reporter_phone: reporterPhone || null,
      reporter_whatsapp: reporterWhatsapp || null,
      seen_at: seenAt ? new Date(seenAt).toISOString() : new Date().toISOString(),
      location_text: locationText || null,
      notes: notes || null,
      lat,
      lng,
      status: 'new',
    })

    if (error) {
      setErrorMessage(error.message)
      setSaving(false)
      return
    }

    setDone(true)
    setSaving(false)
  }

  if (done) {
    return (
      <section className="rounded-[28px] border border-emerald-200 bg-white/95 p-6 shadow-lg">
        <h2 className="text-2xl font-semibold text-emerald-900">
          Reporte enviado
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          Gracias. Tu información ya fue enviada al sistema para ayudar a localizar a {petName}.
        </p>
        <button
          type="button"
          onClick={() => {
            router.push(`/p/${petSlug}`)
            router.refresh()
          }}
          className="mt-5 inline-flex rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
        >
          Volver al perfil
        </button>
      </section>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title={reportType === 'found_safe' ? 'La tengo conmigo' : 'La vi'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre (opcional)">
            <InputLike value={reporterName} onChange={setReporterName} />
          </Field>

          <Field label={reportType === 'found_safe' ? 'Teléfono / WhatsApp' : 'Teléfono (opcional)'}>
            <InputLike value={reporterPhone} onChange={setReporterPhone} />
          </Field>

          <Field label="WhatsApp (opcional)">
            <InputLike value={reporterWhatsapp} onChange={setReporterWhatsapp} />
          </Field>

          <Field label="Fecha y hora">
            <input
              type="datetime-local"
              value={seenAt}
              onChange={(e) => setSeenAt(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Ubicación">
            <InputLike
              value={locationText}
              onChange={setLocationText}
              placeholder="Ej. Parque Juárez, Puebla / Calle 5 de Mayo #123"
            />
          </Field>
        </div>

        <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
          <p className="text-sm font-medium text-sky-900">
            Ubicación para mapa
          </p>
          <p className="mt-1 text-sm leading-6 text-sky-800">
            Esto nos ayudará a dibujar mejor la zona de búsqueda y ubicar el reporte en el mapa.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-900 transition hover:bg-sky-100 disabled:opacity-60"
            >
              {locating ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
            </button>

            {(lat !== null || lng !== null) ? (
              <button
                type="button"
                onClick={clearCapturedLocation}
                className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                Quitar ubicación GPS
              </button>
            ) : null}
          </div>

          {locationStatus ? (
            <p className="mt-3 text-sm text-sky-900">{locationStatus}</p>
          ) : null}

          {(lat !== null && lng !== null) ? (
            <div className="mt-3 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm text-neutral-800">
              Coordenadas capturadas: {lat}, {lng}
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <Field label="Comentario">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500"
              placeholder={
                reportType === 'found_safe'
                  ? 'Ej. La encontré, está tranquila y resguardada en mi casa.'
                  : 'Ej. La vi corriendo cerca del mercado hace 10 minutos.'
              }
            />
          </Field>
        </div>
      </Section>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-lg">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
        >
          {saving ? 'Enviando...' : 'Enviar reporte'}
        </button>
      </div>
    </form>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-lg">
      <h2 className="mb-4 text-lg font-semibold text-neutral-950">{title}</h2>
      {children}
    </section>
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
    <div className="space-y-2">
      <p className="text-sm font-medium text-neutral-700">{label}</p>
      {children}
    </div>
  )
}

function InputLike({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500"
    />
  )
}