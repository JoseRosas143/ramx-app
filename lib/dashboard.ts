import { createClient } from '@/lib/supabase/server'

export async function getTutorPets(profileId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
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
      lost_reports (
        id,
        status,
        closed_at
      )
    `)
    .eq('primary_tutor_profile_id', profileId)
    .order('created_at', { ascending: false })

  if (error) return []

  return (data || []).map((pet: any) => ({
    ...pet,
    has_active_lost_report: Array.isArray(pet.lost_reports)
      ? pet.lost_reports.some(
          (report: any) => report.status === 'active' && !report.closed_at
        )
      : false,
  }))
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
      created_at,
      pets (
        id,
        name,
        public_slug
      )
    `)
    .in('pet_id', petIds)
    .order('created_at', { ascending: false })

  if (error) return []

  return data || []
}