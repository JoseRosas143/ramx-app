'use client'

import { useState } from 'react'
import { addVaccinationAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type VaccineCatalogItem = {
id: string
species: string
category: string
name: string
brand: string | null
diseases: string | null
suggested_interval: string | null
}

export default function VaccineForm({
petId,
catalog,
}: {
petId: string
catalog: VaccineCatalogItem[]
}) {
const [selected, setSelected] = useState('')
const selectedItem = catalog.find((item) => item.id === selected)
const isOther = selected === 'other'

return (
<form
action={addVaccinationAction}
className="rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-lg sm:p-6"
>
<input type="hidden" name="pet_id" value={petId} />

<div>
<p className="text-lg font-semibold tracking-tight text-neutral-950">
Agregar vacuna
</p>
<p className="mt-1 text-sm leading-6 text-neutral-600">
Registra una vacuna aplicada y su próxima fecha sugerida.
</p>
</div>

<div className="mt-6 grid gap-4 sm:grid-cols-2">
<div className="space-y-2 sm:col-span-2">
<Label htmlFor="catalog_id">Vacuna</Label>
<select
id="catalog_id"
name="catalog_id"
value={selected}
onChange={(e) => setSelected(e.target.value)}
required
className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none"
>
<option value="">Selecciona una vacuna</option>

{catalog.map((item) => (
<option key={item.id} value={item.id}>
{item.species} · {item.category} · {item.name}
{item.brand ? ` (${item.brand})` : ''}
</option>
))}

<option value="other">Otra / No aparece en catálogo</option>
</select>

{selectedItem ? (
<p className="rounded-2xl bg-neutral-50 p-3 text-xs leading-5 text-neutral-600">
{selectedItem.diseases ? `Cubre: ${selectedItem.diseases}. ` : ''}
{selectedItem.suggested_interval
? `Intervalo sugerido: ${selectedItem.suggested_interval}.`
: ''}
</p>
) : null}
</div>

{isOther ? (
<div className="space-y-2 sm:col-span-2">
<Label htmlFor="custom_vaccine_name">Nombre de la vacuna</Label>
<Input
id="custom_vaccine_name"
name="custom_vaccine_name"
placeholder="Ej. Vacuna aplicada por veterinario"
required={isOther}
/>
</div>
) : null}

<div className="space-y-2">
<Label htmlFor="applied_date">Fecha aplicada</Label>
<Input id="applied_date" name="applied_date" type="date" required />
</div>

<div className="space-y-2">
<Label htmlFor="next_due_date">Próxima dosis</Label>
<Input id="next_due_date" name="next_due_date" type="date" />
</div>

<div className="space-y-2">
<Label htmlFor="batch_number">Lote</Label>
<Input id="batch_number" name="batch_number" placeholder="Opcional" />
</div>

<div className="space-y-2">
<Label htmlFor="veterinarian_name">Veterinario</Label>
<Input id="veterinarian_name" name="veterinarian_name" placeholder="Opcional" />
</div>

<div className="space-y-2">
<Label htmlFor="clinic_name">Clínica</Label>
<Input id="clinic_name" name="clinic_name" placeholder="Opcional" />
</div>

<div className="space-y-2 sm:col-span-2">
<Label htmlFor="notes">Notas</Label>
<Input
id="notes"
name="notes"
placeholder="Ej. Aplicada sin reacción adversa"
/>
</div>
</div>

<div className="mt-6 flex justify-end">
<Button
type="submit"
className="rounded-2xl bg-neutral-950 px-6 text-white hover:bg-neutral-800"
>
Guardar vacuna
</Button>
</div>
</form>
)
} 