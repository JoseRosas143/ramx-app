import Link from "next/link";

export default function ClientPortalHomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_52%,#f8fafc_100%)] px-4 py-10 text-neutral-950 sm:px-6">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="overflow-hidden rounded-[38px] border border-white/80 bg-white/90 shadow-2xl shadow-blue-950/10 backdrop-blur">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                Portal del cliente RAMX
              </p>
              <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
                Todo tu pedido RAMX en un solo lugar.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
                Consulta tus órdenes, pagos, preparación, guías, productos pendientes de activar y solicitudes de soporte sin tener que escribir por WhatsApp.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/portal/ordenes" className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800">
                  Consultar mi pedido
                </Link>
                <Link href="/portal/soporte" className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-md">
                  Abrir soporte
                </Link>
              </div>
            </div>

            <div className="border-t border-neutral-100 bg-neutral-950 p-6 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <p className="text-sm font-semibold text-orange-300">Acceso rápido</p>
              <div className="mt-6 grid gap-3">
                <PortalQuickLink title="Mis pedidos" text="Pago, producción, guía y activación." href="/portal/ordenes" />
                <PortalQuickLink title="Solicitudes de soporte" text="Historial de mensajes y seguimiento." href="/portal/soporte" />
                <PortalQuickLink title="Add-ons RAMX" text="Reposición, placa extra y plan premium." href="/portal/add-ons" />
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <PortalFeature title="Consulta sin cuenta" text="Usa tu número de orden y correo de compra para ver información protegida." />
          <PortalFeature title="Activación QR/NFC" text="Cuando tu producto tenga código asignado, podrás activarlo desde el portal." />
          <PortalFeature title="Soporte conectado" text="Las solicitudes pueden vincularse a pedidos, pagos, guías y productos." />
        </section>
      </section>
    </main>
  );
}

function PortalQuickLink({ title, text, href }: { title: string; text: string; href: string }) {
  return (
    <Link href={href} className="rounded-[24px] border border-white/10 bg-white/10 p-5 transition hover:-translate-y-0.5 hover:bg-white/15">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-white/70">{text}</p>
    </Link>
  );
}

function PortalFeature({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-xl shadow-blue-950/5">
      <p className="text-lg font-semibold tracking-tight text-neutral-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
    </article>
  );
}
