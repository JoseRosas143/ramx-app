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
      profile_photo_url
    `)
    .eq('primary_tutor_profile_id', profileId)
    .order('created_at', { ascending: false })

  if (error) {
    return []
  }

  return data || []
}