import { createAdminClient } from '@/lib/supabase/admin'

export async function getPublicPetBySlug(slug: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('get_public_pet_profile', {
    p_slug: slug,
  })

  if (error || !data || data.length === 0) {
    console.error('RAMX public pet profile error:', error?.message)
    return null
  }

  const pet = data[0]
  const petId = pet.pet_id

  const [
    photosResult,
    activeLostReportResult,
    sightingsResult,
    medicalProfileResult,
    vaccinationsResult,
    dewormingsResult,
    visitsResult,
    documentsResult,
  ] = await Promise.all([
    supabase
      .from('pet_photos')
      .select('id, file_url, is_cover, sort_order')
      .eq('pet_id', petId)
      .order('sort_order', { ascending: true }),

    supabase
      .from('lost_reports')
      .select(`
        id,
        status,
        lost_at,
        last_seen_text,
        reward_text,
        circumstances,
        public_contact_instructions,
        poster_image_url,
        lat,
        lng,
        radius_km,
        created_at,
        closed_at
      `)
      .eq('pet_id', petId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from('sightings')
      .select(`
        id,
        report_type,
        reporter_name,
        seen_at,
        location_text,
        notes,
        status,
        lat,
        lng,
        created_at
      `)
      .eq('pet_id', petId)
      .neq('status', 'archived')
      .order('seen_at', { ascending: false }),

    supabase
      .from('pet_medical_profiles')
      .select(`
        weight_kg,
        blood_type,
        allergies,
        chronic_conditions,
        current_medications,
        special_care_notes,
        emergency_notes,
        primary_vet_name,
        primary_vet_clinic,
        primary_vet_phone
      `)
      .eq('pet_id', petId)
      .maybeSingle(),

    supabase
      .from('pet_vaccinations')
      .select(`
        id,
        vaccine_name,
        brand,
        applied_date,
        next_due_date,
        veterinarian_name,
        clinic_name,
        notes
      `)
      .eq('pet_id', petId)
      .order('applied_date', { ascending: false })
      .limit(5),

    supabase
      .from('pet_dewormings')
      .select(`
        id,
        dewormer_name,
        brand,
        category,
        applied_date,
        next_due_date,
        veterinarian_name,
        clinic_name,
        notes
      `)
      .eq('pet_id', petId)
      .order('applied_date', { ascending: false })
      .limit(5),

    supabase
      .from('pet_medical_visits')
      .select(`
        id,
        visit_date,
        reason,
        diagnosis,
        treatment,
        weight_kg,
        temperature_c,
        veterinarian_name,
        clinic_name,
        notes
      `)
      .eq('pet_id', petId)
      .order('visit_date', { ascending: false })
      .limit(3),

    supabase
      .from('pet_medical_documents')
      .select(`
        id,
        document_type,
        title,
        notes,
        created_at
      `)
      .eq('pet_id', petId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (photosResult.error) {
    console.error('RAMX public photos error:', photosResult.error.message)
  }

  if (medicalProfileResult.error) {
    console.error(
      'RAMX public medical profile error:',
      medicalProfileResult.error.message
    )
  }

  if (vaccinationsResult.error) {
    console.error(
      'RAMX public vaccinations error:',
      vaccinationsResult.error.message
    )
  }

  if (dewormingsResult.error) {
    console.error(
      'RAMX public dewormings error:',
      dewormingsResult.error.message
    )
  }

  if (visitsResult.error) {
    console.error('RAMX public visits error:', visitsResult.error.message)
  }

  if (documentsResult.error) {
    console.error(
      'RAMX public documents error:',
      documentsResult.error.message
    )
  }

  const activeLostReport = activeLostReportResult.data || null
  const photos = photosResult.data || []

  return {
    ...pet,

    photos,

    active_poster_image_url:
      activeLostReport?.poster_image_url ?? pet.active_poster_image_url ?? null,

    active_lost_at:
      activeLostReport?.lost_at ?? pet.active_lost_at ?? null,

    active_last_seen_text:
      activeLostReport?.last_seen_text ?? pet.active_last_seen_text ?? null,

    active_reward_text:
      activeLostReport?.reward_text ?? pet.active_reward_text ?? null,

    active_circumstances:
      activeLostReport?.circumstances ?? pet.active_circumstances ?? null,

    active_public_contact_instructions:
      activeLostReport?.public_contact_instructions ??
      pet.active_public_contact_instructions ??
      null,

    active_lost_lat: activeLostReport?.lat ?? null,
    active_lost_lng: activeLostReport?.lng ?? null,
    active_radius_km: activeLostReport?.radius_km ?? null,

    map_sightings: sightingsResult.data || [],

    public_medical: {
      profile: medicalProfileResult.data || null,
      vaccinations: vaccinationsResult.data || [],
      dewormings: dewormingsResult.data || [],
      visits: visitsResult.data || [],
      documents: documentsResult.data || [],
    },
  }
}