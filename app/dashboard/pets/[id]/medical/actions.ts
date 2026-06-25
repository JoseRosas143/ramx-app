'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    if (weightRaw) {
  await supabase
    .from('pet_medical_profiles')
    .upsert(
      {
        pet_id: petId,
        weight_kg: Number(weightRaw),
      },
      { onConflict: 'pet_id' }
    )
}

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
    .select('id, name')
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

  const { data: insertedVaccination, error } = await supabase
    .from('pet_vaccinations')
    .insert({
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
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  if (nextDueDate && insertedVaccination?.id) {
    await createMedicalReminder({
      petId,
      recipientProfileId: user.id,
      petName: pet.name,
      sourceTable: 'pet_vaccinations',
      sourceId: insertedVaccination.id,
      reminderKind: 'vaccination_due',
      itemName: vaccineName,
      nextDueDate,
    })
  }

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
    .select('id, name')
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

  const { data: insertedDeworming, error } = await supabase
    .from('pet_dewormings')
    .insert({
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
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  if (nextDueDate && insertedDeworming?.id) {
    await createMedicalReminder({
      petId,
      recipientProfileId: user.id,
      petName: pet.name,
      sourceTable: 'pet_dewormings',
      sourceId: insertedDeworming.id,
      reminderKind: 'deworming_due',
      itemName: dewormerName,
      nextDueDate,
    })
  }

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
    if (weightRaw || temperatureRaw) {
  await supabase
    .from('pet_medical_profiles')
    .upsert(
      {
        pet_id: petId,
        weight_kg: weightRaw ? Number(weightRaw) : undefined,
      },
      { onConflict: 'pet_id' }
    )
}

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
    .select('id, pet_id, recipient_profile_id, meta')
    .eq('id', reminderId)
    .eq('recipient_profile_id', user.id)
    .single()

  if (reminderError || !reminder) {
    throw new Error('No se encontró el recordatorio o no tienes permiso.')
  }

  const now = new Date().toISOString()
  const currentMeta = getMetaObject(reminder.meta)

  const { error } = await supabase
    .from('pet_reminders')
    .update({
      status: 'dismissed',
      dismissed_at: now,
      meta: {
        ...currentMeta,
        resolved_action: 'dismissed',
        dismissed_from_medical_panel_at: now,
      },
    })
    .eq('id', reminderId)
    .eq('recipient_profile_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: now,
      archived_at: now,
    })
    .eq('recipient_profile_id', user.id)
    .contains('meta', {
      reminder_id: reminderId,
    })

  revalidatePath(`/dashboard/pets/${reminder.pet_id}/medical`)
  revalidatePath('/dashboard')
}

export async function markMedicalReminderAppliedAction(formData: FormData) {
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
    .select('id, pet_id, recipient_profile_id, meta')
    .eq('id', reminderId)
    .eq('recipient_profile_id', user.id)
    .single()

  if (reminderError || !reminder) {
    throw new Error('No se encontró el recordatorio o no tienes permiso.')
  }

  const now = new Date().toISOString()
  const currentMeta = getMetaObject(reminder.meta)

  const { error } = await supabase
    .from('pet_reminders')
    .update({
      status: 'dismissed',
      dismissed_at: now,
      meta: {
        ...currentMeta,
        resolved_action: 'applied',
        applied_from_reminder_at: now,
      },
    })
    .eq('id', reminderId)
    .eq('recipient_profile_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: now,
      archived_at: now,
    })
    .eq('recipient_profile_id', user.id)
    .contains('meta', {
      reminder_id: reminderId,
    })

  revalidatePath(`/dashboard/pets/${reminder.pet_id}/medical`)
  revalidatePath('/dashboard')
}
export async function deleteVaccinationAction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado.')

  const vaccinationId = String(formData.get('record_id') || '')

  if (!vaccinationId) {
    throw new Error('Falta el registro de vacuna.')
  }

  const { data: vaccination, error: vaccinationError } = await supabase
    .from('pet_vaccinations')
    .select('id, pet_id')
    .eq('id', vaccinationId)
    .single()

  if (vaccinationError || !vaccination) {
    throw new Error('No se encontró la vacuna.')
  }

  const { data: pet } = await supabase
    .from('pets')
    .select('id')
    .eq('id', vaccination.pet_id)
    .eq('primary_tutor_profile_id', user.id)
    .single()

  if (!pet) {
    throw new Error('No tienes permiso para eliminar este registro.')
  }

  const admin = createAdminClient()

  await admin
    .from('pet_reminders')
    .delete()
    .eq('source_table', 'pet_vaccinations')
    .eq('source_id', vaccinationId)

  const { error } = await admin
    .from('pet_vaccinations')
    .delete()
    .eq('id', vaccinationId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/dashboard/pets/${vaccination.pet_id}/medical`)
  revalidatePath('/dashboard')
}

export async function deleteDewormingAction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado.')

  const dewormingId = String(formData.get('record_id') || '')

  if (!dewormingId) {
    throw new Error('Falta el registro de desparasitación.')
  }

  const { data: deworming, error: dewormingError } = await supabase
    .from('pet_dewormings')
    .select('id, pet_id')
    .eq('id', dewormingId)
    .single()

  if (dewormingError || !deworming) {
    throw new Error('No se encontró la desparasitación.')
  }

  const { data: pet } = await supabase
    .from('pets')
    .select('id')
    .eq('id', deworming.pet_id)
    .eq('primary_tutor_profile_id', user.id)
    .single()

  if (!pet) {
    throw new Error('No tienes permiso para eliminar este registro.')
  }

  const admin = createAdminClient()

  await admin
    .from('pet_reminders')
    .delete()
    .eq('source_table', 'pet_dewormings')
    .eq('source_id', dewormingId)

  const { error } = await admin
    .from('pet_dewormings')
    .delete()
    .eq('id', dewormingId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/dashboard/pets/${deworming.pet_id}/medical`)
  revalidatePath('/dashboard')
}

