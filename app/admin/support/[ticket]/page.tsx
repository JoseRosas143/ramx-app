import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRamxAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  addAdminRamxInternalNoteAction,
  addAdminRamxSupportReplyAction,
  archiveRamxSupportTicketAction,
  restoreRamxSupportTicketAction,
  updateRamxSupportTicketAction,
} from "../actions";

type PageProps = {
  params: Promise<{ ticket: string }>;
  searchParams?: Promise<{ notice?: string }>;
};

type TicketDetail = {
  id: string;
  ticket_number: string;
  order_id: string | null;
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
  resolution_summary: string | null;
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
  ramx_support_messages?: SupportMessage[] | null;
  ramx_support_ticket_attachments?: SupportAttachment[] | null;
};

type SupportMessage = {
  id: string;
  sender_type: string | null;
  author_name: string | null;
  author_email: string | null;
  body: string | null;
  is_internal: boolean | null;
  created_at: string | null;
};

type SupportAttachment = {
  id: string;
  file_name: string | null;
  file_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string | null;
};

type RelatedOrder = {
  id: string;
  order_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  status: string | null;
  payment_status: string | null;
  total_amount: number | null;
  shipping_carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
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

export default async function AdminSupportTicketDetailPage({ params, searchParams }: PageProps) {
  await requireRamxAdmin();
  const { ticket: ticketParam } = await params;
  const query = searchParams ? await searchParams : {};
  const ticketNumber = normalizeTicketNumber(ticketParam);
  const ticket = await getTicket(ticketNumber);

  if (!ticket) {
    return notFound();
  }

  const ticketDetail: TicketDetail = ticket;
  const order = ticketDetail.order_number ? await getRelatedOrder(ticketDetail.order_number) : null;
  const returnTo = `/admin/support/${encodeURIComponent(ticketDetail.ticket_number)}`;
  const visibleMessages = (ticket.ramx_support_messages || []).filter((message) => !message.is_internal);
  const internalNotes = (ticket.ramx_support_messages || []).filter((message) => message.is_internal);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 text-neutral-950 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/support" className="inline-flex text-sm font-medium text-neutral-600 hover:text-neutral-950">
            ← Volver al tablero
          </Link>
          <Link href={`/portal/soporte/${ticketDetail.ticket_number}?email=${encodeURIComponent(ticketDetail.customer_email || "")}`} className="rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            Ver como cliente
          </Link>
        </div>

        {query.notice ? <Notice notice={query.notice} /> : null}

        <section className="rounded-[36px] border border-white/80 bg-white/95 p-6 shadow-2xl shadow-blue-950/10 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <p className="font-mono text-sm font-bold text-sky-700">{ticketDetail.ticket_number}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{ticketDetail.subject || "Solicitud RAMX"}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600">
                {CATEGORY_LABELS[ticketDetail.category || ""] || "Soporte"} · {ticketDetail.customer_name || "Cliente RAMX"} · {ticketDetail.customer_email || "sin correo"}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(ticketDetail.status)}`}>{STATUS_LABELS[ticketDetail.status || ""] || "Abierto"}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${priorityTone(ticketDetail.priority)}`}>{priorityLabel(ticketDetail.priority)}</span>
                {ticketDetail.archived_at ? <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-bold text-neutral-600">Archivado</span> : null}
                {ticketDetail.tags?.map((tag) => <span key={tag} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-500">#{tag}</span>)}
              </div>
            </div>

            <div className="rounded-[26px] border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-sm font-semibold text-neutral-950">SLA y actividad</p>
              <div className="mt-4 grid gap-3 text-sm text-neutral-600">
                <InfoLine label="Creado" value={formatDate(ticketDetail.created_at)} />
                <InfoLine label="Última actividad" value={formatDate(ticketDetail.last_message_at || ticketDetail.updated_at)} />
                <InfoLine label="Primera respuesta" value={ticketDetail.first_response_at ? formatDate(ticketDetail.first_response_at) : "Pendiente"} />
                <InfoLine label="Vence" value={ticketDetail.sla_due_at ? formatDate(ticketDetail.sla_due_at) : "Sin SLA"} highlight={isOverdue(ticketDetail.sla_due_at)} />
                <InfoLine label="Responsable" value={ticketDetail.assigned_to || "Sin asignar"} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <article className="rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-xl shadow-blue-950/5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Descripción inicial</p>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-700">{ticketDetail.description || "Sin descripción."}</p>
            </article>

            <article className="rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-xl shadow-blue-950/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Conversación con cliente</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">Historial visible</h2>
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-500">{visibleMessages.length} mensajes</span>
              </div>
              <div className="mt-6 space-y-4">
                {visibleMessages.length > 0 ? visibleMessages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                )) : (
                  <div className="rounded-[24px] border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">Todavía no hay mensajes adicionales.</div>
                )}
              </div>

              <form action={addAdminRamxSupportReplyAction} className="mt-6 rounded-[24px] border border-sky-100 bg-sky-50 p-5">
                <input type="hidden" name="ticket_id" value={ticketDetail.id} />
                <input type="hidden" name="return_to" value={returnTo} />
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Responder al cliente</span>
                  <textarea name="reply_body" rows={5} placeholder="Escribe una respuesta clara, amable y accionable." className="mt-2 w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10" required />
                </label>
                <label className="mt-3 flex items-center gap-2 text-sm font-medium text-sky-900">
                  <input type="checkbox" name="close_after_reply" className="h-4 w-4 rounded border-sky-200" />
                  Enviar y marcar como resuelto
                </label>
                <button className="mt-4 rounded-2xl bg-sky-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5" type="submit">Enviar respuesta</button>
              </form>
            </article>

            <article className="rounded-[34px] border border-amber-100 bg-amber-50 p-6 shadow-xl shadow-amber-950/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Notas internas</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-amber-950">Bitácora RAMX</h2>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">No visible al cliente</span>
              </div>
              <div className="mt-5 space-y-3">
                {internalNotes.length > 0 ? internalNotes.map((message) => (
                  <div key={message.id} className="rounded-2xl border border-amber-200 bg-white/70 p-4 text-sm leading-6 text-amber-950">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{message.author_name || "Equipo RAMX"}</p>
                      <p className="text-xs text-amber-700">{formatDate(message.created_at)}</p>
                    </div>
                    <p className="mt-2 whitespace-pre-line">{message.body}</p>
                  </div>
                )) : <p className="text-sm leading-6 text-amber-800">Sin notas internas todavía.</p>}
              </div>
              <form action={addAdminRamxInternalNoteAction} className="mt-5">
                <input type="hidden" name="ticket_id" value={ticketDetail.id} />
                <input type="hidden" name="return_to" value={returnTo} />
                <textarea name="internal_note" rows={4} placeholder="Ej. Cliente pidió cambio de dirección; confirmar antes de enviar." className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10" required />
                <button className="mt-3 rounded-2xl bg-amber-950 px-5 py-3 text-sm font-semibold text-white" type="submit">Guardar nota interna</button>
              </form>
            </article>
          </div>

          <aside className="space-y-6">
            <form action={updateRamxSupportTicketAction} className="rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-xl shadow-blue-950/5">
              <input type="hidden" name="ticket_id" value={ticketDetail.id} />
              <input type="hidden" name="return_to" value={returnTo} />
              <h2 className="text-xl font-semibold tracking-tight">Gestión del ticket</h2>
              <div className="mt-5 grid gap-4">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Estatus</span>
                  <select name="status" defaultValue={ticketDetail.status || "new"} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm">
                    {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Prioridad</span>
                  <select name="priority" defaultValue={ticketDetail.priority || "normal"} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm">
                    <option value="low">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Responsable</span>
                  <input name="assigned_to" defaultValue={ticketDetail.assigned_to || ""} placeholder="Nombre o correo" className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Tags</span>
                  <input name="tags" defaultValue={(ticketDetail.tags || []).join(", ")} placeholder="pago, guia, activacion" className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Resumen interno</span>
                  <textarea name="admin_summary" rows={4} defaultValue={ticketDetail.admin_summary || ""} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Resumen de resolución</span>
                  <textarea name="resolution_summary" rows={4} defaultValue={ticketDetail.resolution_summary || ""} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Nota interna opcional</span>
                  <textarea name="internal_note" rows={3} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm" />
                </label>
              </div>
              <button className="mt-5 w-full rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white" type="submit">Guardar cambios</button>
            </form>

            <RelatedOrderCard order={order} ticket={ticketDetail} />
            <AttachmentsCard files={ticketDetail.ramx_support_ticket_attachments || []} />

            {ticketDetail.archived_at ? (
              <form action={restoreRamxSupportTicketAction} className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5">
                <input type="hidden" name="ticket_id" value={ticketDetail.id} />
                <input type="hidden" name="return_to" value={returnTo} />
                <button className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white" type="submit">Restaurar ticket</button>
              </form>
            ) : (
              <form action={archiveRamxSupportTicketAction} className="rounded-[28px] border border-neutral-200 bg-white p-5">
                <input type="hidden" name="ticket_id" value={ticketDetail.id} />
                <input type="hidden" name="return_to" value={returnTo} />
                <button className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-600 hover:text-neutral-950" type="submit">Archivar ticket</button>
              </form>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

function RelatedOrderCard({ order, ticket }: { order: RelatedOrder | null; ticket: TicketDetail }) {
  return (
    <div className="rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-xl shadow-blue-950/5">
      <h2 className="text-xl font-semibold tracking-tight">Orden relacionada</h2>
      {order ? (
        <div className="mt-5 space-y-3 text-sm text-neutral-600">
          <InfoLine label="Orden" value={order.order_number || "—"} />
          <InfoLine label="Pago" value={paymentLabel(order.payment_status)} />
          <InfoLine label="Operación" value={orderStatusLabel(order.status)} />
          <InfoLine label="Total" value={`$${Number(order.total_amount || 0).toFixed(2)} MXN`} />
          <InfoLine label="Teléfono" value={order.customer_phone || ticket.customer_phone || "—"} />
          <InfoLine label="Guía" value={order.tracking_number || "—"} />
          <div className="pt-3">
            <Link href={`/admin/orders?q=${encodeURIComponent(order.order_number || "")}`} className="inline-flex rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white">Abrir pedido</Link>
            {order.tracking_url ? <a href={order.tracking_url} target="_blank" rel="noreferrer" className="ml-2 inline-flex rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700">Rastrear</a> : null}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-neutral-500">Este ticket no está vinculado a una orden existente.</p>
      )}
    </div>
  );
}

function AttachmentsCard({ files }: { files: SupportAttachment[] }) {
  return (
    <div className="rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-xl shadow-blue-950/5">
      <h2 className="text-xl font-semibold tracking-tight">Adjuntos</h2>
      <div className="mt-5 space-y-3">
        {files.length > 0 ? files.map((file) => (
          <a key={file.id} href={file.file_url || "#"} target="_blank" rel="noreferrer" className="block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm font-semibold text-neutral-800 hover:bg-white">
            {file.file_name || "Adjunto RAMX"}
            <span className="mt-1 block text-xs font-normal text-neutral-500">{formatFileSize(file.size_bytes)} · {formatDate(file.created_at)}</span>
          </a>
        )) : (
          <p className="text-sm leading-6 text-neutral-500">Sin archivos adjuntos por ahora.</p>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: SupportMessage }) {
  const isAdmin = message.sender_type === "admin";
  return (
    <div className={`rounded-[24px] border p-5 ${isAdmin ? "border-sky-100 bg-sky-50" : "border-neutral-200 bg-neutral-50"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-neutral-950">{isAdmin ? "RAMX" : message.author_name || "Cliente"}</p>
        <p className="text-xs text-neutral-500">{formatDate(message.created_at)}</p>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-700">{message.body}</p>
    </div>
  );
}

function Notice({ notice }: { notice: string }) {
  const labels: Record<string, string> = {
    saved: "Ticket actualizado.",
    replied: "Respuesta enviada al cliente.",
    resolved: "Respuesta enviada y ticket marcado como resuelto.",
    archived: "Ticket archivado.",
    restored: "Ticket restaurado.",
    note: "Nota interna guardada.",
  };
  return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{labels[notice] || "Cambios guardados."}</div>;
}

function InfoLine({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-neutral-200/70 pb-2 last:border-b-0 last:pb-0">
      <span className="text-neutral-500">{label}</span>
      <span className={`text-right font-semibold ${highlight ? "text-rose-700" : "text-neutral-950"}`}>{value}</span>
    </div>
  );
}

async function getTicket(ticketNumber: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ramx_support_tickets")
    .select(`
      id,
      ticket_number,
      order_id,
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
      resolution_summary,
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
        author_email,
        body,
        is_internal,
        created_at
      ),
      ramx_support_ticket_attachments (
        id,
        file_name,
        file_url,
        mime_type,
        size_bytes,
        created_at
      )
    `)
    .eq("ticket_number", ticketNumber)
    .maybeSingle();

  if (error) {
    console.error("RAMX admin support detail error:", error);
    return null;
  }

  const ticket = data as TicketDetail | null;
  if (!ticket) return null;

  return {
    ...ticket,
    ramx_support_messages: (ticket.ramx_support_messages || []).sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || ""))),
    ramx_support_ticket_attachments: (ticket.ramx_support_ticket_attachments || []).sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || ""))),
  };
}

async function getRelatedOrder(orderNumber: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ramx_orders")
    .select("id,order_number,customer_name,customer_email,customer_phone,status,payment_status,total_amount,shipping_carrier,tracking_number,tracking_url")
    .eq("order_number", orderNumber)
    .maybeSingle();

  return (data || null) as RelatedOrder | null;
}

function normalizeTicketNumber(value: string) {
  return decodeURIComponent(value || "").trim().toUpperCase();
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

function paymentLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    unpaid: "Sin pagar",
    manual_pending: "Pendiente",
    paid: "Pagado",
    refunded: "Devuelto",
    cancelled: "Cancelado",
  };
  return labels[status || ""] || status || "—";
}

function orderStatusLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    in_production: "En producción",
    ready: "Listo",
    delivered: "Entregado",
    returned: "Devuelto",
    cancelled: "Cancelado",
  };
  return labels[status || ""] || status || "—";
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

function formatFileSize(value: number | null | undefined) {
  if (!value) return "Archivo";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
