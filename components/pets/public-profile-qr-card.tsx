'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'

type Props = {
  petName: string
  publicSlug: string
  identifier?: string | null
  photoUrl?: string | null
}

export default function PublicProfileQrCard({
  petName,
  publicSlug,
  identifier,
  photoUrl,
}: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null)

  const [profileUrl, setProfileUrl] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    const envBaseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
    const browserBaseUrl =
      typeof window !== 'undefined' ? window.location.origin : ''

    const baseUrl = envBaseUrl || browserBaseUrl

    if (baseUrl && publicSlug) {
      setProfileUrl(`${baseUrl}/p/${publicSlug}`)
    }
  }, [publicSlug])

  useEffect(() => {
    if (!profileUrl) return

    QRCode.toDataURL(profileUrl, {
      width: 1200,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    })
      .then(setQrDataUrl)
      .catch((error) => {
        console.error('QR generation error:', error)
      })
  }, [profileUrl])

  const displayIdentifier = useMemo(() => {
    if (identifier && identifier.trim().length > 0) return identifier
    return publicSlug
  }, [identifier, publicSlug])

  const handleCopy = async () => {
    if (!profileUrl) return

    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1800)
    } catch (error) {
      console.error('Copy QR URL error:', error)
    }
  }

  const handleDownloadCard = async () => {
    if (!qrDataUrl || !profileUrl) return

    setWorking(true)

    try {
      const dataUrl = await buildQrCardPng({
        petName,
        identifier: displayIdentifier,
        profileUrl,
        qrDataUrl,
      })

      const fileName = `RAMX-${sanitizeFileName(petName)}-QR.png`

      const link = document.createElement('a')
      link.href = dataUrl
      link.download = fileName
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download QR card error:', error)

      if (qrDataUrl) {
        window.open(qrDataUrl, '_blank', 'noopener,noreferrer')
      }
    } finally {
      setWorking(false)
    }
  }

  const handlePrintCard = async () => {
    if (!qrDataUrl || !profileUrl) return

    setWorking(true)

    try {
      const dataUrl = await buildQrCardPng({
        petName,
        identifier: displayIdentifier,
        profileUrl,
        qrDataUrl,
      })

      const printWindow = window.open('', '_blank', 'width=900,height=900')

      if (!printWindow) return

      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>QR RAMX - ${escapeHtml(petName)}</title>
            <style>
              body {
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f8fafc;
                font-family: Arial, sans-serif;
              }

              img {
                width: min(92vw, 620px);
                height: auto;
                display: block;
              }

              @media print {
                body {
                  background: white;
                }

                img {
                  width: 14cm;
                }
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="QR RAMX" />
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
    } catch (error) {
      console.error('Print QR card error:', error)
    } finally {
      setWorking(false)
    }
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-neutral-50/80 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          ref={cardRef}
          className="w-full max-w-[320px] overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm"
        >
          <div className="bg-neutral-950 px-5 py-4 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
              RAMX
            </p>
            <p className="mt-1 text-lg font-semibold leading-tight">
              Perfil público de mascota
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-3">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={petName}
                  className="h-14 w-14 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-xl">
                  🐾
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-neutral-950">
                  {petName}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {displayIdentifier}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-neutral-200 bg-white p-3">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`QR de ${petName}`}
                  className="aspect-square w-full rounded-2xl"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-neutral-100 text-sm text-neutral-500">
                  Generando QR…
                </div>
              )}
            </div>

            <p className="mt-4 break-all text-center text-[11px] leading-5 text-neutral-500">
              {profileUrl || 'Preparando enlace público…'}
            </p>

            <p className="mt-3 text-center text-xs font-medium text-neutral-800">
              Escanea para ver el perfil público en RAMX.
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-neutral-950">
              QR imprimible
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Úsalo para placa, sticker temporal, documentos o impresión rápida.
              El QR apunta directo al perfil público de la mascota.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownloadCard}
              disabled={!qrDataUrl || working}
              className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {working ? 'Preparando…' : 'Descargar PNG'}
            </button>

            <button
              type="button"
              onClick={handlePrintCard}
              disabled={!qrDataUrl || working}
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60"
            >
              Imprimir
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={!profileUrl}
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60"
            >
              {copied ? 'Copiado' : 'Copiar link'}
            </button>
          </div>

          <p className="text-xs leading-5 text-neutral-500">
            En iPhone, si Safari no descarga directamente, abrirá la imagen para
            que puedas guardarla en Fotos o Archivos.
          </p>
        </div>
      </div>
    </section>
  )
}

