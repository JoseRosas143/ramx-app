'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_STATUSES = ['new', 'reviewed', 'resolved', 'archived'] as const
type AllowedStatus = (typeof ALLOWED_STATUSES)[number]

export async function updateSightingStatusAction(formData: FormData) {
  const sightingId = String(formData.get('sightingId') || '')
  const nextStatus = String(formData.get('nextStatus') || '') as AllowedStatus

  if (!sightingId || !ALLOWED_STATUSES.includes(nextStatus)) {
    throw new Error('Datos inválidos para actualizar el reporte.')
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('No se pudo validar la sesión del usuario.')
  }

  const { data: sighting, error: sightingError } = await supabase
    .from('sightings')
    .select('id, pet_id, status')
    .eq('id', sightingId)
    .single()

  if (sightingError || !sighting) {
    throw new Error('No se encontró el reporte.')
  }

  const { data: pet, error: petError } = await supabase
    .from('pets')
    .select('id, primary_tutor_profile_id')
    .eq('id', sighting.pet_id)
    .eq('primary_tutor_profile_id', user.id)
    .single()

  if (petError || !pet) {
    throw new Error('No tienes permisos para modificar este reporte.')
  }

  const { error: updateError } = await supabase
    .from('sightings')
    .update({
      status: nextStatus,
    })
    .eq('id', sightingId)

  if (updateError) {
    console.error('Error actualizando sighting:', updateError)
    throw new Error(`No se pudo actualizar el reporte: ${updateError.message}`)
  }

  revalidatePath('/dashboard')
}

export async function markPetRecoveredAction(formData: FormData) {
  const petId = String(formData.get('petId') || '')

  if (!petId) {
    throw new Error('No se recibió el id de la mascota.')
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('No se pudo validar la sesión del usuario.')
  }

  const { data: pet, error: petError } = await supabase
    .from('pets')
    .select('id, public_slug, primary_tutor_profile_id, status')
    .eq('id', petId)
    .eq('primary_tutor_profile_id', user.id)
    .single()

  if (petError || !pet) {
    throw new Error('No se encontró la mascota o no tienes permisos.')
  }

  const now = new Date().toISOString()

  const { error: closeLostReportError } = await supabase
    .from('lost_reports')
    .update({
      status: 'closed',
      closed_at: now,
    })
    .eq('pet_id', petId)
    .eq('status', 'active')

  if (closeLostReportError) {
    console.error('Error cerrando lost_report:', closeLostReportError)
    throw new Error(
      `No se pudo cerrar el reporte de extravío: ${closeLostReportError.message}`
    )
  }

  const { error: petUpdateError } = await supabase
    .from('pets')
    .update({
      status: 'active',
    })
    .eq('id', petId)
    .eq('primary_tutor_profile_id', user.id)

  if (petUpdateError) {
    console.error('Error actualizando mascota:', petUpdateError)
    throw new Error(`No se pudo actualizar la mascota: ${petUpdateError.message}`)
  }

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/pets/${petId}/edit`)

  if (pet.public_slug) {
    revalidatePath(`/p/${pet.public_slug}`)
  }
}