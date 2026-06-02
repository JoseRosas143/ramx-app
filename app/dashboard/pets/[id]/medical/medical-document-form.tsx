'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  compressImageToWebp,
  formatFileSize,
  isAllowedMedicalDocument,
  isImageFile,
} from './file-compression'
import { addMedicalDocumentAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ACCEPTED_TYPES =
  'image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export default function MedicalDocumentForm({ petId }: { petId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [file, setFile] = useState<File | null>(null)
  const [processedFile, setProcessedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('Receta')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] || null
    setMessage('')
    setFile(null)
    setProcessedFile(null)

    if (!selectedFile) return

    if (!isAllowedMedicalDocument(selectedFile)) {
      setMessage('Tipo de archivo no permitido.')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setMessage('El archivo no debe pesar más de 10 MB.')
      return
    }

    setFile(selectedFile)

    if (isImageFile(selectedFile)) {
      try {
        const compressed = await compressImageToWebp(selectedFile)
        setProcessedFile(compressed)
      } catch {
        setProcessedFile(selectedFile)
        setMessage('No se pudo comprimir la imagen, se subirá el archivo original.')
      }
    } else {
      setProcessedFile(selectedFile)
    }

    if (!title.trim()) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!processedFile) {
      setMessage('Selecciona un archivo.')
      return
    }

    if (!title.trim()) {
      setMessage('Escribe un título para el documento.')
      return
    }

    setSaving(true)
    setMessage('')

    const safeName = processedFile.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .toLowerCase()

    const path = `${petId}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('pet-medical-documents')
      .upload(path, processedFile, {
        upsert: false,
        contentType: processedFile.type,
      })

    if (uploadError) {
      setMessage(uploadError.message)
      setSaving(false)
      return
    }

    const formData = new FormData()
    formData.append('pet_id', petId)
    formData.append('document_type', documentType)
    formData.append('title', title.trim())
    formData.append('file_url', path)
    formData.append('notes', notes.trim())

    try {
      await addMedicalDocumentAction(formData)
      setFile(null)
      setProcessedFile(null)
      setTitle('')
      setNotes('')
      setMessage('Documento guardado correctamente.')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el documento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="document_type">Tipo de documento</Label>
          <select
            id="document_type"
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none"
          >
            <option value="Receta">Receta</option>
            <option value="Certificado">Certificado</option>
            <option value="Estudio">Estudio</option>
            <option value="Laboratorio">Laboratorio</option>
            <option value="Radiografía / imagen">Radiografía / imagen</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Receta consulta mayo"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="file">Archivo</Label>
          <Input
            id="file"
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
          />

          {file ? (
            <div className="rounded-2xl bg-neutral-50 p-3 text-xs leading-5 text-neutral-600">
              <p>Original: {file.name} · {formatFileSize(file.size)}</p>
              {processedFile ? (
                <p>
                  Archivo a subir: {processedFile.name} · {formatFileSize(processedFile.size)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Opcional"
          />
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          {message}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-neutral-950 px-6 text-white hover:bg-neutral-800"
        >
          {saving ? 'Guardando...' : 'Guardar documento'}
        </Button>
      </div>
    </form>
  )
}