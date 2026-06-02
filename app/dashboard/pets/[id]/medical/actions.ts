'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function upsertMedicalProfileAction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado.')

  const petId = String(formData.get('pet_id') || '')
  const weightRaw = String(formData.get('weight_kg') || '').trim()

  if (!petId) throw new Error('Falta la mascota.')

  const { data: pet } = await supabase
    .from('pets')
    .select('id')
    .eq('id', petId)
    .eq('primary_tutor_profile_id', user.id)
    .single()

  if (!pet) throw new Error('No tienes permiso para modificar esta mascota.')

  const payload = {
    pet_id: petId,
    weight_kg: weightRaw ? Number(weightRaw) : null,
    blood_type: clean(formData.get('blood_type')),
    allergies: clean(formData.get('allergies')),
    chronic_conditions: clean(formData.get('chronic_conditions')),
    current_medications: clean(formData.get('current_medications')),
    special_care_notes: clean(formData.get('special_care_notes')),
    emergency_notes: clean(formData.get('emergency_notes')),
    primary_vet_name: clean(formData.get('primary_vet_name')),
    primary_vet_clinic: clean(formData.get('primary_vet_clinic')),
    primary_vet_phone: clean(formData.get('primary_vet_phone')),
  }

  const { error } = await supabase
    .from('pet_medical_profiles')
    .upsert(payload, { onConflict: 'pet_id' })

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/pets/${petId}/medical`)
}

export async function addVaccinationAction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado.')

  const petId = String(formData.get('pet_id') || '')
  const catalogId = String(formData.get('catalog_id') || '')
  const customName = String(formData.get('custom_vaccine_name') || '').trim()
  const appliedDate = String(formData.get('applied_date') || '')
  const nextDueDate = String(formData.get('next_due_date') || '') || null
  const batchNumber = clean(formData.get('batch_number'))
  const veterinarianName = clean(formData.get('veterinarian_name'))
  const clinicName = clean(formData.get('clinic_name'))
  const notes = clean(formData.get('notes'))

  if (!petId || !appliedDate) throw new Error('Faltan datos obligatorios.')

  const { data: pet } = await supabase
    .from('pets')
    .select('id')
    .eq('id', petId)
    .eq('primary_tutor_profile_id', user.id)
    .single()

  if (!pet) throw new Error('No tienes permiso para modificar esta mascota.')

  let vaccineName = customName
  let brand: string | null = null
  let finalCatalogId: string | null = catalogId || null

  if (catalogId && catalogId !== 'other') {
    const { data: catalogItem } = await supabase
      .from('medical_vaccine_catalog')
      .select('id, name, brand')
      .eq('id', catalogId)
      .single()

    if (catalogItem) {
      vaccineName = catalogItem.name
      brand = catalogItem.brand
      finalCatalogId = catalogItem.id
    }
  } else {
    finalCatalogId = null
  }

  if (!vaccineName) {
    throw new Error('Selecciona una vacuna o escribe una personalizada.')
  }

  const { error } = await supabase.from('pet_vaccinations').insert({
    pet_id: petId,
    catalog_id: finalCatalogId,
    vaccine_name: vaccineName,
    brand,
    applied_date: appliedDate,
    next_due_date: nextDueDate,
    batch_number: batchNumber,
    veterinarian_name: veterinarianName,
    clinic_name: clinicName,
    notes,
    created_by_profile_id: user.id,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/pets/${petId}/medical`)
}

