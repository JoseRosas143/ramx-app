'use client'

import { useTransition } from 'react'
import { deleteMedicalDocumentAction } from './actions'
import { Button } from '@/components/ui/button'

export default function DeleteDocumentButton({
  documentId,
}: {
  documentId: string
}) {
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    const confirmed = window.confirm(
      '¿Seguro que quieres eliminar este documento médico? Esta acción no se puede deshacer.'
    )

    if (!confirmed) return

    const formData = new FormData()
    formData.append('document_id', documentId)

    startTransition(async () => {
      await deleteMedicalDocumentAction(formData)
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={handleDelete}
      className="rounded-2xl border-red-200 text-red-700 hover:bg-red-50"
    >
      {pending ? 'Eliminando...' : 'Eliminar'}
    </Button>
  )
}