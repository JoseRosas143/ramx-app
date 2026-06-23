'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  deleteDewormingAction,
  deleteMedicalVisitAction,
  deleteVaccinationAction,
} from './actions'

type Field = {
  label: string
  value: string | number | null | undefined
}

type MedicalRecord = {
  id: string
  title: string
  subtitle?: string | null
  date?: string | null
  badge?: string | null
  fields: Field[]
}

type RecordType = 'vaccination' | 'deworming' | 'visit'

export default function MedicalRecordList({
  title,
  emptyText,
  records,
  recordType,
}: {
  title: string
  emptyText: string
  records: MedicalRecord[]
  recordType?: RecordType
}) {
  const [selected, setSelected] = useState<MedicalRecord | null>(null)
  const [pending, startTransition] = useTransition()

  function handleDelete(record: MedicalRecord) {
    if (!recordType) return

    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${record.title}"? Esta acción no se puede deshacer.`
    )

    if (!confirmed) return

    const formData = new FormData()
    formData.append('record_id', record.id)

    startTransition(async () => {
      if (recordType === 'vaccination') {
        await deleteVaccinationAction(formData)
      }

      if (recordType === 'deworming') {
        await deleteDewormingAction(formData)
      }

      if (recordType === 'visit') {
        await deleteMedicalVisitAction(formData)
      }

      setSelected(null)
    })
  }

  return (
    <>
      <section className="rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-lg sm:p-6">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
          {title}
        </h2>

        {records.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
            {emptyText}
          </p>
        ) : (
          <div className="mt-5 grid gap-3">
            {records.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => setSelected(record)}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-950">
                      {record.title}
                    </p>

                    {record.subtitle ? (
                      <p className="mt-1 text-xs text-neutral-500">
                        {record.subtitle}
                      </p>
                    ) : null}
                  </div>

                  {record.date ? (
                    <Badge variant="secondary" className="shrink-0 rounded-full">
                      {formatDate(record.date)}
                    </Badge>
                  ) : null}
                </div>

                {record.badge ? (
                  <p className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    {record.badge}
                  </p>
                ) : null}

                <p className="mt-3 text-xs font-medium text-neutral-500">
                  Ver detalle completo →
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[30px] bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {title}
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
                  {selected.title}
                </h3>

                {selected.subtitle ? (
                  <p className="mt-1 text-sm text-neutral-600">
                    {selected.subtitle}
                  </p>
                ) : null}
              </div>

              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={() => setSelected(null)}
              >
                Cerrar
              </Button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {selected.fields
                .filter(
                  (field) =>
                    field.value !== null &&
                    field.value !== undefined &&
                    String(field.value).trim() !== ''
                )
                .map((field) => (
                  <div
                    key={field.label}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                      {field.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-neutral-900">
                      {String(field.value)}
                    </p>
                  </div>
                ))}
            </div>

            {recordType ? (
              <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-neutral-200 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => setSelected(null)}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => handleDelete(selected)}
                  className="rounded-2xl bg-red-600 text-white hover:bg-red-700"
                >
                  {pending ? 'Eliminando...' : 'Eliminar registro'}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
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