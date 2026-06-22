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

  const normalizedStateName = useMemo(
    () => normalizeText(stateName),
    [stateName]
  )

  const normalizedMunicipalityName = useMemo(
    () => normalizeText(municipalityName),
    [municipalityName]
  )

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

  const selectedMunicipalityExists = municipalities.some(
    (item) => item.code === municipalityCode
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>{labelPrefix ? `${labelPrefix} · Estado` : 'Estado'}</Label>

        <select
          value={stateCode}
          onChange={(event) => {
            const nextCode = event.target.value
            const selected = states.find((item) => item.code === nextCode)

            onChange({
              stateCode: selected?.code || '',
              stateName: selected?.name || '',
              municipalityCode: '',
              municipalityName: '',
            })
          }}
          className={selectClass}
          required={required}
          disabled={loadingStates}
        >
          <option value="">
            {loadingStates ? 'Cargando estados...' : 'Selecciona un estado'}
          </option>

          {states.map((state) => (
            <option key={state.code} value={state.code}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>{labelPrefix ? `${labelPrefix} · Municipio` : 'Municipio'}</Label>

        <select
          value={selectedMunicipalityExists ? municipalityCode : ''}
          onChange={(event) => {
            const nextCode = event.target.value
            const selected = municipalities.find(
              (item) => item.code === nextCode
            )

            onChange({
              stateCode,
              stateName,
              municipalityCode: selected?.code || '',
              municipalityName: selected?.name || '',
            })
          }}
          className={selectClass}
          required={required}
          disabled={!stateCode || loadingMunicipalities}
        >
          <option value="">
            {!stateCode
              ? 'Primero selecciona un estado'
              : loadingMunicipalities
                ? 'Cargando municipios...'
                : 'Selecciona un municipio'}
          </option>

          {municipalities.map((municipality) => (
            <option key={municipality.fullCode} value={municipality.code}>
              {municipality.name}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="sm:col-span-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const selectClass =
  'w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500'