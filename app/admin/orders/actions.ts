'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRamxAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRamxOrderEmails } from '@/lib/ramx-order-emails'
import { getRamxActiveStoreProduct } from '@/lib/ramx-store-config'
import { syncRamxMercadoPagoByOrderNumber } from '@/lib/ramx-payment-sync'

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'in_production',
  'ready',
  'delivered',
  'cancelled',
  'returned',
] as const

const PAYMENT_STATUSES = [
  'unpaid',
  'manual_pending',
  'paid',
  'refunded',
  'cancelled',
] as const

type OrderStatus = (typeof ORDER_STATUSES)[number]
type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

type UpdatePayload = {
  status: OrderStatus
  payment_status: PaymentStatus
  updated_at: string
  admin_notes: string | null
  shipping_carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  shipped_at: string | null
  confirmed_at?: string
  delivered_at?: string
  cancelled_at?: string
  returned_at?: string
}

export async function updateRamxOrderAdminAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const orderId = String(formData.get('order_id') || '')
  const nextStatusRaw = String(formData.get('status') || '')
  const nextPaymentRaw = String(formData.get('payment_status') || '')
  const adminNotes = clean(formData.get('admin_notes'))
  const shippingCarrier = clean(formData.get('shipping_carrier'))
  const trackingNumber = clean(formData.get('tracking_number'))
  const trackingUrl = normalizeUrl(clean(formData.get('tracking_url')))
  const currentShippedAt = clean(formData.get('current_shipped_at'))
  const returnTo = safeAdminOrdersReturnTo(formData.get('return_to'))

  if (!orderId) {
    throw new Error('No se recibió la orden que se desea actualizar.')
  }

  if (!ORDER_STATUSES.includes(nextStatusRaw as OrderStatus)) {
    throw new Error('El estatus de la orden no es válido.')
  }

  if (!PAYMENT_STATUSES.includes(nextPaymentRaw as PaymentStatus)) {
    throw new Error('El estatus de pago no es válido.')
  }

  const nextStatus = nextStatusRaw as OrderStatus
  const nextPayment = nextPaymentRaw as PaymentStatus
  const now = new Date().toISOString()

  const payload: UpdatePayload = {
    status: nextStatus,
    payment_status: nextPayment,
    updated_at: now,
    admin_notes: adminNotes,
    shipping_carrier: shippingCarrier,
    tracking_number: trackingNumber,
    tracking_url: trackingUrl,
    shipped_at: trackingNumber ? currentShippedAt || now : null,
  }

  if (nextStatus === 'confirmed') payload.confirmed_at = now
  if (nextStatus === 'delivered') payload.delivered_at = now
  if (nextStatus === 'cancelled') payload.cancelled_at = now
  if (nextStatus === 'returned') payload.returned_at = now

  const { error } = await admin
    .from('ramx_orders')
    .update(payload)
    .eq('id', orderId)

  if (error) {
    throw new Error(`No se pudo guardar la orden: ${error.message}`)
  }

  revalidatePath('/admin/orders')
  redirect(withToast(returnTo, 'saved'))
}

