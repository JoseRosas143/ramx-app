import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getPublicPetBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_public_pet_profile', {
    p_slug: slug,
  })

  if (error || !data || data.length === 0) return null

  const basePet = data[0]
  const petId = basePet.pet_id || basePet.id

  if (!petId) return null

  const admin = createAdminClient()

  const [
    petResult,
    settingsResult,
    vetResult,
    photosResult,
    activeLostReportResult,
    sightingsResult,
  ] = await Promise.all([
    admin
      .from('pets')
      .select(`
        id,
        name,
        species,
        breed,
        sex,
        color,
        birth_date,
        microchip_number,
        internal_id,
        public_slug,
        status,
        profile_photo_url,
        medical_alerts
      `)
      .eq('id', petId)
      .maybeSingle(),

    admin
      .from('pet_public_settings')
      .select(`
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
      `)
      .eq('pet_id', petId)
      .maybeSingle(),

    admin
      .from('pet_onboarding_vet_interest')
      .select(`
        id,
        clinic_name,
        phone,
        state,
        municipality
      `)
      .eq('pet_id', petId)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle(),

    admin
      .from('pet_photos')
      .select('id, file_url, is_cover, sort_order')
      .eq('pet_id', petId)
      .order('sort_order', { ascending: true }),

    admin
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

    admin
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
  ])

  const pet = petResult.data
  const settings = settingsResult.data
  const vet = vetResult.data
  const photos = photosResult.data || []
  const activeLostReport = activeLostReportResult.data
  const sightings = sightingsResult.data || []

  return {
    ...basePet,

    pet_id: petId,

    name: pet?.name ?? basePet.name ?? null,
    species: pet?.species ?? basePet.species ?? null,
    breed: pet?.breed ?? basePet.breed ?? null,
    sex: pet?.sex ?? basePet.sex ?? null,
    color: pet?.color ?? basePet.color ?? null,
    birth_date: pet?.birth_date ?? basePet.birth_date ?? null,
    microchip_number: pet?.microchip_number ?? basePet.microchip_number ?? null,
    internal_id: pet?.internal_id ?? basePet.internal_id ?? null,
    public_slug: pet?.public_slug ?? basePet.public_slug ?? slug,
    status: pet?.status ?? basePet.status ?? null,
    profile_photo_url:
      pet?.profile_photo_url ?? basePet.profile_photo_url ?? null,

    medical_alerts:
      pet?.medical_alerts ?? basePet.medical_alerts ?? null,

    show_pet_name:
      settings?.show_pet_name ?? basePet.show_pet_name ?? true,
    show_profile_photo:
      settings?.show_profile_photo ?? basePet.show_profile_photo ?? true,
    show_species:
      settings?.show_species ?? basePet.show_species ?? true,
    show_breed:
      settings?.show_breed ?? basePet.show_breed ?? true,
    show_sex:
      settings?.show_sex ?? basePet.show_sex ?? true,
    show_age:
      settings?.show_age ?? basePet.show_age ?? true,
    show_microchip:
      settings?.show_microchip ?? basePet.show_microchip ?? true,
    show_medical_alerts:
      settings?.show_medical_alerts ?? basePet.show_medical_alerts ?? true,
    show_primary_tutor_phone:
      settings?.show_primary_tutor_phone ??
      basePet.show_primary_tutor_phone ??
      false,
    show_whatsapp_button:
      settings?.show_whatsapp_button ??
      basePet.show_whatsapp_button ??
      false,
    show_emergency_contacts:
      settings?.show_emergency_contacts ??
      basePet.show_emergency_contacts ??
      false,
    show_last_seen_info_when_lost:
      settings?.show_last_seen_info_when_lost ??
      basePet.show_last_seen_info_when_lost ??
      true,
    show_map_when_lost:
      settings?.show_map_when_lost ??
      basePet.show_map_when_lost ??
      true,

    vet_clinic_name:
      vet?.clinic_name ?? basePet.vet_clinic_name ?? null,
    vet_phone:
      vet?.phone ?? basePet.vet_phone ?? null,
    vet_state:
      vet?.state ?? basePet.vet_state ?? null,
    vet_municipality:
      vet?.municipality ?? basePet.vet_municipality ?? null,

    photos,

    active_lost_at:
      activeLostReport?.lost_at ?? basePet.active_lost_at ?? null,
    active_poster_image_url:
      activeLostReport?.poster_image_url ??
      basePet.active_poster_image_url ??
      null,
    active_lost_lat:
      activeLostReport?.lat ?? basePet.active_lost_lat ?? null,
    active_lost_lng:
      activeLostReport?.lng ?? basePet.active_lost_lng ?? null,
    active_radius_km:
      activeLostReport?.radius_km ?? basePet.active_radius_km ?? null,
    active_last_seen_text:
      activeLostReport?.last_seen_text ??
      basePet.active_last_seen_text ??
      null,
    active_reward_text:
      activeLostReport?.reward_text ??
      basePet.active_reward_text ??
      null,
    active_circumstances:
      activeLostReport?.circumstances ??
      basePet.active_circumstances ??
      null,
    active_public_contact_instructions:
      activeLostReport?.public_contact_instructions ??
      basePet.active_public_contact_instructions ??
      null,

    map_sightings: sightings,
  }
}