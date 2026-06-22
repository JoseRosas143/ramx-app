import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getPublicPetBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_public_pet_profile', {
    p_slug: slug,
  })

  if (error || !data || data.length === 0) {
    console.error('get_public_pet_profile error:', error)
    return null
  }

  const basePet = data[0]
  const petId = basePet.pet_id || basePet.id

  if (!petId) return null

  const admin = createAdminClient()

  const canShowPhotos = basePet.show_profile_photo !== false

  const [photosResult, activeLostReportResult] = await Promise.all([
    canShowPhotos
      ? admin
          .from('pet_photos')
          .select('id, file_url, is_cover, sort_order')
          .eq('pet_id', petId)
          .order('sort_order', { ascending: true })
      : Promise.resolve({ data: [], error: null }),

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
        created_at,
        closed_at
      `)
      .eq('pet_id', petId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (photosResult.error) {
    console.error('Public pet photos error:', photosResult.error)
  }

  if (activeLostReportResult.error) {
    console.error('Public active lost report error:', activeLostReportResult.error)
  }

  const photos = photosResult.data || []
  const activeLostReport = activeLostReportResult.data || null

  return {
    ...basePet,

    pet_id: petId,

    profile_photo_url: canShowPhotos
      ? basePet.profile_photo_url || photos.find((photo) => photo.is_cover)?.file_url || photos[0]?.file_url || null
      : null,

    photos: canShowPhotos ? photos : [],

    active_lost_at:
      activeLostReport?.lost_at ?? basePet.active_lost_at ?? null,

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

    active_poster_image_url:
      activeLostReport?.poster_image_url ??
      basePet.active_poster_image_url ??
      null,

    active_lost_lat: null,
    active_lost_lng: null,
    active_radius_km: null,
    map_sightings: [],
  }
}