import 'server-only'
import nodemailer from 'nodemailer'
import { formatMxn } from '@/lib/ramx-store-products'

const RAMX_BANNER_URL =
  process.env.RAMX_ORDER_EMAIL_BANNER_URL ||
  'https://esxkbfyphnthqcxfpkte.supabase.co/storage/v1/object/public/Brand%20kit/5B003718-18AF-4F78-A612-37EFDB637D53.png'

const DEFAULT_ADMIN_EMAIL = 'ramx@bonica.com.mx'

type OrderEmailInput = {
  orderNumber: string
  productName: string
  unitPrice: number
  quantity: number
  totalAmount: number
  customerName: string
  customerEmail: string
  customerPhone: string
  petName?: string | null
  petReference?: string | null
  shippingMethod: string
  shippingAddress: string
  notes?: string | null
}

let transporterCache: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporterCache) return transporterCache

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const secure = process.env.SMTP_SECURE === 'true' || port === 465

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

function getFromHeader() {
  const fromHeader = process.env.SMTP_FROM

  if (fromHeader) return fromHeader

  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
  const fromName = process.env.SMTP_FROM_NAME || 'RAMX'

  return fromEmail ? `"${fromName}" <${fromEmail}>` : null
}

export async function sendRamxOrderEmails(input: OrderEmailInput) {
  const transporter = getTransporter()
  const from = getFromHeader()

  if (!transporter || !from) {
    console.warn('SMTP no configurado. Se omiten correos de orden RAMX.')
    return { sent: false, reason: 'smtp-not-configured' as const }
  }

  const adminEmail =
    process.env.RAMX_ORDERS_NOTIFICATION_EMAIL || DEFAULT_ADMIN_EMAIL

  await Promise.all([
    transporter.sendMail({
      from,
      to: input.customerEmail,
      subject: `RAMX · Recibimos tu solicitud ${input.orderNumber}`,
      html: buildCustomerHtml(input),
      text: buildCustomerText(input),
    }),
    transporter.sendMail({
      from,
      to: adminEmail,
      subject: `RAMX · Nueva orden ${input.orderNumber} · ${input.productName}`,
      html: buildAdminHtml(input),
      text: buildAdminText(input),
      replyTo: input.customerEmail,
    }),
  ])

  return { sent: true as const }
}

function buildCustomerHtml(input: OrderEmailInput) {
  return baseEmailShell({
    eyebrow: 'RAMX · Solicitud recibida',
    title: `Gracias, ${input.customerName}`,
    intro:
      'Recibimos tu solicitud de producto físico RAMX. Revisaremos los datos y te contactaremos para confirmar diseño, disponibilidad, forma de pago y entrega.',
    body: `
      ${summaryTable([
        ['Número de solicitud', input.orderNumber],
        ['Producto', input.productName],
        ['Cantidad', String(input.quantity)],
        ['Total estimado', formatMxn(input.totalAmount)],
        ['Mascota', input.petReference || 'Pendiente de vincular'],
        ['Entrega', deliveryLabel(input.shippingMethod)],
        ['Dirección', input.shippingAddress || 'Pendiente de confirmar'],
      ])}

      <p style="margin:22px 0 0;color:#6b7280;font-size:13px;line-height:1.7;text-align:center;">
        Este correo confirma que tu solicitud fue registrada. El pago o producción se confirma después por el equipo RAMX.
      </p>
    `,
  })
}

function buildAdminHtml(input: OrderEmailInput) {
  return baseEmailShell({
    eyebrow: 'RAMX · Nueva orden',
    title: `Nueva orden ${input.orderNumber}`,
    intro:
      'Se registró una nueva solicitud de producto físico. Revisa los datos para confirmar diseño, pago, producción y entrega.',
    body: `
      ${summaryTable([
        ['Número de solicitud', input.orderNumber],
        ['Producto', input.productName],
        ['Precio unitario', formatMxn(input.unitPrice)],
        ['Cantidad', String(input.quantity)],
        ['Total estimado', formatMxn(input.totalAmount)],
        ['Nombre del comprador', input.customerName],
        ['Correo', input.customerEmail],
        ['WhatsApp / teléfono', input.customerPhone],
        ['Mascota', input.petReference || 'Comprador nuevo / sin vincular'],
        ['Entrega', deliveryLabel(input.shippingMethod)],
        ['Dirección', input.shippingAddress || 'Sin dirección capturada'],
        ['Notas', input.notes || 'Sin notas'],
      ])}
    `,
  })
}

