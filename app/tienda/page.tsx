import Link from 'next/link'

const RAMX_FACEBOOK_URL =
  'https://www.facebook.com/profile.php?id=61591060778332'

const RAMX_INSTAGRAM_URL = 'https://www.instagram.com/ramx.bonica'

const WHATSAPP_URL =
  'https://wa.me/522321416236?text=Hola%20RAMX%2C%20me%20interesa%20la%20tienda%20de%20placas%20QR%20y%20NFC%20para%20mascotas.'

export default function StorePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_44%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-12%] top-[-10%] h-80 w-80 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute right-[-12%] top-[12%] h-96 w-96 rounded-full bg-sky-200/45 blur-3xl" />
        <div className="absolute bottom-[-16%] left-[22%] h-96 w-96 rounded-full bg-rose-200/35 blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-neutral-900"
          >
            RAMX
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white/80 px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
            >
              Dashboard
            </Link>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-md"
            >
              Contactar
            </a>
          </div>
        </header>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-orange-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-700 shadow-sm backdrop-blur">
              Próximamente · Tienda RAMX
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.06em] text-neutral-950 sm:text-6xl lg:text-7xl">
              Placas inteligentes para mascotas que son parte de casa.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
              Estamos preparando productos físicos RAMX para conectar el perfil
              digital de tu mascota con placas QR, identificadores NFC y
              accesorios diseñados con una estética premium, sencilla y
              funcional.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-neutral-950/15 transition hover:-translate-y-0.5 hover:bg-neutral-800"
              >
                Avisarme cuando esté lista
              </a>

              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white/80 px-6 py-4 text-sm font-semibold text-neutral-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                Ir a mi dashboard
              </Link>
            </div>

            <p className="mt-5 text-sm leading-6 text-neutral-500">
              Mientras tanto, ya puedes crear el perfil digital de tu mascota y
              descargar su QR desde el dashboard.
            </p>
          </div>

          <div className="rounded-[36px] border border-white/80 bg-white/75 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
            <div className="rounded-[28px] bg-[linear-gradient(135deg,#111827_0%,#1f2937_48%,#fb923c_100%)] p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-100">
                    RAMX Tag
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                    Identidad digital siempre contigo.
                  </h2>
                </div>

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
                  🐾
                </div>
              </div>

              <div className="mt-10 grid gap-3">
                <StoreFeature
                  title="QR personalizado"
                  text="Conecta directo al perfil público de tu mascota."
                />
                <StoreFeature
                  title="NFC compatible"
                  text="Toca la placa con un teléfono compatible y abre su perfil."
                />
                <StoreFeature
                  title="Diseño premium"
                  text="Minimalista, resistente y pensado para uso diario."
                />
              </div>

              <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="aspect-square rounded-2xl bg-white p-5">
                  <div className="grid h-full grid-cols-5 gap-2">
                    {Array.from({ length: 25 }).map((_, index) => (
                      <div
                        key={index}
                        className={`rounded-sm ${
                          [
                            0, 1, 2, 5, 10, 12, 14, 16, 18, 20, 22, 23, 24,
                          ].includes(index)
                            ? 'bg-neutral-950'
                            : 'bg-neutral-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-4 text-center text-xs font-medium text-orange-50">
                  Vista conceptual · QR RAMX
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          <ProductCard
            title="Placa QR"
            description="Ideal para collar. Escaneo rápido al perfil público."
            status="Próximamente"
          />
          <ProductCard
            title="Placa QR + NFC"
            description="Más cómoda para lectura con teléfonos compatibles."
            status="Próximamente"
          />
          <ProductCard
            title="Kit RAMX"
            description="Placa, QR digital y material de identificación."
            status="Próximamente"
          />
        </section>

        <footer className="mt-14 flex flex-col gap-4 border-t border-neutral-200 pt-8 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>RAMX · Registro Animal MX</p>

          <div className="flex gap-4">
            <a
              href={RAMX_FACEBOOK_URL}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-neutral-700 underline underline-offset-4"
            >
              Facebook
            </a>

            <a
              href={RAMX_INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-neutral-700 underline underline-offset-4"
            >
              Instagram
            </a>
          </div>
        </footer>
      </section>
    </main>
  )
}

function StoreFeature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-orange-50/90">{text}</p>
    </div>
  )
}

function ProductCard({
  title,
  description,
  status,
}: {
  title: string
  description: string
  status: string
}) {
  return (
    <article className="rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-xl">
        ✦
      </div>

      <h3 className="mt-5 text-lg font-semibold tracking-tight text-neutral-950">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>

      <p className="mt-5 inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
        {status}
      </p>
    </article>
  )
}