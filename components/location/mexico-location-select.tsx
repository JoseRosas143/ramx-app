'use client'

import { useEffect, useMemo, useState } from 'react'
import { Label } from '@/components/ui/label'

type StateOption = {
  code: string
  fullCode: string
  name: string
  abbreviation?: string | null
}

type MunicipalityOption = {
  code: string
  stateCode: string
  fullCode: string
  name: string
}

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

type PickerMode = 'state' | 'municipality'

const MEXICO_STATE_FALLBACK: StateOption[] = [
  { code: '01', fullCode: '01', name: 'Aguascalientes', abbreviation: 'Ags.' },
  { code: '02', fullCode: '02', name: 'Baja California', abbreviation: 'BC' },
  { code: '03', fullCode: '03', name: 'Baja California Sur', abbreviation: 'BCS' },
  { code: '04', fullCode: '04', name: 'Campeche', abbreviation: 'Camp.' },
  { code: '05', fullCode: '05', name: 'Coahuila de Zaragoza', abbreviation: 'Coah.' },
  { code: '06', fullCode: '06', name: 'Colima', abbreviation: 'Col.' },
  { code: '07', fullCode: '07', name: 'Chiapas', abbreviation: 'Chis.' },
  { code: '08', fullCode: '08', name: 'Chihuahua', abbreviation: 'Chih.' },
  { code: '09', fullCode: '09', name: 'Ciudad de México', abbreviation: 'CDMX' },
  { code: '10', fullCode: '10', name: 'Durango', abbreviation: 'Dgo.' },
  { code: '11', fullCode: '11', name: 'Guanajuato', abbreviation: 'Gto.' },
  { code: '12', fullCode: '12', name: 'Guerrero', abbreviation: 'Gro.' },
  { code: '13', fullCode: '13', name: 'Hidalgo', abbreviation: 'Hgo.' },
  { code: '14', fullCode: '14', name: 'Jalisco', abbreviation: 'Jal.' },
  { code: '15', fullCode: '15', name: 'México', abbreviation: 'Méx.' },
  { code: '16', fullCode: '16', name: 'Michoacán de Ocampo', abbreviation: 'Mich.' },
  { code: '17', fullCode: '17', name: 'Morelos', abbreviation: 'Mor.' },
  { code: '18', fullCode: '18', name: 'Nayarit', abbreviation: 'Nay.' },
  { code: '19', fullCode: '19', name: 'Nuevo León', abbreviation: 'NL' },
  { code: '20', fullCode: '20', name: 'Oaxaca', abbreviation: 'Oax.' },
  { code: '21', fullCode: '21', name: 'Puebla', abbreviation: 'Pue.' },
  { code: '22', fullCode: '22', name: 'Querétaro', abbreviation: 'Qro.' },
  { code: '23', fullCode: '23', name: 'Quintana Roo', abbreviation: 'Q. Roo' },
  { code: '24', fullCode: '24', name: 'San Luis Potosí', abbreviation: 'SLP' },
  { code: '25', fullCode: '25', name: 'Sinaloa', abbreviation: 'Sin.' },
  { code: '26', fullCode: '26', name: 'Sonora', abbreviation: 'Son.' },
  { code: '27', fullCode: '27', name: 'Tabasco', abbreviation: 'Tab.' },
  { code: '28', fullCode: '28', name: 'Tamaulipas', abbreviation: 'Tamps.' },
  { code: '29', fullCode: '29', name: 'Tlaxcala', abbreviation: 'Tlax.' },
  { code: '30', fullCode: '30', name: 'Veracruz de Ignacio de la Llave', abbreviation: 'Ver.' },
  { code: '31', fullCode: '31', name: 'Yucatán', abbreviation: 'Yuc.' },
  { code: '32', fullCode: '32', name: 'Zacatecas', abbreviation: 'Zac.' },
]