function baseEmailShell({
  eyebrow,
  title,
  intro,
  body,
}: {
  eyebrow: string
  title: string
  intro: string
  body: string
}) {
  return `
  <div style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:680px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:28px;box-shadow:0 24px 60px rgba(15,23,42,.08);overflow:hidden;">
        <div style="background:#f3f4f6;min-height:168px;overflow:hidden;">
          <img
            src="${escapeHtml(RAMX_BANNER_URL)}"
            alt="RAMX"
            style="display:block;width:100%;height:auto;border:0;"
          />
        </div>

        <div style="padding:30px;">
          <p style="margin:0;color:#f97316;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;text-align:center;">
            ${escapeHtml(eyebrow)}
          </p>

          <h1 style="margin:12px 0 0;color:#111827;font-size:28px;line-height:1.2;text-align:center;">
            ${escapeHtml(title)}
          </h1>

          <p style="margin:18px auto 0;max-width:540px;color:#4b5563;font-size:15px;line-height:1.7;text-align:center;">
            ${escapeHtml(intro)}
          </p>

          ${body}

          <p style="margin:26px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;text-align:center;">
            RAMX · Registro Animal MX<br />Identidad digital para mascotas.
          </p>
        </div>
      </div>
    </div>
  </div>
  `
}

function summaryTable(rows: [string, string][]) {
  return `
    <div style="margin:26px 0 0;border:1px solid #e5e7eb;border-radius:22px;overflow:hidden;background:#ffffff;">
      ${rows
        .map(
          ([label, value]) => `
          <div style="display:flex;gap:14px;border-bottom:1px solid #f3f4f6;padding:14px 16px;">
            <div style="width:42%;color:#6b7280;font-size:13px;font-weight:700;">${escapeHtml(
              label
            )}</div>
            <div style="width:58%;color:#111827;font-size:13px;line-height:1.6;">${escapeHtml(
              value
            ).replaceAll('\n', '<br />')}</div>
          </div>
        `
        )
        .join('')}
    </div>
  `
}

function buildCustomerText(input: OrderEmailInput) {
  return [
    `Gracias, ${input.customerName}.`,
    '',
    'Recibimos tu solicitud de producto físico RAMX.',
    `Número de solicitud: ${input.orderNumber}`,
    `Producto: ${input.productName}`,
    `Cantidad: ${input.quantity}`,
    `Total estimado: ${formatMxn(input.totalAmount)}`,
    `Mascota: ${input.petReference || 'Pendiente de vincular'}`,
    `Entrega: ${deliveryLabel(input.shippingMethod)}`,
    `Dirección: ${input.shippingAddress || 'Pendiente de confirmar'}`,
    '',
    'El equipo RAMX te contactará para confirmar diseño, pago y entrega.',
  ].join('\n')
}

function buildAdminText(input: OrderEmailInput) {
  return [
    `Nueva orden ${input.orderNumber}`,
    '',
    `Producto: ${input.productName}`,
    `Precio unitario: ${formatMxn(input.unitPrice)}`,
    `Cantidad: ${input.quantity}`,
    `Total estimado: ${formatMxn(input.totalAmount)}`,
    '',
    `Comprador: ${input.customerName}`,
    `Correo: ${input.customerEmail}`,
    `Teléfono: ${input.customerPhone}`,
    `Mascota: ${input.petReference || 'Comprador nuevo / sin vincular'}`,
    `Entrega: ${deliveryLabel(input.shippingMethod)}`,
    `Dirección: ${input.shippingAddress || 'Sin dirección capturada'}`,
    `Notas: ${input.notes || 'Sin notas'}`,
  ].join('\n')
}

function deliveryLabel(value: string) {
  const labels: Record<string, string> = {
    to_confirm: 'Confirmar por WhatsApp',
    pickup: 'Entrega / recolección local',
    shipping: 'Envío a domicilio',
  }

  return labels[value] || 'Confirmar por WhatsApp'
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
