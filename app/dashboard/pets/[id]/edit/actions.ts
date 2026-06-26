'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
  publicShowMedicalSummary?: boolean
  publicShowPrimaryVet?: boolean
  publicShowVaccinations?: boolean
  publicShowDewormings?: boolean
  publicShowMedicalVisits?: boolean
  publicShowMedicalDocuments?: boolean
}

type UpdatePetMainProfileResult = {
  ok: boolean
  message: string
  medical_alerts?: string | null
}

export async function updatePetMainProfileAction(
  formData: FormData
): Promise<void>

export async function updatePetMainProfileAction(
  petId: string,
  input: UpdatePetMainProfileInput
): Promise<UpdatePetMainProfileResult>

export async function updatePetMainProfileAction(
  formDataOrPetId: FormData | string,
  input?: UpdatePetMainProfileInput
): Promise<void | UpdatePetMainProfileResult> {
  if (typeof formDataOrPetId === 'string') {
    return updatePetMainProfileFromInput(formDataOrPetId, input)
  }

  return updatePetMainProfileFromFormData(formDataOrPetId)
}

async function updatePetMainProfileFromInput(
  petId: string,
  input?: UpdatePetMainProfileInput
): Promise<UpdatePetMainProfileResult> {
  if (!input) {
    return {
      ok: false,
      message: 'Faltan datos para actualizar la mascota.',
    }
  }

  const supabase = await createClient()
  const admin = createAdminClient()

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

  const { data: pet, error: petLookupError } = await admin
    .from('pets')
    .select('id, public_slug, primary_tutor_profile_id')
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

  const normalizedName = cleanText(input.name)

  if (!normalizedName) {
    return {
      ok: false,
      message: 'El nombre de la mascota es obligatorio.',
    }
  }

  const normalizedMedicalAlerts = cleanText(input.medicalAlerts)

  const { data: updatedPet, error: updateError } = await admin
    .from('pets')
    .update({
      name: normalizedName,
      species: cleanText(input.species),
      breed: cleanText(input.breed),
      sex: cleanText(input.sex),
      color: cleanText(input.color),
      birth_date: cleanText(input.birthDate),
      microchip_number: cleanText(input.microchipNumber),
      medical_alerts: normalizedMedicalAlerts,
      profile_photo_url: input.profilePhotoUrl,
      status: input.status,

      public_show_medical_summary: Boolean(input.publicShowMedicalSummary),
      public_show_primary_vet: Boolean(input.publicShowPrimaryVet),
      public_show_vaccinations: input.publicShowVaccinations !== false,
      public_show_dewormings: input.publicShowDewormings !== false,
      public_show_medical_visits: Boolean(input.publicShowMedicalVisits),
      public_show_medical_documents: Boolean(
        input.publicShowMedicalDocuments
      ),
    })
    .eq('id', petId)
    .eq('primary_tutor_profile_id', user.id)
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
  revalidatePath(`/dashboard/pets/${petId}/medical`)

  if (pet.public_slug) {
    revalidatePath(`/p/${pet.public_slug}`)
  }

  return {
    ok: true,
    message: 'Datos principales actualizados correctamente.',
    medical_alerts: updatedPet.medical_alerts,
  }
}