export default function MexicoLocationSelect({
  labelPrefix,
  required = false,
  stateCode,
  stateName,
  municipalityCode,
  municipalityName,
  onChange,
}: Props) {
  const [states, setStates] = useState<StateOption[]>(MEXICO_STATE_FALLBACK)
  const [municipalities, setMunicipalities] = useState<MunicipalityOption[]>([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false)
  const [error, setError] = useState('')
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null)
  const [query, setQuery] = useState('')

  const normalizedStateName = useMemo(
    () => normalizeText(stateName),
    [stateName]
  )

  const normalizedMunicipalityName = useMemo(
    () => normalizeText(municipalityName),
    [municipalityName]
  )

  const filteredStates = useMemo(() => {
    const normalizedQuery = normalizeText(query)

    if (!normalizedQuery) return states

    return states.filter((item) =>
      normalizeText(`${item.name} ${item.abbreviation || ''}`).includes(
        normalizedQuery
      )
    )
  }, [query, states])

  const filteredMunicipalities = useMemo(() => {
    const normalizedQuery = normalizeText(query)

    if (!normalizedQuery) return municipalities

    return municipalities.filter((item) =>
      normalizeText(item.name).includes(normalizedQuery)
    )
  }, [municipalities, query])

  useEffect(() => {
    let cancelled = false

    const loadStates = async () => {
      setLoadingStates(true)
      setError('')

      try {
        const response = await fetch('/api/geo/mexico', {
          cache: 'no-store',
        })
        const payload = await response.json()

        if (!response.ok || !payload.ok) {
          throw new Error(payload.message || 'No se pudieron cargar los estados.')
        }

        const remoteStates = Array.isArray(payload.items) ? payload.items : []
        const nextStates = mergeStates(remoteStates)

        if (!cancelled) {
          setStates(nextStates)
        }
      } catch (loadError) {
        console.error('Load states error:', loadError)

        if (!cancelled) {
          setStates(MEXICO_STATE_FALLBACK)
          setError('Usaremos el catálogo local de estados mientras se restablece el servicio de ubicación.')
        }
      } finally {
        if (!cancelled) {
          setLoadingStates(false)
        }
      }
    }

    loadStates()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (stateCode || !normalizedStateName || states.length === 0) return

    const found = states.find(
      (item) => normalizeText(item.name) === normalizedStateName
    )

    if (found) {
      onChange({
        stateCode: found.code,
        stateName: found.name,
        municipalityCode,
        municipalityName,
      })
    }
  }, [
    stateCode,
    normalizedStateName,
    states,
    municipalityCode,
    municipalityName,
    onChange,
  ])

  useEffect(() => {
    if (!stateCode) {
      setMunicipalities([])
      return
    }

    let cancelled = false

    const loadMunicipalities = async () => {
      setLoadingMunicipalities(true)
      setError('')

      try {
        const response = await fetch(
          `/api/geo/mexico?stateCode=${encodeURIComponent(stateCode)}`,
          { cache: 'no-store' }
        )
        const payload = await response.json()

        if (!response.ok || !payload.ok) {
          throw new Error(
            payload.message || 'No se pudieron cargar los municipios.'
          )
        }

        if (!cancelled) {
          setMunicipalities(Array.isArray(payload.items) ? payload.items : [])
        }
      } catch (loadError) {
        console.error('Load municipalities error:', loadError)

        if (!cancelled) {
          setError('No se pudieron cargar los municipios. Puedes escribirlo manualmente en el selector.')
          setMunicipalities([])
        }
      } finally {
        if (!cancelled) {
          setLoadingMunicipalities(false)
        }
      }
    }

    loadMunicipalities()

    return () => {
      cancelled = true
    }
  }, [stateCode])

  useEffect(() => {
    if (
      municipalityCode ||
      !normalizedMunicipalityName ||
      municipalities.length === 0
    ) {
      return
    }

    const found = municipalities.find(
      (item) => normalizeText(item.name) === normalizedMunicipalityName
    )

    if (found) {
      onChange({
        stateCode,
        stateName,
        municipalityCode: found.code,
        municipalityName: found.name,
      })
    }
  }, [
    municipalityCode,
    normalizedMunicipalityName,
    municipalities,
    stateCode,
    stateName,
    onChange,
  ])

  useEffect(() => {
    if (!pickerMode) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePicker()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [pickerMode])

  const openPicker = (mode: PickerMode) => {
    if (mode === 'state' && loadingStates && states.length === 0) return
    if (mode === 'municipality' && (!stateCode || loadingMunicipalities)) return

    setQuery('')
    setPickerMode(mode)
  }

  const closePicker = () => {
    setPickerMode(null)
    setQuery('')
  }

  const selectState = (state: StateOption) => {
    onChange({
      stateCode: state.code,
      stateName: state.name,
      municipalityCode: '',
      municipalityName: '',
    })
    closePicker()
  }

  const selectMunicipality = (municipality: MunicipalityOption) => {
    onChange({
      stateCode,
      stateName,
      municipalityCode: municipality.code,
      municipalityName: municipality.name,
    })
    closePicker()
  }

  const selectManualMunicipality = () => {
    const cleanName = cleanDisplayName(query)
    if (!cleanName) return

    onChange({
      stateCode,
      stateName,
      municipalityCode: `manual-${slugify(cleanName)}`.slice(0, 64),
      municipalityName: cleanName,
    })
    closePicker()
  }

  const canUseManualMunicipality =
    pickerMode === 'municipality' &&
    cleanDisplayName(query).length >= 2 &&
    filteredMunicipalities.length === 0

  const stateButtonText = loadingStates && states.length === 0
    ? 'Cargando estados...'
    : stateName || 'Selecciona un estado'

  const municipalityButtonText = !stateCode
    ? 'Primero selecciona un estado'
    : loadingMunicipalities
      ? 'Cargando municipios...'
      : municipalityName || 'Selecciona un municipio'

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>{labelPrefix ? `${labelPrefix} · Estado` : 'Estado'}</Label>

        <LocationButton
          label={stateButtonText}
          disabled={loadingStates && states.length === 0}
          selected={Boolean(stateCode)}
          onClick={() => openPicker('state')}
        />

        <input
          type="hidden"
          name={`${labelPrefix || 'location'}_state_code`}
          value={stateCode}
          aria-required={required}
        />
      </div>

      <div className="space-y-2">
        <Label>{labelPrefix ? `${labelPrefix} · Municipio` : 'Municipio'}</Label>

        <LocationButton
          label={municipalityButtonText}
          disabled={!stateCode || loadingMunicipalities}
          selected={Boolean(municipalityCode)}
          onClick={() => openPicker('municipality')}
        />

        <input
          type="hidden"
          name={`${labelPrefix || 'location'}_municipality_code`}
          value={municipalityCode}
          aria-required={required}
        />
      </div>

      {error ? (
        <p className="sm:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {error}
        </p>
      ) : null}

      {pickerMode ? (
        <div
          className="fixed inset-0 z-[9999] flex items-end bg-black/45 px-3 pb-3 pt-12 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={
            pickerMode === 'state'
              ? 'Seleccionar estado'
              : 'Seleccionar municipio'
          }
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePicker()
            }
          }}
        >
          <div className="flex max-h-[82dvh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl sm:max-h-[74vh]">
            <div className="border-b border-neutral-100 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">
                    RAMX
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-neutral-950">
                    {pickerMode === 'state'
                      ? 'Selecciona un estado'
                      : 'Selecciona un municipio'}
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-neutral-500">
                    {pickerMode === 'state'
                      ? 'Elige el estado del tutor o clínica veterinaria.'
                      : `Municipios disponibles para ${stateName}.`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closePicker}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-xl leading-none text-neutral-500 shadow-sm transition hover:bg-neutral-50 hover:text-neutral-950"
                  aria-label="Cerrar selector"
                >
                  ×
                </button>
              </div>

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  pickerMode === 'state'
                    ? 'Buscar estado...'
                    : 'Buscar municipio...'
                }
                autoFocus
                className="mt-4 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-950 outline-none transition focus:border-neutral-400 focus:bg-white"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {pickerMode === 'state'
                ? filteredStates.map((state) => (
                    <button
                      key={state.code}
                      type="button"
                      onClick={() => selectState(state)}
                      className="flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-neutral-50"
                    >
                      <span className="text-sm font-medium text-neutral-900">
                        {state.name}
                      </span>
                      {state.code === stateCode ? (
                        <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
                          Actual
                        </span>
                      ) : null}
                    </button>
                  ))
                : filteredMunicipalities.map((municipality) => (
                    <button
                      key={municipality.fullCode}
                      type="button"
                      onClick={() => selectMunicipality(municipality)}
                      className="flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-neutral-50"
                    >
                      <span className="text-sm font-medium text-neutral-900">
                        {municipality.name}
                      </span>
                      {municipality.code === municipalityCode ? (
                        <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
                          Actual
                        </span>
                      ) : null}
                    </button>
                  ))}

              {canUseManualMunicipality ? (
                <button
                  type="button"
                  onClick={selectManualMunicipality}
                  className="mt-1 flex w-full items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-neutral-950 px-4 py-3 text-left text-white transition hover:bg-neutral-800"
                >
                  <span className="text-sm font-semibold">
                    Usar “{cleanDisplayName(query)}” como municipio
                  </span>
                  <span className="text-xs text-white/70">Manual</span>
                </button>
              ) : null}

              {(pickerMode === 'state'
                ? filteredStates.length === 0
                : filteredMunicipalities.length === 0 && !canUseManualMunicipality) ? (
                <div className="p-8 text-center text-sm text-neutral-500">
                  {pickerMode === 'state'
                    ? 'No encontramos resultados con esa búsqueda.'
                    : 'No encontramos resultados. Escribe al menos 2 letras para capturarlo manualmente.'}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function LocationButton({
  label,
  disabled,
  selected,
  onClick,
}: {
  label: string
  disabled?: boolean
  selected?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-left text-sm shadow-sm outline-none transition hover:border-neutral-400 hover:bg-neutral-50 focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
    >
      <span className={selected ? 'text-neutral-950' : 'text-neutral-500'}>
        {label}
      </span>
      <span className="text-lg leading-none text-neutral-400" aria-hidden="true">
        ⌄
      </span>
    </button>
  )
}

function mergeStates(remoteStates: StateOption[]) {
  const byCode = new Map<string, StateOption>()

  for (const item of MEXICO_STATE_FALLBACK) {
    byCode.set(item.code, item)
  }

  for (const item of remoteStates) {
    if (!item?.code || !item?.name) continue
    byCode.set(item.code, {
      code: item.code,
      fullCode: item.fullCode || item.code,
      name: item.name,
      abbreviation: item.abbreviation || null,
    })
  }

  return Array.from(byCode.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'es-MX')
  )
}

function cleanDisplayName(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
