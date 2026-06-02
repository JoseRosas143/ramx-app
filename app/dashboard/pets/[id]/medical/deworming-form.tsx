'use client'

import { useMemo, useState } from 'react'
import { addDewormingAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type DewormerCatalogItem = {
  id: string
  species: string
  category: string
  name: string
  brand: string | null
  active_ingredient: string | null
  target_parasites: string | null
  suggested_interval: string | null
}

export default function DewormingForm({
  petId,
  petSpecies,
  catalog,
}: {
  petId: string
  petSpecies: string | null
  catalog: DewormerCatalogItem[]
}) {
  const normalizedSpecies = petSpecies?.toLowerCase() || ''
  const defaultSpeciesFilter =
    normalizedSpecies.includes('gato') || normalizedSpecies.includes('felino')
      ? 'Gato'
      : normalizedSpecies.includes('perro') || normalizedSpecies.includes('canino')
        ? 'Perro'
        : 'Todos'

  const [speciesFilter, setSpeciesFilter] = useState(defaultSpeciesFilter)
  const [categoryFilter, setCategoryFilter] = useState('Todos')
  const [selected, setSelected] = useState('')

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const matchesSpecies =
        speciesFilter === 'Todos' || item.species === speciesFilter

      const matchesCategory =
        categoryFilter === 'Todos' || item.category === categoryFilter

      return matchesSpecies && matchesCategory
    })
  }, [catalog, speciesFilter, categoryFilter])

  const categories = useMemo(() => {
    const values = catalog
      .filter((item) => speciesFilter === 'Todos' || item.species === speciesFilter)
      .map((item) => item.category)

    return Array.from(new Set(values)).sort()
  }, [catalog, speciesFilter])

  const selectedItem = catalog.find((item) => item.id === selected)
  const isOther = selected === 'other'

  return (
    <form
      action={addDewormingAction}
      className="rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-lg sm:p-6"
    >
      <input type="hidden" name="pet_id" value={petId} />

      <div>
        <p className="text-lg font-semibold tracking-tight text-neutral-950">
          Agregar desparasitación
        </p>
        <p className="mt-1 text-sm leading-6 text-neutral-600">
          Registra desparasitación interna, externa o combinada. Esto alimenta el estado público de salud.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="species_filter">Especie</Label>
          <select
            id="species_filter"
            value={speciesFilter}
            onChange={(e) => {
              setSpeciesFilter(e.target.value)
              setSelected('')
              setCategoryFilter('Todos')
            }}
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none"
          >
            <option value="Todos">Todas</option>
            <option value="Perro">Perro</option>
            <option value="Gato">Gato</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category_filter">Tipo</Label>
          <select
            id="category_filter"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setSelected('')
            }}
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none"
          >
            <option value="Todos">Todos</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="catalog_id">Desparasitante</Label>
          <select
            id="catalog_id"
            name="catalog_id"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            required
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none"
          >
            <option value="">Selecciona un desparasitante</option>

            {filteredCatalog.map((item) => (
              <option key={item.id} value={item.id}>
                {item.species} · {item.category} · {item.name}
                {item.brand ? ` (${item.brand})` : ''}
              </option>
            ))}

            <option value="other">Otro / No aparece en catálogo</option>
          </select>

          {selectedItem ? (
            <div className="rounded-2xl bg-neutral-50 p-3 text-xs leading-5 text-neutral-600">
              {selectedItem.active_ingredient ? (
                <p>
                  <strong>Principio activo:</strong> {selectedItem.active_ingredient}
                </p>
              ) : null}

              {selectedItem.target_parasites ? (
                <p>
                  <strong>Cubre:</strong> {selectedItem.target_parasites}
                </p>
              ) : null}

              {selectedItem.suggested_interval ? (
                <p>
                  <strong>Intervalo sugerido:</strong> {selectedItem.suggested_interval}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {isOther ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="custom_dewormer_name">Nombre del desparasitante</Label>
              <Input
                id="custom_dewormer_name"
                name="custom_dewormer_name"
                placeholder="Ej. Desparasitante aplicado por veterinario"
                required={isOther}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_category">Tipo</Label>
              <select
                id="custom_category"
                name="custom_category"
                required={isOther}
                className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none"
              >
                <option value="">Selecciona tipo</option>
                <option value="Interno">Interno</option>
                <option value="Externo">Externo</option>
                <option value="Combinado">Combinado</option>
              </select>
            </div>
          </>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="applied_date">Fecha aplicada</Label>
          <Input id="applied_date" name="applied_date" type="date" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="next_due_date">Próxima aplicación</Label>
          <Input id="next_due_date" name="next_due_date" type="date" />
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
          <Input id="clinic_name" name="clinic_name" placeholder="Opcional" />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <Input
            id="notes"
            name="notes"
            placeholder="Ej. Aplicado según peso, sin reacción adversa"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          className="rounded-2xl bg-neutral-950 px-6 text-white hover:bg-neutral-800"
        >
          Guardar desparasitación
        </Button>
      </div>
    </form>
  )
}
