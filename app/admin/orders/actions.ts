'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRamxAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'in_production',
  'ready',
  'delivered',
  'cancelled',
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
  confirmed_at?: string
  delivered_at?: string
  cancelled_at?: string
}

export async function updateRamxOrderAdminAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const orderId = String(formData.get('order_id') || '')
  const nextStatusRaw = String(formData.get('status') || '')
  const nextPaymentRaw = String(formData.get('payment_status') || '')
  const adminNotes = clean(formData.get('admin_notes'))
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
  }

  if (nextStatus === 'confirmed') payload.confirmed_at = now
  if (nextStatus === 'delivered') payload.delivered_at = now
  if (nextStatus === 'cancelled') payload.cancelled_at = now

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

// Compatibilidad con botones/formularios viejos si quedaron abiertos en otra pestaña.
export async function updateRamxOrderStatusAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const orderId = String(formData.get('order_id') || '')
  const nextStatusRaw = String(formData.get('status') || '')
  const adminNotes = clean(formData.get('admin_notes'))
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
  }

  if (nextStatus === 'confirmed') payload.confirmed_at = now
  if (nextStatus === 'delivered') payload.delivered_at = now
  if (nextStatus === 'cancelled') payload.cancelled_at = now

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

function withToast(path: string, message: 'saved' | 'archived' | 'restored') {
  const [pathname, queryString = ''] = path.split('?')
  const params = new URLSearchParams(queryString)
  params.set('notice', message)

  return `${pathname}?${params.toString()}`
}