async function buildQrCardPng({
  petName,
  identifier,
  profileUrl,
  qrDataUrl,
}: {
  petName: string
  identifier: string
  profileUrl: string
  qrDataUrl: string
}) {
  const canvas = document.createElement('canvas')
  const width = 1080
  const height = 1680
  const scale = window.devicePixelRatio > 1 ? 2 : 1

  canvas.width = width * scale
  canvas.height = height * scale

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No se pudo preparar la imagen del QR.')
  }

  ctx.scale(scale, scale)

  const qrImage = await loadImage(qrDataUrl)

  drawRoundedRect(ctx, 0, 0, width, height, 72, '#ffffff')
  drawRoundedRect(ctx, 0, 0, width, 250, 72, '#050505')

  ctx.fillStyle = '#9ca3af'
  ctx.font = '700 42px Georgia, serif'
  ctx.letterSpacing = '12px'
  ctx.fillText('RAMX', 90, 95)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 58px Georgia, serif'
  wrapCanvasText(ctx, 'Perfil público de mascota', 90, 175, 900, 68)

  ctx.fillStyle = '#050505'
  ctx.textAlign = 'center'
  ctx.font = '700 58px Georgia, serif'
  ctx.fillText(petName || 'Mascota RAMX', width / 2, 390)

  ctx.fillStyle = '#7a7a7a'
  ctx.font = '400 42px Georgia, serif'
  ctx.fillText(identifier || 'RAMX', width / 2, 455)

  ctx.textAlign = 'left'

  const qrBoxX = 105
  const qrBoxY = 590
  const qrBoxSize = 870

  drawRoundedStroke(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 64, '#e5e7eb', 4)

  const qrPadding = 60
  ctx.drawImage(
    qrImage,
    qrBoxX + qrPadding,
    qrBoxY + qrPadding,
    qrBoxSize - qrPadding * 2,
    qrBoxSize - qrPadding * 2
  )

  ctx.fillStyle = '#6b7280'
  ctx.font = '400 42px Georgia, serif'
  ctx.textAlign = 'center'
  wrapCanvasText(ctx, profileUrl, width / 2, 1515, 900, 52, 'center')

  ctx.fillStyle = '#111827'
  ctx.font = '600 46px Georgia, serif'
  wrapCanvasText(
    ctx,
    'Escanea para ver el perfil público en RAMX.',
    width / 2,
    1615,
    820,
    56,
    'center'
  )

  return canvas.toDataURL('image/png')
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string
) {
  ctx.save()
  roundedPath(ctx, x, y, width, height, radius)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.restore()
}

function drawRoundedStroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  stroke: string,
  lineWidth: number
) {
  ctx.save()
  roundedPath(ctx, x, y, width, height, radius)
  ctx.strokeStyle = stroke
  ctx.lineWidth = lineWidth
  ctx.stroke()
  ctx.restore()
}

function roundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  ctx.beginPath()
  ctx.moveTo(x + safeRadius, y)
  ctx.lineTo(x + width - safeRadius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  ctx.lineTo(x + width, y + height - safeRadius)
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height
  )
  ctx.lineTo(x + safeRadius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  ctx.lineTo(x, y + safeRadius)
  ctx.quadraticCurveTo(x, y, x + safeRadius, y)
  ctx.closePath()
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: CanvasTextAlign = 'left'
) {
  const previousAlign = ctx.textAlign
  ctx.textAlign = align

  const words = String(text || '').split(' ')
  let line = ''
  let currentY = y

  for (let index = 0; index < words.length; index += 1) {
    const testLine = line ? `${line} ${words[index]}` : words[index]
    const metrics = ctx.measureText(testLine)

    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY)
      line = words[index]
      currentY += lineHeight
    } else {
      line = testLine
    }
  }

  if (line) {
    ctx.fillText(line, x, currentY)
  }

  ctx.textAlign = previousAlign
}

function sanitizeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}