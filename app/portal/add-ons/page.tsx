import Link from "next/link";

const ADD_ONS = [
  {
    title: "Seguro por pérdida de placa",
    price: "Próximamente",
    badge: "Protección",
    description: "Una cobertura simple para reponer tu placa RAMX si se pierde, se rompe o necesitas bloquear un código anterior.",
    cta: "Solicitar información",
    href: "mailto:ramx@bonica.com.mx?subject=Add-on RAMX: seguro por pérdida de placa",
  },
  {
    title: "Placa extra para otra mascota",
    price: "Desde tienda",
    badge: "Add-on",
    description: "Ideal si tienes más de una mascota y quieres que todas cuenten con identidad digital RAMX.",
    cta: "Ver tienda",
    href: "/tienda",
  },
  {
    title: "Plan Premium RAMX",
    price: "Próximamente",
    badge: "Premium",
    description: "Funciones avanzadas para tutores: historial extendido, más documentos, soporte prioritario y beneficios de la red RAMX.",
    cta: "Quiero enterarme",
    href: "mailto:ramx@bonica.com.mx?subject=Interés en Plan Premium RAMX",
  },
  {
    title: "Donación RAMX",
    price: "Monto libre",
    badge: "Comunidad",
    description: "Apoya el lanzamiento fundador para que RAMX llegue a más familias y mascotas.",
    cta: "Donar",
    href: "/tienda/order?product=donacion_ramx",
  },
];

export default function CustomerPortalAddOnsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_55%,#f8fafc_100%)] px-4 py-10 text-neutral-950 sm:px-6">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[36px] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur sm:p-8 lg:p-10">
          <Link href="/portal" className="text-sm font-semibold text-neutral-500 hover:text-neutral-950">
            ← Portal RAMX
          </Link>
          <p className="mt-6 inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-700">
            Add-ons y premium
          </p>
          <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Extiende la protección RAMX de tu mascota.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
            Esta sección prepara el camino para reposiciones, planes premium, placas extra y beneficios futuros sin saturar el flujo de compra principal.
          </p>
        </div>

        <section className="grid gap-5 md:grid-cols-2">
          {ADD_ONS.map((item) => (
            <article key={item.title} className="rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-xl shadow-blue-950/5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">{item.badge}</span>
                <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-bold text-white">{item.price}</span>
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">{item.description}</p>
              <a href={item.href} className="mt-6 inline-flex rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800">
                {item.cta}
              </a>
            </article>
          ))}
        </section>

        <div className="rounded-[30px] border border-emerald-100 bg-emerald-50 p-6 text-sm leading-7 text-emerald-800 shadow-xl shadow-emerald-950/5">
          Recomendación operativa: cuando estos add-ons estén listos, los agregamos desde Admin → Tienda editable para venderlos como productos reales con precio, Mercado Pago y seguimiento en órdenes.
        </div>
      </section>
    </main>
  );
}
