'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  deletePhysicalCodesAction,
  updatePhysicalCodeStatusAction,
  updatePhysicalCodesPrintedAction,
} from './actions'

type PetInfo = {
  id: string
  name: string
  public_slug: string | null
}

type PhysicalCodeRow = {
  id: string
  code: string
  product_type: string
  batch_name: string | null
  status: string
  assigned_pet_id: string | null
  assigned_order_id?: string | null
  assigned_at?: string | null
  activated_at: string | null
  created_at: string
  notes: string | null
  is_printed: boolean
  printed_at: string | null
  redirect_url: string
  pet: PetInfo | null
}

export default function CodesTableClient({
  codes,
}: {
  codes: PhysicalCodeRow[]
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const selectedCodes = useMemo(
    () => codes.filter((item) => selectedIds.includes(item.id)),
    [codes, selectedIds]
  )

  const allVisibleSelected =
    codes.length > 0 && codes.every((item) => selectedIds.includes(item.id))

  function toggleAll() {
    if (allVisibleSelected) {
      setSelectedIds([])
      return
    }

    setSelectedIds(codes.map((item) => item.id))
  }

  function toggleOne(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  function exportSelectedCsv() {
    if (selectedCodes.length === 0) return

    const rows = selectedCodes.map((item) => ({
      code: item.code,
      url: item.redirect_url,
      product_type: getProductLabel(item.product_type),
      status: getStatusLabel(item.status),
      printed: item.is_printed ? 'Sí' : 'No',
      batch_name: item.batch_name || '',
      pet: item.pet?.name || '',
    }))

    const csv = toCsv(rows)
    downloadTextFile(csv, `ramx-urls-impresion-${dateStamp()}.csv`, 'text/csv')
  }

  function exportSelectedTxt() {
    if (selectedCodes.length === 0) return

    const content = selectedCodes
      .map((item) => `${item.code}\n${item.redirect_url}`)
      .join('\n\n')

    downloadTextFile(
      content,
      `ramx-urls-impresion-${dateStamp()}.txt`,
      'text/plain'
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-neutral-200 bg-neutral-50 p-3">
        <div>
          <p className="text-sm font-semibold text-neutral-950">
            {selectedIds.length} código{selectedIds.length === 1 ? '' : 's'} seleccionado
            {selectedIds.length === 1 ? '' : 's'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Selecciona los códigos que quieras exportar para impresión.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportSelectedCsv}
            disabled={selectedIds.length === 0}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-950 px-3 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={exportSelectedTxt}
            disabled={selectedIds.length === 0}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-800 transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Exportar TXT
          </button>

          <form action={updatePhysicalCodesPrintedAction}>
            {selectedIds.map((id) => (
              <input key={id} type="hidden" name="code_ids" value={id} />
            ))}
            <input type="hidden" name="is_printed" value="true" />
            <button
              type="submit"
              disabled={selectedIds.length === 0}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-900 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Marcar impresos
            </button>
          </form>

          <form action={updatePhysicalCodesPrintedAction}>
            {selectedIds.map((id) => (
              <input key={id} type="hidden" name="code_ids" value={id} />
            ))}
            <input type="hidden" name="is_printed" value="false" />
            <button
              type="submit"
              disabled={selectedIds.length === 0}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-700 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Quitar impreso
            </button>
          </form>

          <form
            action={deletePhysicalCodesAction}
            onSubmit={(event) => {
              if (
                !window.confirm(
                  '¿Eliminar los códigos seleccionados? Los activados no se pueden eliminar.'
                )
              ) {
                event.preventDefault()
              }
            }}
          >
            {selectedIds.map((id) => (
              <input key={id} type="hidden" name="code_ids" value={id} />
            ))}
            <button
              type="submit"
              disabled={selectedIds.length === 0}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Eliminar seleccionados
            </button>
          </form>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-neutral-200 bg-white">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAll}
                  aria-label="Seleccionar todos los códigos visibles"
                  className="h-4 w-4"
                />
              </th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">URL QR/NFC</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Impresión</th>
              <th className="px-4 py-3">Mascota</th>
              <th className="px-4 py-3">Lote</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {codes.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-neutral-500">
                  No hay códigos con los filtros actuales.
                </td>
              </tr>
            ) : (
              codes.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleOne(item.id)}
                      aria-label={`Seleccionar ${item.code}`}
                      className="h-4 w-4"
                    />
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-semibold text-neutral-950">{item.code}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {formatDate(item.created_at)}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="max-w-[290px] break-all rounded-2xl bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
                      {item.redirect_url}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-neutral-700">
                    {getProductLabel(item.product_type)}
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge status={item.status} />
                  </td>

                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <PrintedBadge isPrinted={item.is_printed} />
                      {item.printed_at ? (
                        <p className="text-xs text-neutral-500">
                          {formatDate(item.printed_at)}
                        </p>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {item.pet ? (
                      <div>
                        <p className="font-medium text-neutral-900">{item.pet.name}</p>
                        {item.pet.public_slug ? (
                          <Link
                            href={`/p/${item.pet.public_slug}`}
                            className="mt-1 inline-flex text-xs font-medium text-sky-700 underline underline-offset-4"
                          >
                            Ver perfil
                          </Link>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-neutral-500">Sin asignar</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-neutral-700">
                    {item.batch_name || 'Sin lote'}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex min-w-[260px] flex-wrap gap-2">
                      {item.status !== 'activated' ? (
                        <form action={updatePhysicalCodeStatusAction} className="flex gap-2">
                          <input type="hidden" name="code_id" value={item.id} />
                          <select
                            name="next_status"
                            defaultValue={item.status}
                            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-xs outline-none"
                          >
                            <option value="available">Disponible</option>
                            <option value="reserved">Reservado</option>
                            <option value="assigned">Asignado</option>
                            <option value="blocked">Bloqueado</option>
                            <option value="disabled">Desactivado</option>
                            <option value="replaced">Reemplazado</option>
                          </select>

                          <button
                            type="submit"
                            className="h-10 rounded-xl bg-neutral-950 px-3 text-xs font-semibold text-white"
                          >
                            Guardar
                          </button>
                        </form>
                      ) : (
                        <span className="inline-flex h-10 items-center text-xs text-neutral-500">
                          Activado{' '}
                          {item.activated_at ? formatDate(item.activated_at) : ''}
                        </span>
                      )}

                      <form action={updatePhysicalCodesPrintedAction}>
                        <input type="hidden" name="code_ids" value={item.id} />
                        <input
                          type="hidden"
                          name="is_printed"
                          value={item.is_printed ? 'false' : 'true'}
                        />
                        <button
                          type="submit"
                          className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-700"
                        >
                          {item.is_printed ? 'No impreso' : 'Impreso'}
                        </button>
                      </form>

                      {item.status !== 'activated' ? (
                        <form
                          action={deletePhysicalCodesAction}
                          onSubmit={(event) => {
                            if (!window.confirm(`¿Eliminar ${item.code}?`)) {
                              event.preventDefault()
                            }
                          }}
                        >
                          <input type="hidden" name="code_ids" value={item.id} />
                          <button
                            type="submit"
                            className="h-10 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700"
                          >
                            Eliminar
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    reserved: 'bg-amber-50 text-amber-700 border-amber-200',
    activated: 'bg-sky-50 text-sky-700 border-sky-200',
    assigned: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    blocked: 'bg-red-50 text-red-700 border-red-200',
    disabled: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    replaced: 'bg-violet-50 text-violet-700 border-violet-200',
  }

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[status] || styles.disabled
      }`}
    >
      {getStatusLabel(status)}
    </span>
  )
}

function PrintedBadge({ isPrinted }: { isPrinted: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        isPrinted
          ? 'border-violet-200 bg-violet-50 text-violet-700'
          : 'border-neutral-200 bg-neutral-50 text-neutral-600'
      }`}
    >
      {isPrinted ? 'Impreso' : 'No impreso'}
    </span>
  )
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    available: 'Disponible',
    reserved: 'Reservado',
    activated: 'Activado',
    assigned: 'Asignado',
    blocked: 'Bloqueado',
    disabled: 'Desactivado',
    replaced: 'Reemplazado',
    released: 'Liberado',
  }

  return labels[status] || status
}

function getProductLabel(productType: string) {
  const labels: Record<string, string> = {
    qr_plate: 'Placa QR',
    qr_nfc_plate: 'Placa QR + NFC',
    nfc_card: 'Tarjeta NFC',
    kit: 'Kit RAMX',
    other: 'Otro',
    placa_inteligente_nfc_qr: 'Placa Inteligente NFC/Qr',
    combo_identificacion_inteligente: 'Combo Identificación',
    combo_identidad_inteligente: 'Combo Identidad',
  }

  return labels[productType] || productType
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function toCsv(rows: Record<string, string>[]) {
  const headers = ['code', 'url', 'product_type', 'status', 'printed', 'batch_name', 'pet']
  const body = rows.map((row) =>
    headers.map((header) => csvEscape(row[header] || '')).join(',')
  )

  return [headers.join(','), ...body].join('\n')
}

function csvEscape(value: string) {
  const needsQuotes = /[",\n]/.test(value)
  const escaped = value.replace(/"/g, '""')

  return needsQuotes ? `"${escaped}"` : escaped
}

function downloadTextFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type: `${type};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function dateStamp() {
  const now = new Date()

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(now.getDate()).padStart(2, '0')}`
}
