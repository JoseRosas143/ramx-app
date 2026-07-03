'use server'

import { revalidatePath } from 'next/cache'
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

export async function updateRamxOrderStatusAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const orderId = String(formData.get('order_id') || '')
  const nextStatusRaw = String(formData.get('status') || '')
  const adminNotes = clean(formData.get('admin_notes'))

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
}

export async function updateRamxOrderPaymentStatusAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const orderId = String(formData.get('order_id') || '')
  const nextPaymentRaw = String(formData.get('payment_status') || '')

  if (
    !orderId ||
    !PAYMENT_STATUSES.includes(nextPaymentRaw as PaymentStatus)
  ) {
    throw new Error('Datos inválidos para actualizar el pago.')
  }

  const { error } = await admin
    .from('ramx_orders')
    .update({
      payment_status: nextPaymentRaw,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    throw new Error(`No se pudo actualizar el pago: ${error.message}`)
  }

  revalidatePath('/admin/orders')
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  return text.length > 0 ? text : null
}
