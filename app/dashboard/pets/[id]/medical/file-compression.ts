export async function compressImageToWebp(file: File) {
  const imageBitmap = await createImageBitmap(file)

  const maxSize = 1600
  const ratio = Math.min(
    maxSize / imageBitmap.width,
    maxSize / imageBitmap.height,
    1
  )

  const width = Math.round(imageBitmap.width * ratio)
  const height = Math.round(imageBitmap.height * ratio)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No se pudo procesar la imagen.')
  }

  ctx.drawImage(imageBitmap, 0, 0, width, height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('No se pudo comprimir la imagen.'))
          return
        }

        resolve(result)
      },
      'image/webp',
      0.75
    )
  })

  const originalName = file.name.replace(/\.[^/.]+$/, '')

  return new File([blob], `${originalName}.webp`, {
    type: 'image/webp',
  })
}

export function isImageFile(file: File) {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
}

export function isAllowedMedicalDocument(file: File) {
  return [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ].includes(file.type)
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}