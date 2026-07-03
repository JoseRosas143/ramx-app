'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PRODUCT_LABELS: Record<string, string> = {
  placa_qr_nfc: 'Placa QR/NFC',
  microchip_placa_qr_nfc: 'Microchip + placa QR/NFC',
  kit_ramx: 'Kit RAMX',
}

const PRODUCT_TYPES = Object.keys(PRODUCT_LABELS)

export async function createPhysicalProductOrderAction(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const productType = cleanText(formData.get('product_type'))
  const petId = cleanText(formData.get('pet_id'))
  const customerName = cleanText(formData.get('customer_name'))
  const customerEmail =
    cleanText(formData.get('customer_email')) || user.email || null
  const customerPhone = cleanText(formData.get('customer_phone'))
  const shippingMethod =
    cleanText(formData.get('shipping_method')) || 'to_confirm'
  const shippingAddress = cleanText(formData.get('shipping_address'))
  const notes = cleanText(formData.get('notes'))

  const quantityRaw = Number(formData.get('quantity') || 1)
  const quantity = Number.isFinite(quantityRaw)
    ? Math.min(Math.max(Math.floor(quantityRaw), 1), 20)
    : 1

  if (!productType || !PRODUCT_TYPES.includes(productType)) {
    throw new Error('Selecciona un producto válido.')
  }

  if (!petId) {
    throw new Error('Selecciona una mascota.')
  }

  if (!customerName) {
    throw new Error('Captura el nombre de contacto.')
  }

  if (!customerPhone) {
    throw new Error('Captura un teléfono o WhatsApp de contacto.')
  }

  const { data: pet, error: petError } = await admin
    .from('pets')
    .select('id, name, public_slug, primary_tutor_profile_id')
    .eq('id', petId)
    .maybeSingle()

  if (petError || !pet || pet.primary_tutor_profile_id !== user.id) {
    throw new Error('No tienes permiso para crear una orden para esta mascota.')
  }

  const orderNumber = await generateOrderNumber(admin)
  const now = new Date().toISOString()

  const { data: order, error: orderError } = await admin
    .from('ramx_orders')
    .insert({
      profile_id: user.id,
      pet_id: pet.id,
      order_number: orderNumber,
      status: 'pending',
      payment_status: 'unpaid',
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      shipping_method: shippingMethod,
      shipping_address: shippingAddress,
      notes,
      admin_notes: null,
      total_amount: 0,
      currency: 'MXN',
      created_at: now,
      updated_at: now,
    })
    .select('id, order_number')
    .single()

  if (orderError || !order) {
    throw new Error(orderError?.message || 'No se pudo crear la orden.')
  }

  const { error: itemError } = await admin.from('ramx_order_items').insert({
    order_id: order.id,
    product_type: productType,
    product_name: PRODUCT_LABELS[productType],
    quantity,
    unit_price: 0,
    created_at: now,
  })

  if (itemError) {
    throw new Error(itemError.message)
  }

  redirect(
    `/tienda/order/success?order=${encodeURIComponent(order.order_number)}`
  )
}

async function generateOrderNumber(
  admin: ReturnType<typeof createAdminClient>
) {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')

  const prefix = `RAMX-${y}${m}${d}`

  const startOfDay = `${y}-${m}-${d}T00:00:00.000Z`
  const endOfDay = `${y}-${m}-${d}T23:59:59.999Z`

  const { count } = await admin
    .from('ramx_orders')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay)

  const next = String((count || 0) + 1).padStart(4, '0')

  return `${prefix}-${next}`
}

function cleanText(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()

  return text.length > 0 ? text : null
}