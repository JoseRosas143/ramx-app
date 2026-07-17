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
  'placa_inteligente_nfc_qr',
  'combo_identificacion_inteligente',
  'combo_identidad_inteligente',
] as const

const STATUSES = ['available', 'reserved', 'assigned', 'activated', 'blocked', 'disabled', 'replaced'] as const

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
    is_printed: false,
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

  const { data: currentCode, error: lookupError } = await admin
    .from('ramx_physical_codes')
    .select('id, status, deleted_at')
    .eq('id', codeId)
    .maybeSingle()

  if (lookupError || !currentCode || currentCode.deleted_at) {
    throw new Error('No se encontró el código que quieres actualizar.')
  }

  if (currentCode.status === 'activated' && nextStatus !== 'activated') {
    throw new Error('Un código activado no debe cambiarse desde esta pantalla.')
  }

  const payload: Record<string, unknown> = {
    status: nextStatus,
  }

  if (nextStatus === 'disabled' || nextStatus === 'blocked') {
    payload.disabled_at = nextStatus === 'disabled' ? new Date().toISOString() : null
    payload.blocked_at = nextStatus === 'blocked' ? new Date().toISOString() : null
  }

  if (nextStatus === 'available') {
    payload.disabled_at = null
    payload.blocked_at = null
    payload.blocked_reason = null
    payload.assigned_order_id = null
    payload.assigned_order_item_id = null
    payload.assigned_profile_id = null
    payload.assigned_at = null
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

export async function updatePhysicalCodesPrintedAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const ids = getIds(formData)
  const isPrinted = String(formData.get('is_printed') || '') === 'true'

  if (ids.length === 0) {
    throw new Error('Selecciona al menos un código.')
  }

  const { error } = await admin
    .from('ramx_physical_codes')
    .update({
      is_printed: isPrinted,
      printed_at: isPrinted ? new Date().toISOString() : null,
    })
    .in('id', ids)
    .is('deleted_at', null)

  if (error) {
    throw new Error(`No se pudo actualizar impresión: ${error.message}`)
  }

  revalidatePath('/admin/products/codes')
}

export async function deletePhysicalCodesAction(formData: FormData) {
  const { user } = await requireRamxAdmin()
  const admin = createAdminClient()

  const ids = getIds(formData)

  if (ids.length === 0) {
    throw new Error('Selecciona al menos un código para eliminar.')
  }

  const { data: selectedCodes, error: lookupError } = await admin
    .from('ramx_physical_codes')
    .select('id, code, status, deleted_at')
    .in('id', ids)

  if (lookupError) {
    throw new Error(`No se pudieron revisar los códigos: ${lookupError.message}`)
  }

  const activeCodes = (selectedCodes || []).filter(
    (item) => item.status === 'activated'
  )

  if (activeCodes.length > 0) {
    throw new Error(
      `No puedes eliminar códigos activados. Desactiva o revisa: ${activeCodes
        .map((item) => item.code)
        .join(', ')}`
    )
  }

  const { error } = await admin
    .from('ramx_physical_codes')
    .update({
      status: 'disabled',
      disabled_at: new Date().toISOString(),
      deleted_at: new Date().toISOString(),
      deleted_by_profile_id: user.id,
    })
    .in('id', ids)
    .neq('status', 'activated')

  if (error) {
    throw new Error(`No se pudieron eliminar los códigos: ${error.message}`)
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
    placa_inteligente_nfc_qr: 'PLQ',
    combo_identificacion_inteligente: 'CID',
    combo_identidad_inteligente: 'CII',
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

function getIds(formData: FormData) {
  return formData
    .getAll('code_ids')
    .map((value) => String(value || '').trim())
    .filter(Boolean)
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()

  return text.length > 0 ? text : null
}
