'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Photo = {
  id: string
  file_url: string
  is_cover: boolean
  sort_order: number
}

type PetData = {
  id: string
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
  pet_public_settings?: {
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
  }[] | {
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
  } | null
  pet_onboarding_vet_interest?: {
    id: string
    clinic_name: string | null
    phone: string | null
    state: string | null
    municipality: string | null
  }[] | {
    id: string
    clinic_name: string | null
    phone: string | null
    state: string | null
    municipality: string | null
  } | null
  pet_photos?: Photo[]
}

export default function EditPetForm({ pet }: { pet: PetData }) {
    const router = useRouter()
    const supabase = createClient()
    
    const [profileId, setProfileId] = useState<string | null>(null)

  const settings = Array.isArray(pet.pet_public_settings)
    ? pet.pet_public_settings[0]
    : pet.pet_public_settings

  const vet = Array.isArray(pet.pet_onboarding_vet_interest)
    ? pet.pet_onboarding_vet_interest[0]
    : pet.pet_onboarding_vet_interest

  const initialPhotos = [...(pet.pet_photos || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const [name, setName] = useState(pet.name || '')
  const [species, setSpecies] = useState(pet.species || '')
  const [breed, setBreed] = useState(pet.breed || '')
  const [sex, setSex] = useState(pet.sex || '')
  const [color, setColor] = useState(pet.color || '')
  const [birthDate, setBirthDate] = useState(pet.birth_date || '')
  const [microchipNumber, setMicrochipNumber] = useState(pet.microchip_number || '')
  const [medicalAlerts, setMedicalAlerts] = useState(pet.medical_alerts || '')

  const [clinicName, setClinicName] = useState(vet?.clinic_name || '')
  const [vetPhone, setVetPhone] = useState(vet?.phone || '')
  const [vetState, setVetState] = useState(vet?.state || '')
  const [vetMunicipality, setVetMunicipality] = useState(vet?.municipality || '')

  const [showPetName, setShowPetName] = useState(settings?.show_pet_name ?? true)
  const [showProfilePhoto, setShowProfilePhoto] = useState(settings?.show_profile_photo ?? true)
  const [showSpecies, setShowSpecies] = useState(settings?.show_species ?? true)
  const [showBreed, setShowBreed] = useState(settings?.show_breed ?? true)
  const [showSex, setShowSex] = useState(settings?.show_sex ?? true)
  const [showAge, setShowAge] = useState(settings?.show_age ?? true)
  const [showMicrochip, setShowMicrochip] = useState(settings?.show_microchip ?? true)
  const [showMedicalAlerts, setShowMedicalAlerts] = useState(settings?.show_medical_alerts ?? true)
  const [showPrimaryTutorPhone, setShowPrimaryTutorPhone] = useState(settings?.show_primary_tutor_phone ?? true)
  const [showWhatsappButton, setShowWhatsappButton] = useState(settings?.show_whatsapp_button ?? true)

  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
  
      setProfileId(user?.id || null)
    }
  
    loadUser()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { error: petError } = await supabase
      .from('pets')
      .update({
        name,
        species,
        breed,
        sex,
        color,
        birth_date: birthDate || null,
        microchip_number: microchipNumber || null,
        medical_alerts: medicalAlerts || null,
        profile_photo_url:
          photos.find((photo) => photo.is_cover)?.file_url ||
          photos[0]?.file_url ||
          null,
      })
      .eq('id', pet.id)

    if (petError) {
      setMessage(petError.message)
      setSaving(false)
      return
    }

    const { error: settingsError } = await supabase
      .from('pet_public_settings')
      .upsert({
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
      })

    if (settingsError) {
      setMessage(settingsError.message)
      setSaving(false)
      return
    }

    if (vet?.id) {
      const { error: vetError } = await supabase
        .from('pet_onboarding_vet_interest')
        .update({
          clinic_name: clinicName || null,
          phone: vetPhone || null,
          state: vetState || null,
          municipality: vetMunicipality || null,
        })
        .eq('id', vet.id)

      if (vetError) {
        setMessage(vetError.message)
        setSaving(false)
        return
      }
    } else if (clinicName || vetPhone || vetState || vetMunicipality) {
      const { error: vetInsertError } = await supabase
        .from('pet_onboarding_vet_interest')
        .insert({
          pet_id: pet.id,
          clinic_name: clinicName || null,
          phone: vetPhone || null,
          state: vetState || null,
          municipality: vetMunicipality || null,
        })

      if (vetInsertError) {
        setMessage(vetInsertError.message)
        setSaving(false)
        return
      }
    }

    setMessage('Perfil actualizado correctamente.')
    setSaving(false)
    router.refresh()
  }

  const handleUploadPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    setMessage('')

    try {
      const uploaded: Photo[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.split('.').pop()
        const filePath = `${pet.id}/${Date.now()}-${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(filePath, file, { upsert: false })

        if (uploadError) {
          setMessage(uploadError.message)
          setUploading(false)
          return
        }

        const { data: publicUrlData } = supabase.storage
          .from('pet-photos')
          .getPublicUrl(filePath)

       if (!profileId) {
  setMessage('No se pudo identificar al usuario actual.')
  setUploading(false)
  return
}

if (!profileId) {
    setMessage('No se pudo identificar al usuario actual.')
    setUploading(false)
    return
  }
  
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
          setMessage(insertError.message)
          setUploading(false)
          return
        }

        uploaded.push(insertedPhoto)
      }

      const newPhotos = [...photos, ...uploaded]
      setPhotos(newPhotos)

      if (newPhotos.length > 0) {
        await supabase
          .from('pets')
          .update({
            profile_photo_url:
              newPhotos.find((photo) => photo.is_cover)?.file_url ||
              newPhotos[0]?.file_url,
          })
          .eq('id', pet.id)
      }
    } finally {
      setUploading(false)
    }
  }

  const setAsCover = async (photoId: string) => {
    setMessage('')

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
        setMessage(error.message)
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

    setPhotos(updatedPhotos)
    router.refresh()
  }

  const deletePhoto = async (photoId: string) => {
    setMessage('')

    const photoToDelete = photos.find((photo) => photo.id === photoId)
    if (!photoToDelete) return

    const { error } = await supabase
      .from('pet_photos')
      .delete()
      .eq('id', photoId)

    if (error) {
      setMessage(error.message)
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
            {uploading ? 'Subiendo...' : 'Subir fotos'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUploadPhotos(e.target.files)}
            />
          </label>

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

      <SectionCard title="Información médica">
        <Field label="Alertas médicas públicas">
          <textarea
            value={medicalAlerts}
            onChange={(e) => setMedicalAlerts(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500"
            placeholder="Alergias, medicamentos, condiciones importantes..."
          />
        </Field>
      </SectionCard>

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
          <Toggle label="Mostrar nombre" checked={showPetName} onChange={setShowPetName} />
          <Toggle label="Mostrar foto" checked={showProfilePhoto} onChange={setShowProfilePhoto} />
          <Toggle label="Mostrar especie" checked={showSpecies} onChange={setShowSpecies} />
          <Toggle label="Mostrar raza" checked={showBreed} onChange={setShowBreed} />
          <Toggle label="Mostrar sexo" checked={showSex} onChange={setShowSex} />
          <Toggle label="Mostrar edad" checked={showAge} onChange={setShowAge} />
          <Toggle label="Mostrar microchip / ID" checked={showMicrochip} onChange={setShowMicrochip} />
          <Toggle label="Mostrar alertas médicas" checked={showMedicalAlerts} onChange={setShowMedicalAlerts} />
          <Toggle label="Mostrar teléfono" checked={showPrimaryTutorPhone} onChange={setShowPrimaryTutorPhone} />
          <Toggle label="Mostrar botón WhatsApp" checked={showWhatsappButton} onChange={setShowWhatsappButton} />
        </div>
      </SectionCard>

      <div className="rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-lg">
        {message ? (
          <p className="mb-4 text-sm text-neutral-700">{message}</p>
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
    <label className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50/80 px-4 py-3">
      <span className="text-sm text-neutral-800">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
    </label>
  )
}