import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { activatePhysicalCodeAction } from './actions'

type PageProps = {
  params: Promise<{
    code: string
  }>
  searchParams?: Promise<{
    status?: string
  }>
}

type PetOption = {
  id: string
  name: string
  species: string | null
  public_slug: string | null
  profile_photo_url: string | null
  microchip_number: string | null
  internal_id: string | null
}

export default async function ActivatePhysicalCodePage({
  params,
  searchParams,
}: PageProps) {
  const { code } = await params
  const query = searchParams ? await searchParams : {}
  const normalizedCode = normalizeCode(code)

  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: physicalCode } = await admin
    .from('ramx_physical_codes')
    .select(
      `
      id,
      code,
      product_type,
      status,
      assigned_pet_id,
      assigned_profile_id,
      deleted_at,
      activated_at
    `
    )
    .eq('code', normalizedCode)
    .is('deleted_at', null)
    .maybeSingle()

  if (physicalCode?.status === 'activated' && physicalCode.assigned_pet_id) {
    const { data: pet } = await admin
      .from('pets')
      .select('public_slug')
      .eq('id', physicalCode.assigned_pet_id)
      .maybeSingle()

    if (pet?.public_slug) {
      redirect(`/p/${pet.public_slug}`)
    }
  }

  const { data: pets } = user
    ? await admin
        .from('pets')
        .select(
          `
          id,
          name,
          species,
          public_slug,
          profile_photo_url,
          microchip_number,
          internal_id
        `
        )
        .eq('primary_tutor_profile_id', user.id)
        .order('created_at', { ascending: false })
    : { data: [] as PetOption[] }

  const petOptions = (pets || []) as PetOption[]

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/"
          className="inline-flex text-sm font-medium text-neutral-600 hover:text-neutral-950"
        >
          ← RAMX
        </Link>

        <section className="rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8">
          <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
            Activación RAMX
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Activar producto físico
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Código detectado: <strong>{normalizedCode}</strong>
          </p>

          {query.status === 'invalid' || !physicalCode ? (
            <MessageBox
              tone="error"
              title="Código no válido"
              text="No encontramos este código en el inventario RAMX. Revisa que lo hayas escrito completo o contacta a soporte."
            />
          ) : null}

          {physicalCode?.status === 'disabled' || query.status === 'disabled' ? (
            <MessageBox
              tone="error"
              title="Código desactivado"
              text="Este producto fue desactivado y no puede vincularse a una mascota."
            />
          ) : null}

          {physicalCode && physicalCode.status !== 'disabled' ? (
            <div className="mt-6 rounded-3xl border border-sky-100 bg-sky-50 p-4">
              <p className="text-sm font-semibold text-sky-950">
                {getProductLabel(physicalCode.product_type)}
              </p>
              <p className="mt-1 text-sm leading-6 text-sky-800">
                Al activarlo, el QR/NFC abrirá el perfil público de la mascota
                seleccionada y RAMX podrá registrar futuros escaneos.
              </p>
            </div>
          ) : null}

          {!user && physicalCode && physicalCode.status !== 'disabled' ? (
            <div className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
              <h2 className="text-lg font-semibold text-neutral-950">
                Inicia sesión para continuar
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Necesitamos saber a qué cuenta y mascota se vinculará esta placa
                o NFC. Inicia sesión y vuelve a escanear el código.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800"
                >
                  Iniciar sesión
                </Link>

                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  Crear cuenta
                </Link>
              </div>
            </div>
          ) : null}

          {user && physicalCode && physicalCode.status !== 'disabled' ? (
            petOptions.length > 0 ? (
              <form action={activatePhysicalCodeAction} className="mt-6 space-y-5">
                <input type="hidden" name="code" value={normalizedCode} />

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-neutral-700">
                    Selecciona la mascota
                  </span>

                  <select
                    name="pet_id"
                    required
                    className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
                  >
                    <option value="">Elegir mascota</option>
                    {petOptions.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {pet.name} · {pet.microchip_number || pet.internal_id || 'RAMX'}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
                >
                  Activar y abrir perfil público
                </button>
              </form>
            ) : (
              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="text-lg font-semibold text-amber-950">
                  Primero registra una mascota
                </h2>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  Tu cuenta no tiene mascotas disponibles para vincular este
                  producto físico.
                </p>

                <Link
                  href="/dashboard/pets/new"
                  className="mt-5 inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800"
                >
                  Agregar mascota
                </Link>
              </div>
            )
          ) : null}
        </section>
      </div>
    </main>
  )
}

function MessageBox({
  tone,
  title,
  text,
}: {
  tone: 'error' | 'success'
  title: string
  text: string
}) {
  const styles =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800'

  return (
    <div className={`mt-6 rounded-3xl border p-5 ${styles}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6">{text}</p>
    </div>
  )
}

function getProductLabel(productType: string) {
  const labels: Record<string, string> = {
    qr_plate: 'Placa QR',
    qr_nfc_plate: 'Placa QR + NFC',
    nfc_card: 'Tarjeta NFC',
    kit: 'Kit RAMX',
    other: 'Producto RAMX',
  }

  return labels[productType] || 'Producto RAMX'
}

function normalizeCode(value: string) {
  return decodeURIComponent(value || '')
    .trim()
    .toUpperCase()
}
