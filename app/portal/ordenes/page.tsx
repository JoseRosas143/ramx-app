import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncRamxMercadoPagoByOrderNumber } from "@/lib/ramx-payment-sync";

type PageProps = {
  searchParams?: Promise<{
    order?: string;
    email?: string;
  }>;
};

type CustomerPortalOrder = {
  id: string;
  order_number: string;
  status: string | null;
  payment_status: string | null;
  payment_provider: string | null;
  mercado_pago_init_point: string | null;
  mercado_pago_sandbox_init_point: string | null;
  mercado_pago_payment_status: string | null;
  mercado_pago_payment_status_detail: string | null;
  mercado_pago_payment_updated_at: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_method: string | null;
  shipping_address: string | null;
  shipping_carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  total_amount: number | string | null;
  currency: string | null;
  created_at: string | null;
  updated_at: string | null;
  confirmed_at?: string | null;
  delivered_at?: string | null;
  returned_at?: string | null;
  product_assigned_at?: string | null;
  notes: string | null;
  pets?: {
    name: string | null;
    public_slug: string | null;
    microchip_number: string | null;
    internal_id: string | null;
  } | null;
  assigned_codes?: CustomerOrderCode[];
  support_tickets?: CustomerSupportTicketSummary[];
  ramx_order_items?: Array<{
    product_type: string;
    product_name: string | null;
    quantity: number | null;
    unit_price: number | string | null;
    subtotal: number | string | null;
  }> | null;
};

type CustomerOrderCode = {
  id: string;
  code: string;
  product_type: string;
  status: string;
  assigned_at: string | null;
  activated_at: string | null;
};

type CustomerSupportTicketSummary = {
  id: string;
  ticket_number: string;
  subject: string | null;
  status: string | null;
  category: string | null;
  last_message_at: string | null;
  created_at: string | null;
};

const ORDER_LABELS: Record<string, string> = {
  pending: "Pedido recibido",
  confirmed: "Confirmado",
  in_production: "En preparación",
  ready: "Producto asignado",
  delivered: "Entregado",
  returned: "Devuelto",
  cancelled: "Cancelado",
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Sin pagar",
  manual_pending: "Pago pendiente",
  paid: "Pago aprobado",
  refunded: "Pago devuelto",
  cancelled: "Cancelado",
};

const SUPPORT_STATUS_LABELS: Record<string, string> = {
  new: "Nuevo",
  open: "Abierto",
  customer_replied: "Respuesta enviada",
  waiting_customer: "Esperando cliente",
  in_progress: "En proceso",
  resolved: "Resuelto",
  closed: "Cerrado",
};

