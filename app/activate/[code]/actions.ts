'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function activatePhysicalCodeAction(formData: FormData) {
  const code = normalizeCode(String(formData.get('code') || ''))
  const petId = String(formData.get('pet_id') || '')

  if (!code || !petId) {
    throw new Error('Selecciona una mascota para activar el producto.')
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const admin = createAdminClient()

  const { data: physicalCode, error: codeError } = await admin
    .from('ramx_physical_codes')
    .select('id, code, status, assigned_pet_id, assigned_profile_id')
    .eq('code', code)
    .maybeSingle()

  if (codeError || !physicalCode) {
    throw new Error('Este código RAMX no existe o no es válido.')
  }

  if (physicalCode.status === 'disabled') {
    throw new Error('Este código RAMX está desactivado.')
  }

  if (physicalCode.status === 'activated') {
    if (physicalCode.assigned_pet_id) {
      const { data: assignedPet } = await admin
        .from('pets')
        .select('public_slug')
        .eq('id', physicalCode.assigned_pet_id)
        .maybeSingle()

      if (assignedPet?.public_slug) {
        redirect(`/p/${assignedPet.public_slug}`)
      }
    }

    throw new Error('Este código ya fue activado.')
  }

  if (
    physicalCode.status === 'reserved' &&
    physicalCode.assigned_profile_id &&
    physicalCode.assigned_profile_id !== user.id
  ) {
    throw new Error('Este código está reservado para otra cuenta.')
  }

  const { data: pet, error: petError } = await admin
    .from('pets')
    .select('id, name, public_slug, primary_tutor_profile_id')
    .eq('id', petId)
    .maybeSingle()

  if (petError || !pet || pet.primary_tutor_profile_id !== user.id) {
    throw new Error('No tienes permiso para vincular este producto a esa mascota.')
  }

  const now = new Date().toISOString()

  const { error: updateError } = await admin
    .from('ramx_physical_codes')
    .update({
      status: 'activated',
      assigned_profile_id: user.id,
      assigned_pet_id: pet.id,
      activated_at: now,
      disabled_at: null,
    })
    .eq('id', physicalCode.id)

  if (updateError) {
    throw new Error(`No se pudo activar el producto: ${updateError.message}`)
  }

  await admin.from('ramx_product_assignments').insert({
    code_id: physicalCode.id,
    code: physicalCode.code,
    profile_id: user.id,
    pet_id: pet.id,
    status: 'active',
    assigned_at: now,
  })

  await admin.from('ramx_product_scan_events').insert({
    code_id: physicalCode.id,
    code: physicalCode.code,
    pet_id: pet.id,
    profile_id: user.id,
    source: 'activation',
  })

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/pets/${pet.id}/edit`)

  if (pet.public_slug) {
    revalidatePath(`/p/${pet.public_slug}`)
    redirect(`/p/${pet.public_slug}?activated=1`)
  }

  redirect(`/dashboard/pets/${pet.id}/edit`)
}

function normalizeCode(value: string) {
  return decodeURIComponent(value || '')
    .trim()
    .toUpperCase()
}