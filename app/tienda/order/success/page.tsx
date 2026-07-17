import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  syncRamxMercadoPagoByOrderNumber,
  syncRamxMercadoPagoByPaymentId,
} from "@/lib/ramx-payment-sync";

type PageProps = {
  searchParams?: Promise<{
    order?: string;
    payment?: string;
    status?: string;
    payment_id?: string;
    collection_id?: string;
    preference_id?: string;
  }>;
};

type PublicOrder = {
  order_number: string;
  status: string | null;
  payment_status: string | null;
  payment_provider: string | null;
  mercado_pago_init_point: string | null;
  mercado_pago_sandbox_init_point: string | null;
  mercado_pago_payment_status: string | null;
  mercado_pago_payment_updated_at: string | null;
  mercado_pago_payment_checked_at: string | null;
  mercado_pago_payment_status_detail: string | null;
  customer_name: string | null;
  customer_email: string | null;
  shipping_method: string | null;
  shipping_carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  total_amount: number | string | null;
  currency: string | null;
  created_at: string | null;
  updated_at: string | null;
  delivered_at?: string | null;
  returned_at?: string | null;
  ramx_order_items?: Array<{
    product_type: string;
    product_name: string | null;
    quantity: number | null;
    unit_price: number | string | null;
  }> | null;
};

const PAYMENT_COPY: Record<
  string,
  { eyebrow: string; title: string; text: string; tone: string; icon: string }
