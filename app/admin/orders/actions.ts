'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRamxAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildRamxActivationUrl,
  buildRamxPortalOrderUrl,
  sendRamxOrderEmails,
  sendRamxOrderStatusUpdateEmail,
  sendRamxProductAssignedEmail,
  type RamxOrderStatusEmailKind,
} from '@/lib/ramx-order-emails'
import { getRamxActiveStoreProduct } from '@/lib/ramx-store-config'
import { syncRamxMercadoPagoByOrderNumber } from '@/lib/ramx-payment-sync'
import type { RamxStoreProductKind } from '@/lib/ramx-store-products'

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

type OrderNotificationRow = {
  id: string
  order_number: string
  status: string | null
  payment_status: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  shipping_method: string | null
  shipping_address: string | null
  total_amount: number | string | null
  currency: string | null
  shipping_carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  shipped_at: string | null
  updated_at: string | null
  order_in_production_notified_at: string | null
  order_ready_notified_at: string | null
  order_shipped_notified_at: string | null
  order_delivered_notified_at: string | null
  order_returned_notified_at: string | null
  pets?: {
    name?: string | null
    public_slug?: string | null
    microchip_number?: string | null
    internal_id?: string | null
  } | null
  ramx_order_items?: Array<{
    product_type: string
    product_name: string | null
    quantity: number | null
    unit_price: number | string | null
    subtotal?: number | string | null
  }> | null
}

type OrderNotificationPrevious = Pick<
  OrderNotificationRow,
  'status' | 'tracking_number' | 'tracking_url'
> | null

const ORDER_NOTIFICATION_SELECT = `
  id,
  order_number,
  status,
  payment_status,
  customer_name,
  customer_email,
  customer_phone,
  shipping_method,
  shipping_address,
  total_amount,
  currency,
  shipping_carrier,
  tracking_number,
  tracking_url,
  shipped_at,
  updated_at,
  order_in_production_notified_at,
  order_ready_notified_at,
  order_shipped_notified_at,
  order_delivered_notified_at,
  order_returned_notified_at,
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
`

