import { createClient } from '@/lib/supabase/server'

export async function getPublicPetBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_public_pet_profile', {
    p_slug: slug,
  })

  if (error || !data || data.length === 0) return null

  const pet = data[0]

  const { data: photos } = await supabase
    .from('pet_photos')
    .select('id, file_url, is_cover, sort_order')
    .eq('pet_id', pet.pet_id)
    .order('sort_order', { ascending: true })

  const { data: activeLostReport } = await supabase
    .from('lost_reports')
    .select(`
      id,
      status,
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
    .eq('pet_id', pet.pet_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: sightings } = await supabase
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
    .eq('pet_id', pet.pet_id)
    .neq('status', 'archived')
    .order('seen_at', { ascending: false })

  return {
    ...pet,
    photos: photos || [],
    active_poster_image_url: activeLostReport?.poster_image_url ?? null,
    active_lost_lat: activeLostReport?.lat ?? null,
    active_lost_lng: activeLostReport?.lng ?? null,
    active_radius_km: activeLostReport?.radius_km ?? null,
    map_sightings: sightings || [],
  }
}