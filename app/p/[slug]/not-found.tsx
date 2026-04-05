import Image from 'next/image'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#fef3c7_15%,_#eef2ff_45%,_#f8fafc_100%)] px-6 py-16">
      <div className="mx-auto max-w-xl rounded-[32px] border border-white/70 bg-white/85 p-8 text-center shadow-xl backdrop-blur">
        <div className="mb-6 flex justify-center">
          <Image
            src="/images/dog-search.png"
            alt="Perrito buscando perfil"
            width={220}
            height={220}
            className="h-auto w-auto"
            priority
          />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
          Mascota no encontrada
        </h1>

        <p className="mt-3 text-neutral-600">
          Este perfil público no existe, ya no está disponible o el enlace es incorrecto.
        </p>
      </div>
    </main>
  )
}