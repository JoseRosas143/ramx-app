export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 rounded-full border border-neutral-200 px-4 py-1 text-sm text-neutral-600">
          RAMX · Registro Animal MX
        </div>

        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Identidad digital para mascotas,
          <span className="block text-neutral-500">
            conectada con QR, NFC, microchip y red veterinaria
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
          Una plataforma moderna para tutores, veterinarias y perfiles públicos de
          mascotas. Diseñada para registro, extravíos, expediente médico y activación
          de productos físicos.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90">
            Comenzar
          </button>

          <button className="rounded-2xl border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50">
            Ver demo
          </button>
        </div>
      </section>
    </main>
  )
}