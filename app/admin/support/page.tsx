import Link from "next/link";
import { requireRamxAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  archiveRamxSupportTicketAction,
  moveRamxSupportTicketAction,
  restoreRamxSupportTicketAction,
} from "./actions";

type PageProps = {
  searchParams?: Promise<{
    status?: string;
    view?: string;
    q?: string;
    priority?: string;
    assignee?: string;
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
  tags: string[] | null;
  admin_summary: string | null;
  first_response_at: string | null;
  last_customer_message_at: string | null;
  last_admin_message_at: string | null;
  last_message_at: string | null;
  sla_due_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  archived_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  ramx_support_messages?: Array<{
    id: string;
    sender_type: string | null;
    author_name: string | null;
    body: string | null;
    is_internal: boolean | null;
    created_at: string | null;
  }> | null;
};

type Metrics = {
  totalActive: number;
  needsAttention: number;
  inProgress: number;
  waitingCustomer: number;
  resolvedToday: number;
  urgent: number;
  overdue: number;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Nuevo",
  open: "Abierto",
  customer_replied: "Respondió cliente",
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

const BOARD_COLUMNS = [
  { key: "new", title: "Nuevo", statuses: ["new"], hint: "Solicitudes recién creadas." },
  { key: "customer_replied", title: "Cliente respondió", statuses: ["customer_replied", "open"], hint: "Requieren seguimiento RAMX." },
  { key: "in_progress", title: "En proceso", statuses: ["in_progress"], hint: "Casos que ya está trabajando el equipo." },
  { key: "waiting_customer", title: "Esperando cliente", statuses: ["waiting_customer"], hint: "RAMX ya respondió; falta cliente." },
  { key: "resolved", title: "Resuelto / cerrado", statuses: ["resolved", "closed"], hint: "Casos cerrados o resueltos." },
];

export default async function AdminSupportPage({ searchParams }: PageProps) {
  await requireRamxAdmin();
  const query = searchParams ? await searchParams : {};
  const status = String(query.status || "active");
  const view = String(query.view || "board");
  const q = String(query.q || "").trim();
  const priority = String(query.priority || "all");
  const assignee = String(query.assignee || "").trim();

  const [tickets, metrics] = await Promise.all([
    getAdminTickets({ status, q, priority, assignee }),
    getMetrics(q),
  ]);

  const returnTo = `/admin/support?${new URLSearchParams({
    status,
    view,
    ...(q ? { q } : {}),
    ...(priority !== "all" ? { priority } : {}),
    ...(assignee ? { assignee } : {}),
  }).toString()}`;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 text-neutral-950 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <Link href="/admin" className="inline-flex text-sm font-medium text-neutral-600 hover:text-neutral-950">
          ← Volver a admin
        </Link>

        <section className="overflow-hidden rounded-[36px] border border-white/70 bg-white/90 shadow-2xl shadow-blue-950/10 backdrop-blur">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_380px] lg:items-end">
            <div>
              <div className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
                RAMX · Mesa de ayuda tipo Jira
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
                Operación de soporte
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600">
                Gestiona tickets por etapa, prioridad, responsable, pedido, pago, activación y mensajes del cliente. Este tablero conecta el portal del cliente, la IA de soporte, órdenes y la base de conocimiento.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Link href="/admin/support/knowledge" className="rounded-[22px] bg-neutral-950 px-5 py-4 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-neutral-800">
                Editar base IA →
              </Link>
              <Link href="/portal/soporte/nuevo" className="rounded-[22px] border border-neutral-200 bg-white px-5 py-4 text-sm font-semibold text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                Ver flujo cliente →
              </Link>
            </div>
          </div>
          <div className="grid border-t border-neutral-100 bg-neutral-950 text-white sm:grid-cols-3 lg:grid-cols-7">
            <Metric label="Activos" value={metrics.totalActive} />
            <Metric label="Atención" value={metrics.needsAttention} tone="sky" />
            <Metric label="Proceso" value={metrics.inProgress} tone="violet" />
            <Metric label="Esperando" value={metrics.waitingCustomer} tone="amber" />
            <Metric label="Urgentes" value={metrics.urgent} tone="rose" />
            <Metric label="Vencidos" value={metrics.overdue} tone="rose" />
            <Metric label="Resueltos hoy" value={metrics.resolvedToday} tone="emerald" />
          </div>
        </section>

        {query.notice ? <Notice notice={query.notice} /> : null}

        <section className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-xl">
          <form className="grid gap-3 lg:grid-cols-[1fr_180px_180px_200px_190px_auto]" method="get">
            <input type="hidden" name="view" value={view} />
            <input name="q" defaultValue={q} placeholder="Buscar ticket, orden, cliente, correo o asunto" className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5" />
            <select name="status" defaultValue={status} className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5">
              <option value="active">Activos</option>
              <option value="new">Nuevos</option>
              <option value="customer_replied">Cliente respondió</option>
              <option value="in_progress">En proceso</option>
              <option value="waiting_customer">Esperando cliente</option>
              <option value="resolved">Resueltos</option>
              <option value="archived">Archivados</option>
              <option value="all">Todos</option>
            </select>
            <select name="priority" defaultValue={priority} className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5">
              <option value="all">Todas prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="normal">Normal</option>
              <option value="low">Baja</option>
            </select>
            <input name="assignee" defaultValue={assignee} placeholder="Responsable" className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5" />
            <select name="view" defaultValue={view} className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5">
              <option value="board">Tablero</option>
              <option value="list">Lista detallada</option>
            </select>
            <button className="rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white" type="submit">Filtrar</button>
          </form>
        </section>

        {view === "list" ? (
          <ListView tickets={tickets} returnTo={returnTo} />
        ) : (
          <BoardView tickets={tickets} returnTo={returnTo} />
        )}
      </div>
    </main>
  );
}

