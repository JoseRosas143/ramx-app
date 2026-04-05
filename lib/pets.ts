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

  return {
    ...pet,
    photos: photos || [],
  }
}