import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { addCustomerRamxSupportReplyAction } from "../actions";

type PageProps = {
  params: Promise<{ ticket: string }>;
  searchParams?: Promise<{
    email?: string;
    created?: string;
    sent?: string;
    error?: string;
  }>;
};

type SupportTicketDetail = {
  id: string;
  ticket_number: string;
  order_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  subject: string | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_message_at: string | null;
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

export default async function CustomerSupportTicketPage({ params, searchParams }: PageProps) {
  const { ticket: ticketParam } = await params;
  const query = searchParams ? await searchParams : {};
  const ticketNumber = normalizeTicketNumber(ticketParam);
  const email = normalizeEmail(query.email);
  const ticket = email ? await getTicket(ticketNumber, email) : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_55%,#f8fafc_100%)] px-4 py-10 text-neutral-950 sm:px-6">
      <section className="mx-auto max-w-5xl space-y-6">
        <Link href="/portal/soporte" className="text-sm font-semibold text-neutral-500 hover:text-neutral-950">
          ← Soporte RAMX
        </Link>

        {!email ? (
          <AccessForm ticketNumber={ticketNumber} />
        ) : !ticket ? (
          <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-6 text-sm leading-6 text-rose-700 shadow-xl">
            No encontramos esta solicitud con el correo capturado. Revisa el enlace o vuelve a buscar desde soporte.
          </div>
        ) : (
          <>
            {query.created ? <Notice text="Solicitud creada correctamente. El equipo RAMX podrá darle seguimiento desde admin." /> : null}
            {query.sent ? <Notice text="Mensaje enviado. Quedó agregado al historial de la solicitud." /> : null}

            <article className="rounded-[36px] border border-white/80 bg-white/95 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-bold text-neutral-500">{ticket.ticket_number}</p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{ticket.subject || "Solicitud RAMX"}</h1>
                  <p className="mt-3 text-sm leading-6 text-neutral-600">
                    {CATEGORY_LABELS[ticket.category || ""] || "Soporte"} · Orden {ticket.order_number || "sin orden"} · Última actividad {formatDate(ticket.last_message_at || ticket.updated_at || ticket.created_at)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(ticket.status)}`}>
                  {STATUS_LABELS[ticket.status || ""] || "Abierto"}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <InfoPill label="Prioridad" value={ticket.priority === "high" ? "Alta" : "Normal"} />
                <InfoPill label="Cliente" value={ticket.customer_name || "Cliente RAMX"} />
                <InfoPill label="Correo" value={ticket.customer_email || "—"} />
              </div>
            </article>

            <section className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
              <article className="rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-xl shadow-blue-950/5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Historial de mensajes</p>
                <div className="mt-6 space-y-4">
                  {(ticket.ramx_support_messages || []).filter((message) => !message.is_internal).map((message) => (
                    <div key={message.id} className={`rounded-[24px] border p-5 ${message.sender_type === "admin" ? "border-sky-100 bg-sky-50" : "border-neutral-200 bg-neutral-50"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-neutral-950">{message.sender_type === "admin" ? "RAMX" : message.author_name || "Cliente"}</p>
                        <p className="text-xs text-neutral-500">{formatDate(message.created_at)}</p>
                      </div>
                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-700">{message.body}</p>
                    </div>
                  ))}
                </div>

                {ticket.status === "resolved" || ticket.status === "closed" ? (
                  <div className="mt-6 rounded-[24px] border border-emerald-100 bg-emerald-50 p-5 text-sm leading-6 text-emerald-800">
                    Esta solicitud aparece como resuelta. Puedes responder si necesitas reabrir el seguimiento.
                  </div>
                ) : null}

                <form action={addCustomerRamxSupportReplyAction} className="mt-6 rounded-[24px] border border-neutral-200 bg-white p-5">
                  <input type="hidden" name="ticket_number" value={ticket.ticket_number} />
                  <input type="hidden" name="customer_email" value={email} />
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Responder</span>
                    <textarea name="body" rows={5} placeholder="Escribe una actualización, duda o detalle adicional." className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5" required />
                  </label>
                  <button type="submit" className="mt-4 inline-flex rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800">
                    Enviar mensaje
                  </button>
                </form>
              </article>

              <aside className="space-y-5">
                <div className="rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-xl shadow-blue-950/5">
                  <p className="text-sm font-semibold text-neutral-950">Archivos adjuntos</p>
                  <div className="mt-4 space-y-3">
                    {(ticket.ramx_support_ticket_attachments || []).length > 0 ? (ticket.ramx_support_ticket_attachments || []).map((file) => (
                      <a key={file.id} href={file.file_url || "#"} target="_blank" rel="noreferrer" className="block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm font-semibold text-neutral-800 hover:bg-white">
                        {file.file_name || "Adjunto RAMX"}
                      </a>
                    )) : (
                      <p className="text-sm leading-6 text-neutral-500">Aún no hay archivos adjuntos.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] border border-amber-100 bg-amber-50 p-6 shadow-xl shadow-amber-950/5">
                  <p className="text-sm font-semibold text-amber-950">Siguiente mejora</p>
                  <p className="mt-2 text-sm leading-6 text-amber-800/80">
                    En una etapa posterior conectaremos carga directa de imágenes, comprobantes y PDFs al Storage de RAMX.
                  </p>
                </div>
              </aside>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function AccessForm({ ticketNumber }: { ticketNumber: string }) {
  return (
    <form className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-xl sm:p-8" method="get">
      <h1 className="text-2xl font-semibold tracking-tight">Abrir solicitud {ticketNumber}</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">Por seguridad, captura el correo con el que hiciste la compra.</p>
      <label className="mt-5 block">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Correo de compra</span>
        <input name="email" type="email" required className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5" />
      </label>
      <button type="submit" className="mt-5 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white">Abrir solicitud</button>
    </form>
  );
}

function Notice({ text }: { text: string }) {
  return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">{text}</div>;
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

async function getTicket(ticketNumber: string, email: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("ramx_support_tickets")
      .select(`
        id,
        ticket_number,
        order_number,
        customer_name,
        customer_email,
        category,
        priority,
        status,
        subject,
        description,
        created_at,
        updated_at,
        last_message_at,
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
          created_at
        )
      `)
      .eq("ticket_number", ticketNumber)
      .maybeSingle();

    const ticket = (data as SupportTicketDetail | null) || null;
    if (!ticket) return null;
    if (normalizeEmail(ticket.customer_email || "") !== email) return null;

    return {
      ...ticket,
      ramx_support_messages: (ticket.ramx_support_messages || []).sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || ""))),
    };
  } catch (error) {
    console.error("RAMX support ticket detail error:", error);
    return null;
  }
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

function normalizeTicketNumber(value: string | undefined) {
  return String(value || "").trim().toUpperCase().slice(0, 40);
}

function normalizeEmail(value: string | undefined) {
  return String(value || "").trim().toLowerCase().slice(0, 160);
}
