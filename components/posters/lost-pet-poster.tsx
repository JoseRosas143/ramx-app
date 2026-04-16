'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { toPng } from 'html-to-image'

type Props = {
  petName: string
  photoUrl?: string | null
  species?: string | null
  breed?: string | null
  sex?: string | null
  color?: string | null
  ageText?: string | null
  lostAt?: string | null
  lastSeenText?: string | null
  rewardText?: string | null
  circumstances?: string | null
  publicContactInstructions?: string | null
  phone?: string | null
  whatsappUrl?: string | null
  publicSlug?: string | null
}

export default function LostPetPoster({
  petName,
  photoUrl,
  species,
  breed,
  sex,
  color,
  ageText,
  lostAt,
  lastSeenText,
  rewardText,
  circumstances,
  publicContactInstructions,
  phone,
  whatsappUrl,
  publicSlug,
}: Props) {
  const posterRef = useRef<HTMLDivElement | null>(null)

  const [qrDataUrl, setQrDataUrl] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [copying, setCopying] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [origin, setOrigin] = useState('')
  const [isLikelyMobile, setIsLikelyMobile] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)

    const ua = navigator.userAgent || ''
    const mobileUA =
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(ua)

    const coarsePointer =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: coarse)').matches
        : false

    const touchPoints = navigator.maxTouchPoints || 0

    const isMobile = mobileUA || coarsePointer || touchPoints > 1
    setIsLikelyMobile(isMobile)
    setCanNativeShare(typeof navigator.share === 'function')
  }, [])

  const publicProfilePath = publicSlug ? `/p/${publicSlug}` : null

  const publicProfileUrl = useMemo(() => {
    if (!publicProfilePath) return ''
    if (!origin) return publicProfilePath
    return `${origin}${publicProfilePath}`
  }, [origin, publicProfilePath])

  const smartActionLabel =
    canNativeShare && isLikelyMobile ? 'Compartir perfil' : 'Copiar enlace'

  useEffect(() => {
    let cancelled = false

    async function buildQr() {
      if (!publicProfileUrl) {
        setQrDataUrl('')
        return
      }

      try {
        const url = await QRCode.toDataURL(publicProfileUrl, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 360,
          color: {
            dark: '#111111',
            light: '#FFFFFFFF',
          },
        })

        if (!cancelled) {
          setQrDataUrl(url)
        }
      } catch (error) {
        console.error('Error generando QR:', error)
        if (!cancelled) {
          setQrDataUrl('')
        }
      }
    }

    buildQr()

    return () => {
      cancelled = true
    }
  }, [publicProfileUrl])

  const generatePosterPng = async () => {
    if (!posterRef.current) {
      throw new Error('No se encontró el cartel para exportar.')
    }

    return await toPng(posterRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    })
  }

  const copyProfileLink = async () => {
    if (!publicProfileUrl) return false

    try {
      await navigator.clipboard.writeText(publicProfileUrl)
      return true
    } catch (error) {
      console.error('Error copiando enlace:', error)
      return false
    }
  }

  const handleSmartShare = async () => {
    if (!publicProfileUrl) return

    setActionMessage('')

    if (canNativeShare && isLikelyMobile) {
      try {
        setSharing(true)

        await navigator.share({
          title: `Se busca a ${petName}`,
          text: `Ayuda a localizar a ${petName}. Abre el perfil público de RAMX para ver información actualizada.`,
          url: publicProfileUrl,
        })

        setActionMessage('Perfil compartido correctamente.')
        return
      } catch (error) {
        console.error('Error compartiendo:', error)

        const copied = await copyProfileLink()
        if (copied) {
          setActionMessage(
            'No se pudo abrir el menú de compartir. Copiamos el enlace del perfil.'
          )
        } else {
          setActionMessage(
            'No se pudo compartir el perfil. Usa Descargar cartel o Imprimir cartel.'
          )
        }
        return
      } finally {
        setSharing(false)
      }
    }

    try {
      setCopying(true)
      const copied = await copyProfileLink()

      if (copied) {
        setActionMessage('Enlace del perfil copiado.')
      } else {
        setActionMessage('No se pudo copiar el enlace.')
      }
    } finally {
      setCopying(false)
    }
  }

  const handleDownloadPoster = async () => {
    try {
      setDownloading(true)
      setActionMessage('')

      const dataUrl = await generatePosterPng()

      const link = document.createElement('a')
      link.download = `cartel-busqueda-${slugify(petName || 'mascota')}.png`
      link.href = dataUrl
      link.click()

      setActionMessage('Cartel descargado correctamente.')
    } catch (error) {
      console.error('Error descargando cartel:', error)
      setActionMessage('No se pudo descargar el cartel.')
    } finally {
      setDownloading(false)
    }
  }

  const handlePrintPoster = async () => {
    try {
      setPrinting(true)
      setActionMessage('')

      const dataUrl = await generatePosterPng()
      const printWindow = window.open('', '_blank', 'width=900,height=1200')

      if (!printWindow) {
        setActionMessage('No se pudo abrir la ventana de impresión.')
        return
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Cartel de búsqueda - ${escapeHtml(petName)}</title>
            <style>
              html, body {
                margin: 0;
                padding: 0;
                background: white;
              }
              .wrap {
                display: flex;
                justify-content: center;
                align-items: flex-start;
                padding: 24px;
              }
              img {
                width: 100%;
                max-width: 900px;
                height: auto;
                display: block;
              }
              @media print {
                .wrap {
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="wrap">
              <img src="${dataUrl}" alt="Cartel de búsqueda" />
            </div>
            <script>
              window.onload = function () {
                window.focus();
                window.print();
              };
            </script>
          </body>
        </html>
      `)

      printWindow.document.close()
      setActionMessage('Cartel listo para impresión.')
    } catch (error) {
      console.error('Error imprimiendo cartel:', error)
      setActionMessage('No se pudo preparar la impresión.')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <section className="space-y-4">
      <div
        data-html-to-image-ignore
        className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-neutral-200 bg-white/95 p-4 shadow-sm"
      >
        <div>
          <h3 className="text-lg font-semibold text-neutral-950">
            Cartel para compartir
          </h3>
          <p className="mt-1 text-sm text-neutral-600">
            Úsalo para difusión rápida en WhatsApp, redes o impresión.
          </p>
          {actionMessage ? (
            <p className="mt-2 text-sm text-neutral-700">{actionMessage}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {publicProfileUrl ? (
            <button
              type="button"
              onClick={handleSmartShare}
              disabled={sharing || copying}
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60"
            >
              {sharing
                ? 'Compartiendo...'
                : copying
                ? 'Copiando...'
                : smartActionLabel}
            </button>
          ) : null}

          <button
            type="button"
            onClick={handlePrintPoster}
            disabled={printing}
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60"
          >
            {printing ? 'Preparando...' : 'Imprimir cartel'}
          </button>

          <button
            type="button"
            onClick={handleDownloadPoster}
            disabled={downloading}
            className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {downloading ? 'Generando PNG...' : 'Descargar cartel'}
          </button>
        </div>
      </div>

      <section
        ref={posterRef}
        className="overflow-hidden rounded-[32px] border border-red-200 bg-white shadow-2xl"
      >
        <div className="border-b border-red-200 bg-gradient-to-r from-red-600 via-red-500 to-rose-500 px-5 py-4 text-white sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-100">
            Cartel de búsqueda
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Se busca a {petName}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-red-50">
            Comparte este cartel para ayudar a localizar a esta mascota lo antes posible.
          </p>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="border-b border-neutral-200 p-5 lg:border-b-0 lg:border-r sm:p-6">
            <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-50 shadow-sm">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={petName}
                  className="h-[320px] w-full object-cover sm:h-[420px]"
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center bg-neutral-100 text-sm text-neutral-500 sm:h-[420px]">
                  Sin foto disponible
                </div>
              )}
            </div>

            <div className="mt-5 rounded-[24px] border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
                Última referencia
              </p>
              <p className="mt-2 text-lg font-semibold text-red-950">
                {lastSeenText || 'Ubicación por confirmar'}
              </p>

              {lostAt ? (
                <p className="mt-2 text-sm leading-6 text-red-900">
                  <span className="font-medium">Fecha del extravío:</span>{' '}
                  {formatDateTime(lostAt)}
                </p>
              ) : null}
            </div>

            <div className="mt-5 rounded-[24px] border border-dashed border-neutral-300 bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Escanea para ayudar
              </p>

              <div className="mt-3 flex h-[180px] w-[180px] items-center justify-center rounded-md border-4 border-neutral-950 bg-white">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="QR al perfil público RAMX"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-sm font-medium text-neutral-700">
                    Generando QR...
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm leading-6 text-neutral-800">
                Abre el perfil público de RAMX para ver información actualizada, ubicación de búsqueda y formas de reportar si la viste o la tienen resguardada.
              </p>

              <p className="mt-2 text-xs leading-5 text-neutral-500">
                QR al perfil público RAMX
              </p>
            </div>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <PosterChip>{species || 'Mascota'}</PosterChip>
              {breed ? <PosterChip>{breed}</PosterChip> : null}
              {sex ? <PosterChip>{sex}</PosterChip> : null}
              {color ? <PosterChip>{color}</PosterChip> : null}
              {ageText ? <PosterChip>{ageText}</PosterChip> : null}
            </div>

            <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Datos principales
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <PosterField label="Nombre" value={petName} />
                <PosterField label="Color" value={color || 'No disponible'} />
                <PosterField label="Especie" value={species || 'No disponible'} />
                <PosterField label="Sexo" value={sex || 'No disponible'} />
              </div>
            </div>

            {rewardText ? (
              <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
                  Recompensa
                </p>
                <p className="mt-2 text-lg font-semibold text-amber-950">
                  {rewardText}
                </p>
              </div>
            ) : null}

            {circumstances ? (
              <div className="rounded-[24px] border border-neutral-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Circunstancias del extravío
                </p>
                <p className="mt-2 text-sm leading-7 text-neutral-800">
                  {circumstances}
                </p>
              </div>
            ) : null}

            {publicContactInstructions ? (
              <div className="rounded-[24px] border border-neutral-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Indicaciones de contacto
                </p>
                <p className="mt-2 text-sm leading-7 text-neutral-800">
                  {publicContactInstructions}
                </p>
              </div>
            ) : null}

            <div className="rounded-[24px] border border-neutral-900 bg-neutral-950 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-300">
                Contacto inmediato
              </p>

              {phone ? (
                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {phone}
                </p>
              ) : (
                <p className="mt-3 text-sm leading-6 text-neutral-300">
                  Usa el perfil público RAMX para contactar al tutor.
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100"
                  >
                    Contactar por WhatsApp
                  </a>
                ) : null}

                {publicProfileUrl ? (
                  <a
                    href={publicProfileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    Ver perfil público RAMX
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  )
}

function PosterChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-900">
      {children}
    </span>
  )
}

function PosterField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-neutral-950">
        {value}
      </p>
    </div>
  )
}

function formatDateTime(value?: string | null) {
  if (!value) return 'No disponible'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}