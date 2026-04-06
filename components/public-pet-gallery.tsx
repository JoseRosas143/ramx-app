'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Photo = {
  id: string
  file_url: string
  is_cover: boolean
  sort_order: number
}

type Props = {
  photos: Photo[]
  fallbackUrl?: string | null
  petName: string
}

export default function PublicPetGallery({
  photos,
  fallbackUrl,
  petName,
}: Props) {
  const orderedPhotos = useMemo(() => {
    const cleanPhotos = [...photos].sort((a, b) => a.sort_order - b.sort_order)

    if (cleanPhotos.length > 0) return cleanPhotos

    if (fallbackUrl) {
      return [
        {
          id: 'fallback-cover',
          file_url: fallbackUrl,
          is_cover: true,
          sort_order: 0,
        },
      ]
    }

    return []
  }, [photos, fallbackUrl])

  const coverPhoto = useMemo(() => {
    return orderedPhotos.find((photo) => photo.is_cover) || orderedPhotos[0] || null
  }, [orderedPhotos])

  const galleryPhotos = orderedPhotos
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!coverPhoto) {
    return (
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-amber-100 via-orange-50 to-sky-50 p-4">
        <div className="flex h-40 items-center justify-center rounded-[24px] border border-dashed border-neutral-300 bg-white/70 text-sm text-neutral-500">
          Sin foto disponible
        </div>
      </div>
    )
  }

  const currentCirclePhoto = galleryPhotos[currentIndex] || coverPhoto

  const goPrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? galleryPhotos.length - 1 : prev - 1
    )
  }

  const goNext = () => {
    setCurrentIndex((prev) =>
      prev === galleryPhotos.length - 1 ? 0 : prev + 1
    )
  }

  return (
    <div className="relative pb-14">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-amber-100 via-orange-50 to-sky-50 p-3 shadow-inner">
        <div className="relative overflow-hidden rounded-[24px] bg-white shadow-lg">
          {/* portada fija */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverPhoto.file_url}
            alt={`${petName} portada`}
            className="h-44 w-full object-cover sm:h-52"
          />
        </div>
      </div>

      {/* círculo = galería */}
      <div className="absolute left-[48%] top-full z-20 -translate-x-1/2 -translate-y-[82%]">
        <div className="relative rounded-full bg-white p-1.5 shadow-xl ring-4 ring-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentCirclePhoto.file_url}
            alt={`${petName} galería`}
            className="h-52 w- 52 rounded-full object-cover sm:h-48 sm:w-48"
          />

          {galleryPhotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-0 top-1/2 flex h-8 w-8 -translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-105"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-4 w-4 text-neutral-800" />
              </button>

              <button
                type="button"
                onClick={goNext}
                className="absolute right-0 top-1/2 flex h-8 w-8 translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-105"
                aria-label="Foto siguiente"
              >
                <ChevronRight className="h-4 w-4 text-neutral-800" />
              </button>
            </>
          )}
        </div>
      </div>

      {galleryPhotos.length > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {galleryPhotos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-7 bg-neutral-900'
                  : 'w-2 bg-neutral-300 hover:bg-neutral-500'
              }`}
              aria-label={`Ir a foto ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}