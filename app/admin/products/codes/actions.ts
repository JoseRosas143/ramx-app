'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { requireRamxAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const PRODUCT_TYPES = [
  'qr_plate',
  'qr_nfc_plate',
  'nfc_card',
  'kit',
  'other',
] as const

const STATUSES = ['available', 'reserved', 'activated', 'disabled'] as const

type ProductType = (typeof PRODUCT_TYPES)[number]
type Status = (typeof STATUSES)[number]

export async function generatePhysicalCodesAction(formData: FormData) {
  const { user } = await requireRamxAdmin()
  const admin = createAdminClient()

  const productTypeRaw = String(formData.get('product_type') || 'qr_plate')
  const productType = PRODUCT_TYPES.includes(productTypeRaw as ProductType)
    ? (productTypeRaw as ProductType)
    : 'qr_plate'

  const quantityRaw = Number(formData.get('quantity') || 1)
  const quantity = Math.min(Math.max(Math.trunc(quantityRaw || 1), 1), 500)

  const batchName = clean(formData.get('batch_name'))
  const notes = clean(formData.get('notes'))
  const prefix = clean(formData.get('prefix')) || 'RAMX'

  const rows = Array.from({ length: quantity }).map(() => ({
    code: createPhysicalCode(prefix, productType),
    product_type: productType,
    batch_name: batchName,
    notes,
    status: 'available',
    created_by_profile_id: user.id,
  }))

  const { error } = await admin.from('ramx_physical_codes').insert(rows)

  if (error) {
    throw new Error(`No se pudieron crear los códigos: ${error.message}`)
  }

  revalidatePath('/admin/products/codes')
}

export async function updatePhysicalCodeStatusAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const codeId = String(formData.get('code_id') || '')
  const nextStatusRaw = String(formData.get('next_status') || '')

  if (!codeId || !STATUSES.includes(nextStatusRaw as Status)) {
    throw new Error('Datos inválidos para actualizar el código.')
  }

  const nextStatus = nextStatusRaw as Status

  const payload: Record<string, unknown> = {
    status: nextStatus,
  }

  if (nextStatus === 'disabled') {
    payload.disabled_at = new Date().toISOString()
  }

  if (nextStatus === 'available') {
    payload.disabled_at = null
  }

  const { error } = await admin
    .from('ramx_physical_codes')
    .update(payload)
    .eq('id', codeId)

  if (error) {
    throw new Error(`No se pudo actualizar el código: ${error.message}`)
  }

  revalidatePath('/admin/products/codes')
}

function createPhysicalCode(prefix: string, productType: ProductType) {
  const productPrefix: Record<ProductType, string> = {
    qr_plate: 'QR',
    qr_nfc_plate: 'QNF',
    nfc_card: 'NFC',
    kit: 'KIT',
    other: 'GEN',
  }

  return `${normalizePrefix(prefix)}-${productPrefix[productType]}-${randomSuffix()}`
}

function randomSuffix() {
  let value = ''

  while (value.length < 8) {
    value += randomBytes(6)
      .toString('base64url')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
  }

  return value.slice(0, 8)
}

function normalizePrefix(value: string) {
  const normalized = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8)

  return normalized || 'RAMX'
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()

  return text.length > 0 ? text : null
}
