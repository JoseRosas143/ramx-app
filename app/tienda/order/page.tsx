import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPhysicalProductOrderAction } from './actions'

const PRODUCTS = [
  {
    type: 'placa_qr_nfc',
    title: 'Placa QR/NFC',
    description:
      'Placa física para collar con QR y NFC vinculables al perfil público RAMX.',
    includes: ['QR único', 'NFC integrado', 'Activación RAMX', 'Perfil público'],
  },
  {
    type: 'microchip_placa_qr_nfc',
    title: 'Microchip + placa QR/NFC',
    description:
      'Ideal para identificación doble: microchip más placa RAMX con QR/NFC.',
    includes: ['Microchip', 'Placa QR/NFC', 'Activación RAMX', 'Perfil público'],
  },
  {
    type: 'kit_ramx',
    title: 'Kit RAMX',
    description:
      'Paquete completo de identidad física y digital para mascota.',
    includes: ['Placa QR/NFC', 'Pasaporte', 'Certificado', 'Microchip'],
  },
] as const

type PageProps = {
  searchParams?: Promise<{
    product?: string
  }>
}

export default async function PhysicalProductOrderPage({
  searchParams,
}: PageProps) {
  const query = searchParams ? await searchParams : {}

  const selectedProduct = PRODUCTS.some((item) => item.type === query.product)
    ? query.product
    : PRODUCTS[0].type

  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: pets, error: petsError } = await admin
    .from('pets')
    .select('id, name, species, public_slug, microchip_number, internal_id')
    .eq('primary_tutor_profile_id', user.id)
    .order('created_at', { ascending: false })

  if (petsError) {
    console.error('RAMX tienda order pets error:', petsError.message)
  }

  const petOptions = pets || []

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/tienda"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-950"
          >
            ← Volver a tienda
          </Link>

          <Link
            href="/dashboard"
            className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Dashboard
          </Link>
        </div>

        <section className="rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8">
          <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
            Solicitud RAMX
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Solicitar producto físico
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            Selecciona el producto para tu mascota. Esta primera versión crea una
            solicitud interna; el equipo RAMX confirmará disponibilidad, diseño y
            entrega antes de cobrar o producir.
          </p>
        </section>

        <form
          action={createPhysicalProductOrderAction}
          className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <section className="rounded-[30px] border border-white/80 bg-white/95 p-5 shadow-xl sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
              1. Producto
            </h2>

            <div className="mt-5 grid gap-4">
              {PRODUCTS.map((product) => (
                <label
                  key={product.type}
                  className="block cursor-pointer rounded-3xl border border-neutral-200 bg-neutral-50/70 p-4 transition hover:border-neutral-400 hover:bg-white"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="product_type"
                      value={product.type}
                      defaultChecked={product.type === selectedProduct}
                      className="mt-1 h-4 w-4"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-neutral-950">
                        {product.title}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-neutral-600">
                        {product.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {product.includes.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-white bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-medium text-neutral-700">
                Cantidad
              </span>

              <input
                name="quantity"
                type="number"
                min="1"
                max="20"
                defaultValue="1"
                className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
              />
            </label>
          </section>

          <section className="rounded-[30px] border border-white/80 bg-white/95 p-5 shadow-xl sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
              2. Mascota y contacto
            </h2>

            <div className="mt-5 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-neutral-700">
                  Mascota
                </span>

                <select
                  name="pet_id"
                  required
                  className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
                >
                  <option value="">Selecciona mascota</option>

                  {petOptions.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ·{' '}
                      {pet.microchip_number || pet.internal_id || 'RAMX'}
                    </option>
                  ))}
                </select>
              </label>

              {petOptions.length === 0 ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-950">
                    Primero registra una mascota
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    Necesitas una mascota para vincular la placa, microchip o kit.
                  </p>

                  <Link
                    href="/dashboard/pets/new"
                    className="mt-3 inline-flex rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Agregar mascota
                  </Link>
                </div>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-neutral-700">
                  Nombre de contacto
                </span>

                <input
                  name="customer_name"
                  required
                  placeholder="Nombre completo"
                  className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-neutral-700">
                  Correo
                </span>

                <input
                  name="customer_email"
                  type="email"
                  defaultValue={user.email || ''}
                  placeholder="correo@ejemplo.com"
                  className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-neutral-700">
                  WhatsApp / teléfono
                </span>

                <input
                  name="customer_phone"
                  required
                  placeholder="222 000 0000"
                  className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-neutral-700">
                  Entrega
                </span>

                <select
                  name="shipping_method"
                  defaultValue="to_confirm"
                  className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
                >
                  <option value="to_confirm">Confirmar por WhatsApp</option>
                  <option value="pickup">Entrega / recolección local</option>
                  <option value="shipping">Envío a domicilio</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-neutral-700">
                  Dirección o zona de entrega
                </span>

                <textarea
                  name="shipping_address"
                  rows={3}
                  placeholder="Opcional por ahora"
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-neutral-700">
                  Notas
                </span>

                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Color, tamaño, indicaciones o comentarios"
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950"
                />
              </label>

              <button
                type="submit"
                disabled={petOptions.length === 0}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg disabled:opacity-60"
              >
                Crear solicitud RAMX
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  )
}