export async function archiveRamxOrderAction(formData: FormData) {
  const { user } = await requireRamxAdmin()
  const admin = createAdminClient()

  const orderId = String(formData.get('order_id') || '')
  const archivedReason = clean(formData.get('archive_reason'))
  const returnTo = safeAdminOrdersReturnTo(formData.get('return_to'))

  if (!orderId) {
    throw new Error('No se recibió la orden que se desea archivar.')
  }

  const { error } = await admin
    .from('ramx_orders')
    .update({
      archived_at: new Date().toISOString(),
      archived_by: user.id,
      archived_reason: archivedReason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    throw new Error(`No se pudo archivar la orden: ${error.message}`)
  }

  revalidatePath('/admin/orders')
  redirect(withToast(returnTo, 'archived'))
}

export async function unarchiveRamxOrderAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const orderId = String(formData.get('order_id') || '')
  const returnTo = safeAdminOrdersReturnTo(formData.get('return_to'))

  if (!orderId) {
    throw new Error('No se recibió la orden que se desea restaurar.')
  }

  const { error } = await admin
    .from('ramx_orders')
    .update({
      archived_at: null,
      archived_by: null,
      archived_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    throw new Error(`No se pudo restaurar la orden: ${error.message}`)
  }

  revalidatePath('/admin/orders')
  redirect(withToast(returnTo, 'restored'))
}


export async function resendRamxOrderConfirmationAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const orderId = String(formData.get('order_id') || '')
  const returnTo = safeAdminOrdersReturnTo(formData.get('return_to'))

  if (!orderId) {
    throw new Error('No se recibió la orden para reenviar la confirmación.')
  }

  const { data: order, error } = await admin
    .from('ramx_orders')
    .select(
      `
      id,
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      shipping_method,
      shipping_address,
      notes,
      total_amount,
      currency,
      mercado_pago_init_point,
      mercado_pago_sandbox_init_point,
      pets (
        name,
        public_slug,
        microchip_number,
        internal_id
      ),
      ramx_order_items (
        product_type,
        product_name,
        quantity,
        unit_price,
        subtotal
      )
    `,
    )
    .eq('id', orderId)
    .maybeSingle()

  if (error || !order) {
    throw new Error(error?.message || 'No se encontró la orden para reenviar correo.')
  }

  const items = Array.isArray(order.ramx_order_items)
    ? order.ramx_order_items
    : []
  const firstItem = items[0]

  if (!firstItem) {
    throw new Error('La orden no tiene productos asociados.')
  }

  const product = await getRamxActiveStoreProduct(firstItem.product_type)
  const orderKind = product?.kind || (firstItem.product_type === 'donacion_ramx' ? 'donation' : 'physical')
  const quantity = normalizePositiveInt(firstItem.quantity, 1)
  const unitPrice = normalizeMoney(firstItem.unit_price)
  const totalAmount = normalizeMoney(order.total_amount) || unitPrice * quantity
  const paymentUrl = chooseStoredPaymentUrl(order)
  const pet = Array.isArray(order.pets) ? order.pets[0] : order.pets

  await sendRamxOrderEmails({
    orderNumber: order.order_number,
    orderKind,
    productName: firstItem.product_name || product?.title || firstItem.product_type,
    unitPrice,
    quantity,
    totalAmount,
    customerName: order.customer_name || 'Cliente RAMX',
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    petName: pet?.name || null,
    petReference: buildPetReference(pet),
    shippingMethod: order.shipping_method || 'to_confirm',
    shippingAddress: order.shipping_address,
    notes: order.notes,
    paymentUrl,
  })

  await admin
    .from('ramx_orders')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', orderId)

  revalidatePath('/admin/orders')
  redirect(withToast(returnTo, 'resent'))
}


export async function verifyRamxOrderMercadoPagoPaymentAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const orderId = String(formData.get('order_id') || '')
  const returnTo = safeAdminOrdersReturnTo(formData.get('return_to'))

  if (!orderId) {
    throw new Error('No se recibió la orden para verificar el pago.')
  }

  const { data: order, error } = await admin
    .from('ramx_orders')
    .select('order_number, payment_provider, mercado_pago_preference_id')
    .eq('id', orderId)
    .maybeSingle()

  if (error || !order) {
    throw new Error(error?.message || 'No se encontró la orden para verificar el pago.')
  }

  if (order.payment_provider !== 'mercado_pago' && !order.mercado_pago_preference_id) {
    throw new Error('Esta orden no tiene preferencia de Mercado Pago registrada.')
  }

  const result = await syncRamxMercadoPagoByOrderNumber(order.order_number, 'admin')
  const notice = result.paymentStatus === 'paid'
    ? 'payment_verified'
    : result.reason === 'payment_not_found'
      ? 'payment_not_found'
      : 'payment_checked'

  revalidatePath('/admin/orders')
  revalidatePath('/tienda/order/success')
  redirect(withToast(returnTo, notice))
}

