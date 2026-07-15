'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

type LocationValue = {
  stateCode: string
  stateName: string
  municipalityCode: string
  municipalityName: string
}

type Props = {
  labelPrefix?: string
  required?: boolean
  stateCode: string
  stateName: string
  municipalityCode: string
  municipalityName: string
  onChange: (value: LocationValue) => void
}

export default function MexicoLocationSelect({
  labelPrefix,
  required = false,
  stateCode,
  stateName,
  municipalityCode,
  municipalityName,
  onChange,
}: Props) {
  const stateLabel = labelPrefix
    ? `${labelPrefix} · Estado / provincia`
    : 'Estado / provincia'

  const municipalityLabel = labelPrefix
    ? `${labelPrefix} · Municipio / ciudad`
    : 'Municipio / ciudad'

  const handleStateChange = (nextStateName: string) => {
    const cleanState = cleanDisplayName(nextStateName)

    onChange({
      stateCode: cleanState ? buildManualCode('state', cleanState) : '',
      stateName: nextStateName,
      municipalityCode,
      municipalityName,
    })
  }

  const handleMunicipalityChange = (nextMunicipalityName: string) => {
    const cleanMunicipality = cleanDisplayName(nextMunicipalityName)

    onChange({
      stateCode,
      stateName,
      municipalityCode: cleanMunicipality
        ? buildManualCode('city', cleanMunicipality)
        : '',
      municipalityName: nextMunicipalityName,
    })
  }

  const normalizeOnBlur = () => {
    const cleanState = cleanDisplayName(stateName)
    const cleanMunicipality = cleanDisplayName(municipalityName)

    onChange({
      stateCode: cleanState ? buildManualCode('state', cleanState) : '',
      stateName: cleanState,
      municipalityCode: cleanMunicipality
        ? buildManualCode('city', cleanMunicipality)
        : '',
      municipalityName: cleanMunicipality,
    })
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={inputId(labelPrefix, 'state')}>{stateLabel}</Label>
        <Input
          id={inputId(labelPrefix, 'state')}
          value={stateName}
          onChange={(event) => handleStateChange(event.target.value)}
          onBlur={normalizeOnBlur}
          placeholder="Ej. Puebla, California, Madrid"
          autoComplete="address-level1"
          aria-required={required}
          className="rounded-2xl"
        />
        <input
          type="hidden"
          name={`${labelPrefix || 'location'}_state_code`}
          value={stateCode}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={inputId(labelPrefix, 'municipality')}>
          {municipalityLabel}
        </Label>
        <Input
          id={inputId(labelPrefix, 'municipality')}
          value={municipalityName}
          onChange={(event) => handleMunicipalityChange(event.target.value)}
          onBlur={normalizeOnBlur}
          placeholder="Ej. Puebla, Zapopan, Austin"
          autoComplete="address-level2"
          aria-required={required}
          className="rounded-2xl"
        />
        <input
          type="hidden"
          name={`${labelPrefix || 'location'}_municipality_code`}
          value={municipalityCode}
        />
      </div>

      <p className="sm:col-span-2 rounded-2xl border border-neutral-200 bg-white/70 px-4 py-3 text-xs leading-5 text-neutral-500">
        Ubicación capturada manualmente para que RAMX pueda funcionar dentro y
        fuera de México sin depender de catálogos externos.
      </p>
    </div>
  )
}

function inputId(labelPrefix: string | undefined, field: string) {
  return `${labelPrefix || 'location'}-${field}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
}

function cleanDisplayName(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function buildManualCode(prefix: 'state' | 'city', value: string) {
  const slug = normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)

  return slug ? `manual-${prefix}-${slug}` : ''
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