export async function deleteMedicalVisitAction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado.')

  const visitId = String(formData.get('record_id') || '')

  if (!visitId) {
    throw new Error('Falta la consulta clínica.')
  }

  const { data: visit, error: visitError } = await supabase
    .from('pet_medical_visits')
    .select('id, pet_id')
    .eq('id', visitId)
    .single()

  if (visitError || !visit) {
    throw new Error('No se encontró la consulta.')
  }

  const { data: pet } = await supabase
    .from('pets')
    .select('id')
    .eq('id', visit.pet_id)
    .eq('primary_tutor_profile_id', user.id)
    .single()

  if (!pet) {
    throw new Error('No tienes permiso para eliminar esta consulta.')
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('pet_medical_visits')
    .delete()
    .eq('id', visitId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/dashboard/pets/${visit.pet_id}/medical`)
}

export async function updateMedicalDocumentAction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado.')

  const documentId = String(formData.get('document_id') || '')
  const documentType = String(formData.get('document_type') || '').trim()
  const title = String(formData.get('title') || '').trim()
  const notes = clean(formData.get('notes'))

  if (!documentId || !documentType || !title) {
    throw new Error('Faltan datos del documento.')
  }

  const { data: document, error: documentError } = await supabase
    .from('pet_medical_documents')
    .select('id, pet_id')
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
    throw new Error('No tienes permiso para editar este documento.')
  }

  const { error } = await supabase
    .from('pet_medical_documents')
    .update({
      document_type: documentType,
      title,
      notes,
    })
    .eq('id', documentId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/dashboard/pets/${document.pet_id}/medical`)
}

export async function updateVaccinationAction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado.')

  const vaccinationId = String(formData.get('record_id') || '')
  const vaccineName = String(formData.get('vaccine_name') || '').trim()
  const brand = clean(formData.get('brand'))
  const appliedDate = String(formData.get('applied_date') || '')
  const nextDueDate = clean(formData.get('next_due_date'))
  const batchNumber = clean(formData.get('batch_number'))
  const veterinarianName = clean(formData.get('veterinarian_name'))
  const clinicName = clean(formData.get('clinic_name'))
  const notes = clean(formData.get('notes'))

  if (!vaccinationId || !vaccineName || !appliedDate) {
    throw new Error('Faltan datos obligatorios de la vacuna.')
  }

  const { data: vaccination, error: vaccinationError } = await supabase
    .from('pet_vaccinations')
    .select('id, pet_id')
    .eq('id', vaccinationId)
    .single()

  if (vaccinationError || !vaccination) {
    throw new Error('No se encontró la vacuna.')
  }

  const { data: pet } = await supabase
    .from('pets')
    .select('id, name')
    .eq('id', vaccination.pet_id)
    .eq('primary_tutor_profile_id', user.id)
    .single()

  if (!pet) {
    throw new Error('No tienes permiso para editar esta vacuna.')
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('pet_vaccinations')
    .update({
      catalog_id: null,
      vaccine_name: vaccineName,
      brand,
      applied_date: appliedDate,
      next_due_date: nextDueDate,
      batch_number: batchNumber,
      veterinarian_name: veterinarianName,
      clinic_name: clinicName,
      notes,
    })
    .eq('id', vaccinationId)

  if (error) {
    throw new Error(error.message)
  }

  await syncMedicalReminderForSource({
    petId: vaccination.pet_id,
    recipientProfileId: user.id,
    petName: pet.name,
    sourceTable: 'pet_vaccinations',
    sourceId: vaccinationId,
    reminderKind: 'vaccination_due',
    itemName: vaccineName,
    nextDueDate,
  })

  revalidatePath(`/dashboard/pets/${vaccination.pet_id}/medical`)
  revalidatePath('/dashboard')
}

