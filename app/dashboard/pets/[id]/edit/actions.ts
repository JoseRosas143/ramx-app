'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type UpdatePetMainProfileInput = {
  name: string
  species: string
  breed: string
  sex: string
  color: string
  birthDate: string
  microchipNumber: string
  medicalAlerts: string
  profilePhotoUrl: string | null
  status: 'active' | 'lost'
}

type UpdatePetMainProfileResult = {
  ok: boolean
  message: string
  medical_alerts?: string | null
}

export async function updatePetMainProfileAction(
  petId: string,
  input: UpdatePetMainProfileInput
): Promise<UpdatePetMainProfileResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      ok: false,
      message: 'Tu sesión no está activa. Inicia sesión nuevamente.',
    }
  }

  const admin = createAdminClient()

  const { data: pet, error: petLookupError } = await admin
    .from('pets')
    .select('id, primary_tutor_profile_id, public_slug')
    .eq('id', petId)
    .maybeSingle()

  if (petLookupError) {
    return {
      ok: false,
      message: petLookupError.message,
    }
  }

  if (!pet || pet.primary_tutor_profile_id !== user.id) {
    return {
      ok: false,
      message: 'No tienes permiso para actualizar esta mascota.',
    }
  }

  const normalizedName = cleanRequiredText(input.name)

  if (!normalizedName) {
    return {
      ok: false,
      message: 'El nombre de la mascota es obligatorio.',
    }
  }

  const normalizedMedicalAlerts = cleanOptionalText(input.medicalAlerts)

  const { data: updatedPet, error: updateError } = await admin
    .from('pets')
    .update({
      name: normalizedName,
      species: cleanOptionalText(input.species),
      breed: cleanOptionalText(input.breed),
      sex: cleanOptionalText(input.sex),
      color: cleanOptionalText(input.color),
      birth_date: input.birthDate || null,
      microchip_number: cleanOptionalText(input.microchipNumber),
      medical_alerts: normalizedMedicalAlerts,
      profile_photo_url: input.profilePhotoUrl,
      status: input.status,
    })
    .eq('id', petId)
    .select('id, medical_alerts')
    .single()

  if (updateError) {
    return {
      ok: false,
      message: updateError.message,
    }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/pets/${petId}/edit`)

  if (pet.public_slug) {
    revalidatePath(`/p/${pet.public_slug}`)
  }

  return {
    ok: true,
    message: 'Datos principales actualizados correctamente.',
    medical_alerts: updatedPet.medical_alerts,
  }
}

function cleanOptionalText(value: string) {
  const text = value.trim()
  return text.length > 0 ? text : null
}

function cleanRequiredText(value: string) {
  const text = value.trim()
  return text.length > 0 ? text : null
}