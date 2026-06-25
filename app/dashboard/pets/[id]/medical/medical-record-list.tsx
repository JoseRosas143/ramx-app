'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  deleteDewormingAction,
  deleteMedicalVisitAction,
  deleteVaccinationAction,
  updateDewormingAction,
  updateMedicalVisitAction,
  updateVaccinationAction,
} from './actions'

type Field = {
  label: string
  value: string | number | null | undefined
}

type EditData = Record<string, string | number | null | undefined>

type MedicalRecord = {
  id: string
  title: string
  subtitle?: string | null
  date?: string | null
  badge?: string | null
  fields: Field[]
  editData?: EditData
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
  const [editing, setEditing] = useState(false)
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
      setEditing(false)
    })
  }

  function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selected || !recordType) return

    const formData = new FormData(event.currentTarget)
    formData.append('record_id', selected.id)

    startTransition(async () => {
      if (recordType === 'vaccination') {
        await updateVaccinationAction(formData)
      }

      if (recordType === 'deworming') {
        await updateDewormingAction(formData)
      }

      if (recordType === 'visit') {
        await updateMedicalVisitAction(formData)
      }

      setSelected(null)
      setEditing(false)
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
                onClick={() => {
                  setSelected(record)
                  setEditing(false)
                }}
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
                  {editing ? 'Editar registro' : selected.title}
                </h3>

                {!editing && selected.subtitle ? (
                  <p className="mt-1 text-sm text-neutral-600">
                    {selected.subtitle}
                  </p>
                ) : null}
              </div>

              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={() => {
                  setSelected(null)
                  setEditing(false)
                }}
              >
                Cerrar
              </Button>
            </div>

            {!editing ? (
              <>
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
                      onClick={() => setEditing(true)}
                    >
                      Editar
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
              </>
            ) : (
              <form onSubmit={handleUpdate} className="mt-6 space-y-4">
                {recordType === 'vaccination' ? (
                  <VaccinationEditFields data={selected.editData || {}} />
                ) : null}

                {recordType === 'deworming' ? (
                  <DewormingEditFields data={selected.editData || {}} />
                ) : null}

                {recordType === 'visit' ? (
                  <VisitEditFields data={selected.editData || {}} />
                ) : null}

                <div className="flex flex-wrap justify-end gap-2 border-t border-neutral-200 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => setEditing(false)}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="submit"
                    disabled={pending}
                    className="rounded-2xl bg-neutral-950 text-white hover:bg-neutral-800"
                  >
                    {pending ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}

function VaccinationEditFields({ data }: { data: EditData }) {
  return (
    <div className="grid gap-4">
      <TextInput
        label="Nombre de la vacuna"
        name="vaccine_name"
        defaultValue={data.vaccine_name}
        required
      />

      <TextInput label="Marca" name="brand" defaultValue={data.brand} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Fecha aplicada"
          name="applied_date"
          type="date"
          defaultValue={data.applied_date}
          required
        />

        <TextInput
          label="Próxima dosis"
          name="next_due_date"
          type="date"
          defaultValue={data.next_due_date}
        />
      </div>

      <TextInput
        label="Lote"
        name="batch_number"
        defaultValue={data.batch_number}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Veterinario"
          name="veterinarian_name"
          defaultValue={data.veterinarian_name}
        />

        <TextInput
          label="Clínica"
          name="clinic_name"
          defaultValue={data.clinic_name}
        />
      </div>

      <TextArea label="Notas" name="notes" defaultValue={data.notes} />
    </div>
  )
}

function DewormingEditFields({ data }: { data: EditData }) {
  return (
    <div className="grid gap-4">
      <TextInput
        label="Nombre del desparasitante"
        name="dewormer_name"
        defaultValue={data.dewormer_name}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Marca" name="brand" defaultValue={data.brand} />

        <TextInput label="Tipo" name="category" defaultValue={data.category} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Fecha aplicada"
          name="applied_date"
          type="date"
          defaultValue={data.applied_date}
          required
        />

        <TextInput
          label="Próxima aplicación"
          name="next_due_date"
          type="date"
          defaultValue={data.next_due_date}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Veterinario"
          name="veterinarian_name"
          defaultValue={data.veterinarian_name}
        />

        <TextInput
          label="Clínica"
          name="clinic_name"
          defaultValue={data.clinic_name}
        />
      </div>

      <TextArea label="Notas" name="notes" defaultValue={data.notes} />
    </div>
  )
}

function VisitEditFields({ data }: { data: EditData }) {
  return (
    <div className="grid gap-4">
      <TextInput
        label="Fecha de consulta"
        name="visit_date"
        type="date"
        defaultValue={data.visit_date}
        required
      />

      <TextInput
        label="Motivo"
        name="reason"
        defaultValue={data.reason}
        required
      />

      <TextArea
        label="Diagnóstico"
        name="diagnosis"
        defaultValue={data.diagnosis}
      />

      <TextArea
        label="Tratamiento"
        name="treatment"
        defaultValue={data.treatment}
      />

      <TextArea
        label="Receta / indicaciones"
        name="prescription"
        defaultValue={data.prescription}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Peso kg"
          name="weight_kg"
          type="number"
          step="0.01"
          defaultValue={data.weight_kg}
        />

        <TextInput
          label="Temperatura °C"
          name="temperature_c"
          type="number"
          step="0.1"
          defaultValue={data.temperature_c}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Veterinario"
          name="veterinarian_name"
          defaultValue={data.veterinarian_name}
        />

        <TextInput
          label="Clínica"
          name="clinic_name"
          defaultValue={data.clinic_name}
        />
      </div>

      <TextArea label="Notas" name="notes" defaultValue={data.notes} />
    </div>
  )
}

function TextInput({
  label,
  name,
  defaultValue,
  type = 'text',
  required = false,
  step,
}: {
  label: string
  name: string
  defaultValue?: string | number | null
  type?: string
  required?: boolean
  step?: string
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-neutral-700">{label}</span>

      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue ? String(defaultValue) : ''}
        required={required}
        className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-neutral-500"
      />
    </label>
  )
}

function TextArea({
  label,
  name,
  defaultValue,
}: {
  label: string
  name: string
  defaultValue?: string | number | null
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-neutral-700">{label}</span>

      <textarea
        name={name}
        rows={4}
        defaultValue={defaultValue ? String(defaultValue) : ''}
        className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-neutral-500"
      />
    </label>
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