async function updatePetMainProfileFromFormData(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado.')
  }

  const petId = String(formData.get('pet_id') || '').trim()

  if (!petId) {
    throw new Error('Falta la mascota.')
  }

  const { data: pet, error: petLookupError } = await supabase
    .from('pets')
    .select('id, public_slug, primary_tutor_profile_id')
    .eq('id', petId)
    .eq('primary_tutor_profile_id', user.id)
    .single()

  if (petLookupError || !pet) {
    throw new Error('No tienes permiso para modificar esta mascota.')
  }

  const name = clean(formData.get('name'))
  const species = clean(formData.get('species'))
  const breed = clean(formData.get('breed'))
  const sex = clean(formData.get('sex'))
  const color = clean(formData.get('color'))
  const birthDate = clean(formData.get('birth_date'))
  const microchipNumber = clean(formData.get('microchip_number'))
  const medicalAlerts = clean(formData.get('medical_alerts'))
  const profilePhotoUrl = clean(formData.get('profile_photo_url'))

  const isLostMode = getBoolean(formData, 'is_lost_mode')
  const hasLostModeField =
    formData.has('is_lost_mode') ||
    formData.has('lost_mode') ||
    formData.has('status')

  const petPayload: Record<string, unknown> = {}

  if (name !== null) petPayload.name = name
  if (formData.has('species')) petPayload.species = species
  if (formData.has('breed')) petPayload.breed = breed
  if (formData.has('sex')) petPayload.sex = sex
  if (formData.has('color')) petPayload.color = color
  if (formData.has('birth_date')) petPayload.birth_date = birthDate

  if (formData.has('microchip_number')) {
    petPayload.microchip_number = microchipNumber
  }

  if (formData.has('medical_alerts')) {
    petPayload.medical_alerts = medicalAlerts
  }

  if (formData.has('profile_photo_url')) {
    petPayload.profile_photo_url = profilePhotoUrl
  }

  if (hasLostModeField) {
    petPayload.status = isLostMode ? 'lost' : 'active'
  }

  const hasClinicalPrivacyFields =
    formData.has('medical_privacy_present') ||
    formData.has('public_show_medical_summary') ||
    formData.has('public_show_primary_vet') ||
    formData.has('public_show_vaccinations') ||
    formData.has('public_show_dewormings') ||
    formData.has('public_show_medical_visits') ||
    formData.has('public_show_medical_documents')

  if (hasClinicalPrivacyFields) {
    petPayload.public_show_medical_summary = getBoolean(
      formData,
      'public_show_medical_summary'
    )

    petPayload.public_show_primary_vet = getBoolean(
      formData,
      'public_show_primary_vet'
    )

    petPayload.public_show_vaccinations = getBoolean(
      formData,
      'public_show_vaccinations'
    )

    petPayload.public_show_dewormings = getBoolean(
      formData,
      'public_show_dewormings'
    )

    petPayload.public_show_medical_visits = getBoolean(
      formData,
      'public_show_medical_visits'
    )

    petPayload.public_show_medical_documents = getBoolean(
      formData,
      'public_show_medical_documents'
    )
  }

  if (Object.keys(petPayload).length > 0) {
    const { error: updatePetError } = await admin
      .from('pets')
      .update(petPayload)
      .eq('id', petId)
      .eq('primary_tutor_profile_id', user.id)

    if (updatePetError) {
      throw new Error(updatePetError.message)
    }
  }

  await upsertPublicSettings({
    admin,
    formData,
    petId,
  })

  await upsertVetInterest({
    admin,
    formData,
    petId,
  })

  if (hasLostModeField) {
    if (isLostMode) {
      await upsertActiveLostReport({
        admin,
        formData,
        petId,
        profileId: user.id,
      })
    } else {
      await closeActiveLostReports({
        admin,
        petId,
      })
    }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/pets/${petId}/edit`)
  revalidatePath(`/dashboard/pets/${petId}/medical`)

  if (pet.public_slug) {
    revalidatePath(`/p/${pet.public_slug}`)
  }
}

async function upsertPublicSettings({
  admin,
  formData,
  petId,
}: {
  admin: ReturnType<typeof createAdminClient>
  formData: FormData
  petId: string
}) {
  const publicSettingsPayload: Record<string, unknown> = {}

  if (formData.has('public_settings_present')) {
    publicSettingsPayload.show_pet_name = getBoolean(formData, 'show_pet_name')
    publicSettingsPayload.show_profile_photo = getBoolean(
      formData,
      'show_profile_photo'
    )
    publicSettingsPayload.show_species = getBoolean(formData, 'show_species')
    publicSettingsPayload.show_breed = getBoolean(formData, 'show_breed')
    publicSettingsPayload.show_sex = getBoolean(formData, 'show_sex')
    publicSettingsPayload.show_age = getBoolean(formData, 'show_age')
    publicSettingsPayload.show_microchip = getBoolean(
      formData,
      'show_microchip'
    )
    publicSettingsPayload.show_medical_alerts = getBoolean(
      formData,
      'show_medical_alerts'
    )
    publicSettingsPayload.show_primary_tutor_phone = getBoolean(
      formData,
      'show_primary_tutor_phone'
    )
    publicSettingsPayload.show_whatsapp_button = getBoolean(
      formData,
      'show_whatsapp_button'
    )
    publicSettingsPayload.show_emergency_contacts = getBoolean(
      formData,
      'show_emergency_contacts'
    )
    publicSettingsPayload.show_last_seen_info_when_lost = getBoolean(
      formData,
      'show_last_seen_info_when_lost'
    )
    publicSettingsPayload.show_map_when_lost = getBoolean(
      formData,
      'show_map_when_lost'
    )
  }

  if (formData.has('medical_privacy_present')) {
    publicSettingsPayload.show_medical_alerts = getBoolean(
      formData,
      'show_medical_alerts'
    )
  }

  if (Object.keys(publicSettingsPayload).length === 0) return

  const { error } = await admin.from('pet_public_settings').upsert(
    {
      pet_id: petId,
      ...publicSettingsPayload,
    },
    { onConflict: 'pet_id' }
  )

  if (error) {
    throw new Error(error.message)
  }
}

async function upsertVetInterest({
  admin,
  formData,
  petId,
}: {
  admin: ReturnType<typeof createAdminClient>
  formData: FormData
  petId: string
}) {
  const hasVetFields =
    formData.has('clinic_name') ||
    formData.has('vet_phone') ||
    formData.has('vet_state') ||
    formData.has('vet_municipality') ||
    formData.has('state_code') ||
    formData.has('municipality_code')

  if (!hasVetFields) return

  const clinicName = clean(formData.get('clinic_name'))
  const phone = clean(formData.get('vet_phone'))
  const state = clean(formData.get('vet_state'))
  const municipality = clean(formData.get('vet_municipality'))
  const stateCode = clean(formData.get('state_code'))
  const municipalityCode = clean(formData.get('municipality_code'))

  const hasAnyVetValue =
    clinicName || phone || state || municipality || stateCode || municipalityCode

  if (!hasAnyVetValue) return

  const { data: currentVet } = await admin
    .from('pet_onboarding_vet_interest')
    .select('id')
    .eq('pet_id', petId)
    .limit(1)
    .maybeSingle()

  if (currentVet?.id) {
    const { error } = await admin
      .from('pet_onboarding_vet_interest')
      .update({
        clinic_name: clinicName,
        phone,
        state,
        municipality,
        state_code: stateCode,
        municipality_code: municipalityCode,
      })
      .eq('id', currentVet.id)

    if (error) {
      throw new Error(error.message)
    }

    return
  }

  const { error } = await admin.from('pet_onboarding_vet_interest').insert({
    pet_id: petId,
    clinic_name: clinicName,
    phone,
    state,
    municipality,
    state_code: stateCode,
    municipality_code: municipalityCode,
  })

  if (error) {
    throw new Error(error.message)
  }
}

async function upsertActiveLostReport({
  admin,
  formData,
  petId,
  profileId,
}: {
  admin: ReturnType<typeof createAdminClient>
  formData: FormData
  petId: string
  profileId: string
}) {
  const lostReportId = clean(formData.get('lost_report_id'))
  const lostAt = clean(formData.get('lost_at'))
  const lastSeenText = clean(formData.get('last_seen_text'))
  const rewardText = clean(formData.get('reward_text'))
  const circumstances = clean(formData.get('circumstances'))
  const publicContactInstructions = clean(
    formData.get('public_contact_instructions')
  )
  const posterImageUrl = clean(formData.get('poster_image_url'))

  const lat = numberOrNull(formData.get('lost_lat'))
  const lng = numberOrNull(formData.get('lost_lng'))
  const radiusKm = numberOrNull(formData.get('lost_radius_km')) ?? 1

  const payload = {
    pet_id: petId,
    profile_id: profileId,
    status: 'active',
    lost_at: lostAt,
    last_seen_text: lastSeenText,
    reward_text: rewardText,
    circumstances,
    public_contact_instructions: publicContactInstructions,
    poster_image_url: posterImageUrl,
    lat,
    lng,
    radius_km: radiusKm,
    closed_at: null,
    updated_at: new Date().toISOString(),
  }

  if (lostReportId) {
    const { error } = await admin
      .from('lost_reports')
      .update(payload)
      .eq('id', lostReportId)
      .eq('pet_id', petId)

    if (error) {
      throw new Error(error.message)
    }

    return
  }

  const { data: activeReport } = await admin
    .from('lost_reports')
    .select('id')
    .eq('pet_id', petId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activeReport?.id) {
    const { error } = await admin
      .from('lost_reports')
      .update(payload)
      .eq('id', activeReport.id)

    if (error) {
      throw new Error(error.message)
    }

    return
  }

  const { error } = await admin.from('lost_reports').insert({
    ...payload,
    created_at: new Date().toISOString(),
  })

  if (error) {
    throw new Error(error.message)
  }
}

async function closeActiveLostReports({
  admin,
  petId,
}: {
  admin: ReturnType<typeof createAdminClient>
  petId: string
}) {
  const { error } = await admin
    .from('lost_reports')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('pet_id', petId)
    .eq('status', 'active')

  if (error) {
    throw new Error(error.message)
  }
}

function getBoolean(formData: FormData, key: string) {
  const value = formData.get(key)

  return value === 'on' || value === 'true' || value === '1'
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()

  return text.length > 0 ? text : null
}

function cleanText(value: string) {
  const text = String(value || '').trim()

  return text.length > 0 ? text : null
}

function numberOrNull(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()

  if (!text) return null

  const number = Number(text)

  return Number.isNaN(number) ? null : number
}