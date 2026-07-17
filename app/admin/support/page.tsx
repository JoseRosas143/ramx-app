import Link from "next/link";
import { requireRamxAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  addAdminRamxSupportReplyAction,
  archiveRamxSupportTicketAction,
  updateRamxSupportTicketAction,
} from "./actions";

type PageProps = {
  searchParams?: Promise<{
    status?: string;
    q?: string;
    notice?: string;
  }>;
};

type AdminSupportTicket = {
  id: string;
  ticket_number: string;
  order_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  subject: string | null;
  description: string | null;
  assigned_to: string | null;
  last_message_at: string | null;
  created_at: string | null;
  ramx_support_messages?: Array<{
    id: string;
    sender_type: string | null;
    author_name: string | null;
    body: string | null;
    is_internal: boolean | null;
    created_at: string | null;
  }> | null;
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

export default async function AdminSupportPage({ searchParams }: PageProps) {
  await requireRamxAdmin();
  const query = searchParams ? await searchParams : {};
  const status = String(query.status || "active");
  const q = String(query.q || "").trim();
  const tickets = await getAdminTickets(status, q);
  const metrics = buildMetrics(tickets);
  const returnTo = `/admin/support?${new URLSearchParams({ status, ...(q ? { q } : {}) }).toString()}`;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 text-neutral-950 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link href="/admin" className="inline-flex text-sm font-medium text-neutral-600 hover:text-neutral-950">
          ← Volver a admin
        </Link>

        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur sm:p-8">
          <p className="text-sm font-semibold text-sky-700">RAMX · Soporte</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Centro de soporte</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
                Bandeja tipo Jira para solicitudes de clientes conectadas a órdenes, pagos, guías y activaciones.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/support/knowledge" className="rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800">
                Base de conocimiento IA
              </Link>
              <Link href="/portal/soporte" className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-md">
                Ver portal cliente
              </Link>
            </div>
          </div>
        </section>

        {query.notice ? <Notice notice={query.notice} /> : null}

        <section className="grid gap-4 sm:grid-cols-4">
          <Metric label="Nuevos" value={metrics.new} />
          <Metric label="En proceso" value={metrics.inProgress} />
          <Metric label="Esperando cliente" value={metrics.waiting} />
          <Metric label="Resueltos" value={metrics.resolved} />
        </section>

        <section className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-xl">
          <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]" method="get">
            <input name="q" defaultValue={q} placeholder="Buscar ticket, orden, cliente o correo" className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5" />
            <select name="status" defaultValue={status} className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5">
              <option value="active">Activos</option>
              <option value="new">Nuevos</option>
              <option value="customer_replied">Respuesta del cliente</option>
              <option value="in_progress">En proceso</option>
              <option value="waiting_customer">Esperando cliente</option>
              <option value="resolved">Resueltos</option>
              <option value="all">Todos</option>
            </select>
            <button className="rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white" type="submit">Filtrar</button>
          </form>
        </section>

        <section className="grid gap-5">
          {tickets.length > 0 ? tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-[30px] border border-white/80 bg-white/95 p-5 shadow-xl shadow-blue-950/5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-bold text-neutral-500">{ticket.ticket_number}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">{ticket.subject || "Solicitud RAMX"}</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {CATEGORY_LABELS[ticket.category || ""] || "Soporte"} · Orden {ticket.order_number || "—"} · {ticket.customer_name || "Cliente"} · {ticket.customer_email || "—"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(ticket.status)}`}>{STATUS_LABELS[ticket.status || ""] || "Abierto"}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${priorityTone(ticket.priority)}`}>{priorityLabel(ticket.priority)}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
                <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-5">
                  <p className="text-sm font-semibold text-neutral-950">Descripción</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-neutral-600">{ticket.description || "Sin descripción"}</p>

                  <div className="mt-5 space-y-3">
                    {(ticket.ramx_support_messages || []).slice(-3).map((message) => (
                      <div key={message.id} className={`rounded-2xl border p-4 text-sm ${message.is_internal ? "border-amber-100 bg-amber-50 text-amber-900" : "border-white bg-white text-neutral-700"}`}>
                        <p className="font-semibold text-neutral-950">{message.is_internal ? "Nota interna" : message.sender_type === "admin" ? "RAMX" : message.author_name || "Cliente"}</p>
                        <p className="mt-1 whitespace-pre-line leading-6">{message.body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <form action={updateRamxSupportTicketAction} className="rounded-[24px] border border-neutral-200 bg-white p-5">
                    <input type="hidden" name="ticket_id" value={ticket.id} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Estatus</span>
                        <select name="status" defaultValue={ticket.status || "new"} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm">
                          {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Prioridad</span>
                        <select name="priority" defaultValue={ticket.priority || "normal"} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm">
                          <option value="low">Baja</option>
                          <option value="normal">Normal</option>
                          <option value="high">Alta</option>
                          <option value="urgent">Urgente</option>
                        </select>
                      </label>
                    </div>
                    <label className="mt-3 block">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Responsable</span>
                      <input name="assigned_to" defaultValue={ticket.assigned_to || ""} placeholder="Nombre o correo" className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm" />
                    </label>
                    <label className="mt-3 block">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Nota interna opcional</span>
                      <textarea name="internal_note" rows={3} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm" />
                    </label>
                    <button className="mt-4 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white" type="submit">Guardar ticket</button>
                  </form>

                  <form action={addAdminRamxSupportReplyAction} className="rounded-[24px] border border-sky-100 bg-sky-50 p-5">
                    <input type="hidden" name="ticket_id" value={ticket.id} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Respuesta al cliente</span>
                      <textarea name="reply_body" rows={4} placeholder="Mensaje visible para el cliente en el portal." className="mt-2 w-full rounded-2xl border border-sky-100 bg-white px-3 py-3 text-sm" />
                    </label>
                    <button className="mt-4 w-full rounded-2xl bg-sky-950 px-4 py-3 text-sm font-semibold text-white" type="submit">Responder</button>
                  </form>

                  <form action={archiveRamxSupportTicketAction}>
                    <input type="hidden" name="ticket_id" value={ticket.id} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <button className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-600 hover:text-neutral-950" type="submit">Archivar</button>
                  </form>
                </div>
              </div>
            </article>
          )) : (
            <div className="rounded-[30px] border border-dashed border-neutral-300 bg-white/80 p-8 text-center text-sm text-neutral-500">No hay tickets con este filtro.</div>
          )}
        </section>
      </div>
    </main>
  );
}

async function getAdminTickets(status: string, q: string) {
  const admin = createAdminClient();
  let query = admin
    .from("ramx_support_tickets")
    .select(`
      id,
      ticket_number,
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      category,
      priority,
      status,
      subject,
      description,
      assigned_to,
      last_message_at,
      created_at,
      ramx_support_messages (
        id,
        sender_type,
        author_name,
        body,
        is_internal,
        created_at
      )
    `)
    .is("archived_at", null)
    .order("last_message_at", { ascending: false })
    .limit(50);

  if (status && status !== "active" && status !== "all") query = query.eq("status", status);
  if (status === "active") query = query.not("status", "in", "(resolved,closed)");
  if (q) query = query.or(`ticket_number.ilike.%${q}%,order_number.ilike.%${q}%,customer_email.ilike.%${q}%,customer_name.ilike.%${q}%,subject.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) {
    console.error("RAMX admin support query error:", error);
    return [];
  }

  return ((data || []) as AdminSupportTicket[]).map((ticket) => ({
    ...ticket,
    ramx_support_messages: (ticket.ramx_support_messages || []).sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || ""))),
  }));
}

function buildMetrics(tickets: AdminSupportTicket[]) {
  return {
    new: tickets.filter((item) => item.status === "new" || item.status === "customer_replied").length,
    inProgress: tickets.filter((item) => item.status === "in_progress" || item.status === "open").length,
    waiting: tickets.filter((item) => item.status === "waiting_customer").length,
    resolved: tickets.filter((item) => item.status === "resolved" || item.status === "closed").length,
  };
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Notice({ notice }: { notice: string }) {
  const labels: Record<string, string> = {
    saved: "Ticket actualizado.",
    replied: "Respuesta enviada al portal del cliente.",
    archived: "Ticket archivado.",
  };
  return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{labels[notice] || "Cambios guardados."}</div>;
}

function statusTone(status: string | null | undefined) {
  if (status === "resolved" || status === "closed") return "bg-emerald-100 text-emerald-700";
  if (status === "waiting_customer") return "bg-amber-100 text-amber-700";
  if (status === "customer_replied" || status === "new") return "bg-sky-100 text-sky-700";
  return "bg-neutral-100 text-neutral-600";
}

function priorityTone(priority: string | null | undefined) {
  if (priority === "urgent") return "bg-rose-100 text-rose-700";
  if (priority === "high") return "bg-orange-100 text-orange-700";
  if (priority === "low") return "bg-neutral-100 text-neutral-500";
  return "bg-violet-100 text-violet-700";
}

function priorityLabel(priority: string | null | undefined) {
  const labels: Record<string, string> = { low: "Baja", normal: "Normal", high: "Alta", urgent: "Urgente" };
  return labels[priority || "normal"] || "Normal";
}