export async function updateDewormingAction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado.')

  const dewormingId = String(formData.get('record_id') || '')
  const dewormerName = String(formData.get('dewormer_name') || '').trim()
  const brand = clean(formData.get('brand'))
  const category = clean(formData.get('category'))
  const appliedDate = String(formData.get('applied_date') || '')
  const nextDueDate = clean(formData.get('next_due_date'))
  const veterinarianName = clean(formData.get('veterinarian_name'))
  const clinicName = clean(formData.get('clinic_name'))
  const notes = clean(formData.get('notes'))

  if (!dewormingId || !dewormerName || !appliedDate) {
    throw new Error('Faltan datos obligatorios de la desparasitación.')
  }

  const { data: deworming, error: dewormingError } = await supabase
    .from('pet_dewormings')
    .select('id, pet_id')
    .eq('id', dewormingId)
    .single()

  if (dewormingError || !deworming) {
    throw new Error('No se encontró la desparasitación.')
  }

  const { data: pet } = await supabase
    .from('pets')
    .select('id, name')
    .eq('id', deworming.pet_id)
    .eq('primary_tutor_profile_id', user.id)
    .single()

  if (!pet) {
    throw new Error('No tienes permiso para editar esta desparasitación.')
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('pet_dewormings')
    .update({
      catalog_id: null,
      dewormer_name: dewormerName,
      brand,
      category,
      applied_date: appliedDate,
      next_due_date: nextDueDate,
      veterinarian_name: veterinarianName,
      clinic_name: clinicName,
      notes,
    })
    .eq('id', dewormingId)

  if (error) {
    throw new Error(error.message)
  }

  await syncMedicalReminderForSource({
    petId: deworming.pet_id,
    recipientProfileId: user.id,
    petName: pet.name,
    sourceTable: 'pet_dewormings',
    sourceId: dewormingId,
    reminderKind: 'deworming_due',
    itemName: dewormerName,
    nextDueDate,
  })

  revalidatePath(`/dashboard/pets/${deworming.pet_id}/medical`)
  revalidatePath('/dashboard')
}

export async function updateMedicalVisitAction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado.')

  const visitId = String(formData.get('record_id') || '')
  const visitDate = String(formData.get('visit_date') || '')
  const reason = String(formData.get('reason') || '').trim()
  const diagnosis = clean(formData.get('diagnosis'))
  const treatment = clean(formData.get('treatment'))
  const prescription = clean(formData.get('prescription'))
  const notes = clean(formData.get('notes'))
  const weightRaw = String(formData.get('weight_kg') || '').trim()
  const temperatureRaw = String(formData.get('temperature_c') || '').trim()
  const veterinarianName = clean(formData.get('veterinarian_name'))
  const clinicName = clean(formData.get('clinic_name'))

  if (!visitId || !visitDate || !reason) {
    throw new Error('Faltan datos obligatorios de la consulta.')
  }

  const { data: visit, error: visitError } = await supabase
    .from('pet_medical_visits')
    .select('id, pet_id')
    .eq('id', visitId)
    .single()

  if (visitError || !visit) {
    throw new Error('No se encontró la consulta.')
  }

  const { data: pet } = await supabase
    .from('pets')
    .select('id')
    .eq('id', visit.pet_id)
    .eq('primary_tutor_profile_id', user.id)
    .single()

  if (!pet) {
    throw new Error('No tienes permiso para editar esta consulta.')
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('pet_medical_visits')
    .update({
      visit_date: visitDate,
      reason,
      diagnosis,
      treatment,
      prescription,
      notes,
      weight_kg: weightRaw ? Number(weightRaw) : null,
      temperature_c: temperatureRaw ? Number(temperatureRaw) : null,
      veterinarian_name: veterinarianName,
      clinic_name: clinicName,
    })
    .eq('id', visitId)

  if (error) {
    throw new Error(error.message)
  }

  if (weightRaw) {
    await admin
      .from('pet_medical_profiles')
      .upsert(
        {
          pet_id: visit.pet_id,
          weight_kg: Number(weightRaw),
        },
        { onConflict: 'pet_id' }
      )
  }

  revalidatePath(`/dashboard/pets/${visit.pet_id}/medical`)
  revalidatePath('/dashboard')
}

