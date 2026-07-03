'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { RamxStoreProduct } from '@/lib/ramx-store-products'
import { formatMxn } from '@/lib/ramx-store-products'

type ProductLaunchCarouselProps = {
  products: RamxStoreProduct[]
}

export function ProductLaunchCarousel({ products }: ProductLaunchCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)

  const activeProduct = products[activeIndex] || products[0]

  const priceLabel = useMemo(() => {
    if (!activeProduct) return ''
    return activeProduct.price > 0
      ? formatMxn(activeProduct.price)
      : activeProduct.priceLabel
  }, [activeProduct])

  useEffect(() => {
    if (!expanded) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setExpanded(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [expanded])

  if (!activeProduct) return null

  function goToPrevious() {
    setActiveIndex((current) =>
      current === 0 ? products.length - 1 : current - 1,
    )
  }

  function goToNext() {
    setActiveIndex((current) =>
      current === products.length - 1 ? 0 : current + 1,
    )
  }

  return (
    <>
      <section className="rounded-[36px] border border-white/80 bg-white/75 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
        <div className="overflow-hidden rounded-[30px] border border-neutral-900/10 bg-neutral-950 text-white">
          <div className="relative isolate min-h-[560px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.32),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(125,211,252,0.24),transparent_26%),linear-gradient(145deg,#09090b_0%,#111827_48%,#1f2937_100%)]" />

            <div className="relative z-10 flex min-h-[560px] flex-col p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-100 backdrop-blur">
                    Preventa RAMX
                  </p>
                  <h2 className="mt-4 max-w-sm text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                    {activeProduct.title}
                  </h2>
                </div>

                <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-neutral-950 shadow-xl shadow-black/20">
                  {priceLabel}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="group mt-6 overflow-hidden rounded-[28px] border border-white/15 bg-white/10 p-2 text-left shadow-2xl shadow-black/25 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/80"
                aria-label={`Ampliar imagen de ${activeProduct.title}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-white">
                  <Image
                    src={activeProduct.imageSrc}
                    alt={activeProduct.title}
                    fill
                    sizes="(min-width: 1024px) 44vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    priority
                  />

                  <div className="absolute bottom-3 right-3 rounded-full bg-neutral-950/85 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur">
                    Toca para ampliar
                  </div>
                </div>
              </button>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={goToPrevious}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl text-white transition hover:bg-white/20"
                  aria-label="Producto anterior"
                >
                  ‹
                </button>

                <div className="flex gap-2">
                  {products.map((product, index) => (
                    <button
                      key={product.type}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`h-2.5 rounded-full transition ${
                        index === activeIndex
                          ? 'w-8 bg-white'
                          : 'w-2.5 bg-white/35 hover:bg-white/60'
                      }`}
                      aria-label={`Ver ${product.title}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={goToNext}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl text-white transition hover:bg-white/20"
                  aria-label="Siguiente producto"
                >
                  ›
                </button>
              </div>

              <div className="mt-5 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-sm leading-6 text-orange-50/90">
                  {activeProduct.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {activeProduct.includes.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/tienda/order?product=${activeProduct.type}`}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-neutral-950 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-orange-50"
                >
                  {activeProduct.kind === 'donation'
                    ? 'Apoyar el lanzamiento'
                    : 'Apartar en preventa'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {expanded ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen ampliada de ${activeProduct.title}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/85 p-4 backdrop-blur-md"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/15 bg-white p-2 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950/85 text-lg font-semibold text-white shadow-lg backdrop-blur transition hover:bg-neutral-800"
              aria-label="Cerrar imagen ampliada"
            >
              ×
            </button>

            <div className="relative aspect-[4/3] overflow-hidden rounded-[26px] bg-neutral-100">
              <Image
                src={activeProduct.imageSrc}
                alt={activeProduct.title}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>

            <div className="flex flex-col gap-2 px-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-950">
                  {activeProduct.title}
                </p>
                <p className="text-sm text-neutral-500">
                  {activeProduct.kind === 'donation'
                    ? 'Apoyo de monto libre para RAMX'
                    : 'Producto físico en preventa'}
                </p>
              </div>

              <Link
                href={`/tienda/order?product=${activeProduct.type}`}
                className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                {activeProduct.kind === 'donation' ? 'Donar' : 'Apartar'}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
