'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getRamxStoreProduct,
  RAMX_STORE_PRODUCT_TYPES,
  type RamxStoreProductType,
} from '@/lib/ramx-store-products'
import { sendRamxOrderEmails } from '@/lib/ramx-order-emails'

export async function createPhysicalProductOrderAction(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const productType = cleanText(formData.get('product_type'))
  const petId = cleanText(formData.get('pet_id'))
  const petName = cleanText(formData.get('pet_name'))
  const customerName = cleanText(formData.get('customer_name'))
  const customerEmail = normalizeEmail(formData.get('customer_email'))
  const customerPhone = cleanText(formData.get('customer_phone'))
  const shippingMethod =
    cleanText(formData.get('shipping_method')) || 'to_confirm'
  const shippingAddress = buildShippingAddress(formData)
  const notes = cleanText(formData.get('notes'))

  const quantityRaw = Number(formData.get('quantity') || 1)
  const quantity = Number.isFinite(quantityRaw)
    ? Math.min(Math.max(Math.floor(quantityRaw), 1), 20)
    : 1

  if (
    !productType ||
    !RAMX_STORE_PRODUCT_TYPES.includes(productType as RamxStoreProductType)
  ) {
    throw new Error('Selecciona un producto válido.')
  }

  const product = getRamxStoreProduct(productType)

  if (!product) {
    throw new Error('Selecciona un producto válido.')
  }

  if (!customerName) {
    throw new Error('Captura el nombre de contacto.')
  }

  if (!customerEmail) {
    throw new Error('Captura un correo válido para enviar la confirmación.')
  }

  if (!customerPhone) {
    throw new Error('Captura un teléfono o WhatsApp de contacto.')
  }

  if (!shippingAddress) {
    throw new Error('Captura la dirección de entrega.')
  }

  let pet: {
    id: string
    name: string
    public_slug: string | null
    microchip_number: string | null
    internal_id: string | null
    primary_tutor_profile_id: string | null
  } | null = null

  if (petId) {
    if (!user) {
      throw new Error('Inicia sesión para vincular una mascota registrada.')
    }

    const { data: selectedPet, error: petError } = await admin
      .from('pets')
      .select(
        'id, name, public_slug, microchip_number, internal_id, primary_tutor_profile_id'
      )
      .eq('id', petId)
      .maybeSingle()

    if (
      petError ||
      !selectedPet ||
      selectedPet.primary_tutor_profile_id !== user.id
    ) {
      throw new Error('No tienes permiso para crear una orden para esta mascota.')
    }

    pet = selectedPet
  }

  const orderNumber = await generateOrderNumber(admin)
  const now = new Date().toISOString()
  const totalAmount = product.price * quantity
  const petReference = buildPetReference(pet, petName)
  const storedNotes = buildStoredNotes({ petName, notes })

  const { data: order, error: orderError } = await admin
    .from('ramx_orders')
    .insert({
      profile_id: user?.id || null,
      pet_id: pet?.id || null,
      order_number: orderNumber,
      status: 'pending',
      payment_status: 'unpaid',
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      shipping_method: shippingMethod,
      shipping_address: shippingAddress,
      notes: storedNotes,
      admin_notes: null,
      total_amount: totalAmount,
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
    product_type: product.type,
    product_name: product.title,
    quantity,
    unit_price: product.price,
    created_at: now,
  })

  if (itemError) {
    throw new Error(itemError.message)
  }

  try {
    await sendRamxOrderEmails({
      orderNumber: order.order_number,
      productName: product.title,
      unitPrice: product.price,
      quantity,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
      petName: pet?.name || petName,
      petReference,
      shippingMethod,
      shippingAddress,
      notes,
    })
  } catch (emailError) {
    console.error('RAMX order email error:', emailError)
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

function buildShippingAddress(formData: FormData) {
  const street = cleanText(formData.get('shipping_street'))
  const neighborhood = cleanText(formData.get('shipping_neighborhood'))
  const state = cleanText(formData.get('shipping_state'))
  const postalCode = cleanText(formData.get('shipping_postal_code'))

  const lines = [
    street ? `Calle y número: ${street}` : null,
    neighborhood ? `Colonia: ${neighborhood}` : null,
    state ? `Estado: ${state}` : null,
    postalCode ? `C.P.: ${postalCode}` : null,
  ].filter(Boolean)

  return lines.length > 0 ? lines.join('\n') : null
}

function buildPetReference(
  pet: {
    name: string
    microchip_number: string | null
    internal_id: string | null
  } | null,
  petName: string | null
) {
  if (pet) {
    const id = pet.microchip_number || pet.internal_id || 'RAMX'
    return `${pet.name} · ${id}`
  }

  return petName ? `${petName} · Pendiente de vincular` : null
}

function buildStoredNotes({
  petName,
  notes,
}: {
  petName: string | null
  notes: string | null
}) {
  const lines = [
    petName ? `Mascota sin vincular: ${petName}` : null,
    notes ? `Notas del comprador: ${notes}` : null,
  ].filter(Boolean)

  return lines.length > 0 ? lines.join('\n') : null
}

function normalizeEmail(value: FormDataEntryValue | null) {
  const email = cleanText(value)?.toLowerCase() || null

  if (!email) return null

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

function cleanText(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()

  return text.length > 0 ? text : null
}
