'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function updateAccountProfileAction(formData: FormData) {
  const fullName = cleanText(formData.get('fullName'))
  const countryCode = cleanText(formData.get('countryCode')) || '+52'
  const phone = cleanText(formData.get('phone'))

  if (!fullName) {
    throw new Error('El nombre es obligatorio.')
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/auth/login')
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      country_code: countryCode,
      phone,
    })
    .eq('id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/account')
  redirect('/dashboard/account?saved=1')
}

export async function requestEmailChangeAction(formData: FormData) {
  const newEmail = cleanText(formData.get('newEmail'))?.toLowerCase()

  if (!newEmail || !newEmail.includes('@')) {
    throw new Error('Escribe un correo electrónico válido.')
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/auth/login')
  }

  if (user.email?.toLowerCase() === newEmail) {
    throw new Error('Ese correo ya está asociado a tu cuenta.')
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'

  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    {
      emailRedirectTo: `${siteUrl}/auth/login?email_updated=1`,
    }
  )

  if (error) {
    throw new Error(error.message)
  }

  redirect('/dashboard/account?email_change_sent=1')
}

export async function deletePetAction(formData: FormData) {
  const petId = cleanText(formData.get('petId'))
  const confirmPetName = cleanText(formData.get('confirmPetName'))

  if (!petId) {
    throw new Error('No se recibió la mascota.')
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/auth/login')
  }

  const admin = createAdminClient()

  const { data: pet, error: petError } = await admin
    .from('pets')
    .select('id, name, primary_tutor_profile_id')
    .eq('id', petId)
    .maybeSingle()

  if (petError) {
    throw new Error(petError.message)
  }

  if (!pet || pet.primary_tutor_profile_id !== user.id) {
    throw new Error('No tienes permiso para eliminar esta mascota.')
  }

  if (confirmPetName !== pet.name) {
    throw new Error('Para eliminar la mascota escribe exactamente su nombre.')
  }

  await deletePetData(admin, pet.id)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/account')
  redirect('/dashboard/account?pet_deleted=1')
}

export async function deleteAccountAction(formData: FormData) {
  const confirmation = cleanText(formData.get('confirmation'))

  if (confirmation !== 'ELIMINAR') {
    throw new Error('Para eliminar la cuenta escribe ELIMINAR.')
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/auth/login')
  }

  const admin = createAdminClient()

  const { data: pets, error: petsError } = await admin
    .from('pets')
    .select('id')
    .eq('primary_tutor_profile_id', user.id)

  if (petsError) {
    throw new Error(petsError.message)
  }

  for (const pet of pets || []) {
    await deletePetData(admin, pet.id)
  }

  await admin.from('notifications').delete().eq('recipient_profile_id', user.id)
  await admin.from('profiles').delete().eq('id', user.id)

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id)

  if (deleteUserError) {
    throw new Error(deleteUserError.message)
  }

  redirect('/auth/login?account_deleted=1')
}

async function deletePetData(
  admin: ReturnType<typeof createAdminClient>,
  petId: string
) {
  await admin.from('notifications').delete().eq('pet_id', petId)
  await admin.from('pet_reminders').delete().eq('pet_id', petId)
  await admin.from('sightings').delete().eq('pet_id', petId)
  await admin.from('lost_reports').delete().eq('pet_id', petId)

  await admin.from('pet_medical_documents').delete().eq('pet_id', petId)
  await admin.from('pet_medical_visits').delete().eq('pet_id', petId)
  await admin.from('pet_dewormings').delete().eq('pet_id', petId)
  await admin.from('pet_vaccinations').delete().eq('pet_id', petId)
  await admin.from('pet_medical_profiles').delete().eq('pet_id', petId)

  await admin.from('pet_public_settings').delete().eq('pet_id', petId)
  await admin.from('pet_onboarding_vet_interest').delete().eq('pet_id', petId)
  await admin.from('pet_photos').delete().eq('pet_id', petId)

  const { error } = await admin.from('pets').delete().eq('id', petId)

  if (error) {
    throw new Error(error.message)
  }
}

function cleanText(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  return text.length > 0 ? text : null
}