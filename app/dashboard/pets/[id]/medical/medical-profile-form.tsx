'use client'

import { upsertMedicalProfileAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type MedicalProfile = {
  id: string
  pet_id: string
  weight_kg: number | null
  blood_type: string | null
  allergies: string | null
  chronic_conditions: string | null
  current_medications: string | null
  special_care_notes: string | null
  emergency_notes: string | null
  primary_vet_name: string | null
  primary_vet_clinic: string | null
  primary_vet_phone: string | null
}

export default function MedicalProfileForm({
  petId,
  medicalProfile,
}: {
  petId: string
  medicalProfile: MedicalProfile | null
}) {
  return (
    <form action={upsertMedicalProfileAction} className="space-y-5">
      <input type="hidden" name="pet_id" value={petId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="weight_kg">Peso actual (kg)</Label>
          <Input
            id="weight_kg"
            name="weight_kg"
            type="number"
            step="0.01"
            defaultValue={medicalProfile?.weight_kg ?? ''}
            placeholder="Ej. 12.5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="blood_type">Tipo de sangre</Label>
          <Input
            id="blood_type"
            name="blood_type"
            defaultValue={medicalProfile?.blood_type ?? ''}
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="allergies">Alergias</Label>
          <Input
            id="allergies"
            name="allergies"
            defaultValue={medicalProfile?.allergies ?? ''}
            placeholder="Ej. Penicilina, alimento específico..."
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="chronic_conditions">Enfermedades crónicas</Label>
          <Input
            id="chronic_conditions"
            name="chronic_conditions"
            defaultValue={medicalProfile?.chronic_conditions ?? ''}
            placeholder="Ej. Diabetes, epilepsia, cardiopatía..."
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="current_medications">Medicamentos actuales</Label>
          <Input
            id="current_medications"
            name="current_medications"
            defaultValue={medicalProfile?.current_medications ?? ''}
            placeholder="Ej. Insulina cada 12 h..."
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="special_care_notes">Cuidados especiales</Label>
          <Input
            id="special_care_notes"
            name="special_care_notes"
            defaultValue={medicalProfile?.special_care_notes ?? ''}
            placeholder="Ej. No darle croquetas, requiere alimento especial..."
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="emergency_notes">Notas de emergencia</Label>
          <Input
            id="emergency_notes"
            name="emergency_notes"
            defaultValue={medicalProfile?.emergency_notes ?? ''}
            placeholder="Ej. En caso de crisis contactar al veterinario..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primary_vet_name">Veterinario principal</Label>
          <Input
            id="primary_vet_name"
            name="primary_vet_name"
            defaultValue={medicalProfile?.primary_vet_name ?? ''}
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primary_vet_clinic">Clínica</Label>
          <Input
            id="primary_vet_clinic"
            name="primary_vet_clinic"
            defaultValue={medicalProfile?.primary_vet_clinic ?? ''}
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="primary_vet_phone">Teléfono veterinario</Label>
          <Input
            id="primary_vet_phone"
            name="primary_vet_phone"
            defaultValue={medicalProfile?.primary_vet_phone ?? ''}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          className="rounded-2xl bg-neutral-950 px-6 text-white hover:bg-neutral-800"
        >
          Guardar resumen clínico
        </Button>
      </div>
    </form>
  )
}