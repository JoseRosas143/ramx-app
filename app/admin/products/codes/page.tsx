import Link from 'next/link'
import { requireRamxAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  generatePhysicalCodesAction,
  updatePhysicalCodeStatusAction,
} from './actions'

type PhysicalCode = {
  id: string
  code: string
  product_type: string
  batch_name: string | null
  status: string
  assigned_pet_id: string | null
  assigned_profile_id: string | null
  activated_at: string | null
  created_at: string
  notes: string | null
}

type PetInfo = {
  id: string
  name: string
  public_slug: string | null
}

export default async function AdminPhysicalCodesPage() {
  await requireRamxAdmin()

  const admin = createAdminClient()
  const baseUrl = getBaseUrl()

  const { data: codes, error } = await admin
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
      activated_at,
      created_at,
      notes
    `
    )
    .order('created_at', { ascending: false })
    .limit(80)

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
      ? await admin
          .from('pets')
          .select('id, name, public_slug')
          .in('id', petIds)
      : { data: [] as PetInfo[] }

  const petsById = new Map<string, PetInfo>()

  for (const pet of (pets || []) as PetInfo[]) {
    petsById.set(pet.id, pet)
  }

  const availableCount = physicalCodes.filter(
    (item) => item.status === 'available'
  ).length
  const activatedCount = physicalCodes.filter(
    (item) => item.status === 'activated'
  ).length
  const disabledCount = physicalCodes.filter(
    (item) => item.status === 'disabled'
  ).length

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
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

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Disponibles" value={availableCount} />
            <Stat label="Activados" value={activatedCount} />
            <Stat label="Desactivados" value={disabledCount} />
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
            Crear lote de códigos
          </h2>

          <form action={generatePhysicalCodesAction} className="mt-5 grid gap-4 lg:grid-cols-6">
            <label className="space-y-2 lg:col-span-2">
              <span className="text-sm font-medium text-neutral-700">Tipo</span>
              <select
                name="product_type"
                defaultValue="qr_plate"
                className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
              >
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
                Últimos códigos
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Copia la URL <strong>/r/[código]</strong> para generar el QR o
                grabar el NFC.
              </p>
            </div>

            {error ? (
              <p className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
                {error.message}
              </p>
            ) : null}
          </div>

          <div className="overflow-x-auto rounded-[24px] border border-neutral-200 bg-white">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">URL QR/NFC</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Mascota</th>
                  <th className="px-4 py-3">Lote</th>
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100">
                {physicalCodes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                      Aún no hay códigos físicos.
                    </td>
                  </tr>
                ) : (
                  physicalCodes.map((item) => {
                    const pet = item.assigned_pet_id
                      ? petsById.get(item.assigned_pet_id)
                      : null
                    const redirectUrl = `${baseUrl}/r/${item.code}`

                    return (
                      <tr key={item.id} className="align-top">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-neutral-950">{item.code}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {formatDate(item.created_at)}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="max-w-[290px] break-all rounded-2xl bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
                            {redirectUrl}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-neutral-700">
                          {getProductLabel(item.product_type)}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge status={item.status} />
                        </td>

                        <td className="px-4 py-4">
                          {pet ? (
                            <div>
                              <p className="font-medium text-neutral-900">{pet.name}</p>
                              {pet.public_slug ? (
                                <Link
                                  href={`/p/${pet.public_slug}`}
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
                                <option value="disabled">Desactivado</option>
                              </select>

                              <button
                                type="submit"
                                className="h-10 rounded-xl bg-neutral-950 px-3 text-xs font-semibold text-white"
                              >
                                Guardar
                              </button>
                            </form>
                          ) : (
                            <span className="text-xs text-neutral-500">
                              Activado {item.activated_at ? formatDate(item.activated_at) : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-neutral-950">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    reserved: 'bg-amber-50 text-amber-700 border-amber-200',
    activated: 'bg-sky-50 text-sky-700 border-sky-200',
    disabled: 'bg-neutral-100 text-neutral-600 border-neutral-200',
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

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    available: 'Disponible',
    reserved: 'Reservado',
    activated: 'Activado',
    disabled: 'Desactivado',
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
  }

  return labels[productType] || productType
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'
  )
}