type ReminderSyncInput = {
  petId: string
  recipientProfileId: string
  petName: string
  sourceTable: 'pet_vaccinations' | 'pet_dewormings'
  sourceId: string
  reminderKind: 'vaccination_due' | 'deworming_due'
  itemName: string
  nextDueDate: string | null
}

async function syncMedicalReminderForSource({
  petId,
  recipientProfileId,
  petName,
  sourceTable,
  sourceId,
  reminderKind,
  itemName,
  nextDueDate,
}: ReminderSyncInput) {
  const admin = createAdminClient()

  if (!nextDueDate) {
    await admin
      .from('pet_reminders')
      .delete()
      .eq('source_table', sourceTable)
      .eq('source_id', sourceId)

    return
  }

  const dueDate = normalizeDate(nextDueDate)

  if (!dueDate) return

  const reminderDate = subtractDays(dueDate, 7)
  const isVaccine = reminderKind === 'vaccination_due'

  const title = isVaccine
    ? `Vacuna próxima para ${petName}`
    : `Desparasitación próxima para ${petName}`

  const body = isVaccine
    ? `${petName} tiene programada la próxima vacuna: ${itemName}.`
    : `${petName} tiene programada la próxima desparasitación: ${itemName}.`

  const { data: existingReminder } = await admin
    .from('pet_reminders')
    .select('id, meta')
    .eq('source_table', sourceTable)
    .eq('source_id', sourceId)
    .maybeSingle()

  const currentMeta = getMetaObject(existingReminder?.meta)

  const payload = {
    pet_id: petId,
    recipient_profile_id: recipientProfileId,
    reminder_kind: reminderKind,
    title,
    body,
    due_date: dueDate,
    reminder_date: reminderDate,
    status: 'pending',
    email_sent_at: null,
    dismissed_at: null,
    meta: {
      ...currentMeta,
      item_name: itemName,
      updated_from: 'medical_record_edit',
      next_due_date: dueDate,
      reminder_days_before: 7,
    },
  }

  if (existingReminder?.id) {
    await admin
      .from('pet_reminders')
      .update(payload)
      .eq('id', existingReminder.id)

    return
  }

  await admin.from('pet_reminders').insert({
    ...payload,
    source_table: sourceTable,
    source_id: sourceId,
  })
}

type MedicalReminderKind = 'vaccination_due' | 'deworming_due'

type CreateMedicalReminderInput = {
  petId: string
  recipientProfileId: string
  petName: string
  sourceTable: 'pet_vaccinations' | 'pet_dewormings'
  sourceId: string
  reminderKind: MedicalReminderKind
  itemName: string
  nextDueDate: string
}

async function createMedicalReminder({
  petId,
  recipientProfileId,
  petName,
  sourceTable,
  sourceId,
  reminderKind,
  itemName,
  nextDueDate,
}: CreateMedicalReminderInput) {
  const dueDate = normalizeDate(nextDueDate)

  if (!dueDate) return

  const admin = createAdminClient()
  const reminderDate = subtractDays(dueDate, 7)
  const isVaccine = reminderKind === 'vaccination_due'

  const title = isVaccine
    ? `Vacuna próxima para ${petName}`
    : `Desparasitación próxima para ${petName}`

  const body = isVaccine
    ? `${petName} tiene programada la próxima vacuna: ${itemName}.`
    : `${petName} tiene programada la próxima desparasitación: ${itemName}.`

  const { error } = await admin.from('pet_reminders').insert({
    pet_id: petId,
    recipient_profile_id: recipientProfileId,
    reminder_kind: reminderKind,
    title,
    body,
    due_date: dueDate,
    reminder_date: reminderDate,
    status: 'pending',
    source_table: sourceTable,
    source_id: sourceId,
    meta: {
      item_name: itemName,
      created_from: 'medical_record',
      reminder_days_before: 7,
    },
  })

  if (error) {
    console.error('RAMX create medical reminder error:', error.message)
  }
}

function normalizeDate(value: string) {
  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) return null

  return date.toISOString().slice(0, 10)
}

function subtractDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`)
  date.setDate(date.getDate() - days)

  return date.toISOString().slice(0, 10)
}

function getMetaObject(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  return text.length > 0 ? text : null
}