> = {
  approved: {
    eyebrow: "Pago aprobado",
    title: "Tu pago RAMX fue recibido",
    text: "Mercado Pago aprobó la operación. RAMX validará el detalle de la orden y continuará con preparación, asignación y entrega.",
    tone: "text-emerald-700 bg-emerald-100",
    icon: "✓",
  },
  pending: {
    eyebrow: "Pago pendiente",
    title: "Tu solicitud RAMX quedó pendiente de pago",
    text: "Mercado Pago marcó la operación como pendiente o en proceso. RAMX esperará la confirmación antes de iniciar producción.",
    tone: "text-amber-700 bg-amber-100",
    icon: "…",
  },
  failure: {
    eyebrow: "Pago no completado",
    title: "Tu solicitud RAMX fue creada",
    text: "El pago no se completó o fue rechazado. Tu solicitud quedó registrada y RAMX puede ayudarte a reintentar o confirmar otra forma de pago.",
    tone: "text-rose-700 bg-rose-100",
    icon: "!",
  },
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

export default async function PhysicalProductOrderSuccessPage({
  searchParams,
}: PageProps) {
  const query = searchParams ? await searchParams : {};
  const orderNumber = query.order || "Solicitud RAMX";
  await syncMercadoPagoReturnIfPossible(query);
  const order = query.order ? await getPublicOrder(query.order) : null;
  const paymentUrl = order ? chooseStoredPaymentUrl(order) : null;
  const paymentCopy = resolvePaymentCopy(order, query.payment || query.status || null);

  const eyebrow = paymentCopy?.eyebrow || "Solicitud recibida";
  const title = paymentCopy?.title || "Tu solicitud RAMX fue creada";
  const text =
    paymentCopy?.text ||
    "También enviamos una confirmación al correo capturado y una notificación interna al equipo RAMX. Revisaremos los datos del producto, pago, disponibilidad y entrega antes de confirmar el siguiente paso.";
  const tone = paymentCopy?.tone || "text-emerald-700 bg-emerald-100";
  const icon = paymentCopy?.icon || "✓";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-4xl rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8">
        <div className="text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl text-3xl ${tone}`}
          >
            {icon}
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            {eyebrow}
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
            {title}
          </h1>

          <p className="mt-4 text-sm leading-6 text-neutral-600">
            Número de solicitud:
          </p>

          <p className="mx-auto mt-2 max-w-md rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-950">
            {orderNumber}
          </p>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-neutral-600">
            {text}
          </p>
        </div>

        {order ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <div className="rounded-[26px] border border-neutral-200 bg-neutral-50/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Resumen del pedido
              </p>
              <div className="mt-4 space-y-3 text-sm text-neutral-700">
                <SummaryRow label="Producto" value={getItemsLabel(order)} />
                <SummaryRow
                  label="Total"
                  value={formatMxn(Number(order.total_amount || 0), order.currency || "MXN")}
                />
                <SummaryRow
                  label="Pago"
                  value={PAYMENT_LABELS[order.payment_status || ""] || "En validación"}
                />
                <SummaryRow
                  label="Mercado Pago"
                  value={mercadoPagoPublicLabel(order)}
                />
                <SummaryRow
                  label="Orden"
                  value={ORDER_LABELS[order.status || ""] || "Recibida"}
                />
                <SummaryRow
                  label="Guía"
                  value={trackingLabel(order)}
                />
                <SummaryRow
                  label="Correo"
                  value={maskEmail(order.customer_email || "") || "Capturado"}
                />
              </div>

              {paymentUrl && order.payment_status !== "paid" ? (
                <a
                  href={paymentUrl}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800"
                >
                  Completar pago
                </a>
              ) : null}

              {order.tracking_url ? (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  Rastrear envío
                </a>
              ) : null}
            </div>

            <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Seguimiento RAMX
              </p>
              <OrderTimeline order={order} />
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/tienda/order"
            className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800"
          >
            Crear otra solicitud
          </Link>

          <Link
            href="/tienda"
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Volver a tienda
          </Link>

          {query.order ? (
            <Link
              href={`/portal/ordenes?order=${encodeURIComponent(query.order)}`}
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Ver en portal de cliente
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}

async function syncMercadoPagoReturnIfPossible(query: {
  order?: string;
  payment?: string;
  status?: string;
  payment_id?: string;
  collection_id?: string;
}) {
  if (!query.order) return;

  const paymentId = query.payment_id || query.collection_id;

  try {
    if (paymentId && paymentId !== "null") {
      await syncRamxMercadoPagoByPaymentId(paymentId, "success");
      return;
    }

    if (query.payment || query.status) {
      await syncRamxMercadoPagoByOrderNumber(query.order, "success");
    }
  } catch (error) {
    console.error("RAMX Mercado Pago return sync error:", error);
  }
}

function resolvePaymentCopy(order: PublicOrder | null, fallback: string | null) {
  if (order?.payment_status === "paid") return PAYMENT_COPY.approved;
  if (order?.payment_status === "manual_pending") return PAYMENT_COPY.pending;
  if (order?.payment_status === "cancelled" || order?.payment_status === "refunded") {
    return PAYMENT_COPY.failure;
  }

  return fallback ? PAYMENT_COPY[fallback] : null;
}

async function getPublicOrder(orderNumber: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("ramx_orders")
      .select(
        `
        order_number,
        status,
        payment_status,
        payment_provider,
        mercado_pago_init_point,
        mercado_pago_sandbox_init_point,
        mercado_pago_payment_status,
        mercado_pago_payment_status_detail,
        mercado_pago_payment_updated_at,
        mercado_pago_payment_checked_at,
        customer_name,
        customer_email,
        shipping_method,
        shipping_carrier,
        tracking_number,
        tracking_url,
        shipped_at,
        total_amount,
        currency,
        created_at,
        updated_at,
        delivered_at,
        returned_at,
        ramx_order_items (
          product_type,
          product_name,
          quantity,
          unit_price
        )
      `,
      )
      .eq("order_number", orderNumber)
      .maybeSingle();

    return (data as PublicOrder | null) || null;
  } catch {
    return null;
  }
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-3 last:border-b-0 last:pb-0">
      <span className="text-neutral-500">{label}</span>
      <span className="max-w-[65%] text-right font-semibold text-neutral-950">
        {value || "—"}
      </span>
    </div>
  );
}

function OrderTimeline({ order }: { order: PublicOrder }) {
  const steps = getTimelineSteps(order);

  return (
    <ol className="mt-4 space-y-3">
      {steps.map((step) => (
        <li key={step.label} className="flex gap-3">
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
              step.done
                ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                : "border-neutral-200 bg-neutral-50 text-neutral-300"
            }`}
          >
            {step.done ? "✓" : "·"}
          </span>
          <div>
            <p className={`text-sm font-semibold ${step.done ? "text-neutral-950" : "text-neutral-400"}`}>
              {step.label}
            </p>
            <p className="text-xs leading-5 text-neutral-500">{step.date || step.help}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function getTimelineSteps(order: PublicOrder) {
  const status = order.status || "pending";
  const paidAt =
    order.mercado_pago_payment_updated_at ||
    (order.payment_status === "paid" ? order.updated_at : null);
  const productAssigned = Boolean(order.tracking_number) || ["ready", "delivered", "returned"].includes(status);
  const shippedOrDelivered = Boolean(order.tracking_number) || ["delivered", "returned"].includes(status);

  return [
    {
      label: "Pedido creado",
      done: true,
      date: formatDate(order.created_at),
      help: "Solicitud recibida.",
    },
    {
      label: "Pago recibido",
      done: order.payment_status === "paid",
      date: order.payment_status === "paid" ? formatDate(paidAt) : null,
      help: "Pendiente de confirmación de pago.",
    },
    {
      label: "En preparación",
      done: ["in_production", "ready", "delivered", "returned"].includes(status),
      date: status === "in_production" ? formatDate(order.updated_at) : null,
      help: "RAMX prepara tu producto.",
    },
    {
      label: "Producto asignado",
      done: productAssigned,
      date: productAssigned ? formatDate(order.updated_at) : null,
      help: "Asignaremos el código físico o placa.",
    },
    {
      label: "Enviado / entregado",
      done: shippedOrDelivered,
      date: order.shipped_at ? formatDate(order.shipped_at) : order.delivered_at ? formatDate(order.delivered_at) : null,
      help: "Pendiente de entrega.",
    },
    {
      label: "Devuelto",
      done: status === "returned",
      date: order.returned_at ? formatDate(order.returned_at) : null,
      help: "Solo aplica si hubo devolución.",
    },
  ];
}

function getItemsLabel(order: PublicOrder) {
  const items = order.ramx_order_items || [];
  return items
    .map((item) => `${item.quantity || 1} × ${item.product_name || item.product_type}`)
    .join(", ");
}

function trackingLabel(order: PublicOrder) {
  const carrier = order.shipping_carrier || "";
  const number = order.tracking_number || "";

  if (!carrier && !number) return "Pendiente";

  return [carrier, number].filter(Boolean).join(" · ");
}

function mercadoPagoPublicLabel(order: PublicOrder) {
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
  const detail = order.mercado_pago_payment_status_detail
    ? ` · ${order.mercado_pago_payment_status_detail}`
    : "";

  return `${label}${detail}`;
}

function chooseStoredPaymentUrl(order: PublicOrder) {
  const useSandbox =
    process.env.MERCADO_PAGO_USE_SANDBOX_LINK === "true" ||
    process.env.MP_USE_SANDBOX_LINK === "true" ||
    process.env.MERCADO_PAGO_ACCESS_TOKEN?.startsWith("TEST-");

  if (useSandbox && order.mercado_pago_sandbox_init_point) {
    return order.mercado_pago_sandbox_init_point;
  }

  return order.mercado_pago_init_point || order.mercado_pago_sandbox_init_point || null;
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

function maskEmail(value: string) {
  if (!value.includes("@")) return value;
  const [name, domain] = value.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}
