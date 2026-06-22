export type ImageCompressionOptions = {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  outputType?: 'image/webp' | 'image/jpeg'
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  maxWidth: 1800,
  maxHeight: 1800,
  quality: 0.82,
  outputType: 'image/webp',
}

export async function compressImageFile(
  file: File,
  options?: ImageCompressionOptions
): Promise<File> {
  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  if (!file.type.startsWith('image/')) {
    return file
  }

  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file
  }

  const imageBitmap = await createImageBitmap(file)
  const { width, height } = calculateSize(
    imageBitmap.width,
    imageBitmap.height,
    config.maxWidth,
    config.maxHeight
  )

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    imageBitmap.close()
    return file
  }

  ctx.drawImage(imageBitmap, 0, 0, width, height)
  imageBitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, config.outputType, config.quality)
  })

  if (!blob) return file

  const originalNameWithoutExtension = file.name.replace(/\.[^/.]+$/, '')
  const nextExtension = config.outputType === 'image/webp' ? 'webp' : 'jpg'

  return new File([blob], `${sanitizeFileName(originalNameWithoutExtension)}.${nextExtension}`, {
    type: config.outputType,
    lastModified: Date.now(),
  })
}

export async function compressImageFiles(
  files: File[],
  options?: ImageCompressionOptions
): Promise<File[]> {
  const compressedFiles: File[] = []

  for (const file of files) {
    compressedFiles.push(await compressImageFile(file, options))
  }

  return compressedFiles
}

function calculateSize(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
) {
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return {
      width: originalWidth,
      height: originalHeight,
    }
  }

  const widthRatio = maxWidth / originalWidth
  const heightRatio = maxHeight / originalHeight
  const ratio = Math.min(widthRatio, heightRatio)

  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  }
}

function sanitizeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}