function BoardView({ tickets, returnTo }: { tickets: AdminSupportTicket[]; returnTo: string }) {
  return (
    <section className="grid gap-4 xl:grid-cols-5">
      {BOARD_COLUMNS.map((column) => {
        const columnTickets = tickets.filter((ticket) => column.statuses.includes(ticket.status || ""));
        return (
          <div key={column.key} className="min-h-[520px] rounded-[30px] border border-white/80 bg-white/80 p-4 shadow-xl shadow-blue-950/5 backdrop-blur">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{column.title}</h2>
                <p className="mt-1 text-xs leading-5 text-neutral-500">{column.hint}</p>
              </div>
              <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-bold text-white">{columnTickets.length}</span>
            </div>
            <div className="space-y-3">
              {columnTickets.length > 0 ? columnTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} returnTo={returnTo} compact />) : (
                <div className="rounded-[22px] border border-dashed border-neutral-300 bg-white/60 p-5 text-center text-xs leading-5 text-neutral-500">
                  Sin tickets en esta etapa.
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function ListView({ tickets, returnTo }: { tickets: AdminSupportTicket[]; returnTo: string }) {
  return (
    <section className="grid gap-4">
      {tickets.length > 0 ? tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} returnTo={returnTo} />
      )) : (
        <div className="rounded-[30px] border border-dashed border-neutral-300 bg-white/80 p-8 text-center text-sm text-neutral-500">No hay tickets con este filtro.</div>
      )}
    </section>
  );
}

function TicketCard({ ticket, returnTo, compact = false }: { ticket: AdminSupportTicket; returnTo: string; compact?: boolean }) {
  const lastVisibleMessage = (ticket.ramx_support_messages || []).filter((message) => !message.is_internal).at(-1);
  const nextStatus = suggestNextStatus(ticket.status);

  return (
    <article className={`rounded-[26px] border border-white/80 bg-white/95 shadow-lg shadow-blue-950/5 ${compact ? "p-4" : "p-5"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/admin/support/${ticket.ticket_number}`} className="font-mono text-sm font-bold text-sky-700 hover:text-sky-950">
            {ticket.ticket_number}
          </Link>
          <h3 className="mt-2 text-base font-semibold leading-6 tracking-tight text-neutral-950">
            <Link href={`/admin/support/${ticket.ticket_number}`} className="hover:text-sky-700">
              {ticket.subject || "Solicitud RAMX"}
            </Link>
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(ticket.status)}`}>{STATUS_LABELS[ticket.status || ""] || "Abierto"}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${priorityTone(ticket.priority)}`}>{priorityLabel(ticket.priority)}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs leading-5 text-neutral-500">
        <p><span className="font-semibold text-neutral-700">Cliente:</span> {ticket.customer_name || "Cliente RAMX"} · {ticket.customer_email || "—"}</p>
        <p><span className="font-semibold text-neutral-700">Orden:</span> {ticket.order_number || "Sin orden"} · <span className="font-semibold text-neutral-700">Categoría:</span> {CATEGORY_LABELS[ticket.category || ""] || "Otro"}</p>
        <p><span className="font-semibold text-neutral-700">Responsable:</span> {ticket.assigned_to || "Sin asignar"}</p>
      </div>

      {ticket.admin_summary ? (
        <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          <span className="font-bold">Resumen interno:</span> {ticket.admin_summary}
        </div>
      ) : null}

      {!compact && lastVisibleMessage ? (
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-600">
          <p className="font-semibold text-neutral-950">Último mensaje</p>
          <p className="mt-1 line-clamp-3 whitespace-pre-line">{lastVisibleMessage.body}</p>
        </div>
      ) : null}

      {ticket.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {ticket.tags.slice(0, compact ? 3 : 8).map((tag) => (
            <span key={tag} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-500">#{tag}</span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 text-xs text-neutral-500 sm:grid-cols-2">
        <p>Creado: {formatDate(ticket.created_at)}</p>
        <p>Última actividad: {formatDate(ticket.last_message_at || ticket.updated_at)}</p>
        <p>1ª respuesta: {ticket.first_response_at ? formatDate(ticket.first_response_at) : "Pendiente"}</p>
        <p className={isOverdue(ticket.sla_due_at) ? "font-bold text-rose-700" : ""}>SLA: {ticket.sla_due_at ? formatDate(ticket.sla_due_at) : "Sin SLA"}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={`/admin/support/${ticket.ticket_number}`} className="rounded-2xl bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800">
          Abrir
        </Link>
        {ticket.order_number ? (
          <Link href={`/admin/orders?q=${encodeURIComponent(ticket.order_number)}`} className="rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 transition hover:-translate-y-0.5 hover:shadow-sm">
            Ver orden
          </Link>
        ) : null}
        {nextStatus ? (
          <form action={moveRamxSupportTicketAction}>
            <input type="hidden" name="ticket_id" value={ticket.id} />
            <input type="hidden" name="next_status" value={nextStatus.value} />
            <input type="hidden" name="return_to" value={returnTo} />
            <button type="submit" className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-semibold text-sky-800 transition hover:-translate-y-0.5 hover:bg-sky-100">
              {nextStatus.label}
            </button>
          </form>
        ) : null}
        {ticket.archived_at ? (
          <form action={restoreRamxSupportTicketAction}>
            <input type="hidden" name="ticket_id" value={ticket.id} />
            <input type="hidden" name="return_to" value={returnTo} />
            <button type="submit" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">Restaurar</button>
          </form>
        ) : (
          <form action={archiveRamxSupportTicketAction}>
            <input type="hidden" name="ticket_id" value={ticket.id} />
            <input type="hidden" name="return_to" value={returnTo} />
            <button type="submit" className="rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-500 hover:text-neutral-950">Archivar</button>
          </form>
        )}
      </div>
    </article>
  );
}

async function getAdminTickets(filters: { status: string; q: string; priority: string; assignee: string }) {
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
      tags,
      admin_summary,
      first_response_at,
      last_customer_message_at,
      last_admin_message_at,
      last_message_at,
      sla_due_at,
      resolved_at,
      closed_at,
      archived_at,
      created_at,
      updated_at,
      ramx_support_messages (
        id,
        sender_type,
        author_name,
        body,
        is_internal,
        created_at
      )
    `)
    .order("last_message_at", { ascending: false })
    .limit(200);

  if (filters.status === "active") query = query.is("archived_at", null).not("status", "in", "(resolved,closed)");
  else if (filters.status === "archived") query = query.not("archived_at", "is", null);
  else if (filters.status !== "all") query = query.is("archived_at", null).eq("status", filters.status);

  if (filters.priority !== "all") query = query.eq("priority", filters.priority);
  if (filters.assignee) query = query.ilike("assigned_to", `%${escapeLike(filters.assignee)}%`);
  if (filters.q) {
    const q = escapeLike(filters.q);
    query = query.or(`ticket_number.ilike.%${q}%,order_number.ilike.%${q}%,customer_email.ilike.%${q}%,customer_name.ilike.%${q}%,subject.ilike.%${q}%`);
  }

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

async function getMetrics(q: string): Promise<Metrics> {
  const admin = createAdminClient();
  let query = admin
    .from("ramx_support_tickets")
    .select("id,status,priority,sla_due_at,resolved_at,archived_at,customer_email,customer_name,subject,order_number")
    .limit(1000);

  if (q) {
    const cleanQ = escapeLike(q);
    query = query.or(`ticket_number.ilike.%${cleanQ}%,order_number.ilike.%${cleanQ}%,customer_email.ilike.%${cleanQ}%,customer_name.ilike.%${cleanQ}%,subject.ilike.%${cleanQ}%`);
  }

  const { data } = await query;
  const rows = (data || []) as Array<{ status: string | null; priority: string | null; sla_due_at: string | null; resolved_at: string | null; archived_at: string | null }>;
  const today = new Date().toISOString().slice(0, 10);
  const active = rows.filter((row) => !row.archived_at && row.status !== "resolved" && row.status !== "closed");

  return {
    totalActive: active.length,
    needsAttention: active.filter((row) => row.status === "new" || row.status === "customer_replied" || row.status === "open").length,
    inProgress: active.filter((row) => row.status === "in_progress").length,
    waitingCustomer: active.filter((row) => row.status === "waiting_customer").length,
    resolvedToday: rows.filter((row) => row.resolved_at?.slice(0, 10) === today).length,
    urgent: active.filter((row) => row.priority === "urgent").length,
    overdue: active.filter((row) => isOverdue(row.sla_due_at)).length,
  };
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "sky" | "violet" | "amber" | "rose" | "emerald" }) {
  const toneClass: Record<string, string> = {
    neutral: "text-white/80",
    sky: "text-sky-200",
    violet: "text-violet-200",
    amber: "text-amber-200",
    rose: "text-rose-200",
    emerald: "text-emerald-200",
  };
  return (
    <div className="border-b border-white/10 p-4 sm:border-b-0 sm:border-r last:border-r-0">
      <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${toneClass[tone]}`}>{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Notice({ notice }: { notice: string }) {
  const labels: Record<string, string> = {
    saved: "Ticket actualizado.",
    replied: "Respuesta enviada al portal del cliente.",
    resolved: "Respuesta enviada y ticket marcado como resuelto.",
    archived: "Ticket archivado.",
    restored: "Ticket restaurado.",
    moved: "Ticket movido de etapa.",
    note: "Nota interna guardada.",
  };
  return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{labels[notice] || "Cambios guardados."}</div>;
}

function suggestNextStatus(status: string | null | undefined) {
  if (status === "new" || status === "open" || status === "customer_replied") return { value: "in_progress", label: "Tomar" };
  if (status === "in_progress") return { value: "waiting_customer", label: "Esperar cliente" };
  if (status === "waiting_customer") return { value: "resolved", label: "Resolver" };
  if (status === "resolved") return { value: "closed", label: "Cerrar" };
  return null;
}

function statusTone(status: string | null | undefined) {
  if (status === "resolved" || status === "closed") return "bg-emerald-100 text-emerald-700";
  if (status === "waiting_customer") return "bg-amber-100 text-amber-700";
  if (status === "customer_replied" || status === "new") return "bg-sky-100 text-sky-700";
  if (status === "in_progress") return "bg-violet-100 text-violet-700";
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

function isOverdue(date: string | null | undefined) {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function escapeLike(value: string) {
  return value.replaceAll("%", "").replaceAll("_", "").slice(0, 120);
}
