import { createClient } from '@/lib/supabase/server'

export async function getTutorPetById(profileId: string, petId: string) {
  const supabase = await createClient()

  const { data: pet, error } = await supabase
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
      medical_alerts,
      status,
      profile_photo_url,
      pet_public_settings (
        pet_id,
        show_pet_name,
        show_profile_photo,
        show_species,
        show_breed,
        show_sex,
        show_age,
        show_microchip,
        show_medical_alerts,
        show_primary_tutor_phone,
        show_whatsapp_button,
        show_emergency_contacts,
        show_last_seen_info_when_lost,
        show_map_when_lost
      ),
      pet_onboarding_vet_interest (
        id,
        clinic_name,
        phone,
        state,
        municipality
      ),
      pet_photos (
        id,
        file_url,
        is_cover,
        sort_order
      )
    `)
    .eq('id', petId)
    .eq('primary_tutor_profile_id', profileId)
    .single()

  if (error || !pet) return null

  return pet
}