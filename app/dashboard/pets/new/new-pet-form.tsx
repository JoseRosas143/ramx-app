'use client'

import { ChangeEvent, useState } from 'react'
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

export default function NewPetForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const supabase = createClient()

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

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
  const [medicalAlerts, setMedicalAlerts] = useState('')
  const [petPhotos, setPetPhotos] = useState<File[]>([])

  const [vetClinicName, setVetClinicName] = useState('')
  const [vetPhone, setVetPhone] = useState('')
  const [vetState, setVetState] = useState(profile.state || '')
  const [vetMunicipality, setVetMunicipality] = useState(profile.municipality || '')

  const handlePhotosChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPetPhotos(files.slice(0, 5))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSaving(true)
    setMessage('')

    if (!petName.trim()) {
      setMessage('Escribe el nombre de la mascota.')
      setSaving(false)
      return
    }

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
      p_name: petName.trim(),
      p_species: species.trim() || 'Mascota',
      p_breed: breed.trim() || null,
      p_sex: sex.trim() || null,
      p_birth_date: birthDate || null,
      p_color: color.trim() || null,
      p_weight_kg: null,
      p_is_sterilized: isSterilized === '' ? null : isSterilized === 'true',
      p_description: null,
      p_medical_alerts: medicalAlerts.trim() || null,
      p_profile_photo_url: coverPhotoUrl,
      p_microchip_number: hasMicrochip ? microchipNumber.trim() : null,
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

    if (vetClinicName || vetPhone || vetState || vetMunicipality) {
      await supabase.from('pet_onboarding_vet_interest').insert({
        pet_id: createdPet.id,
        clinic_name: vetClinicName || null,
        phone: vetPhone || null,
        state: vetState || null,
        municipality: vetMunicipality || null,
      })
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card className="rounded-[32px] border-white/70 bg-white/95 shadow-xl">
      <CardContent className="p-6 sm:p-8">
        <p className="text-sm font-medium text-neutral-500">RAMX · Nueva mascota</p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
          Agregar nueva mascota
        </h1>

        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Registra una mascota adicional en tu cuenta. Después podrás completar su expediente clínico, activar productos físicos y administrar su perfil público.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-neutral-950">Identificación</h2>

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
              <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
                RAMX generará un ID interno para esta mascota. Después podrás vincularle placa QR, NFC o microchip.
              </p>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-neutral-950">Información básica</h2>

            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="color">Color</Label>
                <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Blanco con café" />
              </div>
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
              <Label htmlFor="medicalAlerts">Información médica importante</Label>
              <Input
                id="medicalAlerts"
                value={medicalAlerts}
                onChange={(e) => setMedicalAlerts(e.target.value)}
                placeholder="Ej. alérgica a penicilina, requiere medicamento diario..."
              />
              <p className="text-xs text-neutral-500">
                Esto es solo una alerta rápida. El expediente clínico completo irá en una sección separada.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="petPhotos">Fotos de tu mascota (máx. 5)</Label>
              <Input id="petPhotos" type="file" accept="image/*" multiple onChange={handlePhotosChange} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-neutral-950">Veterinaria habitual opcional</h2>

            <div className="space-y-2">
              <Label htmlFor="vetClinicName">Nombre de la veterinaria</Label>
              <Input id="vetClinicName" value={vetClinicName} onChange={(e) => setVetClinicName(e.target.value)} placeholder="Clínica Vet Centro" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vetPhone">Teléfono</Label>
              <Input id="vetPhone" value={vetPhone} onChange={(e) => setVetPhone(e.target.value)} placeholder="2229876543" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vetState">Estado</Label>
                <Input id="vetState" value={vetState} onChange={(e) => setVetState(e.target.value)} placeholder="Puebla" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vetMunicipality">Municipio</Label>
                <Input id="vetMunicipality" value={vetMunicipality} onChange={(e) => setVetMunicipality(e.target.value)} placeholder="Puebla" />
              </div>
            </div>
          </section>

          {message && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {message}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => router.push('/dashboard')}
              disabled={saving}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              className="rounded-2xl bg-neutral-950 px-6 text-white hover:bg-neutral-800"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar mascota'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}