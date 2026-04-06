'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  petId: string
  petName: string
  reportType: 'sighting' | 'found_safe'
}

export default function PublicReportForm({
  petId,
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
      location_text: locationText,
      notes: notes || null,
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
          onClick={() => router.back()}
          className="mt-5 inline-flex rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
        >
          Volver
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