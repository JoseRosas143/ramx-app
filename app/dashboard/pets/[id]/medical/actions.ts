'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addVaccinationAction(formData: FormData) {
const supabase = await createClient()

const {
data: { user },
} = await supabase.auth.getUser()

if (!user) {
throw new Error('No autenticado.')
}

const petId = String(formData.get('pet_id') || '')
const catalogId = String(formData.get('catalog_id') || '')
const customName = String(formData.get('custom_vaccine_name') || '').trim()
const appliedDate = String(formData.get('applied_date') || '')
const nextDueDate = String(formData.get('next_due_date') || '') || null
const batchNumber = String(formData.get('batch_number') || '').trim() || null
const veterinarianName = String(formData.get('veterinarian_name') || '').trim() || null
const clinicName = String(formData.get('clinic_name') || '').trim() || null
const notes = String(formData.get('notes') || '').trim() || null

if (!petId || !appliedDate) {
throw new Error('Faltan datos obligatorios.')
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

if (error) {
throw new Error(error.message)
}

revalidatePath(`/dashboard/pets/${petId}/medical`)
} 