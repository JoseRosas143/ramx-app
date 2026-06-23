'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type PublicClinicalRecordProps = {
  petName: string
  medicalAlerts?: string | null
  showMedicalAlerts?: boolean | null
  medical: {
    profile: any | null
    vaccinations: any[]
    dewormings: any[]
    visits: any[]
    documents: any[]
  } | null
}

export default function PublicClinicalRecord({
  petName,
  medicalAlerts,
  showMedicalAlerts,
  medical,
}: PublicClinicalRecordProps) {
  const [open, setOpen] = useState(false)

  const profile = medical?.profile || null
  const vaccinations = medical?.vaccinations || []
  const dewormings = medical?.dewormings || []
  const visits = medical?.visits || []
  const documents = medical?.documents || []

  const hasAnyClinicalData =
    !!profile ||
    vaccinations.length > 0 ||
    dewormings.length > 0 ||
    visits.length > 0 ||
    documents.length > 0 ||
    (!!showMedicalAlerts && !!medicalAlerts)

  const lastVisit = visits[0] || null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-5 py-2.5 text-sm font-semibold text-sky-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-100 hover:shadow-md"
      >
        Expediente clínico
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6">
          <section className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[32px] border border-white/70 bg-white p-5 shadow-2xl sm:p-6">
            <div className="sticky top-0 z-10 -mx-5 -mt-5 mb-5 border-b border-neutral-200 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Badge className="rounded-full bg-sky-100 px-4 py-1 text-sky-900 hover:bg-sky-100">
                    RAMX · Expediente clínico
                  </Badge>

                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">
                    Expediente clínico de {petName}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                    Información médica en modo solo lectura para apoyar la
                    identificación, cuidado básico y atención veterinaria.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl"
                >
                  Cerrar
                </Button>
              </div>
            </div>

            {!hasAnyClinicalData ? (
              <div className="rounded-[26px] border border-neutral-200 bg-neutral-50 p-5">
                <p className="text-sm leading-6 text-neutral-600">
                  Esta mascota aún no tiene información clínica pública
                  disponible.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {showMedicalAlerts && medicalAlerts ? (
                  <section className="rounded-[24px] border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-semibold text-red-900">
                      Alerta médica rápida
                    </p>
                    <p className="mt-2 text-sm leading-6 text-red-800">
                      {medicalAlerts}
                    </p>
                  </section>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-3">
                  <Card className="rounded-[26px] border-neutral-100 bg-neutral-50/80 shadow-sm lg:col-span-2">
                    <CardContent className="p-5">
                      <h3 className="text-lg font-semibold text-neutral-950">
                        Resumen clínico
                      </h3>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <InfoBlock
                          label="Peso"
                          value={
                            profile?.weight_kg
                              ? `${profile.weight_kg} kg`
                              : 'No registrado'
                          }
                        />
                        <InfoBlock
                          label="Tipo de sangre"
                          value={profile?.blood_type || 'No registrado'}
                        />
                        <InfoBlock
                          label="Alergias"
                          value={profile?.allergies || 'Sin registro'}
                        />
                        <InfoBlock
                          label="Enfermedades crónicas"
                          value={
                            profile?.chronic_conditions || 'Sin registro'
                          }
                        />
                        <InfoBlock
                          label="Medicamentos actuales"
                          value={
                            profile?.current_medications || 'Sin registro'
                          }
                        />
                        <InfoBlock
                          label="Cuidados especiales"
                          value={
                            profile?.special_care_notes || 'Sin registro'
                          }
                        />
                        <InfoBlock
                          label="Última consulta"
                          value={
                            lastVisit?.visit_date
                              ? formatDate(lastVisit.visit_date)
                              : 'Sin registro'
                          }
                        />
                        <InfoBlock
                          label="Diagnóstico reciente"
                          value={lastVisit?.diagnosis || 'Sin registro'}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[26px] border-neutral-100 bg-neutral-50/80 shadow-sm">
                    <CardContent className="p-5">
                      <h3 className="text-lg font-semibold text-neutral-950">
                        Veterinaria principal
                      </h3>

                      <div className="mt-4 space-y-3">
                        <InfoBlock
                          label="Veterinario"
                          value={
                            profile?.primary_vet_name || 'No registrado'
                          }
                        />
                        <InfoBlock
                          label="Clínica"
                          value={
                            profile?.primary_vet_clinic || 'No registrada'
                          }
                        />
                        <InfoBlock
                          label="Teléfono"
                          value={
                            profile?.primary_vet_phone || 'No registrado'
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <ClinicalList
                    title="Vacunas"
                    emptyText="Sin vacunas registradas."
                    items={vaccinations.map((item) => ({
                      id: item.id,
                      title: item.vaccine_name,
                      subtitle:
                        item.brand ||
                        item.clinic_name ||
                        'Vacuna registrada',
                      date: item.applied_date,
                      badge: item.next_due_date
                        ? `Próxima dosis: ${formatDate(item.next_due_date)}`
                        : null,
                      details: [
                        ['Marca', item.brand],
                        [
                          'Aplicada',
                          item.applied_date
                            ? formatDate(item.applied_date)
                            : null,
                        ],
                        [
                          'Próxima dosis',
                          item.next_due_date
                            ? formatDate(item.next_due_date)
                            : null,
                        ],
                        ['Veterinario', item.veterinarian_name],
                        ['Clínica', item.clinic_name],
                        ['Notas', item.notes],
                      ],
                    }))}
                  />

                  <ClinicalList
                    title="Desparasitación"
                    emptyText="Sin desparasitaciones registradas."
                    items={dewormings.map((item) => ({
                      id: item.id,
                      title: item.dewormer_name,
                      subtitle:
                        item.brand ||
                        item.category ||
                        'Desparasitación registrada',
                      date: item.applied_date,
                      badge: item.next_due_date
                        ? `Próxima fecha: ${formatDate(item.next_due_date)}`
                        : null,
                      details: [
                        ['Marca', item.brand],
                        ['Tipo', item.category],
                        [
                          'Aplicada',
                          item.applied_date
                            ? formatDate(item.applied_date)
                            : null,
                        ],
                        [
                          'Próxima aplicación',
                          item.next_due_date
                            ? formatDate(item.next_due_date)
                            : null,
                        ],
                        ['Veterinario', item.veterinarian_name],
                        ['Clínica', item.clinic_name],
                        ['Notas', item.notes],
                      ],
                    }))}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <ClinicalList
                    title="Consultas clínicas recientes"
                    emptyText="Sin consultas registradas."
                    items={visits.map((item) => ({
                      id: item.id,
                      title: item.reason,
                      subtitle:
                        item.diagnosis ||
                        item.clinic_name ||
                        'Consulta médica',
                      date: item.visit_date,
                      badge: item.treatment ? 'Con tratamiento' : null,
                      details: [
                        [
                          'Fecha',
                          item.visit_date ? formatDate(item.visit_date) : null,
                        ],
                        ['Motivo', item.reason],
                        ['Diagnóstico', item.diagnosis],
                        ['Tratamiento', item.treatment],
                        [
                          'Peso',
                          item.weight_kg ? `${item.weight_kg} kg` : null,
                        ],
                        [
                          'Temperatura',
                          item.temperature_c
                            ? `${item.temperature_c} °C`
                            : null,
                        ],
                        ['Veterinario', item.veterinarian_name],
                        ['Clínica', item.clinic_name],
                        ['Notas', item.notes],
                      ],
                    }))}
                  />

                  <Card className="rounded-[26px] border-neutral-100 bg-neutral-50/80 shadow-sm">
                    <CardContent className="p-5">
                      <h3 className="text-lg font-semibold text-neutral-950">
                        Documentos médicos
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        Por privacidad, el perfil público solo muestra la
                        referencia del documento. No abre ni descarga archivos.
                      </p>

                      {documents.length === 0 ? (
                        <p className="mt-4 rounded-2xl bg-white p-4 text-sm text-neutral-600">
                          Sin documentos registrados.
                        </p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="rounded-2xl border border-neutral-200 bg-white p-4"
                            >
                              <p className="text-sm font-semibold text-neutral-950">
                                {doc.title}
                              </p>
                              <p className="mt-1 text-xs text-neutral-500">
                                {doc.document_type}
                              </p>

                              {doc.notes ? (
                                <p className="mt-2 text-sm leading-6 text-neutral-600">
                                  {doc.notes}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-neutral-900">{value}</p>
    </div>
  )
}

function ClinicalList({
  title,
  emptyText,
  items,
}: {
  title: string
  emptyText: string
  items: {
    id: string
    title: string
    subtitle?: string | null
    date?: string | null
    badge?: string | null
    details: [string, string | null | undefined][]
  }[]
}) {
  return (
    <Card className="rounded-[26px] border-neutral-100 bg-neutral-50/80 shadow-sm">
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold text-neutral-950">{title}</h3>

        {items.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-white p-4 text-sm text-neutral-600">
            {emptyText}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <details
                key={item.id}
                className="group rounded-2xl border border-neutral-200 bg-white p-4"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-950">
                        {item.title}
                      </p>

                      {item.subtitle ? (
                        <p className="mt-1 text-xs text-neutral-500">
                          {item.subtitle}
                        </p>
                      ) : null}
                    </div>

                    {item.date ? (
                      <Badge variant="secondary" className="rounded-full">
                        {formatDate(item.date)}
                      </Badge>
                    ) : null}
                  </div>

                  {item.badge ? (
                    <p className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                      {item.badge}
                    </p>
                  ) : null}

                  <p className="mt-3 text-xs font-medium text-neutral-500">
                    Ver detalle →
                  </p>
                </summary>

                <div className="mt-4 grid gap-2 border-t border-neutral-100 pt-4 sm:grid-cols-2">
                  {item.details
                    .filter((detail) => detail[1])
                    .map(([label, value]) => (
                      <InfoBlock
                        key={label}
                        label={label}
                        value={String(value)}
                      />
                    ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatDate(value: string) {
  if (!value) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}