import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  searchParams?: Promise<{
    order?: string;
    email?: string;
  }>;
};

type SupportTicketRow = {
  id: string;
  ticket_number: string;
  order_number: string | null;
  customer_email: string | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  subject: string | null;
  last_message_at: string | null;
  created_at: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Nuevo",
  open: "Abierto",
  customer_replied: "Respuesta del cliente",
  waiting_customer: "Esperando cliente",
  in_progress: "En proceso",
  resolved: "Resuelto",
  closed: "Cerrado",
};

const CATEGORY_LABELS: Record<string, string> = {
  pedido_preventa: "Pedido / preventa",
  pago_mercado_pago: "Pago Mercado Pago",
  activacion_qr_nfc: "Activación QR/NFC",
  registro_mascota: "Registro de mascota",
  modo_extraviado: "Modo extraviado",
  cuenta_acceso: "Cuenta y acceso",
  garantia_reposicion: "Garantía / reposición",
  donacion: "Donación",
  premium_addons: "Premium / add-ons",
  otro: "Otro",
};

export default async function CustomerSupportPortalPage({ searchParams }: PageProps) {
  const query = searchParams ? await searchParams : {};
  const orderNumber = normalizeOrderNumber(query.order);
  const email = normalizeEmail(query.email);
  const shouldSearch = Boolean(orderNumber && email);
  const tickets = shouldSearch ? await getTickets(orderNumber, email) : [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_55%,#f8fafc_100%)] px-4 py-10 text-neutral-950 sm:px-6">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[36px] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur sm:p-8 lg:p-10">
          <Link href="/portal" className="text-sm font-semibold text-neutral-500 hover:text-neutral-950">
            ← Portal RAMX
          </Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
                Soporte RAMX
              </p>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
                Tus solicitudes y mensajes.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">
                Consulta solicitudes abiertas, historial de mensajes y seguimiento relacionado con tu pedido, pago, guía o activación.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/portal/soporte/nuevo${orderNumber && email ? `?order=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}` : ""}`} className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800">
                  Crear solicitud
                </Link>
                <Link href="/portal/ordenes" className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-md">
                  Ver mis pedidos
                </Link>
              </div>
            </div>

            <form className="rounded-[30px] border border-neutral-200 bg-neutral-50/80 p-5 shadow-inner" method="get">
              <p className="text-sm font-semibold text-neutral-950">Buscar solicitudes</p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Usa el mismo correo de compra para proteger tu información.
              </p>

              <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400" htmlFor="order">
                Número de orden
              </label>
              <input id="order" name="order" defaultValue={orderNumber} placeholder="RAMX-20260703-0017" className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5" required />

              <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400" htmlFor="email">
                Correo de compra
              </label>
              <input id="email" name="email" type="email" defaultValue={email} placeholder="tu-correo@email.com" className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5" required />

              <button className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800" type="submit">
                Ver solicitudes
              </button>
            </form>
          </div>
        </div>

        {shouldSearch ? (
          <section className="rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-xl shadow-blue-950/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Solicitudes abiertas</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">{tickets.length} solicitud(es)</h2>
              </div>
              <Link href={`/portal/soporte/nuevo?order=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`} className="rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800">
                Nueva solicitud
              </Link>
            </div>

            <div className="mt-6 grid gap-4">
              {tickets.length > 0 ? tickets.map((ticket) => (
                <Link key={ticket.id} href={`/portal/soporte/${encodeURIComponent(ticket.ticket_number)}?email=${encodeURIComponent(email)}`} className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-5 transition hover:-translate-y-0.5 hover:border-neutral-300 hover:bg-white hover:shadow-lg">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-sm font-bold text-neutral-950">{ticket.ticket_number}</p>
                      <h3 className="mt-2 text-lg font-semibold tracking-tight">{ticket.subject || "Solicitud RAMX"}</h3>
                      <p className="mt-1 text-sm text-neutral-500">{CATEGORY_LABELS[ticket.category || ""] || "Soporte"} · {formatDate(ticket.last_message_at || ticket.created_at)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(ticket.status)}`}>
                      {STATUS_LABELS[ticket.status || ""] || "Abierto"}
                    </span>
                  </div>
                </Link>
              )) : (
                <div className="rounded-[24px] border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm leading-6 text-neutral-600">
                  No encontramos solicitudes para esta orden. Puedes crear una nueva si necesitas ayuda con pago, guía, activación, reposición o cuenta.
                </div>
              )}
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <SupportCard title="Pagos y preventa" text="Ayuda con Mercado Pago, comprobantes, estados pendientes y confirmaciones." />
          <SupportCard title="Activación QR/NFC" text="Soporte para vincular placas, códigos físicos y perfiles públicos de mascota." />
          <SupportCard title="Garantía y add-ons" text="Reposición por pérdida, placas extra, premium y cambios de datos." />
        </section>
      </section>
    </main>
  );
}

async function getTickets(orderNumber: string, email: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("ramx_support_tickets")
      .select("id, ticket_number, order_number, customer_email, category, priority, status, subject, last_message_at, created_at")
      .eq("order_number", orderNumber)
      .eq("customer_email", email)
      .is("archived_at", null)
      .order("last_message_at", { ascending: false });

    return ((data || []) as SupportTicketRow[]) || [];
  } catch (error) {
    console.error("RAMX support tickets lookup error:", error);
    return [];
  }
}

function SupportCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-xl shadow-blue-950/5">
      <p className="text-lg font-semibold tracking-tight text-neutral-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
    </article>
  );
}

function statusTone(status: string | null | undefined) {
  if (status === "resolved" || status === "closed") return "bg-emerald-100 text-emerald-700";
  if (status === "waiting_customer") return "bg-amber-100 text-amber-700";
  if (status === "customer_replied" || status === "new") return "bg-sky-100 text-sky-700";
  return "bg-neutral-100 text-neutral-600";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function normalizeOrderNumber(value: string | undefined) {
  return String(value || "").trim().toUpperCase().slice(0, 40);
}

function normalizeEmail(value: string | undefined) {
  return String(value || "").trim().toLowerCase().slice(0, 160);
}
