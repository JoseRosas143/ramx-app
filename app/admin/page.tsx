import Link from "next/link";
import { requireRamxAdmin } from "@/lib/admin-auth";

export default async function AdminHomePage() {
  await requireRamxAdmin();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex text-sm font-medium text-neutral-600 hover:text-neutral-950"
        >
          ← Volver al dashboard
        </Link>

        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur sm:p-8">
          <p className="text-sm font-semibold text-orange-700">RAMX · Admin</p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Administración RAMX
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            Gestiona códigos físicos, placas QR/NFC, activaciones y pedidos. En
            esta primera fase dejamos listo el inventario de códigos físicos.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/products/codes"
            className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-950 text-xl text-white">
              QR
            </div>

            <h2 className="mt-5 text-xl font-semibold tracking-tight text-neutral-950">
              Códigos físicos
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Crea códigos para placas QR, QR+NFC, tarjetas NFC y kits RAMX.
            </p>
          </Link>

          <Link
            href="/admin/orders"
            className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-xl">
              🛒
            </div>

            <h2 className="mt-5 text-xl font-semibold tracking-tight text-neutral-950">
              Pedidos
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Revisa solicitudes, pagos por Mercado Pago, producción y entrega.
            </p>
          </Link>

          <Link
            href="/admin/store"
            className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-xl">
              🛍️
            </div>

            <h2 className="mt-5 text-xl font-semibold tracking-tight text-neutral-950">
              Tienda editable
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Cambia productos, precios, imágenes, carrusel y preventa sin tocar código.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