export default async function CustomerOrdersPortalPage({ searchParams }: PageProps) {
  const query = searchParams ? await searchParams : {};
  const orderNumber = normalizeOrderNumber(query.order);
  const email = normalizeEmail(query.email);
  const shouldSearch = Boolean(orderNumber && email);
  const order = shouldSearch ? await getCustomerOrder(orderNumber, email) : null;
  const searchedWithoutResult = shouldSearch && !order;
  const paymentUrl = order ? chooseStoredPaymentUrl(order) : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_55%,#f8fafc_100%)] px-4 py-10 text-neutral-950 sm:px-6">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[36px] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                Portal de cliente RAMX
              </p>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
                Consulta el avance de tu pedido.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">
                Da seguimiento a tu preventa, pago, preparación, guía de envío y activación RAMX desde un solo lugar. Solo necesitas tu número de orden y el correo con el que compraste.
              </p>
              <div className="mt-6 grid gap-3 text-sm text-neutral-600 sm:grid-cols-3">
                <TrustPill title="Pago" text="Estado Mercado Pago" />
                <TrustPill title="Entrega" text="Guía y rastreo" />
                <TrustPill title="Soporte" text="Tickets y mensajes" />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/portal/soporte" className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-md">Soporte</Link>
                <Link href="/portal/add-ons" className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-md">Add-ons</Link>
              </div>
            </div>

            <form className="rounded-[30px] border border-neutral-200 bg-neutral-50/80 p-5 shadow-inner" method="get">
              <p className="text-sm font-semibold text-neutral-950">Buscar pedido</p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Protegemos tus datos: no mostramos información del pedido si el correo no coincide.
              </p>

              <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400" htmlFor="order">
                Número de orden
              </label>
              <input
                id="order"
                name="order"
                defaultValue={orderNumber}
                placeholder="RAMX-20260703-0017"
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5"
                required
              />

              <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400" htmlFor="email">
                Correo de compra
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={email}
                placeholder="tu-correo@email.com"
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5"
                required
              />

              <button className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800" type="submit">
                Consultar pedido
              </button>

              {searchedWithoutResult ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                  No encontramos una orden con esos datos. Revisa el número de orden y el correo usado en la compra.
                </div>
              ) : null}
            </form>
          </div>
        </div>

        {order ? (
          <section className="mt-8 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
            <article className="rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-xl shadow-blue-950/5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Pedido</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">{order.order_number}</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${paymentTone(order.payment_status)}`}>
                  {PAYMENT_LABELS[order.payment_status || ""] || "En validación"}
                </span>
              </div>

              <div className="mt-6 space-y-3 text-sm text-neutral-700">
                <SummaryRow label="Cliente" value={order.customer_name || "Cliente RAMX"} />
                <SummaryRow label="Producto" value={getItemsLabel(order)} />
                <SummaryRow label="Total" value={formatMxn(Number(order.total_amount || 0), order.currency || "MXN")} />
                <SummaryRow label="Estado" value={ORDER_LABELS[order.status || ""] || "Pedido recibido"} />
                <SummaryRow label="Mercado Pago" value={mercadoPagoPublicLabel(order)} />
                <SummaryRow label="Entrega" value={trackingLabel(order)} />
                <SummaryRow label="Dirección" value={order.shipping_address || "Pendiente o no aplica"} />
                <SummaryRow label="Mascota" value={petLabel(order)} />
                <SummaryRow label="Producto RAMX" value={activationSummary(order)} />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {paymentUrl && order.payment_status !== "paid" ? (
                  <a className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800" href={paymentUrl}>
                    Completar pago
                  </a>
                ) : null}
                {order.tracking_url ? (
                  <a className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-md" href={order.tracking_url} target="_blank" rel="noreferrer">
                    Rastrear envío
                  </a>
                ) : null}
                <a className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-md" href={`mailto:ramx@bonica.com.mx?subject=Ayuda con pedido ${encodeURIComponent(order.order_number)}`}>
                  Necesito ayuda
                </a>
              </div>
            </article>

            <article className="rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-xl shadow-blue-950/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Seguimiento</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">Timeline RAMX</h2>
                </div>
                <Link href="/tienda" className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-bold text-neutral-600 transition hover:border-neutral-950 hover:text-neutral-950">
                  Tienda
                </Link>
              </div>
              <OrderTimeline order={order} />

              {order.assigned_codes && order.assigned_codes.length > 0 ? (
                <div className="mt-6 rounded-[24px] border border-sky-100 bg-sky-50 p-5">
                  <p className="text-sm font-semibold text-sky-950">Activación RAMX</p>
                  <p className="mt-2 text-sm leading-6 text-sky-800/80">
                    Tu pedido ya tiene código físico asignado. Cuando recibas tu placa, QR o NFC, actívalo y vincúlalo a tu mascota.
                  </p>
                  <div className="mt-4 grid gap-3">
                    {order.assigned_codes.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white bg-white/90 p-4">
                        <p className="font-mono text-sm font-bold text-neutral-950">{item.code}</p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {productCodeLabel(item.product_type)} · {productCodeStatusLabel(item.status)}
                        </p>
                        <a
                          href={`/r/${encodeURIComponent(item.code)}`}
                          className="mt-3 inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800"
                        >
                          {item.status === "activated" ? "Abrir perfil público" : "Activar producto"}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 rounded-[24px] border border-indigo-100 bg-indigo-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-indigo-950">Solicitudes de soporte</p>
                    <p className="mt-1 text-sm leading-6 text-indigo-800/80">Historial de mensajes conectado a este pedido.</p>
                  </div>
                  <Link href={`/portal/soporte/nuevo?order=${encodeURIComponent(order.order_number)}&email=${encodeURIComponent(order.customer_email || "")}`} className="rounded-2xl bg-indigo-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">Abrir ticket</Link>
                </div>
                <div className="mt-4 grid gap-3">
                  {(order.support_tickets || []).length > 0 ? (order.support_tickets || []).map((ticket) => (
                    <Link key={ticket.id} href={`/portal/soporte/${encodeURIComponent(ticket.ticket_number)}?email=${encodeURIComponent(order.customer_email || "")}`} className="rounded-2xl border border-white bg-white/90 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                      <p className="font-mono text-sm font-bold text-neutral-950">{ticket.ticket_number}</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-800">{ticket.subject || "Solicitud RAMX"}</p>
                      <p className="mt-1 text-xs text-neutral-500">{SUPPORT_STATUS_LABELS[ticket.status || ""] || "Abierto"} · {formatDate(ticket.last_message_at || ticket.created_at)}</p>
                    </Link>
                  )) : (
                    <p className="rounded-2xl border border-white bg-white/70 p-4 text-sm leading-6 text-indigo-800/80">Aún no hay solicitudes abiertas para este pedido.</p>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-violet-100 bg-violet-50 p-5">
                <p className="text-sm font-semibold text-violet-950">Add-ons y premium</p>
                <p className="mt-2 text-sm leading-6 text-violet-800/80">
                  Próximamente podrás agregar reposición por pérdida de placa, placa extra y plan premium RAMX.
                </p>
                <Link href="/portal/add-ons" className="mt-4 inline-flex rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-900 transition hover:-translate-y-0.5 hover:shadow-md">Ver add-ons</Link>
              </div>

              <div className="mt-6 rounded-[24px] border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-900">Gracias por impulsar RAMX</p>
                <p className="mt-2 text-sm leading-6 text-emerald-800/80">
                  Cada preventa nos acerca al lanzamiento de una red de identidad y protección para mascotas. Cuando tu producto esté listo, aquí verás la guía y los siguientes pasos de activación.
                </p>
              </div>
            </article>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function TrustPill({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white bg-white/70 p-4 shadow-sm">
      <p className="font-semibold text-neutral-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-neutral-500">{text}</p>
    </div>
  );
}

async function getCustomerOrder(orderNumber: string, email: string) {
  try {
    await syncRamxMercadoPagoByOrderNumber(orderNumber, "success");
  } catch (error) {
    console.error("RAMX customer portal payment sync error:", error);
  }

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("ramx_orders")
      .select(
        `
        id,
        order_number,
        status,
        payment_status,
        payment_provider,
        mercado_pago_init_point,
        mercado_pago_sandbox_init_point,
        mercado_pago_payment_status,
        mercado_pago_payment_status_detail,
        mercado_pago_payment_updated_at,
        customer_name,
        customer_email,
        customer_phone,
        shipping_method,
        shipping_address,
        shipping_carrier,
        tracking_number,
        tracking_url,
        shipped_at,
        total_amount,
        currency,
        created_at,
        updated_at,
        confirmed_at,
        delivered_at,
        returned_at,
        product_assigned_at,
        notes,
        pets (
          name,
          public_slug,
          microchip_number,
          internal_id
        ),
        ramx_order_items (
          product_type,
          product_name,
          quantity,
          unit_price,
          subtotal
        )
      `,
      )
      .eq("order_number", orderNumber)
      .maybeSingle();

    const order = (data as CustomerPortalOrder | null) || null;
    if (!order) return null;

    const storedEmail = normalizeEmail(order.customer_email || "");
    if (!storedEmail || storedEmail !== email) return null;

    const { data: codeRows } = await admin
      .from("ramx_order_product_codes")
      .select("id, code, product_type, status, assigned_at, activated_at")
      .eq("order_id", order.id)
      .in("status", ["assigned", "activated", "blocked"])
      .order("assigned_at", { ascending: false });

    const { data: supportRows } = await admin
      .from("ramx_support_tickets")
      .select("id, ticket_number, subject, status, category, last_message_at, created_at")
      .eq("order_number", order.order_number)
      .eq("customer_email", email)
      .is("archived_at", null)
      .order("last_message_at", { ascending: false });

    return {
      ...order,
      assigned_codes: ((codeRows || []) as unknown as CustomerOrderCode[]) || [],
      support_tickets: ((supportRows || []) as unknown as CustomerSupportTicketSummary[]) || [],
    };
  } catch (error) {
    console.error("RAMX customer portal order lookup error:", error);
    return null;
  }
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-3 last:border-b-0 last:pb-0">
      <span className="text-neutral-500">{label}</span>
      <span className="max-w-[65%] text-right font-semibold text-neutral-950">{value || "—"}</span>
    </div>
  );
}

function OrderTimeline({ order }: { order: CustomerPortalOrder }) {
  const steps = getTimelineSteps(order);

  return (
    <ol className="mt-6 space-y-4">
      {steps.map((step) => (
        <li key={step.label} className="flex gap-4">
          <span
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
              step.done
                ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                : "border-neutral-200 bg-neutral-50 text-neutral-300"
            }`}
          >
            {step.done ? "✓" : "·"}
          </span>
          <div>
            <p className={`text-sm font-semibold ${step.done ? "text-neutral-950" : "text-neutral-400"}`}>{step.label}</p>
            <p className="text-xs leading-5 text-neutral-500">{step.date || step.help}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function getTimelineSteps(order: CustomerPortalOrder) {
  const status = order.status || "pending";
  const paidAt = order.mercado_pago_payment_updated_at || (order.payment_status === "paid" ? order.updated_at : null);
  const productAssigned = Boolean(order.product_assigned_at) || Boolean(order.assigned_codes?.length) || Boolean(order.tracking_number) || ["ready", "delivered", "returned"].includes(status);
  const shippedOrDelivered = Boolean(order.tracking_number) || ["delivered", "returned"].includes(status);

  return [
    { label: "Pedido creado", done: true, date: formatDate(order.created_at), help: "Solicitud recibida." },
    { label: "Pago recibido", done: order.payment_status === "paid", date: order.payment_status === "paid" ? formatDate(paidAt) : null, help: "Pendiente de confirmación de pago." },
    { label: "En preparación", done: ["in_production", "ready", "delivered", "returned"].includes(status), date: status === "in_production" ? formatDate(order.updated_at) : null, help: "RAMX prepara tu producto." },
    { label: "Producto asignado", done: productAssigned, date: productAssigned ? formatDate(order.updated_at) : null, help: "Asignaremos el código físico o placa." },
    { label: "Enviado / entregado", done: shippedOrDelivered, date: order.shipped_at ? formatDate(order.shipped_at) : order.delivered_at ? formatDate(order.delivered_at) : null, help: "Pendiente de entrega." },
    { label: "Devuelto", done: status === "returned", date: order.returned_at ? formatDate(order.returned_at) : null, help: "Solo aplica si hubo devolución." },
  ];
}

function getItemsLabel(order: CustomerPortalOrder) {
  const items = order.ramx_order_items || [];
  const label = items
    .map((item) => `${item.quantity || 1} × ${item.product_name || item.product_type}`)
    .join(", ");
  return label || "Producto RAMX";
}

function trackingLabel(order: CustomerPortalOrder) {
  const carrier = order.shipping_carrier || "";
  const number = order.tracking_number || "";
  if (!carrier && !number) return "Pendiente";
  return [carrier, number].filter(Boolean).join(" · ");
}

function petLabel(order: CustomerPortalOrder) {
  const pet = Array.isArray(order.pets) ? order.pets[0] : order.pets;
  if (!pet?.name) return "No vinculada todavía";
  return [pet.name, pet.internal_id || pet.microchip_number].filter(Boolean).join(" · ");
}


function activationSummary(order: CustomerPortalOrder) {
  const codes = order.assigned_codes || [];
  if (codes.length === 0) return "Pendiente de asignar";
  return codes.map((item) => `${item.code} · ${productCodeStatusLabel(item.status)}`).join("\n");
}

function productCodeLabel(value: string) {
  const labels: Record<string, string> = {
    qr_plate: "Placa QR",
    qr_nfc_plate: "Placa QR + NFC",
    nfc_card: "Tarjeta NFC",
    kit: "Kit RAMX",
    other: "Producto RAMX",
    placa_inteligente_nfc_qr: "Placa Inteligente NFC/Qr",
    combo_identificacion_inteligente: "Combo Identificación",
    combo_identidad_inteligente: "Combo Identidad",
  };
  return labels[value] || value || "Producto RAMX";
}

function productCodeStatusLabel(value: string) {
  const labels: Record<string, string> = {
    assigned: "Pendiente de activar",
    activated: "Activado",
    blocked: "Bloqueado",
    released: "Liberado",
    replaced: "Reemplazado",
  };
  return labels[value] || value || "—";
}

function mercadoPagoPublicLabel(order: CustomerPortalOrder) {
  if (order.payment_provider !== "mercado_pago") return "Por confirmar";
  const status = String(order.mercado_pago_payment_status || "").toLowerCase();
  const labels: Record<string, string> = {
    approved: "Pago aprobado",
    pending: "Pago pendiente",
    in_process: "Pago en revisión",
    authorized: "Pago autorizado",
    rejected: "Pago rechazado",
    cancelled: "Pago cancelado",
    refunded: "Pago devuelto",
    charged_back: "Contracargo",
  };
  const label = labels[status] || (status ? `Estado: ${status}` : "Sin validación todavía");
  const detail = order.mercado_pago_payment_status_detail ? ` · ${order.mercado_pago_payment_status_detail}` : "";
  return `${label}${detail}`;
}

function chooseStoredPaymentUrl(order: CustomerPortalOrder) {
  const useSandbox =
    process.env.MERCADO_PAGO_USE_SANDBOX_LINK === "true" ||
    process.env.MP_USE_SANDBOX_LINK === "true" ||
    process.env.MERCADO_PAGO_ACCESS_TOKEN?.startsWith("TEST-");

  if (useSandbox && order.mercado_pago_sandbox_init_point) return order.mercado_pago_sandbox_init_point;
  return order.mercado_pago_init_point || order.mercado_pago_sandbox_init_point || null;
}

function paymentTone(status: string | null | undefined) {
  if (status === "paid") return "bg-emerald-100 text-emerald-700";
  if (status === "manual_pending") return "bg-amber-100 text-amber-700";
  if (status === "cancelled" || status === "refunded") return "bg-rose-100 text-rose-700";
  return "bg-neutral-100 text-neutral-600";
}

function formatMxn(amount: number, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency || "MXN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeOrderNumber(value: string | undefined) {
  return String(value || "").trim().toUpperCase().slice(0, 40);
}

function normalizeEmail(value: string | undefined) {
  return String(value || "").trim().toLowerCase().slice(0, 160);
}
