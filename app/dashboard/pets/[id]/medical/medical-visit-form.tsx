'use client'

import { addMedicalVisitAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function MedicalVisitForm({ petId }: { petId: string }) {
  return (
    <form action={addMedicalVisitAction} className="space-y-5">
      <input type="hidden" name="pet_id" value={petId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="visit_date">Fecha de consulta</Label>
          <Input id="visit_date" name="visit_date" type="date" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Motivo de consulta</Label>
          <Input
            id="reason"
            name="reason"
            placeholder="Ej. Vómito, revisión general, cojera..."
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="diagnosis">Diagnóstico</Label>
          <Input
            id="diagnosis"
            name="diagnosis"
            placeholder="Ej. Gastroenteritis, dermatitis, revisión normal..."
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="treatment">Tratamiento</Label>
          <Input
            id="treatment"
            name="treatment"
            placeholder="Ej. Antiemético, dieta blanda, antibiótico..."
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="prescription">Receta / indicaciones</Label>
          <Input
            id="prescription"
            name="prescription"
            placeholder="Ej. Medicamento cada 12 h por 5 días..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight_kg">Peso en consulta (kg)</Label>
          <Input
            id="weight_kg"
            name="weight_kg"
            type="number"
            step="0.01"
            placeholder="Ej. 12.4"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="temperature_c">Temperatura (°C)</Label>
          <Input
            id="temperature_c"
            name="temperature_c"
            type="number"
            step="0.1"
            placeholder="Ej. 38.5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="veterinarian_name">Veterinario</Label>
          <Input
            id="veterinarian_name"
            name="veterinarian_name"
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clinic_name">Clínica</Label>
          <Input
            id="clinic_name"
            name="clinic_name"
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notas clínicas</Label>
          <Input
            id="notes"
            name="notes"
            placeholder="Observaciones adicionales"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          className="rounded-2xl bg-neutral-950 px-6 text-white hover:bg-neutral-800"
        >
          Guardar consulta
        </Button>
      </div>
    </form>
  )
}