// Compatibilidad con botones/formularios viejos si quedaron abiertos en otra pestaña.
export async function updateRamxOrderStatusAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const orderId = String(formData.get('order_id') || '')
  const nextStatusRaw = String(formData.get('status') || '')
  const adminNotes = clean(formData.get('admin_notes'))
  const shippingCarrier = clean(formData.get('shipping_carrier'))
  const trackingNumber = clean(formData.get('tracking_number'))
  const trackingUrl = normalizeUrl(clean(formData.get('tracking_url')))
  const currentShippedAt = clean(formData.get('current_shipped_at'))
  const returnTo = safeAdminOrdersReturnTo(formData.get('return_to'))

  if (!orderId || !ORDER_STATUSES.includes(nextStatusRaw as OrderStatus)) {
    throw new Error('Datos inválidos para actualizar la orden.')
  }

  const nextStatus = nextStatusRaw as OrderStatus
  const now = new Date().toISOString()
  const payload: Record<string, unknown> = {
    status: nextStatus,
    updated_at: now,
    admin_notes: adminNotes,
    shipping_carrier: shippingCarrier,
    tracking_number: trackingNumber,
    tracking_url: trackingUrl,
    shipped_at: trackingNumber ? currentShippedAt || now : null,
  }

  if (nextStatus === 'confirmed') payload.confirmed_at = now
  if (nextStatus === 'delivered') payload.delivered_at = now
  if (nextStatus === 'cancelled') payload.cancelled_at = now
  if (nextStatus === 'returned') payload.returned_at = now

  const { error } = await admin
    .from('ramx_orders')
    .update(payload)
    .eq('id', orderId)

  if (error) {
    throw new Error(`No se pudo actualizar la orden: ${error.message}`)
  }

  revalidatePath('/admin/orders')
  redirect(withToast(returnTo, 'saved'))
}

export async function updateRamxOrderPaymentStatusAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const orderId = String(formData.get('order_id') || '')
  const nextPaymentRaw = String(formData.get('payment_status') || '')
  const returnTo = safeAdminOrdersReturnTo(formData.get('return_to'))

  if (!orderId || !PAYMENT_STATUSES.includes(nextPaymentRaw as PaymentStatus)) {
    throw new Error('Datos inválidos para actualizar el pago.')
  }

  const { error } = await admin
    .from('ramx_orders')
    .update({
      payment_status: nextPaymentRaw as PaymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    throw new Error(`No se pudo actualizar el pago: ${error.message}`)
  }

  revalidatePath('/admin/orders')
  redirect(withToast(returnTo, 'saved'))
}


function normalizeMoney(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value || 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function normalizePositiveInt(value: unknown, fallback: number) {
  const numberValue = Number(value || fallback)
  return Number.isFinite(numberValue) && numberValue > 0
    ? Math.floor(numberValue)
    : fallback
}

function chooseStoredPaymentUrl(order: {
  mercado_pago_init_point?: string | null
  mercado_pago_sandbox_init_point?: string | null
}) {
  const useSandbox =
    process.env.MERCADO_PAGO_USE_SANDBOX_LINK === 'true' ||
    process.env.MP_USE_SANDBOX_LINK === 'true' ||
    process.env.MERCADO_PAGO_ACCESS_TOKEN?.startsWith('TEST-')

  if (useSandbox && order.mercado_pago_sandbox_init_point) {
    return order.mercado_pago_sandbox_init_point
  }

  return order.mercado_pago_init_point || order.mercado_pago_sandbox_init_point || null
}

function buildPetReference(
  pet:
    | {
        name?: string | null
        public_slug?: string | null
        microchip_number?: string | null
        internal_id?: string | null
      }
    | null
    | undefined,
) {
  if (!pet?.name) return null

  const reference = pet.microchip_number || pet.internal_id || pet.public_slug
  return reference ? `${pet.name} · ${reference}` : pet.name
}

function normalizeUrl(value: string | null) {
  if (!value) return null

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return `https://${value}`
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  return text.length > 0 ? text : null
}

function safeAdminOrdersReturnTo(value: FormDataEntryValue | null) {
  const raw = String(value || '/admin/orders')

  if (!raw.startsWith('/admin/orders')) {
    return '/admin/orders'
  }

  return raw
}

function withToast(path: string, message: 'saved' | 'archived' | 'restored' | 'resent' | 'payment_verified' | 'payment_checked' | 'payment_not_found') {
  const [pathname, queryString = ''] = path.split('?')
  const params = new URLSearchParams(queryString)
  params.set('notice', message)

  return `${pathname}?${params.toString()}`
}
