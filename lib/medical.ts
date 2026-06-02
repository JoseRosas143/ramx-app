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
    remindersResult,
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
      .from('pet_reminders')
      .select('*')
      .eq('pet_id', petId)
      .eq('recipient_profile_id', profileId)
      .in('status', ['pending', 'failed'])
      .order('due_date', { ascending: true }),

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
  const documentsWithSignedUrls = await Promise.all(
    (documentsResult.data || []).map(async (doc: any) => {
      const { data } = await supabase.storage
        .from('pet-medical-documents')
        .createSignedUrl(doc.file_url, 60 * 10)

      return {
        ...doc,
        signed_url: data?.signedUrl || null,
      }
    })
  )
  return {
    pet,
    medicalProfile: medicalProfileResult.data,
    vaccinations: vaccinationsResult.data || [],
    dewormings: dewormingsResult.data || [],
    visits: visitsResult.data || [],
    documents: documentsWithSignedUrls,
    reminders: remindersResult.data || [],
    vaccineCatalog: vaccineCatalogResult.data || [],
    dewormerCatalog: dewormerCatalogResult.data || [],
    
  }
}