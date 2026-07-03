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

export default function MexicoLocationSelect({
  labelPrefix,
  required = false,
  stateCode,
  stateName,
  municipalityCode,
  municipalityName,
  onChange,
}: Props) {
  const [states, setStates] = useState<StateOption[]>([])
  const [municipalities, setMunicipalities] = useState<MunicipalityOption[]>([])
  const [loadingStates, setLoadingStates] = useState(true)
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
        const response = await fetch('/api/geo/mexico')
        const payload = await response.json()

        if (!response.ok || !payload.ok) {
          throw new Error(payload.message || 'No se pudieron cargar los estados.')
        }

        if (!cancelled) {
          setStates(payload.items || [])
        }
      } catch (loadError) {
        console.error('Load states error:', loadError)

        if (!cancelled) {
          setError('No se pudieron cargar los estados.')
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
          `/api/geo/mexico?stateCode=${encodeURIComponent(stateCode)}`
        )
        const payload = await response.json()

        if (!response.ok || !payload.ok) {
          throw new Error(
            payload.message || 'No se pudieron cargar los municipios.'
          )
        }

        if (!cancelled) {
          setMunicipalities(payload.items || [])
        }
      } catch (loadError) {
        console.error('Load municipalities error:', loadError)

        if (!cancelled) {
          setError('No se pudieron cargar los municipios.')
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
    if (mode === 'state' && loadingStates) return
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

  const stateButtonText = loadingStates
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
          disabled={loadingStates}
          selected={Boolean(stateCode)}
          onClick={() => openPicker('state')}
        />

        <input
          type="hidden"
          name={`${labelPrefix || 'location'}_state_code`}
          value={stateCode}
          required={required}
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
          required={required}
        />
      </div>

      {error ? (
        <p className="sm:col-span-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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

              {(pickerMode === 'state'
                ? filteredStates.length === 0
                : filteredMunicipalities.length === 0) ? (
                <div className="p-8 text-center text-sm text-neutral-500">
                  No encontramos resultados con esa búsqueda.
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

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
