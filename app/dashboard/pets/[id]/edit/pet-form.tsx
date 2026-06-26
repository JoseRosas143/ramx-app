'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { compressImageFile } from '@/lib/image-compression'
import { updatePetMainProfileAction } from './actions'

type Photo = {
  id: string
  file_url: string
  is_cover: boolean
  sort_order: number
}

type LostReport = {
  id: string
  status: string | null
  lost_at: string | null
  last_seen_text: string | null
  lat: number | null
  lng: number | null
  radius_km: number | null
  reward_text: string | null
  circumstances: string | null
  public_contact_instructions: string | null
  poster_image_url: string | null
  closed_at: string | null
  created_at: string | null
  updated_at: string | null
}

type PublicSettings = {
  pet_id: string
  show_pet_name: boolean
  show_profile_photo: boolean
  show_species: boolean
  show_breed: boolean
  show_sex: boolean
  show_age: boolean
  show_microchip: boolean
  show_medical_alerts: boolean
  show_primary_tutor_phone: boolean
  show_whatsapp_button: boolean
  show_emergency_contacts: boolean
  show_last_seen_info_when_lost: boolean
  show_map_when_lost: boolean
}

type VetInterest = {
  id: string
  clinic_name: string | null
  phone: string | null
  state: string | null
  municipality: string | null
}

type PetData = {
  id: string
  primary_tutor_profile_id?: string
  name: string
  species: string | null
  breed: string | null
  sex: string | null
  color: string | null
  birth_date: string | null
  microchip_number: string | null
  internal_id: string | null
  public_slug: string | null
  medical_alerts: string | null
  status: string | null
  profile_photo_url: string | null
  public_show_medical_summary?: boolean | null
  public_show_primary_vet?: boolean | null
  public_show_vaccinations?: boolean | null
  public_show_dewormings?: boolean | null
  public_show_medical_visits?: boolean | null
  public_show_medical_documents?: boolean | null
  pet_public_settings?: PublicSettings[] | PublicSettings | null
  pet_onboarding_vet_interest?: VetInterest[] | VetInterest | null
  pet_photos?: Photo[]
  lost_reports?: LostReport[]
}

