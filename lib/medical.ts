import { createClient } from '@/lib/supabase/server'

export async function getPetMedicalRecord(profileId: string, petId: string) {
  const supabase = await createClient()

  const { data: pet, error: petError } = await supabase
    .from('pets')
    .select(`
      id,
      primary_tutor_profile_id,
      name,
      species,
      breed,
      sex,
      color,
      birth_date,
      microchip_number,
      internal_id,
      public_slug,
      profile_photo_url,
      medical_alerts
    `)
    .eq('id', petId)
    .eq('primary_tutor_profile_id', profileId)
    .single()

  if (petError || !pet) {
    return null
  }

  const [
    medicalProfileResult,
    vaccinationsResult,
    dewormingsResult,
    visitsResult,
    documentsResult,
    vaccineCatalogResult,
    dewormerCatalogResult,
  ] = await Promise.all([
    supabase
      .from('pet_medical_profiles')
      .select('*')
      .eq('pet_id', petId)
      .maybeSingle(),

    supabase
      .from('pet_vaccinations')
      .select('*')
      .eq('pet_id', petId)
      .order('applied_date', { ascending: false }),

    supabase
      .from('pet_dewormings')
      .select('*')
      .eq('pet_id', petId)
      .order('applied_date', { ascending: false }),

    supabase
      .from('pet_medical_visits')
      .select('*')
      .eq('pet_id', petId)
      .order('visit_date', { ascending: false }),

    supabase
      .from('pet_medical_documents')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false }),

    supabase
      .from('medical_vaccine_catalog')
      .select('*')
      .eq('is_active', true)
      .order('species', { ascending: true })
      .order('category', { ascending: true })
      .order('name', { ascending: true }),

    supabase
      .from('medical_dewormer_catalog')
      .select('*')
      .eq('is_active', true)
      .order('species', { ascending: true })
      .order('category', { ascending: true })
      .order('name', { ascending: true }),
  ])

  return {
    pet,
    medicalProfile: medicalProfileResult.data,
    vaccinations: vaccinationsResult.data || [],
    dewormings: dewormingsResult.data || [],
    visits: visitsResult.data || [],
    documents: documentsResult.data || [],
    vaccineCatalog: vaccineCatalogResult.data || [],
    dewormerCatalog: dewormerCatalogResult.data || [],
  }
}