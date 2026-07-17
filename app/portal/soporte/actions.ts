'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

type CustomerOrderForSupport = {
  id: string
  order_number: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
}

const SUPPORT_CATEGORIES = [
  'pedido_preventa',
  'pago_mercado_pago',
  'activacion_qr_nfc',
  'registro_mascota',
  'modo_extraviado',
  'cuenta_acceso',
  'garantia_reposicion',
  'donacion',
  'premium_addons',
  'otro',
] as const

export async function createRamxSupportTicketAction(formData: FormData) {
  const admin = createAdminClient()

  const orderNumber = normalizeOrderNumber(formData.get('order_number'))
  const customerEmail = normalizeEmail(formData.get('customer_email'))
  const customerName = clean(formData.get('customer_name'))
  const customerPhone = clean(formData.get('customer_phone'))
  const categoryRaw = String(formData.get('category') || 'otro')
  const subject = clean(formData.get('subject'))
  const description = clean(formData.get('description'))
  const attachmentUrl = normalizeUrl(clean(formData.get('attachment_url')))
  const priority = String(formData.get('priority') || 'normal') === 'high' ? 'high' : 'normal'

  if (!orderNumber || !customerEmail) {
    redirect(`/portal/soporte/nuevo?error=missing`)
  }

  if (!subject || !description) {
    redirect(`/portal/soporte/nuevo?order=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(customerEmail)}&error=missing`)
  }

  const order = await readOrderForSupport(orderNumber, customerEmail)

  if (!order) {
    redirect(`/portal/soporte/nuevo?order=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(customerEmail)}&error=not_found`)
  }

  const now = new Date().toISOString()
  const ticketNumber = buildTicketNumber()
  const category = SUPPORT_CATEGORIES.includes(categoryRaw as (typeof SUPPORT_CATEGORIES)[number])
    ? categoryRaw
    : 'otro'

  const { data: ticket, error: ticketError } = await admin
    .from('ramx_support_tickets')
    .insert({
      ticket_number: ticketNumber,
      order_id: order.id,
      order_number: order.order_number,
      customer_name: customerName || order.customer_name || 'Cliente RAMX',
      customer_email: customerEmail,
      customer_phone: customerPhone || order.customer_phone,
      category,
      priority,
      status: 'new',
      subject,
      description,
      source: 'portal',
      last_message_at: now,
      created_at: now,
      updated_at: now,
    })
    .select('id, ticket_number')
    .maybeSingle()

  if (ticketError || !ticket) {
    throw new Error(ticketError?.message || 'No se pudo crear la solicitud de soporte.')
  }

  const { error: messageError } = await admin.from('ramx_support_messages').insert({
    ticket_id: ticket.id,
    sender_type: 'customer',
    author_name: customerName || order.customer_name || 'Cliente RAMX',
    author_email: customerEmail,
    body: description,
    is_internal: false,
    created_at: now,
  })

  if (messageError) {
    throw new Error(`Se creó la solicitud, pero no se pudo guardar el mensaje: ${messageError.message}`)
  }

  if (attachmentUrl) {
    await admin.from('ramx_support_ticket_attachments').insert({
      ticket_id: ticket.id,
      file_name: 'Adjunto del cliente',
      file_url: attachmentUrl,
      created_at: now,
    })
  }

  revalidatePath('/portal/soporte')
  revalidatePath(`/portal/soporte/${ticket.ticket_number}`)
  redirect(`/portal/soporte/${encodeURIComponent(ticket.ticket_number)}?email=${encodeURIComponent(customerEmail)}&created=1`)
}

export async function addCustomerRamxSupportReplyAction(formData: FormData) {
  const admin = createAdminClient()
  const ticketNumber = normalizeTicketNumber(formData.get('ticket_number'))
  const customerEmail = normalizeEmail(formData.get('customer_email'))
  const body = clean(formData.get('body'))

  if (!ticketNumber || !customerEmail || !body) {
    redirect(`/portal/soporte/${encodeURIComponent(ticketNumber || '')}?email=${encodeURIComponent(customerEmail)}&error=missing`)
  }

  const { data: ticket, error: ticketError } = await admin
    .from('ramx_support_tickets')
    .select('id, ticket_number, customer_email, customer_name, status')
    .eq('ticket_number', ticketNumber)
    .maybeSingle()

  if (ticketError || !ticket || normalizeEmail(ticket.customer_email) !== customerEmail) {
    redirect(`/portal/soporte/${encodeURIComponent(ticketNumber)}?error=not_found`)
  }

  const now = new Date().toISOString()
  const { error } = await admin.from('ramx_support_messages').insert({
    ticket_id: ticket.id,
    sender_type: 'customer',
    author_name: ticket.customer_name || 'Cliente RAMX',
    author_email: customerEmail,
    body,
    is_internal: false,
    created_at: now,
  })

  if (error) {
    throw new Error(`No se pudo enviar tu mensaje: ${error.message}`)
  }

  await admin
    .from('ramx_support_tickets')
    .update({
      status: ticket.status === 'resolved' ? 'customer_replied' : 'customer_replied',
      last_message_at: now,
      updated_at: now,
    })
    .eq('id', ticket.id)

  revalidatePath(`/portal/soporte/${ticketNumber}`)
  redirect(`/portal/soporte/${encodeURIComponent(ticketNumber)}?email=${encodeURIComponent(customerEmail)}&sent=1`)
}

async function readOrderForSupport(orderNumber: string, email: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('ramx_orders')
    .select('id, order_number, customer_name, customer_email, customer_phone')
    .eq('order_number', orderNumber)
    .maybeSingle()

  const order = (data as CustomerOrderForSupport | null) || null
  if (!order) return null
  if (normalizeEmail(order.customer_email) !== email) return null
  return order
}

function buildTicketNumber() {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `SUP-${y}${m}${d}-${suffix}`
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  return text.length > 0 ? text.slice(0, 4000) : null
}

function normalizeOrderNumber(value: FormDataEntryValue | string | null) {
  return String(value || '').trim().toUpperCase().slice(0, 40)
}

function normalizeTicketNumber(value: FormDataEntryValue | string | null) {
  return String(value || '').trim().toUpperCase().slice(0, 40)
}

function normalizeEmail(value: FormDataEntryValue | string | null | undefined) {
  return String(value || '').trim().toLowerCase().slice(0, 160)
}

function normalizeUrl(value: string | null) {
  if (!value) return null
  if (!/^https?:\/\//i.test(value)) return null
  return value.slice(0, 1000)
}