const STATUS_EMAIL_COLUMNS = {
  in_production: 'order_in_production_notified_at',
  ready: 'order_ready_notified_at',
  shipped: 'order_shipped_notified_at',
  delivered: 'order_delivered_notified_at',
  returned: 'order_returned_notified_at',
} as const satisfies Record<RamxOrderStatusEmailKind, keyof OrderNotificationRow>

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

  const previousOrder = await readOrderForNotification(admin, orderId)
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
    shipped_at: trackingNumber ? currentShippedAt || previousOrder?.shipped_at || now : null,
  }

  if (nextStatus === 'confirmed' && previousOrder?.status !== 'confirmed') payload.confirmed_at = now
  if (nextStatus === 'delivered' && previousOrder?.status !== 'delivered') payload.delivered_at = now
  if (nextStatus === 'cancelled' && previousOrder?.status !== 'cancelled') payload.cancelled_at = now
  if (nextStatus === 'returned' && previousOrder?.status !== 'returned') payload.returned_at = now

  const { data: updatedOrder, error } = await admin
    .from('ramx_orders')
    .update(payload)
    .eq('id', orderId)
    .select(ORDER_NOTIFICATION_SELECT)
    .maybeSingle()

  if (error) {
    throw new Error(`No se pudo guardar la orden: ${error.message}`)
  }

  if (updatedOrder) {
    await sendOrderStatusEmailIfNeeded(
      admin,
      updatedOrder as OrderNotificationRow,
      previousOrder,
    )
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


export async function assignRamxPhysicalCodeToOrderAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const orderId = String(formData.get('order_id') || '')
  const codeId = String(formData.get('code_id') || '')
  const notes = clean(formData.get('assignment_notes'))
  const returnTo = safeAdminOrdersReturnTo(formData.get('return_to'))

  if (!orderId || !codeId) {
    throw new Error('Selecciona una orden y un código físico disponible.')
  }

  const { data: orderData, error: orderError } = await admin
    .from('ramx_orders')
    .select(
      `
      id,
      order_number,
      status,
      payment_status,
      profile_id,
      customer_name,
      customer_email,
      total_amount,
      product_assigned_notified_at,
      ramx_order_items (
        id,
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

  if (orderError || !orderData) {
    throw new Error(orderError?.message || 'No se encontró la orden para asignar producto.')
  }

  const order = orderData as {
    id: string
    order_number: string
    status: string | null
    payment_status: string | null
    profile_id?: string | null
    customer_name: string | null
    customer_email: string | null
    total_amount: number | string | null
    product_assigned_notified_at: string | null
    ramx_order_items?: Array<{
      id: string
      product_type: string
      product_name: string | null
      quantity: number | null
      unit_price: number | string | null
      subtotal: number | string | null
    }> | null
  }

  const items = Array.isArray(order.ramx_order_items) ? order.ramx_order_items : []
  const physicalItem = items.find((item) => item.product_type !== 'donacion_ramx')

  if (!physicalItem) {
    throw new Error('Esta orden no tiene un producto físico para asignar.')
  }

  const { data: codeData, error: codeError } = await admin
    .from('ramx_physical_codes')
    .select('id, code, product_type, status, assigned_order_id, assigned_pet_id, deleted_at')
    .eq('id', codeId)
    .maybeSingle()

  if (codeError || !codeData) {
    throw new Error(codeError?.message || 'No se encontró el código físico seleccionado.')
  }

  const code = codeData as {
    id: string
    code: string
    product_type: string
    status: string
    assigned_order_id?: string | null
    assigned_pet_id?: string | null
    deleted_at?: string | null
  }

  if (code.deleted_at) {
    throw new Error('Ese código fue eliminado y no puede asignarse.')
  }

  if (code.status === 'activated' || code.assigned_pet_id) {
    throw new Error('Ese código ya fue activado por una mascota.')
  }

  if (code.assigned_order_id && code.assigned_order_id !== order.id) {
    throw new Error('Ese código ya está asignado a otra orden.')
  }

  if (!['available', 'reserved', 'assigned'].includes(code.status)) {
    throw new Error('Solo puedes asignar códigos disponibles o reservados.')
  }

  const now = new Date().toISOString()
  const productType = code.product_type || physicalItem.product_type

  const { error: updateCodeError } = await admin
    .from('ramx_physical_codes')
    .update({
      status: 'assigned',
      assigned_order_id: order.id,
      assigned_order_item_id: physicalItem.id,
      assigned_profile_id: order.profile_id || null,
      assigned_at: now,
      disabled_at: null,
      blocked_at: null,
      blocked_reason: null,
    })
    .eq('id', code.id)

  if (updateCodeError) {
    throw new Error(`No se pudo asignar el código: ${updateCodeError.message}`)
  }

  const { error: assignmentError } = await admin
    .from('ramx_order_product_codes')
    .upsert(
      {
        order_id: order.id,
        order_item_id: physicalItem.id,
        code_id: code.id,
        code: code.code,
        product_type: productType,
        status: 'assigned',
        assigned_at: now,
        activated_at: null,
        released_at: null,
        notes,
        updated_at: now,
      },
      { onConflict: 'code_id' },
    )

  if (assignmentError) {
    throw new Error(`El código se asignó, pero no se pudo registrar la relación con la orden: ${assignmentError.message}`)
  }

  const nextOrderStatus = shouldMarkOrderReady(order.status, order.payment_status)
    ? 'ready'
    : order.status || 'pending'

  await admin
    .from('ramx_orders')
    .update({
      status: nextOrderStatus,
      product_assigned_at: now,
      updated_at: now,
    })
    .eq('id', order.id)

  if (order.customer_email && !order.product_assigned_notified_at) {
    const activationUrl = buildRamxActivationUrl(code.code)
    const portalUrl = buildRamxPortalOrderUrl(order.order_number, order.customer_email)

    if (activationUrl) {
      try {
        const result = await sendRamxProductAssignedEmail({
          orderNumber: order.order_number,
          productName: physicalItem.product_name || physicalItem.product_type,
          customerName: order.customer_name || 'Cliente RAMX',
          customerEmail: order.customer_email,
          code: code.code,
          activationUrl,
          portalUrl,
          assignedAt: now,
        })

        if (result.sent) {
          await admin
            .from('ramx_orders')
            .update({
              product_assigned_notified_at: new Date().toISOString(),
              order_last_email_error: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido al enviar correo de activación.'
        await admin
          .from('ramx_orders')
          .update({
            order_last_email_error: message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)
      }
    }
  }

  revalidatePath('/admin/orders')
  revalidatePath('/admin/products/codes')
  revalidatePath('/portal/ordenes')
  redirect(withToast(returnTo, 'product_assigned'))
}

export async function releaseRamxPhysicalCodeFromOrderAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const assignmentId = String(formData.get('assignment_id') || '')
  const returnTo = safeAdminOrdersReturnTo(formData.get('return_to'))

  if (!assignmentId) {
    throw new Error('No se recibió la asignación que quieres liberar.')
  }

  const { data: assignmentData, error: assignmentLookupError } = await admin
    .from('ramx_order_product_codes')
    .select('id, order_id, code_id, code, status')
    .eq('id', assignmentId)
    .maybeSingle()

  if (assignmentLookupError || !assignmentData) {
    throw new Error(assignmentLookupError?.message || 'No encontramos esa asignación.')
  }

  const assignment = assignmentData as {
    id: string
    order_id: string
    code_id: string
    code: string
    status: string
  }

  if (assignment.status === 'activated') {
    throw new Error('No puedes liberar un código que ya fue activado por una mascota.')
  }

  const now = new Date().toISOString()

  const { error: codeError } = await admin
    .from('ramx_physical_codes')
    .update({
      status: 'available',
      assigned_order_id: null,
      assigned_order_item_id: null,
      assigned_profile_id: null,
      assigned_at: null,
      blocked_at: null,
      blocked_reason: null,
    })
    .eq('id', assignment.code_id)
    .neq('status', 'activated')

  if (codeError) {
    throw new Error(`No se pudo liberar el código: ${codeError.message}`)
  }

  const { error: updateAssignmentError } = await admin
    .from('ramx_order_product_codes')
    .update({
      status: 'released',
      released_at: now,
      updated_at: now,
    })
    .eq('id', assignment.id)

  if (updateAssignmentError) {
    throw new Error(`Se liberó el código, pero no se pudo actualizar el historial: ${updateAssignmentError.message}`)
  }

  await admin
    .from('ramx_orders')
    .update({ updated_at: now })
    .eq('id', assignment.order_id)

  revalidatePath('/admin/orders')
  revalidatePath('/admin/products/codes')
  revalidatePath('/portal/ordenes')
  redirect(withToast(returnTo, 'product_released'))
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

  const previousOrder = await readOrderForNotification(admin, orderId)
  const nextStatus = nextStatusRaw as OrderStatus
  const now = new Date().toISOString()
  const payload: Record<string, unknown> = {
    status: nextStatus,
    updated_at: now,
    admin_notes: adminNotes,
    shipping_carrier: shippingCarrier,
    tracking_number: trackingNumber,
    tracking_url: trackingUrl,
    shipped_at: trackingNumber ? currentShippedAt || previousOrder?.shipped_at || now : null,
  }

  if (nextStatus === 'confirmed' && previousOrder?.status !== 'confirmed') payload.confirmed_at = now
  if (nextStatus === 'delivered' && previousOrder?.status !== 'delivered') payload.delivered_at = now
  if (nextStatus === 'cancelled' && previousOrder?.status !== 'cancelled') payload.cancelled_at = now
  if (nextStatus === 'returned' && previousOrder?.status !== 'returned') payload.returned_at = now

  const { data: updatedOrder, error } = await admin
    .from('ramx_orders')
    .update(payload)
    .eq('id', orderId)
    .select(ORDER_NOTIFICATION_SELECT)
    .maybeSingle()

  if (error) {
    throw new Error(`No se pudo actualizar la orden: ${error.message}`)
  }

  if (updatedOrder) {
    await sendOrderStatusEmailIfNeeded(
      admin,
      updatedOrder as OrderNotificationRow,
      previousOrder,
    )
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

async function readOrderForNotification(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
): Promise<OrderNotificationRow | null> {
  const { data, error } = await admin
    .from('ramx_orders')
    .select(ORDER_NOTIFICATION_SELECT)
    .eq('id', orderId)
    .maybeSingle()

  if (error) {
    throw new Error(`No se pudo leer la orden: ${error.message}`)
  }

  return (data as OrderNotificationRow | null) || null
}

async function sendOrderStatusEmailIfNeeded(
  admin: ReturnType<typeof createAdminClient>,
  order: OrderNotificationRow,
  previous: OrderNotificationPrevious,
) {
  if (!order.customer_email) return

  const emailKind = resolveStatusEmailKind(order, previous)
  if (!emailKind) return

  const items = Array.isArray(order.ramx_order_items)
    ? order.ramx_order_items
    : []
  const firstItem = items[0]
  if (!firstItem) return

  const product = await getRamxActiveStoreProduct(firstItem.product_type)
  const orderKind: RamxStoreProductKind =
    product?.kind || (firstItem.product_type === 'donacion_ramx' ? 'donation' : 'physical')

  if (orderKind === 'donation' && emailKind !== 'delivered') {
    return
  }

  const totalAmount = normalizeMoney(order.total_amount) ||
    normalizeMoney(firstItem.unit_price) * normalizePositiveInt(firstItem.quantity, 1)

  try {
    const result = await sendRamxOrderStatusUpdateEmail({
      kind: emailKind,
      orderNumber: order.order_number,
      orderKind,
      productName: firstItem.product_name || product?.title || firstItem.product_type,
      totalAmount,
      customerName: order.customer_name || 'Cliente RAMX',
      customerEmail: order.customer_email,
      shippingCarrier: order.shipping_carrier,
      trackingNumber: order.tracking_number,
      trackingUrl: order.tracking_url,
      updatedAt: order.updated_at,
    })

    if (result.sent) {
      const notificationColumn = STATUS_EMAIL_COLUMNS[emailKind]
      await admin
        .from('ramx_orders')
        .update({
          [notificationColumn]: new Date().toISOString(),
          order_last_email_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al enviar correo.'
    console.error('RAMX order status email error:', error)

    await admin
      .from('ramx_orders')
      .update({
        order_last_email_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
  }
}

function resolveStatusEmailKind(
  order: OrderNotificationRow,
  previous: OrderNotificationPrevious,
): RamxOrderStatusEmailKind | null {
  const status = order.status || 'pending'
  const trackingChanged = Boolean(order.tracking_number) &&
    (order.tracking_number !== previous?.tracking_number || order.tracking_url !== previous?.tracking_url)

  if (status === 'returned' && !order.order_returned_notified_at) return 'returned'
  if (status === 'delivered' && !order.order_delivered_notified_at) return 'delivered'

  if (trackingChanged) return 'shipped'

  if (status === 'ready' && !order.order_ready_notified_at) return 'ready'
  if (status === 'in_production' && !order.order_in_production_notified_at) return 'in_production'

  return null
}


function shouldMarkOrderReady(status: string | null | undefined, paymentStatus: string | null | undefined) {
  return paymentStatus === 'paid' && ['pending', 'confirmed', 'in_production'].includes(status || 'pending')
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

function withToast(
  path: string,
  message:
    | 'saved'
    | 'archived'
    | 'restored'
    | 'resent'
    | 'payment_verified'
    | 'payment_checked'
    | 'payment_not_found'
    | 'product_assigned'
    | 'product_released',
) {
  const [pathname, queryString = ''] = path.split('?')
  const params = new URLSearchParams(queryString)
  params.set('notice', message)

  return `${pathname}?${params.toString()}`
}
