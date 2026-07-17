import Image from "next/image";
import Link from "next/link";
import { ProductLaunchCarousel } from "@/components/store/product-launch-carousel";
import { getRamxStorefrontConfig } from "@/lib/ramx-store-config";
import { formatMxn, type RamxStoreProduct } from "@/lib/ramx-store-products";

const WHATSAPP_URL =
  "https://wa.me/522321416236?text=Hola%20RAMX%2C%20me%20interesa%20la%20preventa%20de%20productos%20RAMX%20para%20mascotas.";

const STORE_FAQS = [
  {
    question: "¿Cuándo recibo mi placa?",
    answer:
      "RAMX está en preventa fundadora. Al llegar a la meta de producción, te avisaremos por correo el avance, preparación y entrega de tu producto.",
  },
  {
    question: "¿Cómo activo mi QR?",
    answer:
      "Cuando recibas tu placa o tag NFC, escaneas el código y RAMX te guía para crear cuenta, registrar mascota o vincularlo a un perfil existente.",
  },
  {
    question: "¿Necesito tener cuenta?",
    answer:
      "Puedes comprar sin cuenta. La cuenta será necesaria hasta el momento de activar el producto y vincularlo con la mascota.",
  },
  {
    question: "¿Qué pasa si mi mascota se pierde?",
    answer:
      "Podrás usar el perfil público RAMX y el modo extraviado para facilitar que quien la encuentre tenga una forma segura de contactarte.",
  },
];

export default async function StorePage() {
  const { settings, products } = await getRamxStorefrontConfig();
  const physicalProducts = products.filter((product) => product.kind === "physical");
  const donationProduct = products.find((product) => product.kind === "donation");
  const preorderGoal = settings.preorderGoal || 200;
  const preorderCurrent = Math.min(settings.preorderCurrentSales || 0, preorderGoal);
  const preorderProgress = preorderGoal > 0 ? Math.max(4, Math.min(100, Math.round((preorderCurrent / preorderGoal) * 100))) : 18;

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
              {settings.preorderEnabled ? settings.preorderBadge : "RAMX Store"}
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.06em] text-neutral-950 sm:text-6xl lg:text-7xl">
              {settings.heroTitle}
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
              {settings.heroDescription}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <LaunchMetric label="Meta" value={`${preorderGoal} ventas`} />
              <LaunchMetric label="Avance" value={`${preorderCurrent}/${preorderGoal}`} />
              <LaunchMetric label="Pago" value="Mercado Pago" />
            </div>

            <div className="mt-8 rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-700">
                Launch RAMX
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                {settings.launchTitle}
              </h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                {settings.launchDescription}
              </p>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#111827,#fb923c)]"
                  style={{ width: `${preorderProgress}%` }}
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Meta editable desde Admin → Tienda. Actualiza ventas, textos,
                productos, precios e imágenes sin tocar código.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tienda/order"
                className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-neutral-950/15 transition hover:-translate-y-0.5 hover:bg-neutral-800"
              >
                {settings.primaryCtaLabel}
              </Link>

              {donationProduct ? (
                <Link
                  href={`/tienda/order?product=${donationProduct.type}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-orange-200 bg-white/85 px-6 py-4 text-sm font-semibold text-orange-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >
                  {settings.donationCtaLabel}
                </Link>
              ) : null}
            </div>

            <p className="mt-5 text-sm leading-6 text-neutral-500">
              Si ya tienes cuenta RAMX, puedes crear el perfil digital de tu
              mascota desde el dashboard y vincular tu producto cuando lo recibas.
            </p>
          </div>

          <ProductLaunchCarousel products={products} />
        </div>

        <section className="mt-14 rounded-[34px] border border-white/80 bg-white/70 p-5 shadow-2xl shadow-slate-900/5 backdrop-blur sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
                Catálogo editable
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-neutral-950">
                Productos para empezar con identidad inteligente.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-neutral-600">
              Selecciona el producto, completa tus datos y paga de forma segura.
              Este catálogo puede actualizarse desde el panel admin.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {physicalProducts.map((product) => (
              <ProductCard key={product.type} product={product} />
            ))}
          </div>
        </section>

        {donationProduct ? (
          <section className="mt-6 overflow-hidden rounded-[34px] border border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_56%,#eff6ff_100%)] p-5 shadow-xl shadow-orange-900/5 sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
              <div className="overflow-hidden rounded-[28px] border border-white bg-white shadow-lg">
                <Image
                  src={donationProduct.imageSrc}
                  alt={donationProduct.title}
                  width={900}
                  height={700}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>

              <div>
                <p className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-orange-800">
                  {donationProduct.badgeText || "Apoyo voluntario"}
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-neutral-950">
                  {donationProduct.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
                  {donationProduct.description}
                </p>

                <Link
                  href={`/tienda/order?product=${donationProduct.type}`}
                  className="mt-6 inline-flex rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-neutral-950/15 transition hover:-translate-y-0.5 hover:bg-neutral-800"
                >
                  {donationProduct.ctaLabel || "Hacer donación"}
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <PremiumFeature
            title="Compra segura"
            description="Mercado Pago procesa el pago y RAMX guarda el pedido para seguimiento desde admin."
          />
          <PremiumFeature
            title="Identidad digital"
            description="Cada placa o combo puede vincularse después al perfil público de tu mascota."
          />
          <PremiumFeature
            title="Soporte RAMX"
            description="Te acompañamos en compra, activación y recuperación si tu mascota se extravía."
          />
        </section>

        <section className="mt-10 rounded-[34px] border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
                Confianza RAMX
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-neutral-950">
                {settings.trustTitle}
              </h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                {settings.trustDescription}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {STORE_FAQS.map((faq) => (
                <article
                  key={faq.question}
                  className="rounded-[26px] border border-neutral-200 bg-white/80 p-4 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-neutral-950">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {faq.answer}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[34px] border border-neutral-950 bg-neutral-950 p-6 text-white shadow-2xl shadow-neutral-950/20 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-200">
                RAMX admin editable
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                Cambia productos, precios, imágenes y preventa sin código.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                Desde el panel admin puedes activar/desactivar productos, cambiar
                precios, subir nuevos links de imagen, ordenar el carrusel y
                actualizar la meta de lanzamiento.
              </p>
            </div>

            <Link
              href="/admin/store"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:-translate-y-0.5 hover:bg-orange-50"
            >
              Editar tienda
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function LaunchMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/80 bg-white/70 px-4 py-4 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">
        {value}
      </p>
    </div>
  );
}

function ProductCard({ product }: { product: RamxStoreProduct }) {
  const price = product.kind === "donation" ? product.priceLabel : formatMxn(product.price);

  return (
    <Link
      href={`/tienda/order?product=${product.type}`}
      className="group overflow-hidden rounded-[30px] border border-white bg-white/90 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        <Image
          src={product.imageSrc}
          alt={product.title}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-neutral-950 shadow-sm backdrop-blur">
          {product.badgeText || "Preventa"}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-neutral-950">
            {product.title}
          </h3>
          <span className="shrink-0 rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
            {price}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          {product.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {product.includes.slice(0, 4).map((item) => (
            <span
              key={item}
              className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600"
            >
              {item}
            </span>
          ))}
        </div>
        <p className="mt-5 text-sm font-semibold text-orange-700">
          {product.ctaLabel || "Comprar en preventa"} →
        </p>
      </div>
    </Link>
  );
}

function PremiumFeature({ title, description }: { title: string; description: string }) {
  return (
    <article className="rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-lg shadow-slate-900/5 backdrop-blur">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white">
        ✓
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-neutral-950">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
    </article>
  );
}
