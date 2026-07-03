import Link from 'next/link'

type PageProps = {
  searchParams?: Promise<{
    order?: string
  }>
}

export default async function PhysicalProductOrderSuccessPage({
  searchParams,
}: PageProps) {
  const query = searchParams ? await searchParams : {}
  const orderNumber = query.order || 'Solicitud RAMX'

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-2xl rounded-[34px] border border-white/80 bg-white/95 p-8 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-3xl">
          ✓
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Solicitud recibida
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
          Tu solicitud RAMX fue creada
        </h1>

        <p className="mt-4 text-sm leading-6 text-neutral-600">
          Número de solicitud:
        </p>

        <p className="mt-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-950">
          {orderNumber}
        </p>

        <p className="mt-5 text-sm leading-6 text-neutral-600">
          También enviamos una confirmación al correo capturado y una
          notificación interna al equipo RAMX. Revisaremos los datos del
          producto, disponibilidad, diseño y entrega antes de confirmar el
          siguiente paso.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/tienda/order"
            className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800"
          >
            Crear otra solicitud
          </Link>

          <Link
            href="/tienda"
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Volver a tienda
          </Link>
        </div>
      </section>
    </main>
  )
}