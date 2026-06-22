import nodemailer from 'nodemailer'

type SendWelcomeEmailInput = {
  to: string
  fullName?: string | null
}

const RAMX_BANNER_URL =
  'https://esxkbfyphnthqcxfpkte.supabase.co/storage/v1/object/public/Brand%20kit/Banner%20bienvenida.png'

const RAMX_STORE_URL = 'https://ramx.bonica.com.mx/tienda'
const RAMX_FACEBOOK_URL =
  'https://www.facebook.com/profile.php?id=61591060778332'
const RAMX_INSTAGRAM_URL = 'https://www.instagram.com/ramx.bonica'

export async function sendWelcomeEmail({
  to,
  fullName,
}: SendWelcomeEmailInput) {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = Number(process.env.SMTP_PORT || 587)
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpSecure = process.env.SMTP_SECURE === 'true'

  const fromEmail =
    process.env.SMTP_FROM_EMAIL ||
    extractEmailFromFromHeader(process.env.SMTP_FROM) ||
    smtpUser

  const fromName = process.env.SMTP_FROM_NAME || 'RAMX'

  if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
    throw new Error('Faltan variables SMTP para enviar correo de bienvenida.')
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })

  const safeName = escapeHtml(fullName || 'Tutor RAMX')

  await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject: 'Bienvenido a RAMX 🐾',
    html: buildWelcomeHtml({
      fullName: safeName,
    }),
  })
}

function buildWelcomeHtml({ fullName }: { fullName: string }) {
  const siteUrl = getSiteUrl()
  const dashboardUrl = `${siteUrl}/dashboard`
  const shareText = encodeURIComponent(
    `Conoce RAMX, una plataforma para proteger la identidad digital de tus mascotas: ${RAMX_STORE_URL}`
  )
  const whatsappShareUrl = `https://wa.me/?text=${shareText}`

  return `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Bienvenido a RAMX</title>
  </head>

  <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:30px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 24px 80px rgba(15,23,42,0.10);">
            <tr>
              <td>
                <img src="${RAMX_BANNER_URL}" alt="Bienvenido a RAMX" width="640" style="display:block;width:100%;height:auto;border:0;" />
              </td>
            </tr>

            <tr>
              <td style="padding:36px 32px 12px;">
                <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#f97316;font-weight:800;">
                  RAMX · Registro Animal MX
                </p>

                <h1 style="margin:0;font-size:31px;line-height:1.15;color:#111827;letter-spacing:-0.045em;">
                  Bienvenido, ${fullName}
                </h1>

                <p style="margin:18px 0 0;font-size:16px;line-height:1.75;color:#4b5563;">
                  Tu cuenta ya está confirmada. Desde ahora puedes crear y administrar la identidad digital de tus mascotas, su perfil público, sus datos importantes y las herramientas de recuperación en caso de extravío.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 32px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="background:linear-gradient(135deg,#fff7ed 0%,#eff6ff 55%,#ffffff 100%);border:1px solid #fed7aa;border-radius:24px;padding:22px;">
                      <p style="margin:0;font-size:15px;font-weight:800;color:#9a3412;">
                        Un proyecto con historia
                      </p>

                      <p style="margin:10px 0 0;font-size:14px;line-height:1.75;color:#7c2d12;">
                        RAMX nace en memoria de Niña, una perrita profundamente querida. Era obediente, noble y muy especial; pero también tenía ese espíritu curioso que, cuando decidía que era hora de dar un pequeño paseo por su cuenta, encontraba la forma de salir a explorar.
                      </p>

                      <p style="margin:12px 0 0;font-size:14px;line-height:1.75;color:#7c2d12;">
                        De esa historia nació una idea sencilla: que más familias tengan una herramienta bonita, práctica y confiable para identificar, proteger y reencontrar a quienes también son parte de casa.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:22px 32px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:24px;padding:22px;">
                      <p style="margin:0;font-size:15px;font-weight:800;color:#111827;">
                        Primeros pasos recomendados
                      </p>

                      <ol style="margin:12px 0 0;padding-left:20px;color:#4b5563;font-size:14px;line-height:1.8;">
                        <li>Completa el perfil público de tu mascota.</li>
                        <li>Sube fotos claras y recientes.</li>
                        <li>Agrega datos médicos importantes si aplica.</li>
                        <li>Descarga o imprime el QR desde tu dashboard.</li>
                      </ol>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:28px 32px 8px;">
                <a href="${dashboardUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:15px 24px;border-radius:18px;">
                  Ir a mi dashboard
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 32px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:24px;padding:22px;text-align:center;">
                      <p style="margin:0;font-size:17px;font-weight:800;color:#111827;letter-spacing:-0.02em;">
                        Ayúdanos a que más mascotas estén protegidas
                      </p>

                      <p style="margin:10px 0 0;font-size:14px;line-height:1.7;color:#4b5563;">
                        Comparte RAMX con alguien que ame a su mascota tanto como tú. Pronto tendremos disponibles placas, QR, NFC y productos físicos desde nuestra tienda.
                      </p>

                      <div style="margin-top:18px;">
                        <a href="${RAMX_STORE_URL}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:13px 20px;border-radius:16px;margin:4px;">
                          Visitar tienda RAMX
                        </a>

                        <a href="${whatsappShareUrl}" style="display:inline-block;background:#ffffff;color:#111827;text-decoration:none;font-weight:800;font-size:14px;padding:13px 20px;border-radius:16px;border:1px solid #d1d5db;margin:4px;">
                          Compartir por WhatsApp
                        </a>
                      </div>

                      <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#9ca3af;">
                        Tienda: ${RAMX_STORE_URL}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:26px 32px 34px;">
                <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#6b7280;">
                  Síguenos en redes
                </p>

                <a href="${RAMX_FACEBOOK_URL}" style="display:inline-block;color:#2563eb;text-decoration:none;font-size:14px;font-weight:700;margin:0 8px;">
                  Facebook
                </a>

                <span style="color:#d1d5db;">·</span>

                <a href="${RAMX_INSTAGRAM_URL}" style="display:inline-block;color:#db2777;text-decoration:none;font-size:14px;font-weight:700;margin:0 8px;">
                  Instagram
                </a>

                <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#9ca3af;">
                  RAMX protege y conecta la identidad digital de tus mascotas.
                </p>
              </td>
            </tr>
          </table>

          <p style="margin:18px 0 0;font-size:11px;line-height:1.5;color:#94a3b8;">
            Este correo fue enviado porque confirmaste tu cuenta en RAMX.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
`
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000'
}

function extractEmailFromFromHeader(value?: string) {
  if (!value) return null

  const match = value.match(/<([^>]+)>/)
  return match?.[1] || value
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}