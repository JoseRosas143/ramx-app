import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  RAMX_STORE_PRODUCTS,
  formatMxn,
} from '@/lib/ramx-store-products'
import { createPhysicalProductOrderAction } from './actions'

type PageProps = {
  searchParams?: Promise<{
    product?: string
  }>
}

export default async function PhysicalProductOrderPage({
  searchParams,
}: PageProps) {
  const query = searchParams ? await searchParams : {}

  const selectedProduct = RAMX_STORE_PRODUCTS.some(
    (item) => item.type === query.product
  )
    ? query.product
    : RAMX_STORE_PRODUCTS[0].type

  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let petOptions: Array<{
    id: string
    name: string
    species: string | null
    public_slug: string | null
    microchip_number: string | null
    internal_id: string | null
  }> = []

  if (user) {
    const { data: pets, error: petsError } = await admin
      .from('pets')
      .select('id, name, species, public_slug, microchip_number, internal_id')
      .eq('primary_tutor_profile_id', user.id)
      .order('created_at', { ascending: false })

    if (petsError) {
      console.error('RAMX tienda order pets error:', petsError.message)
    }

    petOptions = pets || []
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/tienda"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-950"
          >
            ← Volver a tienda
          </Link>

          <div className="flex flex-wrap gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>

        <section className="rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8">
          <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
            Solicitud RAMX
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Solicitar producto físico
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
            Elige tu producto RAMX y captura tus datos de entrega. Puedes
            comprar aunque todavía no tengas cuenta; si ya tienes una mascota
            registrada, también puedes vincular la solicitud desde aquí.
          </p>
        </section>

        <form
          action={createPhysicalProductOrderAction}
          className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]"
        >
          <section className="rounded-[30px] border border-white/80 bg-white/95 p-5 shadow-xl sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
              1. Producto
            </h2>

            <div className="mt-5 grid gap-4">
              {RAMX_STORE_PRODUCTS.map((product) => (
                <label
                  key={product.type}
                  className="block cursor-pointer rounded-[28px] border border-neutral-200 bg-neutral-50/70 p-3 transition hover:border-neutral-400 hover:bg-white sm:p-4"
                >
                  <div className="grid gap-4 sm:grid-cols-[150px_1fr] sm:items-center">
                    <div className="overflow-hidden rounded-3xl border border-white bg-white shadow-sm">
                      <Image
                        src={product.imageSrc}
                        alt={product.title}
                        width={900}
                        height={700}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="product_type"
                        value={product.type}
                        defaultChecked={product.type === selectedProduct}
                        className="mt-1 h-4 w-4 shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-base font-semibold text-neutral-950">
                            {product.title}
                          </p>

                          <p className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
                            {formatMxn(product.price)}
                          </p>
                        </div>

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
              2. Comprador y entrega
            </h2>

            <div className="mt-5 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-neutral-700">
                  Mascota registrada, si aplica
                </span>

                <select
                  name="pet_id"
                  className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
                >
                  <option value="">Comprador nuevo / vincular después</option>

                  {petOptions.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ·{' '}
                      {pet.microchip_number || pet.internal_id || 'RAMX'}
                    </option>
                  ))}
                </select>
              </label>

              {!user ? (
                <div className="rounded-3xl border border-sky-200 bg-sky-50 p-4">
                  <p className="text-sm font-semibold text-sky-950">
                    Puedes comprar sin cuenta
                  </p>

                  <p className="mt-1 text-sm leading-6 text-sky-800">
                    Después podrás activar el QR/NFC y vincularlo a la mascota
                    cuando recibas tu producto.
                  </p>
                </div>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-neutral-700">
                  Nombre de la mascota, si aún no está registrada
                </span>

                <input
                  name="pet_name"
                  placeholder="Ej. Niña, Max, Luna"
                  className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
                />
              </label>

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
                  Correo para confirmación
                </span>

                <input
                  name="customer_email"
                  type="email"
                  required
                  defaultValue={user?.email || ''}
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

              <div className="rounded-3xl border border-neutral-200 bg-neutral-50/70 p-4">
                <p className="text-sm font-semibold text-neutral-950">
                  Dirección de entrega
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium text-neutral-700">
                      Calle y número
                    </span>
                    <input
                      name="shipping_street"
                      required
                      placeholder="Ej. Av. Reforma 123"
                      className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-neutral-700">
                      Colonia
                    </span>
                    <input
                      name="shipping_neighborhood"
                      required
                      placeholder="Ej. Centro"
                      className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-neutral-700">
                      Estado
                    </span>
                    <input
                      name="shipping_state"
                      required
                      placeholder="Ej. Puebla"
                      className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-neutral-700">
                      C.P.
                    </span>
                    <input
                      name="shipping_postal_code"
                      required
                      inputMode="numeric"
                      placeholder="Ej. 72000"
                      className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
                    />
                  </label>
                </div>
              </div>

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
                className="inline-flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
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
