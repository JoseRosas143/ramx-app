import nodemailer from 'nodemailer'

type NewSightingEmailInput = {
  to: string
  tutorName?: string | null
  petName: string
  reportType: 'sighting' | 'found_safe'
  locationText?: string | null
  seenAt?: string | null
  reporterName?: string | null
  reporterPhone?: string | null
  reporterWhatsapp?: string | null
  notes?: string | null
  publicProfileUrl: string
}

let transporterCache: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporterCache) return transporterCache

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const secure = process.env.SMTP_SECURE === 'true'

  if (!host || !user || !pass) {
    return null
  }

  transporterCache = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })

  return transporterCache
}

export async function sendNewSightingEmail(input: NewSightingEmailInput) {
  const transporter = getTransporter()
  const from = process.env.SMTP_FROM

  if (!transporter || !from) {
    console.warn('SMTP no configurado. Se omite envío de correo.')
    return { sent: false, reason: 'smtp-not-configured' as const }
  }

  const subject =
    input.reportType === 'found_safe'
      ? `RAMX · Reportaron que tienen resguardada a ${input.petName}`
      : `RAMX · Nuevo avistamiento para ${input.petName}`

  const reportTypeLabel =
    input.reportType === 'found_safe'
      ? 'La tienen resguardada'
      : 'Nuevo avistamiento'

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif; background:#f8fafc; padding:24px;">
      <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:20px; overflow:hidden;">
        <div style="background:linear-gradient(90deg,#111827,#1f2937); padding:20px 24px; color:#ffffff;">
          <div style="font-size:12px; letter-spacing:.18em; text-transform:uppercase; opacity:.8;">RAMX</div>
          <h1 style="margin:8px 0 0; font-size:24px; line-height:1.2;">${escapeHtml(subject)}</h1>
        </div>

        <div style="padding:24px;">
          <p style="margin:0 0 16px; color:#111827; font-size:15px; line-height:1.7;">
            Hola ${escapeHtml(input.tutorName || 'Tutor')}, recibiste un nuevo reporte público para <strong>${escapeHtml(
    input.petName
  )}</strong>.
          </p>

          <div style="border:1px solid #e5e7eb; border-radius:16px; padding:16px; background:#f9fafb;">
            <p style="margin:0 0 10px; font-size:13px; text-transform:uppercase; letter-spacing:.14em; color:#6b7280;">Resumen</p>
            <p style="margin:0 0 8px; color:#111827;"><strong>Tipo:</strong> ${escapeHtml(
              reportTypeLabel
            )}</p>
            <p style="margin:0 0 8px; color:#111827;"><strong>Ubicación:</strong> ${escapeHtml(
              input.locationText || 'No especificada'
            )}</p>
            <p style="margin:0 0 8px; color:#111827;"><strong>Fecha del reporte:</strong> ${escapeHtml(
              formatDateTime(input.seenAt)
            )}</p>
            <p style="margin:0 0 8px; color:#111827;"><strong>Nombre:</strong> ${escapeHtml(
              input.reporterName || 'No disponible'
            )}</p>
            <p style="margin:0 0 8px; color:#111827;"><strong>Teléfono:</strong> ${escapeHtml(
              input.reporterPhone || 'No disponible'
            )}</p>
            <p style="margin:0; color:#111827;"><strong>WhatsApp:</strong> ${escapeHtml(
              input.reporterWhatsapp || 'No disponible'
            )}</p>
          </div>

          ${
            input.notes
              ? `
            <div style="margin-top:16px; border:1px solid #e5e7eb; border-radius:16px; padding:16px; background:#ffffff;">
              <p style="margin:0 0 10px; font-size:13px; text-transform:uppercase; letter-spacing:.14em; color:#6b7280;">Comentario</p>
              <p style="margin:0; color:#111827; line-height:1.7;">${escapeHtml(input.notes)}</p>
            </div>
          `
              : ''
          }

          <div style="margin-top:24px;">
            <a href="${escapeHtml(
              input.publicProfileUrl
            )}" style="display:inline-block; background:#111827; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:14px; font-weight:600;">
              Abrir perfil de la mascota
            </a>
          </div>
        </div>
      </div>
    </div>
  `

  const text = [
    `Hola ${input.tutorName || 'Tutor'},`,
    '',
    `Recibiste un nuevo reporte público para ${input.petName}.`,
    `Tipo: ${reportTypeLabel}`,
    `Ubicación: ${input.locationText || 'No especificada'}`,
    `Fecha del reporte: ${formatDateTime(input.seenAt)}`,
    `Nombre: ${input.reporterName || 'No disponible'}`,
    `Teléfono: ${input.reporterPhone || 'No disponible'}`,
    `WhatsApp: ${input.reporterWhatsapp || 'No disponible'}`,
    '',
    input.notes ? `Comentario: ${input.notes}` : '',
    '',
    `Perfil público: ${input.publicProfileUrl}`,
  ]
    .filter(Boolean)
    .join('\n')

  await transporter.sendMail({
    from,
    to: input.to,
    subject,
    html,
    text,
  })

  return { sent: true as const }
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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}