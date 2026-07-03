import Image from 'next/image'
import Link from 'next/link'
import { ProductLaunchCarousel } from '@/components/store/product-launch-carousel'
import { RAMX_STORE_PRODUCTS, formatMxn } from '@/lib/ramx-store-products'

const RAMX_FACEBOOK_URL =
  'https://www.facebook.com/profile.php?id=61591060778332'

const RAMX_INSTAGRAM_URL = 'https://www.instagram.com/ramx.bonica'

const WHATSAPP_URL =
  'https://wa.me/522321416236?text=Hola%20RAMX%2C%20me%20interesa%20la%20preventa%20de%20productos%20RAMX%20para%20mascotas.'

const PHYSICAL_PRODUCTS = RAMX_STORE_PRODUCTS.filter(
  (product) => product.kind === 'physical',
)

const DONATION_PRODUCT = RAMX_STORE_PRODUCTS.find(
  (product) => product.kind === 'donation',
)

const PREORDER_GOAL = 200

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
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-neutral-900"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-sm">
              R
            </span>
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

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-orange-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-700 shadow-sm backdrop-blur">
              Preventa fundadora · RAMX
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.06em] text-neutral-950 sm:text-6xl lg:text-7xl">
              Ayúdanos a lanzar la primera red inteligente para mascotas RAMX.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
              Estamos reuniendo las primeras {PREORDER_GOAL} ventas para iniciar
              producción, activar los códigos QR/NFC y entregar los primeros
              kits fundadores. Cada compra ayuda a que más mascotas tengan una
              identidad digital clara, segura y fácil de compartir cuando más se
              necesita.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <LaunchMetric label="Meta" value={`${PREORDER_GOAL} ventas`} />
              <LaunchMetric label="Modalidad" value="Preventa" />
              <LaunchMetric label="Pago" value="Mercado Pago" />
            </div>

            <div className="mt-8 rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-700">
                Launch RAMX
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                Una preventa con propósito.
              </h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                No estás comprando solo una placa. Estás ayudando a construir
                una herramienta mexicana para que los tutores puedan compartir
                datos esenciales, activar alertas, conectar con veterinarias y
                facilitar el regreso a casa de una mascota extraviada.
              </p>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-neutral-200">
                <div className="h-full w-[18%] rounded-full bg-[linear-gradient(90deg,#111827,#fb923c)]" />
              </div>

              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Barra conceptual de lanzamiento. La meta de preventa es reunir
                200 ventas fundadoras para arrancar producción inicial.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tienda/order"
                className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-neutral-950/15 transition hover:-translate-y-0.5 hover:bg-neutral-800"
              >
                Apartar en preventa
              </Link>

              {DONATION_PRODUCT ? (
                <Link
                  href={`/tienda/order?product=${DONATION_PRODUCT.type}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-orange-200 bg-white/85 px-6 py-4 text-sm font-semibold text-orange-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >
                  Apoyar con donación
                </Link>
              ) : null}
            </div>

            <p className="mt-5 text-sm leading-6 text-neutral-500">
              Si ya tienes cuenta RAMX, puedes crear el perfil digital de tu
              mascota desde el dashboard y vincular tu producto cuando lo
              recibas.
            </p>
          </div>

          <ProductLaunchCarousel products={RAMX_STORE_PRODUCTS} />
        </div>

        <section className="mt-14 rounded-[34px] border border-white/80 bg-white/70 p-5 shadow-2xl shadow-slate-900/5 backdrop-blur sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
                Catálogo fundador
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-neutral-950">
                Productos para empezar con identidad inteligente.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-neutral-600">
              Selecciona el producto, completa tus datos y paga de forma segura.
              En productos físicos confirmaremos entrega y activación.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {PHYSICAL_PRODUCTS.map((product) => (
              <ProductCard
                key={product.type}
                type={product.type}
                title={product.title}
                price={formatMxn(product.price)}
                imageSrc={product.imageSrc}
                description={product.description}
                includes={product.includes}
              />
            ))}
          </div>
        </section>

        {DONATION_PRODUCT ? (
          <section className="mt-6 overflow-hidden rounded-[34px] border border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_56%,#eff6ff_100%)] p-5 shadow-xl shadow-orange-900/5 sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
              <div className="overflow-hidden rounded-[28px] border border-white bg-white shadow-lg">
                <Image
                  src={DONATION_PRODUCT.imageSrc}
                  alt={DONATION_PRODUCT.title}
                  width={900}
                  height={700}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>

              <div>
                <p className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-orange-800">
                  Apoyo voluntario
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-neutral-950">
                  Dona para acelerar el lanzamiento de RAMX.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
                  Tu donación ayuda a cubrir producción inicial, pruebas de
                  placas, activación de códigos, mejoras de la plataforma y
                  difusión para que más tutores conozcan RAMX. El monto es libre
                  y se procesa de forma segura por Mercado Pago.
                </p>

                <Link
                  href={`/tienda/order?product=${DONATION_PRODUCT.type}`}
                  className="mt-6 inline-flex rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-neutral-950/15 transition hover:-translate-y-0.5 hover:bg-neutral-800"
                >
                  Hacer donación
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <PremiumFeature
            title="Activación posterior"
            text="Tu QR/NFC podrá vincularse al perfil público de la mascota cuando recibas el producto."
          />
          <PremiumFeature
            title="Diseño mobile-first"
            text="Los perfiles RAMX están pensados para abrir rápido desde celular, justo cuando alguien encuentra una mascota."
          />
          <PremiumFeature
            title="Ecosistema en crecimiento"
            text="La tienda es el primer paso para conectar tutores, mascotas, productos físicos y veterinarias."
          />
        </section>

        <footer className="mt-14 flex flex-col gap-4 border-t border-neutral-200 pt-8 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>RAMX · Registro Animal MX · Preventa fundadora</p>

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

function LaunchMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-lg shadow-slate-900/5 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">
        {value}
      </p>
    </div>
  )
}

function ProductCard({
  type,
  title,
  price,
  imageSrc,
  description,
  includes,
}: {
  type: string
  title: string
  price: string
  imageSrc: string
  description: string
  includes: string[]
}) {
  return (
    <article className="group overflow-hidden rounded-[30px] border border-white/80 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10">
      <div className="relative overflow-hidden">
        <Image
          src={imageSrc}
          alt={title}
          width={900}
          height={700}
          className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-orange-700 shadow-sm backdrop-blur">
          Preventa
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight text-neutral-950">
            {title}
          </h3>
          <p className="shrink-0 rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
            {price}
          </p>
        </div>

        <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {includes.slice(0, 4).map((item) => (
            <span
              key={item}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600"
            >
              {item}
            </span>
          ))}
        </div>

        <Link
          href={`/tienda/order?product=${type}`}
          className="mt-5 inline-flex w-full justify-center rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800"
        >
          Apartar ahora
        </Link>
      </div>
    </article>
  )
}

function PremiumFeature({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-lg shadow-slate-900/5 backdrop-blur">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-sm">
        ✓
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-neutral-950">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
    </article>
  )
}
