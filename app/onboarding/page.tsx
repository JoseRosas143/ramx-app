'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  country_code: string | null
  state: string | null
  municipality: string | null
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
  const [municipality, setMunicipality] = useState('')

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
  const [vetMunicipality, setVetMunicipality] = useState('')

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
        .select('id, full_name, email, phone, country_code, state, municipality, onboarding_completed')
        .eq('id', user.id)
        .single()

      if (error || !profileData) {
        setMessage('No se pudo cargar tu perfil.')
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
      setMunicipality(profileData.municipality || '')
      setLoading(false)
    }

    load()
  }, [router, supabase])

  const handlePhotosChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPetPhotos(files.slice(0, 5))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setMessage('')

    if (hasMicrochip && microchipNumber.trim() !== confirmMicrochipNumber.trim()) {
      setMessage('Los números de microchip no coinciden.')
      setSaving(false)
      return
    }

    let coverPhotoUrl: string | null = null

    if (petPhotos.length > 0) {
      const firstPhoto = petPhotos[0]
      const fileExt = firstPhoto.name.split('.').pop()
      const filePath = `${profile.id}/${Date.now()}-cover.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(filePath, firstPhoto, { upsert: false })

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

    const { data: petData, error: petError } = await supabase.rpc('create_pet_with_defaults', {
      p_primary_tutor_profile_id: profile.id,
      p_name: petName,
      p_species: species,
      p_breed: breed || null,
      p_sex: sex || null,
      p_birth_date: birthDate || null,
      p_color: color || null,
      p_weight_kg: null,
      p_is_sterilized: isSterilized === '' ? null : isSterilized === 'true',
      p_description: null,
      p_medical_alerts: null,
      p_profile_photo_url: coverPhotoUrl,
      p_microchip_number: hasMicrochip ? microchipNumber : null,
      p_has_microchip: hasMicrochip,
    })

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

    if (petPhotos.length > 1) {
      for (let i = 1; i < petPhotos.length; i++) {
        const photo = petPhotos[i]
        const fileExt = photo.name.split('.').pop()
        const filePath = `${profile.id}/${Date.now()}-${i}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(filePath, photo, { upsert: false })

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

    if (coverPhotoUrl) {
      await supabase.from('pet_photos').insert({
        pet_id: createdPet.id,
        uploaded_by_profile_id: profile.id,
        file_url: coverPhotoUrl,
        is_cover: true,
        sort_order: 0,
      })
    }

    if (vetClinicName || vetPhone || vetState || vetMunicipality) {
      await supabase.from('pet_onboarding_vet_interest').insert({
        pet_id: createdPet.id,
        clinic_name: vetClinicName || null,
        phone: vetPhone || null,
        state: vetState || null,
        municipality: vetMunicipality || null,
      })
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        country_code: countryCode,
        phone,
        state: stateName,
        municipality,
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
      <main className="min-h-screen bg-neutral-50 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center text-neutral-600">
          Cargando onboarding...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <Card className="rounded-3xl border-neutral-200 bg-white shadow-sm">
          <CardContent className="p-8">
            <p className="text-sm text-neutral-500">Primer acceso</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Completa tu registro RAMX
            </h1>
            <p className="mt-3 text-neutral-600">
              Onboarding v2 alineado al flujo real de registro animal.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
              <section className="space-y-4">
                <h2 className="text-lg font-medium">Identificación</h2>

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
                  <div className="flex gap-3">
                    <Button type="button" variant={hasMicrochip ? 'default' : 'outline'} onClick={() => setHasMicrochip(true)}>
                      Sí
                    </Button>
                    <Button type="button" variant={!hasMicrochip ? 'default' : 'outline'} onClick={() => setHasMicrochip(false)}>
                      No
                    </Button>
                  </div>
                </div>

                {hasMicrochip ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="microchipNumber">Número de microchip</Label>
                      <Input
                        id="microchipNumber"
                        value={microchipNumber}
                        onChange={(e) => setMicrochipNumber(e.target.value)}
                        placeholder="985000000000001"
                        required={hasMicrochip}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmMicrochipNumber">Confirmar microchip</Label>
                      <Input
                        id="confirmMicrochipNumber"
                        value={confirmMicrochipNumber}
                        onChange={(e) => setConfirmMicrochipNumber(e.target.value)}
                        placeholder="985000000000001"
                        required={hasMicrochip}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-neutral-500">
                    Se generará un número de identificación interno para tu mascota. Esto replica y mejora el flujo de “sin microchip” del registro actual. 
                  </p>
                )}
              </section>

              <section className="space-y-4">
                <h2 className="text-lg font-medium">Información de la mascota</h2>

                <div className="space-y-2">
                  <Label htmlFor="species">Especie</Label>
                  <Input id="species" value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Perro" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breed">Raza</Label>
                  <Input id="breed" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="French Poodle" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sex">Sexo</Label>
                  <Input id="sex" value={sex} onChange={(e) => setSex(e.target.value)} placeholder="Macho / Hembra" />
                </div>

                <div className="space-y-2">
                  <Label>¿Mascota esterilizada?</Label>
                  <div className="flex gap-3">
                    <Button type="button" variant={isSterilized === 'true' ? 'default' : 'outline'} onClick={() => setIsSterilized('true')}>
                      Sí
                    </Button>
                    <Button type="button" variant={isSterilized === 'false' ? 'default' : 'outline'} onClick={() => setIsSterilized('false')}>
                      No
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                  <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Blanco con café" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="petPhotos">Fotos de tu mascota (máx. 5)</Label>
                  <Input id="petPhotos" type="file" accept="image/*" multiple onChange={handlePhotosChange} />
                  <p className="text-xs text-neutral-500">
                    Se parece al flujo del sitio actual, que permite varias fotos de la mascota.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-lg font-medium">Información del tutor</h2>

                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={profile?.full_name || ''} disabled />
                </div>

                <div className="space-y-2">
                  <Label>Correo</Label>
                  <Input value={profile?.email || ''} disabled />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="countryCode">Lada</Label>
                    <Input id="countryCode" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} placeholder="+52" required />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="2221234567" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stateName">Estado</Label>
                  <Input id="stateName" value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="Puebla" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="municipality">Municipio</Label>
                  <Input id="municipality" value={municipality} onChange={(e) => setMunicipality(e.target.value)} placeholder="Puebla" required />
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-lg font-medium">Información de la veterinaria (opcional)</h2>

                <div className="space-y-2">
                  <Label htmlFor="vetClinicName">Nombre de la veterinaria</Label>
                  <Input id="vetClinicName" value={vetClinicName} onChange={(e) => setVetClinicName(e.target.value)} placeholder="Clínica Vet Centro" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vetPhone">Teléfono</Label>
                  <Input id="vetPhone" value={vetPhone} onChange={(e) => setVetPhone(e.target.value)} placeholder="2229876543" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vetState">Estado</Label>
                  <Input id="vetState" value={vetState} onChange={(e) => setVetState(e.target.value)} placeholder="Puebla" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vetMunicipality">Municipio</Label>
                  <Input id="vetMunicipality" value={vetMunicipality} onChange={(e) => setVetMunicipality(e.target.value)} placeholder="Puebla" />
                </div>
              </section>

              {message && <p className="text-sm text-red-600">{message}</p>}

              <Button
                type="submit"
                className="w-full rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
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