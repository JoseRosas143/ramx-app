'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MexicoLocationSelect from '@/components/location/mexico-location-select'
import { compressImageFile } from '@/lib/image-compression'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  country_code: string | null
  state: string | null
  state_code: string | null
  municipality: string | null
  municipality_code: string | null
  onboarding_completed: boolean
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [profile, setProfile] = useState<Profile | null>(null)

  const [countryCode, setCountryCode] = useState('+52')
  const [phone, setPhone] = useState('')
  const [stateName, setStateName] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [municipalityCode, setMunicipalityCode] = useState('')

  const [petName, setPetName] = useState('')
  const [hasMicrochip, setHasMicrochip] = useState(true)
  const [microchipNumber, setMicrochipNumber] = useState('')
  const [confirmMicrochipNumber, setConfirmMicrochipNumber] = useState('')
  const [species, setSpecies] = useState('Perro')
  const [breed, setBreed] = useState('')
  const [sex, setSex] = useState('')
  const [isSterilized, setIsSterilized] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [color, setColor] = useState('')

  const [petPhotos, setPetPhotos] = useState<File[]>([])

  const [vetClinicName, setVetClinicName] = useState('')
  const [vetPhone, setVetPhone] = useState('')
  const [vetState, setVetState] = useState('')
  const [vetStateCode, setVetStateCode] = useState('')
  const [vetMunicipality, setVetMunicipality] = useState('')
  const [vetMunicipalityCode, setVetMunicipalityCode] = useState('')

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select(
          `
          id,
          full_name,
          email,
          phone,
          country_code,
          state,
          state_code,
          municipality,
          municipality_code,
          onboarding_completed
        `
        )
        .eq('id', user.id)
        .single()

      if (error || !profileData) {
        setMessage(
          error?.message || 'No se pudo cargar tu perfil. Intenta nuevamente.'
        )
        setLoading(false)
        return
      }

      if (profileData.onboarding_completed) {
        router.push('/dashboard')
        return
      }

      setProfile(profileData)
      setCountryCode(profileData.country_code || '+52')
      setPhone(profileData.phone || '')
      setStateName(profileData.state || '')
      setStateCode(profileData.state_code || '')
      setMunicipality(profileData.municipality || '')
      setMunicipalityCode(profileData.municipality_code || '')
      setLoading(false)
    }

    load()
  }, [router, supabase])

  const handlePhotosChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPetPhotos(files.slice(0, 5))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!profile) return

    setSaving(true)
    setMessage('')

    const normalizedPetName = petName.trim()
    const normalizedPhone = phone.trim()
    const normalizedMicrochip = microchipNumber.trim()
    const normalizedConfirmMicrochip = confirmMicrochipNumber.trim()

    if (!normalizedPetName) {
      setMessage('Escribe el nombre de tu mascota.')
      setSaving(false)
      return
    }

    if (!normalizedPhone) {
      setMessage('Escribe tu teléfono de contacto.')
      setSaving(false)
      return
    }

    if (!stateCode || !stateName || !municipalityCode || !municipality) {
      setMessage('Selecciona tu estado y municipio.')
      setSaving(false)
      return
    }

    if (hasMicrochip && normalizedMicrochip !== normalizedConfirmMicrochip) {
      setMessage('Los números de microchip no coinciden.')
      setSaving(false)
      return
    }

    if (hasMicrochip && !normalizedMicrochip) {
      setMessage('Escribe el número de microchip.')
      setSaving(false)
      return
    }

    let coverPhotoUrl: string | null = null

    if (petPhotos.length > 0) {
  const firstPhoto = await compressImageFile(petPhotos[0], {
    maxWidth: 1800,
    maxHeight: 1800,
    quality: 0.84,
    outputType: 'image/webp',
  })

  const fileExt = getSafeExtension(firstPhoto.name)
  const filePath = `${profile.id}/${Date.now()}-cover.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('pet-photos')
    .upload(filePath, firstPhoto, {
      upsert: false,
      contentType: firstPhoto.type || undefined,
    })

  if (uploadError) {
    setMessage(uploadError.message)
    setSaving(false)
    return
  }

  const { data: publicUrlData } = supabase.storage
    .from('pet-photos')
    .getPublicUrl(filePath)

  coverPhotoUrl = publicUrlData.publicUrl
}

    const { data: petData, error: petError } = await supabase.rpc(
      'create_pet_with_defaults',
      {
        p_primary_tutor_profile_id: profile.id,
        p_name: normalizedPetName,
        p_species: species || null,
        p_breed: breed.trim() || null,
        p_sex: sex || null,
        p_birth_date: birthDate || null,
        p_color: color.trim() || null,
        p_weight_kg: null,
        p_is_sterilized:
          isSterilized === '' ? null : isSterilized === 'true',
        p_description: null,
        p_medical_alerts: null,
        p_profile_photo_url: coverPhotoUrl,
        p_microchip_number: hasMicrochip ? normalizedMicrochip : null,
        p_has_microchip: hasMicrochip,
      }
    )

    if (petError) {
      setMessage(petError.message)
      setSaving(false)
      return
    }

    const createdPet = Array.isArray(petData) ? petData[0] : petData

    if (!createdPet?.id) {
      setMessage('No se pudo obtener la mascota creada.')
      setSaving(false)
      return
    }

    if (coverPhotoUrl) {
      await supabase.from('pet_photos').insert({
        pet_id: createdPet.id,
        uploaded_by_profile_id: profile.id,
        file_url: coverPhotoUrl,
        is_cover: true,
        sort_order: 0,
      })
    }

    if (petPhotos.length > 1) {
  for (let i = 1; i < petPhotos.length; i++) {
    const photo = await compressImageFile(petPhotos[i], {
      maxWidth: 1800,
      maxHeight: 1800,
      quality: 0.82,
      outputType: 'image/webp',
    })

    const fileExt = getSafeExtension(photo.name)
    const filePath = `${profile.id}/${Date.now()}-${i}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('pet-photos')
      .upload(filePath, photo, {
        upsert: false,
        contentType: photo.type || undefined,
      })

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(filePath)

      await supabase.from('pet_photos').insert({
        pet_id: createdPet.id,
        uploaded_by_profile_id: profile.id,
        file_url: publicUrlData.publicUrl,
        is_cover: false,
        sort_order: i,
      })
    }
  }
}

    const hasVetData =
      vetClinicName.trim() ||
      vetPhone.trim() ||
      vetState.trim() ||
      vetMunicipality.trim()

    if (hasVetData) {
      await supabase.from('pet_onboarding_vet_interest').insert({
        pet_id: createdPet.id,
        clinic_name: vetClinicName.trim() || null,
        phone: vetPhone.trim() || null,
        state: vetState || null,
        state_code: vetStateCode || null,
        municipality: vetMunicipality || null,
        municipality_code: vetMunicipalityCode || null,
      })
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        country_code: countryCode.trim() || '+52',
        phone: normalizedPhone,
        state: stateName,
        state_code: stateCode,
        municipality,
        municipality_code: municipalityCode,
        onboarding_completed: true,
      })
      .eq('id', profile.id)

    if (profileError) {
      setMessage(profileError.message)
      setSaving(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-[28px] border border-white/70 bg-white/90 p-8 text-center text-neutral-600 shadow-xl">
          Cargando registro inicial...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Card className="rounded-[32px] border-white/70 bg-white/95 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            <p className="text-sm font-medium text-neutral-500">
              Primer acceso · RAMX
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              Completa el registro de tu mascota
            </h1>

            <p className="mt-3 text-sm leading-6 text-neutral-600 sm:text-base">
              Crea su identidad digital, define tus datos de contacto y deja
              listo su perfil público para QR, NFC o microchip.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
              <section className="space-y-4 rounded-[28px] border border-neutral-200 bg-neutral-50/80 p-5">
                <SectionTitle
                  title="Identificación"
                  description="El microchip se usará como identificador principal. Si no tiene, RAMX generará un ID interno."
                />

                <div className="space-y-2">
                  <Label htmlFor="petName">Nombre de la mascota</Label>
                  <Input
                    id="petName"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="Nina"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>¿Tu mascota tiene microchip?</Label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant={hasMicrochip ? 'default' : 'outline'}
                      onClick={() => setHasMicrochip(true)}
                      className="rounded-2xl"
                    >
                      Sí tiene microchip
                    </Button>

                    <Button
                      type="button"
                      variant={!hasMicrochip ? 'default' : 'outline'}
                      onClick={() => {
                        setHasMicrochip(false)
                        setMicrochipNumber('')
                        setConfirmMicrochipNumber('')
                      }}
                      className="rounded-2xl"
                    >
                      No tiene microchip
                    </Button>
                  </div>
                </div>

                {hasMicrochip ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="microchipNumber">
                        Número de microchip
                      </Label>
                      <Input
                        id="microchipNumber"
                        value={microchipNumber}
                        onChange={(e) => setMicrochipNumber(e.target.value)}
                        placeholder="985000000000001"
                        required={hasMicrochip}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmMicrochipNumber">
                        Confirmar microchip
                      </Label>
                      <Input
                        id="confirmMicrochipNumber"
                        value={confirmMicrochipNumber}
                        onChange={(e) =>
                          setConfirmMicrochipNumber(e.target.value)
                        }
                        placeholder="985000000000001"
                        required={hasMicrochip}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-sky-100 bg-sky-50 p-4">
                    <p className="text-sm font-semibold text-sky-950">
                      RAMX generará un ID interno
                    </p>
                    <p className="mt-1 text-sm leading-6 text-sky-800">
                      Podrás usar ese ID para el perfil público, QR o placa
                      mientras decides si más adelante agregas microchip.
                    </p>
                  </div>
                )}
              </section>

              <section className="space-y-4 rounded-[28px] border border-neutral-200 bg-neutral-50/80 p-5">
                <SectionTitle
                  title="Información de la mascota"
                  description="Estos datos ayudan a identificarla si alguien escanea su perfil público."
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="species">Especie</Label>
                    <select
                      id="species"
                      value={species}
                      onChange={(e) => setSpecies(e.target.value)}
                      className={selectClass}
                      required
                    >
                      <option value="Perro">Perro</option>
                      <option value="Gato">Gato</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="breed">Raza</Label>
                    <Input
                      id="breed"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      placeholder="French Poodle"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sex">Sexo</Label>
                    <select
                      id="sex"
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="Macho">Macho</option>
                      <option value="Hembra">Hembra</option>
                      <option value="No especificado">No especificado</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>¿Mascota esterilizada?</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant={
                          isSterilized === 'true' ? 'default' : 'outline'
                        }
                        onClick={() => setIsSterilized('true')}
                        className="rounded-2xl"
                      >
                        Sí
                      </Button>

                      <Button
                        type="button"
                        variant={
                          isSterilized === 'false' ? 'default' : 'outline'
                        }
                        onClick={() => setIsSterilized('false')}
                        className="rounded-2xl"
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="Blanco con café"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="petPhotos">Fotos de tu mascota</Label>
                  <Input
                    id="petPhotos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotosChange}
                  />
                  <p className="text-xs leading-5 text-neutral-500">
                    Puedes subir hasta 5 fotos. La primera será usada como foto
                    principal.
                  </p>
                </div>
              </section>

              <section className="space-y-4 rounded-[28px] border border-neutral-200 bg-neutral-50/80 p-5">
                <SectionTitle
                  title="Información del tutor"
                  description="Tus datos de contacto se usarán para alertas, recuperación y comunicación segura."
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input value={profile?.full_name || ''} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label>Correo</Label>
                    <Input value={profile?.email || ''} disabled />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="countryCode">Lada</Label>
                    <Input
                      id="countryCode"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      placeholder="+52"
                      required
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="2221234567"
                      required
                    />
                  </div>
                </div>

                <MexicoLocationSelect
                  required
                  labelPrefix="Tutor"
                  stateCode={stateCode}
                  stateName={stateName}
                  municipalityCode={municipalityCode}
                  municipalityName={municipality}
                  onChange={(value) => {
                    setStateCode(value.stateCode)
                    setStateName(value.stateName)
                    setMunicipalityCode(value.municipalityCode)
                    setMunicipality(value.municipalityName)
                  }}
                />
              </section>

              <section className="space-y-4 rounded-[28px] border border-neutral-200 bg-neutral-50/80 p-5">
                <SectionTitle
                  title="Veterinaria relacionada"
                  description="Opcional. Sirve para iniciar la conexión con clínicas o doctores en una siguiente fase."
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vetClinicName">
                      Nombre de la veterinaria
                    </Label>
                    <Input
                      id="vetClinicName"
                      value={vetClinicName}
                      onChange={(e) => setVetClinicName(e.target.value)}
                      placeholder="Clínica Vet Centro"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vetPhone">Teléfono</Label>
                    <Input
                      id="vetPhone"
                      value={vetPhone}
                      onChange={(e) => setVetPhone(e.target.value)}
                      placeholder="2229876543"
                    />
                  </div>
                </div>

                <MexicoLocationSelect
                  labelPrefix="Veterinaria"
                  stateCode={vetStateCode}
                  stateName={vetState}
                  municipalityCode={vetMunicipalityCode}
                  municipalityName={vetMunicipality}
                  onChange={(value) => {
                    setVetStateCode(value.stateCode)
                    setVetState(value.stateName)
                    setVetMunicipalityCode(value.municipalityCode)
                    setVetMunicipality(value.municipalityName)
                  }}
                />
              </section>

              {message ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {message}
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full rounded-2xl bg-neutral-950 py-6 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
                disabled={saving}
              >
                {saving ? 'Registrando...' : 'Registrar mascota'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function SectionTitle({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p>
    </div>
  )
}

function getSafeExtension(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase()

  if (!ext || ext.length > 8) return 'jpg'

  return ext.replace(/[^a-z0-9]/g, '') || 'jpg'
}

const selectClass =
  'w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500'