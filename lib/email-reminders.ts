import 'server-only'
import nodemailer from 'nodemailer'

const RAMX_BANNER_URL =
  'https://esxkbfyphnthqcxfpkte.supabase.co/storage/v1/object/public/Brand%20kit/5B003718-18AF-4F78-A612-37EFDB637D53.png'

type ReminderEmailInput = {
  to: string
  petName: string
  title: string
  body: string
  dueDate: string
  actionUrl: string
}

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error('SMTP no configurado.')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })
}

export async function sendMedicalReminderEmail({
  to,
  petName,
  title,
  body,
  dueDate,
  actionUrl,
}: ReminderEmailInput) {
  const transporter = getTransporter()

  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
  const fromName = process.env.SMTP_FROM_NAME || 'RAMX'

  const html = `
  <div style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:28px;padding:32px;box-shadow:0 24px 60px rgba(15,23,42,.08);overflow:hidden;">
        
        <div style="margin:-32px -32px 28px -32px;">
          <img
            src="${RAMX_BANNER_URL}"
            alt="RAMX"
            style="display:block;width:100%;height:auto;border-top-left-radius:28px;border-top-right-radius:28px;"
          />
        </div>

        <p style="margin:0;color:#6b7280;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;text-align:center;">
          RAMX · Recordatorio médico
        </p>

        <h1 style="margin:14px 0 0;color:#111827;font-size:28px;line-height:1.2;text-align:center;">
          ${escapeHtml(title)}
        </h1>

        <p style="margin:18px auto 0;max-width:520px;color:#4b5563;font-size:15px;line-height:1.7;text-align:center;">
          ${escapeHtml(body)}
        </p>

        <div style="margin:26px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:22px;padding:20px;">
          <p style="margin:0;color:#111827;font-size:14px;font-weight:700;">
            Mascota
          </p>
          <p style="margin:6px 0 0;color:#4b5563;font-size:15px;">
            ${escapeHtml(petName)}
          </p>

          <p style="margin:18px 0 0;color:#111827;font-size:14px;font-weight:700;">
            Fecha programada
          </p>
          <p style="margin:6px 0 0;color:#4b5563;font-size:15px;">
            ${escapeHtml(dueDate)}
          </p>
        </div>

        <div style="margin:30px 0;text-align:center;">
          <a
            href="${actionUrl}"
            style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:15px 28px;border-radius:18px;font-size:15px;font-weight:700;"
          >
            Ver expediente clínico
          </a>
        </div>

        <p style="margin:24px auto 0;max-width:520px;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">
          RAMX te ayuda a mantener organizada la información importante de tus mascotas, incluyendo vacunas, desparasitación, documentos médicos y alertas de cuidado.
        </p>

        <p style="margin:18px 0 0;color:#9ca3af;font-size:12px;text-align:center;">
          RAMX · Registro Animal MX
        </p>
      </div>
    </div>
  </div>
  `

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: title,
    html,
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