export async function addDewormingAction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado.')

  const petId = String(formData.get('pet_id') || '')
  const catalogId = String(formData.get('catalog_id') || '')
  const customName = String(formData.get('custom_dewormer_name') || '').trim()
  const customCategory = String(formData.get('custom_category') || '').trim()
  const appliedDate = String(formData.get('applied_date') || '')
  const nextDueDate = String(formData.get('next_due_date') || '') || null
  const veterinarianName = clean(formData.get('veterinarian_name'))
  const clinicName = clean(formData.get('clinic_name'))
  const notes = clean(formData.get('notes'))

  if (!petId || !appliedDate) throw new Error('Faltan datos obligatorios.')

  const { data: pet } = await supabase
    .from('pets')
    .select('id')
    .eq('id', petId)
    .eq('primary_tutor_profile_id', user.id)
    .single()

  if (!pet) throw new Error('No tienes permiso para modificar esta mascota.')

  let dewormerName = customName
  let brand: string | null = null
  let category: string | null = customCategory || null
  let finalCatalogId: string | null = catalogId || null

  if (catalogId && catalogId !== 'other') {
    const { data: catalogItem } = await supabase
      .from('medical_dewormer_catalog')
      .select('id, name, brand, category')
      .eq('id', catalogId)
      .single()

    if (catalogItem) {
      dewormerName = catalogItem.name
      brand = catalogItem.brand
      category = catalogItem.category
      finalCatalogId = catalogItem.id
    }
  } else {
    finalCatalogId = null
  }

  if (!dewormerName) {
    throw new Error('Selecciona un desparasitante o escribe uno personalizado.')
  }

  const { error } = await supabase.from('pet_dewormings').insert({
    pet_id: petId,
    catalog_id: finalCatalogId,
    dewormer_name: dewormerName,
    brand,
    category,
    applied_date: appliedDate,
    next_due_date: nextDueDate,
    veterinarian_name: veterinarianName,
    clinic_name: clinicName,
    notes,
    created_by_profile_id: user.id,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/pets/${petId}/medical`)
}
export async function addMedicalVisitAction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado.')

  const petId = String(formData.get('pet_id') || '')
  const visitDate = String(formData.get('visit_date') || '')
  const reason = String(formData.get('reason') || '').trim()

  if (!petId || !visitDate || !reason) {
    throw new Error('Faltan datos obligatorios.')
  }

  const { data: pet } = await supabase
    .from('pets')
    .select('id')
    .eq('id', petId)
    .eq('primary_tutor_profile_id', user.id)
    .single()

  if (!pet) throw new Error('No tienes permiso para modificar esta mascota.')

  const weightRaw = String(formData.get('weight_kg') || '').trim()
  const temperatureRaw = String(formData.get('temperature_c') || '').trim()

  const { error } = await supabase.from('pet_medical_visits').insert({
    pet_id: petId,
    visit_date: visitDate,
    reason,
    diagnosis: clean(formData.get('diagnosis')),
    treatment: clean(formData.get('treatment')),
    prescription: clean(formData.get('prescription')),
    notes: clean(formData.get('notes')),
    weight_kg: weightRaw ? Number(weightRaw) : null,
    temperature_c: temperatureRaw ? Number(temperatureRaw) : null,
    veterinarian_name: clean(formData.get('veterinarian_name')),
    clinic_name: clean(formData.get('clinic_name')),
    created_by_profile_id: user.id,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/pets/${petId}/medical`)
}
export async function addMedicalDocumentAction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado.')

  const petId = String(formData.get('pet_id') || '')
  const documentType = String(formData.get('document_type') || '').trim()
  const title = String(formData.get('title') || '').trim()
  const fileUrl = String(formData.get('file_url') || '').trim()
  const notes = clean(formData.get('notes'))

  if (!petId || !documentType || !title || !fileUrl) {
    throw new Error('Faltan datos obligatorios del documento.')
  }

  const { data: pet } = await supabase
    .from('pets')
    .select('id')
    .eq('id', petId)
    .eq('primary_tutor_profile_id', user.id)
    .single()

  if (!pet) {
    throw new Error('No tienes permiso para modificar esta mascota.')
  }

  const { error } = await supabase.from('pet_medical_documents').insert({
    pet_id: petId,
    document_type: documentType,
    title,
    file_url: fileUrl,
    notes,
    uploaded_by_profile_id: user.id,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/pets/${petId}/medical`)
}

export async function deleteMedicalDocumentAction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado.')

  const documentId = String(formData.get('document_id') || '')

  if (!documentId) throw new Error('Falta el documento.')

  const { data: document, error: documentError } = await supabase
    .from('pet_medical_documents')
    .select('id, pet_id, file_url')
    .eq('id', documentId)
    .single()

  if (documentError || !document) {
    throw new Error('No se encontró el documento.')
  }

  const { data: pet } = await supabase
    .from('pets')
    .select('id')
    .eq('id', document.pet_id)
    .eq('primary_tutor_profile_id', user.id)
    .single()

  if (!pet) {
    throw new Error('No tienes permiso para eliminar este documento.')
  }

  const { error: storageError } = await supabase.storage
    .from('pet-medical-documents')
    .remove([document.file_url])

  if (storageError) {
    throw new Error(storageError.message)
  }

  const { error: deleteError } = await supabase
    .from('pet_medical_documents')
    .delete()
    .eq('id', documentId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  revalidatePath(`/dashboard/pets/${document.pet_id}/medical`)
}

export async function dismissMedicalReminderAction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado.')

  const reminderId = String(formData.get('reminder_id') || '')

  if (!reminderId) {
    throw new Error('Falta el recordatorio.')
  }

  const { data: reminder, error: reminderError } = await supabase
    .from('pet_reminders')
    .select('id, pet_id, recipient_profile_id')
    .eq('id', reminderId)
    .eq('recipient_profile_id', user.id)
    .single()

  if (reminderError || !reminder) {
    throw new Error('No se encontró el recordatorio o no tienes permiso.')
  }

  const { error } = await supabase
    .from('pet_reminders')
    .update({
      status: 'dismissed',
      dismissed_at: new Date().toISOString(),
    })
    .eq('id', reminderId)
    .eq('recipient_profile_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/dashboard/pets/${reminder.pet_id}/medical`)
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  return text.length > 0 ? text : null
}