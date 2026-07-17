import Link from 'next/link'
import { requireRamxAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { generatePhysicalCodesAction } from './actions'
import CodesTableClient from './codes-table-client'

type PageProps = {
  searchParams?: Promise<{
    status?: string
    printed?: string
    q?: string
  }>
}

type PhysicalCode = {
  id: string
  code: string
  product_type: string
  batch_name: string | null
  status: string
  assigned_pet_id: string | null
  assigned_profile_id: string | null
  assigned_order_id?: string | null
  assigned_at?: string | null
  activated_at: string | null
  created_at: string
  notes: string | null
  is_printed: boolean | null
  printed_at: string | null
}

type PetInfo = {
  id: string
  name: string
  public_slug: string | null
}

const STATUS_FILTERS = ['all', 'available', 'reserved', 'assigned', 'activated', 'blocked', 'disabled', 'replaced']
const PRINTED_FILTERS = ['all', 'printed', 'not_printed']

export default async function AdminPhysicalCodesPage({
  searchParams,
}: PageProps) {
  await requireRamxAdmin()

  const params = searchParams ? await searchParams : {}
  const statusFilter = normalizeStatusFilter(params.status)
  const printedFilter = normalizePrintedFilter(params.printed)
  const search = String(params.q || '').trim().slice(0, 80)

  const admin = createAdminClient()
  const baseUrl = getBaseUrl()

  let codesQuery = admin
    .from('ramx_physical_codes')
    .select(
      `
      id,
      code,
      product_type,
      batch_name,
      status,
      assigned_pet_id,
      assigned_profile_id,
      assigned_order_id,
      assigned_at,
      activated_at,
      created_at,
      notes,
      is_printed,
      printed_at
    `
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(300)

  if (statusFilter !== 'all') {
    codesQuery = codesQuery.eq('status', statusFilter)
  }

  if (printedFilter === 'printed') {
    codesQuery = codesQuery.eq('is_printed', true)
  }

  if (printedFilter === 'not_printed') {
    codesQuery = codesQuery.eq('is_printed', false)
  }

  if (search) {
    codesQuery = codesQuery.ilike('code', `%${escapeIlike(search)}%`)
  }

  const [{ data: codes, error }, { data: statsRows }] = await Promise.all([
    codesQuery,
    admin
      .from('ramx_physical_codes')
      .select('status, is_printed')
      .is('deleted_at', null),
  ])

  const physicalCodes = (codes || []) as PhysicalCode[]
  const petIds = Array.from(
    new Set(
      physicalCodes
        .map((item) => item.assigned_pet_id)
        .filter((item): item is string => Boolean(item))
    )
  )

  const { data: pets } =
    petIds.length > 0
      ? await admin.from('pets').select('id, name, public_slug').in('id', petIds)
      : { data: [] as PetInfo[] }

  const petsById = new Map<string, PetInfo>()

  for (const pet of (pets || []) as PetInfo[]) {
    petsById.set(pet.id, pet)
  }

  const allStats = (statsRows || []) as Array<{
    status: string
    is_printed: boolean | null
  }>

  const availableCount = allStats.filter(
    (item) => item.status === 'available'
  ).length
  const activatedCount = allStats.filter(
    (item) => item.status === 'activated'
  ).length
  const assignedCount = allStats.filter(
    (item) => item.status === 'assigned'
  ).length
  const disabledCount = allStats.filter(
    (item) => item.status === 'disabled' || item.status === 'blocked'
  ).length
  const printedCount = allStats.filter((item) => item.is_printed).length

  const rows = physicalCodes.map((item) => ({
    ...item,
    is_printed: Boolean(item.is_printed),
    redirect_url: `${baseUrl}/r/${item.code}`,
    pet: item.assigned_pet_id ? petsById.get(item.assigned_pet_id) || null : null,
  }))

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="inline-flex text-sm font-medium text-neutral-600 hover:text-neutral-950"
          >
            ← Volver a admin
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Dashboard
          </Link>
        </div>

        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur sm:p-8">
          <p className="text-sm font-semibold text-orange-700">
            RAMX · Códigos físicos
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Placas QR/NFC y códigos de activación
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
            Cada producto físico debe apuntar a <strong>/r/[código]</strong>. Si
            el código no está activado, RAMX manda al flujo de activación. Si ya
            está activado, registra el escaneo y abre el perfil público de la
            mascota.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Stat label="Disponibles" value={availableCount} />
            <Stat label="Asignados" value={assignedCount} />
            <Stat label="Activados" value={activatedCount} />
            <Stat label="Impresos" value={printedCount} />
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
            Crear lote de códigos
          </h2>

          <form
            action={generatePhysicalCodesAction}
            className="mt-5 grid gap-4 lg:grid-cols-6"
          >
            <label className="space-y-2 lg:col-span-2">
              <span className="text-sm font-medium text-neutral-700">Tipo</span>
              <select
                name="product_type"
                defaultValue="qr_plate"
                className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
              >
                <option value="placa_inteligente_nfc_qr">Placa Inteligente NFC/Qr</option>
                <option value="combo_identificacion_inteligente">Combo Identificación Inteligente</option>
                <option value="combo_identidad_inteligente">Combo Identidad Inteligente</option>
                <option value="qr_plate">Placa QR</option>
                <option value="qr_nfc_plate">Placa QR + NFC</option>
                <option value="nfc_card">Tarjeta NFC</option>
                <option value="kit">Kit RAMX</option>
                <option value="other">Otro</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-neutral-700">Cantidad</span>
              <input
                name="quantity"
                type="number"
                min="1"
                max="500"
                defaultValue="10"
                className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-neutral-700">Prefijo</span>
              <input
                name="prefix"
                defaultValue="RAMX"
                className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
              />
            </label>

            <label className="space-y-2 lg:col-span-2">
              <span className="text-sm font-medium text-neutral-700">Lote</span>
              <input
                name="batch_name"
                placeholder="Ej. Primer lote Puebla"
                className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
              />
            </label>

            <label className="space-y-2 lg:col-span-5">
              <span className="text-sm font-medium text-neutral-700">Notas</span>
              <input
                name="notes"
                placeholder="Ej. producción proveedor X, color negro, prueba NFC"
                className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
              />
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
              >
                Generar
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1 pb-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
                Códigos
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Filtra, marca como impreso, elimina códigos sin activar y exporta
                las URLs <strong>/r/[código]</strong> para impresión.
              </p>
            </div>

            {error ? (
              <p className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
                {error.message}
              </p>
            ) : null}
          </div>

          <form method="get" className="mb-4 grid gap-3 rounded-[24px] border border-neutral-200 bg-white p-4 md:grid-cols-4">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Estado
              </span>
              <select
                name="status"
                defaultValue={statusFilter}
                className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-3 text-sm outline-none"
              >
                <option value="all">Todos</option>
                <option value="available">Disponibles</option>
                <option value="reserved">Reservados</option>
                <option value="assigned">Asignados</option>
                <option value="activated">Activados</option>
                <option value="blocked">Bloqueados</option>
                <option value="disabled">Desactivados</option>
                <option value="replaced">Reemplazados</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Impresión
              </span>
              <select
                name="printed"
                defaultValue={printedFilter}
                className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-3 text-sm outline-none"
              >
                <option value="all">Todos</option>
                <option value="printed">Impresos</option>
                <option value="not_printed">No impresos</option>
              </select>
            </label>

            <label className="space-y-2 md:col-span-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Buscar código
              </span>
              <input
                name="q"
                defaultValue={search}
                placeholder="RAMX-QR..."
                className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-3 text-sm outline-none"
              />
            </label>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white"
              >
                Filtrar
              </button>

              <Link
                href="/admin/products/codes"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700"
              >
                Limpiar
              </Link>
            </div>
          </form>

          <CodesTableClient codes={rows} />
        </section>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-neutral-950">{value}</p>
    </div>
  )
}

function normalizeStatusFilter(value?: string) {
  return STATUS_FILTERS.includes(value || '') ? value || 'all' : 'all'
}

function normalizePrintedFilter(value?: string) {
  return PRINTED_FILTERS.includes(value || '') ? value || 'all' : 'all'
}

function escapeIlike(value: string) {
  return value.replace(/[%_]/g, '')
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'
  )
}