export default function EditPetForm({ pet }: { pet: PetData }) {
  const router = useRouter()
  const supabase = createClient()

  const settings = Array.isArray(pet.pet_public_settings)
    ? pet.pet_public_settings[0]
    : pet.pet_public_settings

  const vet = Array.isArray(pet.pet_onboarding_vet_interest)
    ? pet.pet_onboarding_vet_interest[0]
    : pet.pet_onboarding_vet_interest

  const initialPhotos = [...(pet.pet_photos || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )

  const activeLostReport =
    (pet.lost_reports || []).find(
      (report) => report.status === 'active' && !report.closed_at
    ) || null

  const [profileId, setProfileId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'neutral' | 'success' | 'error'>(
    'neutral'
  )

  const [name, setName] = useState(pet.name || '')
  const [species, setSpecies] = useState(pet.species || '')
  const [breed, setBreed] = useState(pet.breed || '')
  const [sex, setSex] = useState(pet.sex || '')
  const [color, setColor] = useState(pet.color || '')
  const [birthDate, setBirthDate] = useState(pet.birth_date || '')
  const [microchipNumber, setMicrochipNumber] = useState(
    pet.microchip_number || ''
  )
  const [medicalAlerts, setMedicalAlerts] = useState(pet.medical_alerts || '')

  const [clinicName, setClinicName] = useState(vet?.clinic_name || '')
  const [vetPhone, setVetPhone] = useState(vet?.phone || '')
  const [vetState, setVetState] = useState(vet?.state || '')
  const [vetMunicipality, setVetMunicipality] = useState(
    vet?.municipality || ''
  )

  const [showPetName, setShowPetName] = useState(
    settings?.show_pet_name ?? true
  )
  const [showProfilePhoto, setShowProfilePhoto] = useState(
    settings?.show_profile_photo ?? true
  )
  const [showSpecies, setShowSpecies] = useState(
    settings?.show_species ?? true
  )
  const [showBreed, setShowBreed] = useState(settings?.show_breed ?? true)
  const [showSex, setShowSex] = useState(settings?.show_sex ?? true)
  const [showAge, setShowAge] = useState(settings?.show_age ?? true)
  const [showMicrochip, setShowMicrochip] = useState(
    settings?.show_microchip ?? true
  )
  const [showMedicalAlerts, setShowMedicalAlerts] = useState(
    settings?.show_medical_alerts ?? true
  )
  const [showPrimaryTutorPhone, setShowPrimaryTutorPhone] = useState(
    settings?.show_primary_tutor_phone ?? true
  )
  const [showWhatsappButton, setShowWhatsappButton] = useState(
    settings?.show_whatsapp_button ?? true
  )
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(
    settings?.show_emergency_contacts ?? true
  )
  const [showLastSeenInfoWhenLost, setShowLastSeenInfoWhenLost] = useState(
    settings?.show_last_seen_info_when_lost ?? true
  )
  const [showMapWhenLost, setShowMapWhenLost] = useState(
    settings?.show_map_when_lost ?? true
  )

  const [publicShowMedicalSummary, setPublicShowMedicalSummary] = useState(
    pet.public_show_medical_summary ?? false
  )
  const [publicShowPrimaryVet, setPublicShowPrimaryVet] = useState(
    pet.public_show_primary_vet ?? false
  )
  const [publicShowVaccinations, setPublicShowVaccinations] = useState(
    pet.public_show_vaccinations ?? true
  )
  const [publicShowDewormings, setPublicShowDewormings] = useState(
    pet.public_show_dewormings ?? true
  )
  const [publicShowMedicalVisits, setPublicShowMedicalVisits] = useState(
    pet.public_show_medical_visits ?? false
  )
  const [publicShowMedicalDocuments, setPublicShowMedicalDocuments] = useState(
    pet.public_show_medical_documents ?? false
  )

  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)

  const [isLostMode, setIsLostMode] = useState(
    pet.status === 'lost' || !!activeLostReport
  )
  const [lostAt, setLostAt] = useState(
    activeLostReport?.lost_at ? toDatetimeLocal(activeLostReport.lost_at) : ''
  )
  const [lastSeenText, setLastSeenText] = useState(
    activeLostReport?.last_seen_text || ''
  )
  const [rewardText, setRewardText] = useState(
    activeLostReport?.reward_text || ''
  )
  const [circumstances, setCircumstances] = useState(
    activeLostReport?.circumstances || ''
  )
  const [publicContactInstructions, setPublicContactInstructions] = useState(
    activeLostReport?.public_contact_instructions || ''
  )
  const [posterImageUrl, setPosterImageUrl] = useState(
    activeLostReport?.poster_image_url || ''
  )
  const [uploadingPosterImage, setUploadingPosterImage] = useState(false)

  const [lostLat, setLostLat] = useState(
    activeLostReport?.lat != null ? String(activeLostReport.lat) : ''
  )
  const [lostLng, setLostLng] = useState(
    activeLostReport?.lng != null ? String(activeLostReport.lng) : ''
  )
  const [lostRadiusKm, setLostRadiusKm] = useState(
    activeLostReport?.radius_km != null ? String(activeLostReport.radius_km) : '1'
  )
  const [locatingLostPoint, setLocatingLostPoint] = useState(false)
  const [lostLocationStatus, setLostLocationStatus] = useState('')

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setProfileId(user?.id || null)
    }

    loadUser()
  }, [supabase])

  function setStatusMessage(
    text: string,
    tone: 'neutral' | 'success' | 'error' = 'neutral'
  ) {
    setMessage(text)
    setMessageTone(tone)
  }

  const handleUseCurrentLostLocation = () => {
    setLostLocationStatus('')

    if (!navigator.geolocation) {
      setLostLocationStatus('Tu navegador no soporta geolocalización.')
      return
    }

    setLocatingLostPoint(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLat = Number(position.coords.latitude.toFixed(6))
        const nextLng = Number(position.coords.longitude.toFixed(6))

        setLostLat(String(nextLat))
        setLostLng(String(nextLng))

        if (!lastSeenText.trim()) {
          setLastSeenText(
            `Ubicación aproximada del extravío (${nextLat}, ${nextLng})`
          )
        }

        setLostLocationStatus('Ubicación base capturada correctamente.')
        setLocatingLostPoint(false)
      },
      () => {
        setLostLocationStatus(
          'No se pudo obtener la ubicación. Revisa permisos del navegador o escribe las coordenadas manualmente.'
        )
        setLocatingLostPoint(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const handleClearLostLocation = () => {
    setLostLat('')
    setLostLng('')
    setLostLocationStatus('Ubicación base eliminada.')
  }

  const handleUploadLostPosterPhoto = async (file: File | null) => {
    if (!file) return

    setUploadingPosterImage(true)
    setStatusMessage('')

    try {
      if (!profileId) {
        setStatusMessage('No se pudo identificar al usuario actual.', 'error')
        return
      }

      const compressedFile = await compressImageFile(file, {
        maxWidth: 1800,
        maxHeight: 1800,
        quality: 0.86,
        outputType: 'image/webp',
      })

      const ext = getSafeExtension(compressedFile.name)
      const filePath = `${pet.id}/lost-poster-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(filePath, compressedFile, {
          upsert: true,
          contentType: compressedFile.type || undefined,
        })

      if (uploadError) {
        setStatusMessage(uploadError.message, 'error')
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(filePath)

      setPosterImageUrl(publicUrlData.publicUrl)
      setStatusMessage('Foto reciente para búsqueda cargada correctamente.', 'success')
    } catch (error) {
      console.error('Lost poster upload error:', error)
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo cargar la foto reciente.',
        'error'
      )
    } finally {
      setUploadingPosterImage(false)
    }
  }

  const clearLostPosterPhoto = () => {
    setPosterImageUrl('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setStatusMessage('')

    if (!profileId) {
      setStatusMessage('No se pudo identificar al usuario actual.', 'error')
      setSaving(false)
      return
    }

    const normalizedName = cleanText(name)
    const coverUrl =
      photos.find((photo) => photo.is_cover)?.file_url ||
      photos[0]?.file_url ||
      null

    if (!normalizedName) {
      setStatusMessage('El nombre de la mascota es obligatorio.', 'error')
      setSaving(false)
      return
    }

    const mainProfileResult = await updatePetMainProfileAction(pet.id, {
      name: normalizedName,
      species,
      breed,
      sex,
      color,
      birthDate,
      microchipNumber,
      medicalAlerts,
      profilePhotoUrl: coverUrl,
      status: isLostMode ? 'lost' : 'active',
    })

    if (!mainProfileResult.ok) {
      setStatusMessage(mainProfileResult.message, 'error')
      setSaving(false)
      return
    }

    setMedicalAlerts(mainProfileResult.medical_alerts || '')

    const { error: settingsError } = await supabase
      .from('pet_public_settings')
      .upsert(
        {
          pet_id: pet.id,
          show_pet_name: showPetName,
          show_profile_photo: showProfilePhoto,
          show_species: showSpecies,
          show_breed: showBreed,
          show_sex: showSex,
          show_age: showAge,
          show_microchip: showMicrochip,
          show_medical_alerts: showMedicalAlerts,
          show_primary_tutor_phone: showPrimaryTutorPhone,
          show_whatsapp_button: showWhatsappButton,
          show_emergency_contacts: showEmergencyContacts,
          show_last_seen_info_when_lost: showLastSeenInfoWhenLost,
          show_map_when_lost: showMapWhenLost,
        },
        { onConflict: 'pet_id' }
      )

    if (settingsError) {
      setStatusMessage(settingsError.message, 'error')
      setSaving(false)
      return
    }

    const { error: clinicalPrivacyError } = await supabase
      .from('pets')
      .update({
        public_show_medical_summary: publicShowMedicalSummary,
        public_show_primary_vet: publicShowPrimaryVet,
        public_show_vaccinations: publicShowVaccinations,
        public_show_dewormings: publicShowDewormings,
        public_show_medical_visits: publicShowMedicalVisits,
        public_show_medical_documents: publicShowMedicalDocuments,
      })
      .eq('id', pet.id)
      .eq('primary_tutor_profile_id', profileId)

    if (clinicalPrivacyError) {
      setStatusMessage(clinicalPrivacyError.message, 'error')
      setSaving(false)
      return
    }

    const hasVetData =
      cleanText(clinicName) ||
      cleanText(vetPhone) ||
      cleanText(vetState) ||
      cleanText(vetMunicipality)

    if (vet?.id) {
      const { error: vetError } = await supabase
        .from('pet_onboarding_vet_interest')
        .update({
          clinic_name: cleanText(clinicName),
          phone: cleanText(vetPhone),
          state: cleanText(vetState),
          municipality: cleanText(vetMunicipality),
        })
        .eq('id', vet.id)

      if (vetError) {
        setStatusMessage(vetError.message, 'error')
        setSaving(false)
        return
      }
    } else if (hasVetData) {
      const { error: vetInsertError } = await supabase
        .from('pet_onboarding_vet_interest')
        .insert({
          pet_id: pet.id,
          clinic_name: cleanText(clinicName),
          phone: cleanText(vetPhone),
          state: cleanText(vetState),
          municipality: cleanText(vetMunicipality),
        })

      if (vetInsertError) {
        setStatusMessage(vetInsertError.message, 'error')
        setSaving(false)
        return
      }
    }

    if (isLostMode) {
      if ((lostLat && !lostLng) || (!lostLat && lostLng)) {
        setStatusMessage(
          'Para usar mapa del extravío, captura latitud y longitud completas.',
          'error'
        )
        setSaving(false)
        return
      }

      const parsedLostLat = lostLat ? Number(lostLat) : null
      const parsedLostLng = lostLng ? Number(lostLng) : null
      const parsedRadiusKm = lostRadiusKm ? Number(lostRadiusKm) : 1

      if (
        (lostLat && Number.isNaN(parsedLostLat as number)) ||
        (lostLng && Number.isNaN(parsedLostLng as number))
      ) {
        setStatusMessage('Las coordenadas del extravío no son válidas.', 'error')
        setSaving(false)
        return
      }

      if (lostRadiusKm && Number.isNaN(parsedRadiusKm)) {
        setStatusMessage('El radio de búsqueda no es válido.', 'error')
        setSaving(false)
        return
      }

      if (activeLostReport?.id) {
        const { error: lostUpdateError } = await supabase
          .from('lost_reports')
          .update({
            status: 'active',
            lost_at: lostAt ? new Date(lostAt).toISOString() : null,
            last_seen_text: cleanText(lastSeenText),
            lat: parsedLostLat,
            lng: parsedLostLng,
            radius_km: parsedRadiusKm || 1,
            reward_text: cleanText(rewardText),
            circumstances: cleanText(circumstances),
            public_contact_instructions: cleanText(publicContactInstructions),
            poster_image_url: cleanText(posterImageUrl),
            closed_at: null,
          })
          .eq('id', activeLostReport.id)

        if (lostUpdateError) {
          setStatusMessage(lostUpdateError.message, 'error')
          setSaving(false)
          return
        }
      } else {
        const { error: lostInsertError } = await supabase
          .from('lost_reports')
          .insert({
            pet_id: pet.id,
            reported_by_profile_id: profileId,
            status: 'active',
            lost_at: lostAt
              ? new Date(lostAt).toISOString()
              : new Date().toISOString(),
            last_seen_text: cleanText(lastSeenText),
            lat: parsedLostLat,
            lng: parsedLostLng,
            radius_km: parsedRadiusKm || 1,
            reward_text: cleanText(rewardText),
            circumstances: cleanText(circumstances),
            public_contact_instructions: cleanText(publicContactInstructions),
            poster_image_url: cleanText(posterImageUrl),
          })

        if (lostInsertError) {
          setStatusMessage(lostInsertError.message, 'error')
          setSaving(false)
          return
        }
      }
    } else if (activeLostReport?.id) {
      const { error: lostCloseError } = await supabase
        .from('lost_reports')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
        })
        .eq('id', activeLostReport.id)

      if (lostCloseError) {
        setStatusMessage(lostCloseError.message, 'error')
        setSaving(false)
        return
      }
    }

    setStatusMessage('Perfil actualizado correctamente.', 'success')
    setSaving(false)
    router.refresh()
  }

  const handleUploadPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    setStatusMessage('')

    try {
      if (!profileId) {
        setStatusMessage('No se pudo identificar al usuario actual.', 'error')
        return
      }

      const uploaded: Photo[] = []

      for (let i = 0; i < files.length; i++) {
        const compressedFile = await compressImageFile(files[i], {
          maxWidth: 1800,
          maxHeight: 1800,
          quality: 0.82,
          outputType: 'image/webp',
        })

        const ext = getSafeExtension(compressedFile.name)
        const filePath = `${pet.id}/${Date.now()}-${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(filePath, compressedFile, {
            upsert: false,
            contentType: compressedFile.type || undefined,
          })

        if (uploadError) {
          setStatusMessage(uploadError.message, 'error')
          return
        }

        const { data: publicUrlData } = supabase.storage
          .from('pet-photos')
          .getPublicUrl(filePath)

        const { data: insertedPhoto, error: insertError } = await supabase
          .from('pet_photos')
          .insert({
            pet_id: pet.id,
            uploaded_by_profile_id: profileId,
            file_url: publicUrlData.publicUrl,
            is_cover: photos.length === 0 && i === 0,
            sort_order: photos.length + i,
          })
          .select()
          .single()

        if (insertError) {
          setStatusMessage(insertError.message, 'error')
          return
        }

        uploaded.push(insertedPhoto as Photo)
      }

      const newPhotos = [...photos, ...uploaded]
      setPhotos(newPhotos)

      if (newPhotos.length > 0) {
        const nextCover =
          newPhotos.find((photo) => photo.is_cover)?.file_url ||
          newPhotos[0]?.file_url ||
          null

        await supabase
          .from('pets')
          .update({
            profile_photo_url: nextCover,
          })
          .eq('id', pet.id)
          .eq('primary_tutor_profile_id', profileId)
      }

      setStatusMessage('Fotos cargadas correctamente.', 'success')
      router.refresh()
    } catch (error) {
      console.error('Photo upload error:', error)
      setStatusMessage(
        error instanceof Error ? error.message : 'No se pudieron cargar las fotos.',
        'error'
      )
    } finally {
      setUploading(false)
    }
  }

  const setAsCover = async (photoId: string) => {
    setStatusMessage('')

    if (!profileId) {
      setStatusMessage('No se pudo identificar al usuario actual.', 'error')
      return
    }

    const updatedPhotos = photos.map((photo) => ({
      ...photo,
      is_cover: photo.id === photoId,
    }))

    for (const photo of updatedPhotos) {
      const { error } = await supabase
        .from('pet_photos')
        .update({ is_cover: photo.is_cover })
        .eq('id', photo.id)

      if (error) {
        setStatusMessage(error.message, 'error')
        return
      }
    }

    const cover = updatedPhotos.find((photo) => photo.id === photoId)

    await supabase
      .from('pets')
      .update({
        profile_photo_url: cover?.file_url || null,
      })
      .eq('id', pet.id)
      .eq('primary_tutor_profile_id', profileId)

    setPhotos(updatedPhotos)
    router.refresh()
  }

  const deletePhoto = async (photoId: string) => {
    setStatusMessage('')

    if (!profileId) {
      setStatusMessage('No se pudo identificar al usuario actual.', 'error')
      return
    }

    const { error } = await supabase
      .from('pet_photos')
      .delete()
      .eq('id', photoId)

    if (error) {
      setStatusMessage(error.message, 'error')
      return
    }

    const remaining = photos.filter((photo) => photo.id !== photoId)

    let normalized = remaining
    if (remaining.length > 0 && !remaining.some((photo) => photo.is_cover)) {
      normalized = remaining.map((photo, index) => ({
        ...photo,
        is_cover: index === 0,
      }))

      for (const photo of normalized) {
        await supabase
          .from('pet_photos')
          .update({ is_cover: photo.is_cover })
          .eq('id', photo.id)
      }
    }

    await supabase
      .from('pets')
      .update({
        profile_photo_url:
          normalized.find((photo) => photo.is_cover)?.file_url ||
          normalized[0]?.file_url ||
          null,
      })
      .eq('id', pet.id)
      .eq('primary_tutor_profile_id', profileId)

    setPhotos(normalized)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionCard title="Datos generales">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre">
            <InputLike value={name} onChange={setName} />
          </Field>

          <Field label="Especie">
            <InputLike value={species} onChange={setSpecies} />
          </Field>

          <Field label="Raza">
            <InputLike value={breed} onChange={setBreed} />
          </Field>

          <Field label="Sexo">
            <InputLike value={sex} onChange={setSex} />
          </Field>

          <Field label="Color">
            <InputLike value={color} onChange={setColor} />
          </Field>

          <Field label="Fecha de nacimiento">
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500"
            />
          </Field>

          <Field label="Microchip">
            <InputLike value={microchipNumber} onChange={setMicrochipNumber} />
          </Field>

          <Field label="ID interno">
            <input
              value={pet.internal_id || ''}
              disabled
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm text-neutral-500"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Fotos">
        <div className="space-y-4">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            {uploading ? 'Comprimiendo y subiendo...' : 'Subir fotos'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUploadPhotos(e.target.files)}
            />
          </label>

          <p className="text-xs leading-5 text-neutral-500">
            Las fotos nuevas se optimizan automáticamente en formato WebP para
            mantener buena calidad y mejorar la velocidad del perfil público.
          </p>

          {photos.length === 0 ? (
            <p className="text-sm text-neutral-600">
              Aún no hay fotos registradas.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.file_url}
                    alt="Foto de mascota"
                    className="h-40 w-full object-cover"
                  />

                  <div className="space-y-3 p-4">
                    <p className="text-sm font-medium text-neutral-900">
                      {photo.is_cover ? 'Foto de portada' : 'Foto secundaria'}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {!photo.is_cover ? (
                        <button
                          type="button"
                          onClick={() => setAsCover(photo.id)}
                          className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50"
                        >
                          Poner portada
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => deletePhoto(photo.id)}
                        className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Modo extraviado">
        <div className="space-y-4">
          <Toggle
            label="Marcar como extraviada"
            checked={isLostMode}
            onChange={setIsLostMode}
          />

          {isLostMode ? (
            <div className="grid gap-4">
              <Field label="Fecha y hora del extravío">
                <input
                  type="datetime-local"
                  value={lostAt}
                  onChange={(e) => setLostAt(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500"
                />
              </Field>

              <Field label="Última ubicación conocida">
                <InputLike value={lastSeenText} onChange={setLastSeenText} />
              </Field>

              <div className="rounded-3xl border border-red-100 bg-red-50/60 p-4">
                <p className="text-sm font-semibold text-red-900">
                  Ubicación base para mapa
                </p>

                <p className="mt-1 text-sm leading-6 text-red-800">
                  Esta es la ubicación principal desde donde se perdió la
                  mascota. Se usará para centrar el mapa privado del dashboard.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleUseCurrentLostLocation}
                    disabled={locatingLostPoint}
                    className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-900 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    {locatingLostPoint
                      ? 'Obteniendo ubicación...'
                      : 'Usar mi ubicación actual'}
                  </button>

                  {lostLat || lostLng ? (
                    <button
                      type="button"
                      onClick={handleClearLostLocation}
                      className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                    >
                      Quitar ubicación
                    </button>
                  ) : null}
                </div>

                {lostLocationStatus ? (
                  <p className="mt-3 text-sm text-red-900">
                    {lostLocationStatus}
                  </p>
                ) : null}

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <Field label="Latitud">
                    <InputLike value={lostLat} onChange={setLostLat} />
                  </Field>

                  <Field label="Longitud">
                    <InputLike value={lostLng} onChange={setLostLng} />
                  </Field>

                  <Field label="Radio de búsqueda (km)">
                    <InputLike value={lostRadiusKm} onChange={setLostRadiusKm} />
                  </Field>
                </div>

                <p className="mt-3 text-xs leading-5 text-red-700">
                  El mapa y la inteligencia de avistamientos se muestran en el
                  dashboard del tutor, no en el perfil público.
                </p>
              </div>

              <div className="rounded-3xl border border-red-100 bg-white p-4">
                <p className="text-sm font-semibold text-red-900">
                  Foto reciente para cartel y búsqueda
                </p>

                <p className="mt-1 text-sm leading-6 text-red-800">
                  Usa una foto clara y reciente de cómo se veía tu mascota al
                  momento del extravío. Esta imagen se mostrará en el cartel y
                  materiales públicos de búsqueda.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-900 transition hover:bg-red-50">
                    {uploadingPosterImage
                      ? 'Comprimiendo y subiendo...'
                      : 'Subir foto reciente'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleUploadLostPosterPhoto(e.target.files?.[0] || null)
                      }
                    />
                  </label>

                  {posterImageUrl ? (
                    <button
                      type="button"
                      onClick={clearLostPosterPhoto}
                      className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                    >
                      Quitar foto reciente
                    </button>
                  ) : null}
                </div>

                {posterImageUrl ? (
                  <div className="mt-4 overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={posterImageUrl}
                      alt="Foto reciente para búsqueda"
                      className="h-64 w-full object-cover"
                    />
                  </div>
                ) : null}
              </div>

              <Field label="Recompensa (opcional)">
                <InputLike value={rewardText} onChange={setRewardText} />
              </Field>

              <Field label="Circunstancias del extravío">
                <textarea
                  value={circumstances}
                  onChange={(e) => setCircumstances(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500"
                  placeholder="Describe cómo se perdió, señas particulares, collar, comportamiento..."
                />
              </Field>

              <Field label="Instrucciones públicas de contacto">
                <textarea
                  value={publicContactInstructions}
                  onChange={(e) => setPublicContactInstructions(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500"
                  placeholder="Ej. Por favor llámame de inmediato o escríbeme por WhatsApp."
                />
              </Field>
            </div>
          ) : (
            <p className="text-sm text-neutral-600">
              Cuando actives este modo, la mascota se mostrará como extraviada
              en el perfil público.
            </p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Información médica importante">
        <Field label="Alertas médicas públicas">
          <textarea
            value={medicalAlerts}
            onChange={(e) => setMedicalAlerts(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500"
            placeholder="Ej. Alergia a penicilina, epilepsia, requiere medicamento diario, no administrar ciertos alimentos..."
          />
        </Field>

        <div className="mt-4 rounded-3xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            Esta información puede mostrarse en el perfil público
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Úsala solo para datos críticos que ayuden a proteger a tu mascota en
            caso de extravío o emergencia. Puedes activar o desactivar su
            visibilidad en privacidad pública.
          </p>
        </div>
      </SectionCard>

      <div id="privacidad-publica" className="scroll-mt-24">
        <SectionCard title="Privacidad del expediente clínico público">
          <p className="mb-4 text-sm leading-6 text-neutral-600">
            Elige qué partes del expediente clínico pueden ver las personas al
            escanear el QR o abrir el perfil público de esta mascota.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle
              label="Mostrar resumen clínico"
              checked={publicShowMedicalSummary}
              onChange={setPublicShowMedicalSummary}
            />

            <Toggle
              label="Mostrar veterinaria principal"
              checked={publicShowPrimaryVet}
              onChange={setPublicShowPrimaryVet}
            />

            <Toggle
              label="Mostrar vacunas"
              checked={publicShowVaccinations}
              onChange={setPublicShowVaccinations}
            />

            <Toggle
              label="Mostrar desparasitación"
              checked={publicShowDewormings}
              onChange={setPublicShowDewormings}
            />

            <Toggle
              label="Mostrar consultas clínicas"
              checked={publicShowMedicalVisits}
              onChange={setPublicShowMedicalVisits}
            />

            <Toggle
              label="Mostrar documentos médicos como referencia"
              checked={publicShowMedicalDocuments}
              onChange={setPublicShowMedicalDocuments}
            />
          </div>

          <div className="mt-4 rounded-3xl border border-sky-100 bg-sky-50 p-4">
            <p className="text-sm font-semibold text-sky-900">
              Los documentos no se descargan públicamente
            </p>

            <p className="mt-2 text-sm leading-6 text-sky-800">
              En el perfil público solo se muestra el tipo, título y notas del
              documento. Los archivos médicos siguen protegidos.
            </p>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Veterinaria relacionada">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Clínica">
            <InputLike value={clinicName} onChange={setClinicName} />
          </Field>

          <Field label="Teléfono">
            <InputLike value={vetPhone} onChange={setVetPhone} />
          </Field>

          <Field label="Estado">
            <InputLike value={vetState} onChange={setVetState} />
          </Field>

          <Field label="Municipio">
            <InputLike value={vetMunicipality} onChange={setVetMunicipality} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Privacidad pública">
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Mostrar nombre"
            checked={showPetName}
            onChange={setShowPetName}
          />
          <Toggle
            label="Mostrar foto"
            checked={showProfilePhoto}
            onChange={setShowProfilePhoto}
          />
          <Toggle
            label="Mostrar especie"
            checked={showSpecies}
            onChange={setShowSpecies}
          />
          <Toggle
            label="Mostrar raza"
            checked={showBreed}
            onChange={setShowBreed}
          />
          <Toggle
            label="Mostrar sexo"
            checked={showSex}
            onChange={setShowSex}
          />
          <Toggle
            label="Mostrar edad"
            checked={showAge}
            onChange={setShowAge}
          />
          <Toggle
            label="Mostrar microchip / ID"
            checked={showMicrochip}
            onChange={setShowMicrochip}
          />
          <Toggle
            label="Mostrar alertas médicas"
            checked={showMedicalAlerts}
            onChange={setShowMedicalAlerts}
          />
          <Toggle
            label="Mostrar teléfono"
            checked={showPrimaryTutorPhone}
            onChange={setShowPrimaryTutorPhone}
          />
          <Toggle
            label="Mostrar botón WhatsApp"
            checked={showWhatsappButton}
            onChange={setShowWhatsappButton}
          />
          <Toggle
            label="Mostrar contactos de emergencia"
            checked={showEmergencyContacts}
            onChange={setShowEmergencyContacts}
          />
          <Toggle
            label="Mostrar última ubicación textual si está extraviada"
            checked={showLastSeenInfoWhenLost}
            onChange={setShowLastSeenInfoWhenLost}
          />
          <Toggle
            label="Reservar mapa solo para dashboard"
            checked={!showMapWhenLost}
            onChange={(value) => setShowMapWhenLost(!value)}
          />
        </div>
      </SectionCard>

      <div className="rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-lg">
        {message ? (
          <p
            className={`mb-4 rounded-2xl border p-4 text-sm leading-6 ${
              messageTone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : messageTone === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-700'
            }`}
          >
            {message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 px-5 py-3 text-sm font-medium text-neutral-800 transition-all duration-200 hover:bg-white hover:shadow-md"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    </form>
  )
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-lg">
      <h2 className="mb-4 text-lg font-semibold text-neutral-950">{title}</h2>
      {children}
    </section>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-neutral-700">{label}</p>
      {children}
    </div>
  )
}

function InputLike({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500"
    />
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-neutral-50/80 px-4 py-3">
      <span className="text-sm text-neutral-800">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0"
      />
    </label>
  )
}

function toDatetimeLocal(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (n: number) => String(n).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function cleanText(value: string) {
  const text = value.trim()
  return text.length > 0 ? text : null
}

function getSafeExtension(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase()

  if (!ext || ext.length > 8) return 'jpg'

  return ext.replace(/[^a-z0-9]/g, '') || 'jpg'
}