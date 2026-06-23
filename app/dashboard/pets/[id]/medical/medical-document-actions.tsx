'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  deleteMedicalDocumentAction,
  updateMedicalDocumentAction,
} from './actions'

type MedicalDocument = {
  id: string
  title: string
  document_type: string
  notes: string | null
}

export default function MedicalDocumentActions({
  document,
}: {
  document: MedicalDocument
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [documentType, setDocumentType] = useState(document.document_type)
  const [title, setTitle] = useState(document.title)
  const [notes, setNotes] = useState(document.notes || '')
  const [pending, startTransition] = useTransition()

  function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData()
    formData.append('document_id', document.id)
    formData.append('document_type', documentType)
    formData.append('title', title)
    formData.append('notes', notes)

    startTransition(async () => {
      await updateMedicalDocumentAction(formData)
      setIsEditing(false)
    })
  }

  function handleDelete() {
    const confirmed = window.confirm(
      '¿Seguro que quieres eliminar este documento médico? Esta acción no se puede deshacer.'
    )

    if (!confirmed) return

    const formData = new FormData()
    formData.append('document_id', document.id)

    startTransition(async () => {
      await deleteMedicalDocumentAction(formData)
    })
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsEditing(true)}
          className="rounded-2xl"
        >
          Editar
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={handleDelete}
          className="rounded-2xl border-red-200 text-red-700 hover:bg-red-50"
        >
          {pending ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </div>

      {isEditing ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 backdrop-blur-sm sm:items-center sm:justify-center">
          <form
            onSubmit={handleUpdate}
            className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-[30px] bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Documento médico
                </p>

                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
                  Editar documento
                </h3>
              </div>

              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={() => setIsEditing(false)}
              >
                Cerrar
              </Button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-neutral-700">
                  Tipo de documento
                </span>

                <select
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm outline-none"
                >
                  <option value="Receta">Receta</option>
                  <option value="Certificado">Certificado</option>
                  <option value="Estudio">Estudio</option>
                  <option value="Laboratorio">Laboratorio</option>
                  <option value="Radiografía / imagen">
                    Radiografía / imagen
                  </option>
                  <option value="Otro">Otro</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-neutral-700">
                  Título
                </span>

                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm outline-none"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-neutral-700">
                  Notas
                </span>

                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm outline-none"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-neutral-200 pt-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={() => setIsEditing(false)}
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
        </div>
      ) : null}
    </>
  )
}