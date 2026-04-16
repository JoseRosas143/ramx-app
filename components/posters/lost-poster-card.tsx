'use client'

import type { ReactNode } from 'react'

type Props = {
  petName: string
  photoUrl?: string | null
  species?: string | null
  breed?: string | null
  sex?: string | null
  color?: string | null
  ageText?: string | null
  lostAt?: string | null
  lastSeenText?: string | null
  rewardText?: string | null
  circumstances?: string | null
  publicContactInstructions?: string | null
  phone?: string | null
  whatsappUrl?: string | null
  publicSlug?: string | null
}

export default function LostPetPosterCard({
  petName,
  photoUrl,
  species,
  breed,
  sex,
  color,
  ageText,
  lostAt,
  lastSeenText,
  rewardText,
  circumstances,
  publicContactInstructions,
  phone,
  whatsappUrl,
  publicSlug,
}: Props) {
  const publicProfilePath = publicSlug ? `/p/${publicSlug}` : null

  return (
    <section className="overflow-hidden rounded-[32px] border border-red-200 bg-white shadow-2xl">
      <div className="border-b border-red-200 bg-gradient-to-r from-red-600 via-red-500 to-rose-500 px-5 py-4 text-white sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-100">
          Cartel de búsqueda
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Se busca a {petName}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-red-50">
          Vista previa del cartel público para compartir cuando una mascota esté reportada como extraviada.
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border-b border-neutral-200 p-5 lg:border-b-0 lg:border-r sm:p-6">
          <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-50 shadow-sm">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={petName}
                className="h-[320px] w-full object-cover sm:h-[420px]"
              />
            ) : (
              <div className="flex h-[320px] items-center justify-center bg-neutral-100 text-sm text-neutral-500 sm:h-[420px]">
                Sin foto disponible
              </div>
            )}
          </div>

          <div className="mt-5 rounded-[24px] border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
              Última referencia
            </p>
            <p className="mt-2 text-lg font-semibold text-red-950">
              {lastSeenText || 'Ubicación por confirmar'}
            </p>

            {lostAt ? (
              <p className="mt-2 text-sm leading-6 text-red-900">
                <span className="font-medium">Fecha del extravío:</span>{' '}
                {formatDateTime(lostAt)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <PosterChip>{species || 'Mascota'}</PosterChip>
            {breed ? <PosterChip>{breed}</PosterChip> : null}
            {sex ? <PosterChip>{sex}</PosterChip> : null}
            {color ? <PosterChip>{color}</PosterChip> : null}
            {ageText ? <PosterChip>{ageText}</PosterChip> : null}
          </div>

          <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Datos principales
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <PosterField label="Nombre" value={petName} />
              <PosterField label="Color" value={color || 'No disponible'} />
              <PosterField label="Especie" value={species || 'No disponible'} />
              <PosterField label="Sexo" value={sex || 'No disponible'} />
            </div>
          </div>

          {rewardText ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
                Recompensa
              </p>
              <p className="mt-2 text-lg font-semibold text-amber-950">
                {rewardText}
              </p>
            </div>
          ) : null}

          {circumstances ? (
            <div className="rounded-[24px] border border-neutral-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Circunstancias del extravío
              </p>
              <p className="mt-2 text-sm leading-7 text-neutral-800">
                {circumstances}
              </p>
            </div>
          ) : null}

          {publicContactInstructions ? (
            <div className="rounded-[24px] border border-neutral-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Indicaciones de contacto
              </p>
              <p className="mt-2 text-sm leading-7 text-neutral-800">
                {publicContactInstructions}
              </p>
            </div>
          ) : null}

          <div className="rounded-[24px] border border-neutral-900 bg-neutral-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-300">
              Contacto inmediato
            </p>

            {phone ? (
              <p className="mt-3 text-2xl font-semibold tracking-tight">
                {phone}
              </p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                Usa el perfil público RAMX para contactar al tutor.
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100"
                >
                  Contactar por WhatsApp
                </a>
              ) : null}

              {publicProfilePath ? (
                <a
                  href={publicProfilePath}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Ver perfil público RAMX
                </a>
              ) : null}
            </div>
          </div>

          <div className="rounded-[24px] border border-dashed border-neutral-300 bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Enlace público
            </p>
            <p className="mt-2 break-all text-sm leading-6 text-neutral-800">
              {publicProfilePath || 'No disponible'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function PosterChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-900">
      {children}
    </span>
  )
}

function PosterField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-neutral-950">
        {value}
      </p>
    </div>
  )
}

function formatDateTime(value?: string | null) {
  if (!value) return 'No disponible'
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