import { createClient } from '@/lib/supabase/server'

export async function getTutorPets(profileId: string) {
  const supabase = await createClient()

  const { data: pets, error } = await supabase
    .from('pets')
    .select(`
      id,
      name,
      species,
      breed,
      sex,
      color,
      status,
      public_slug,
      microchip_number,
      internal_id,
      profile_photo_url,
      created_at,
      lost_reports (
        id,
        status,
        lost_at,
        last_seen_text,
        lat,
        lng,
        radius_km,
        reward_text,
        circumstances,
        public_contact_instructions,
        poster_image_url,
        closed_at,
        created_at,
        updated_at
      )
    `)
    .eq('primary_tutor_profile_id', profileId)
    .order('created_at', { ascending: false })

  if (error || !pets) {
    console.error('getTutorPets error:', error)
    return []
  }

  const petIds = pets.map((pet) => pet.id)

  const { data: sightings, error: sightingsError } =
    petIds.length > 0
      ? await supabase
          .from('sightings')
          .select(`
            id,
            pet_id,
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
          .in('pet_id', petIds)
          .neq('status', 'archived')
          .order('seen_at', { ascending: false })
      : { data: [], error: null }

  if (sightingsError) {
    console.error('getTutorPets sightings error:', sightingsError)
  }

  const sightingsByPet = new Map<string, any[]>()

  for (const sighting of sightings || []) {
    const current = sightingsByPet.get(sighting.pet_id) || []
    current.push(sighting)
    sightingsByPet.set(sighting.pet_id, current)
  }

  return pets.map((pet: any) => {
    const activeLostReport = Array.isArray(pet.lost_reports)
      ? pet.lost_reports.find(
          (report: any) => report.status === 'active' && !report.closed_at
        ) || null
      : null

    return {
      ...pet,
      active_lost_report: activeLostReport,
      dashboard_sightings: sightingsByPet.get(pet.id) || [],
      has_active_lost_report: !!activeLostReport,
    }
  })
}

export async function getTutorSightings(profileId: string) {
  const supabase = await createClient()

  const { data: tutorPets, error: petsError } = await supabase
    .from('pets')
    .select('id')
    .eq('primary_tutor_profile_id', profileId)

  if (petsError || !tutorPets || tutorPets.length === 0) {
    return []
  }

  const petIds = tutorPets.map((pet) => pet.id)

  const { data, error } = await supabase
    .from('sightings')
    .select(`
      id,
      pet_id,
      report_type,
      reporter_name,
      reporter_phone,
      reporter_whatsapp,
      seen_at,
      location_text,
      notes,
      status,
      lat,
      lng,
      created_at,
      pets (
        id,
        name,
        public_slug
      )
    `)
    .in('pet_id', petIds)
    .order('seen_at', { ascending: false })

  if (error) return []

  return data || []
}

export async function getTutorNotifications(profileId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id,
      recipient_profile_id,
      pet_id,
      sighting_id,
      kind,
      channel,
      title,
      body,
      action_url,
      meta,
      is_read,
      archived_at,
      created_at,
      read_at
    `)
    .eq('recipient_profile_id', profileId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return []

  return data || []
}