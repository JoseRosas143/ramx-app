import Link from "next/link";
import { requireRamxAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import OrderCrmActionsClient from "./order-crm-actions-client";
import {
  archiveRamxOrderAction,
  resendRamxOrderConfirmationAction,
  unarchiveRamxOrderAction,
  verifyRamxOrderMercadoPagoPaymentAction,
  updateRamxOrderAdminAction,
} from "./actions";

type PageProps = {
  searchParams?: Promise<{
    status?: string;
    payment?: string;
    view?: string;
    bucket?: string;
    notice?: string;
    q?: string;
  }>;
};

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_provider: string | null;
  mercado_pago_preference_id: string | null;
  mercado_pago_payment_id: string | null;
  mercado_pago_payment_status: string | null;
  mercado_pago_payment_status_detail: string | null;
  mercado_pago_payment_updated_at: string | null;
  mercado_pago_payment_checked_at: string | null;
  mercado_pago_payment_notified_at: string | null;
  mercado_pago_last_sync_error: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_method: string | null;
  shipping_address: string | null;
  shipping_carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  notes: string | null;
  total_amount: number | string | null;
  currency: string | null;
  created_at: string;
  updated_at: string | null;
  confirmed_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  returned_at?: string | null;
  admin_notes: string | null;
  archived_at: string | null;
  archived_reason: string | null;
  pets?: {
    id: string;
    name: string | null;
    public_slug: string | null;
    microchip_number: string | null;
    internal_id: string | null;
  } | null;
  ramx_order_items?: Array<{
    id: string;
    product_type: string;
    product_name: string | null;
    quantity: number | null;
    unit_price: number | string | null;
    subtotal: number | string | null;
  }> | null;
};

const ORDER_STATUS_OPTIONS = [
  ["all", "Todos"],
  ["pending", "Pendientes"],
  ["confirmed", "Confirmadas"],
  ["in_production", "En producción"],
  ["ready", "Listas"],
  ["delivered", "Entregadas"],
  ["returned", "Devueltas"],
  ["cancelled", "Canceladas"],
] as const;

const PAYMENT_STATUS_OPTIONS = [
  ["all", "Todos"],
  ["unpaid", "Sin pagar"],
  ["manual_pending", "Pendiente"],
  ["paid", "Pagado"],
  ["refunded", "Reembolsado"],
  ["cancelled", "Cancelado"],
] as const;

const VIEW_OPTIONS = [
  ["active", "Activos"],
  ["archived", "Archivados"],
  ["all", "Todos"],
] as const;

const BUCKET_OPTIONS = [
  ["all", "Todos"],
  ["pending", "Pendientes operativos"],
] as const;

const QUICK_FILTERS = [
  { label: "Activos", href: "/admin/orders", key: "active" },
  { label: "Archivados", href: "/admin/orders?view=archived", key: "archived" },
  { label: "Pagados", href: "/admin/orders?payment=paid", key: "paid" },
  { label: "Pendientes", href: "/admin/orders?bucket=pending", key: "pending" },
  {
    label: "En producción",
    href: "/admin/orders?status=in_production",
    key: "in_production",
  },
  { label: "Entregados", href: "/admin/orders?status=delivered", key: "delivered" },
] as const;

const ORDER_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  in_production: "En producción",
  ready: "Lista",
  delivered: "Entregada",
  returned: "Devuelta",
  cancelled: "Cancelada",
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Sin pagar",
  manual_pending: "Pago pendiente",
  paid: "Pago aprobado",
  refunded: "Pago devuelto",
  cancelled: "Cancelado",
};

const NOTICE_LABELS: Record<string, string> = {
  saved: "Cambios guardados correctamente.",
  archived: "Pedido archivado. Puedes verlo desde el filtro Archivados.",
  restored: "Pedido restaurado al listado activo.",
  resent: "Correo de confirmación reenviado correctamente.",
  payment_verified: "Pago verificado: Mercado Pago lo reporta como aprobado.",
  payment_checked: "Pago verificado con Mercado Pago. Revisa el estado actualizado en la tarjeta del pedido.",
  payment_not_found: "No encontramos pagos asociados todavía en Mercado Pago para esa orden.",
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  await requireRamxAdmin();
  const admin = createAdminClient();
  const query = searchParams ? await searchParams : {};

  const status = normalizeOption(query.status, ORDER_STATUS_OPTIONS, "all");
  const payment = normalizeOption(query.payment, PAYMENT_STATUS_OPTIONS, "all");
  const view = normalizeOption(query.view, VIEW_OPTIONS, "active");
  const bucket = normalizeOption(query.bucket, BUCKET_OPTIONS, "all");
  const notice = query.notice || "";
  const search = String(query.q || "").trim().slice(0, 80);
  const returnTo = buildReturnTo({ status, payment, view, bucket, search });

  let request = admin
    .from("ramx_orders")
    .select(
      `
      id,
      order_number,
      status,
      payment_status,
      payment_provider,
      mercado_pago_preference_id,
      mercado_pago_payment_id,
      mercado_pago_payment_status,
      mercado_pago_payment_status_detail,
      mercado_pago_payment_updated_at,
      mercado_pago_payment_checked_at,
      mercado_pago_payment_notified_at,
      mercado_pago_last_sync_error,
      customer_name,
      customer_email,
      customer_phone,
      shipping_method,
      shipping_address,
      shipping_carrier,
      tracking_number,
      tracking_url,
      shipped_at,
      notes,
      total_amount,
      currency,
      created_at,
      updated_at,
      confirmed_at,
      delivered_at,
      cancelled_at,
      returned_at,
      admin_notes,
      archived_at,
      archived_reason,
      pets (
        id,
        name,
        public_slug,
        microchip_number,
        internal_id
      ),
      ramx_order_items (
        id,
        product_type,
        product_name,
        quantity,
        unit_price,
        subtotal
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") request = request.eq("status", status);
  if (payment !== "all") request = request.eq("payment_status", payment);
  if (bucket === "pending") {
    request = request.or(
      "status.eq.pending,payment_status.eq.unpaid,payment_status.eq.manual_pending",
    );
  }
  if (view === "active") request = request.is("archived_at", null);
  if (view === "archived") request = request.not("archived_at", "is", null);
  if (search) {
    request = request.or(
      `order_number.ilike.%${escapeIlike(search)}%,customer_name.ilike.%${escapeIlike(
        search,
      )}%,customer_email.ilike.%${escapeIlike(search)}%,customer_phone.ilike.%${escapeIlike(search)}%`,
    );
  }

  const [{ data: orders, error }, { data: statsRows }] = await Promise.all([
    request,
    admin
      .from("ramx_orders")
      .select("status, payment_status, archived_at, total_amount")
      .limit(1000),
  ]);

  const orderRows = ((orders || []) as OrderRow[]) || [];
  const stats = buildStats((statsRows || []) as Array<Record<string, unknown>>);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/admin"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-950"
            >
              ← Admin
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
              Pedidos RAMX
            </h1>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Mini CRM operativo para preventa, pagos, producción, entrega,
              devoluciones, archivo y seguimiento de órdenes físicas o donaciones.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/store"
              className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Editar tienda
            </Link>
            <Link
              href="/admin/products/codes"
              className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Códigos físicos
            </Link>
          </div>
        </div>

        {notice && NOTICE_LABELS[notice] ? (
          <section className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-900 shadow-sm">
            {NOTICE_LABELS[notice]}
          </section>
        ) : null}

        <section className="grid gap-3 md:grid-cols-5">
          <StatCard label="Activos" value={stats.active} />
          <StatCard label="Pagados" value={stats.paid} tone="emerald" />
          <StatCard label="Pendientes" value={stats.pending} tone="amber" />
          <StatCard label="En producción" value={stats.inProduction} tone="sky" />
          <StatCard label="Vendido" value={formatMxn(stats.revenue, "MXN")} tone="dark" />
        </section>

        <section className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-xl">
          <div className="mb-5 flex flex-wrap gap-2">
            {QUICK_FILTERS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition hover:-translate-y-0.5 hover:shadow-sm ${quickFilterClass(
                  item.key,
                  { status, payment, view, bucket },
                )}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {bucket === "pending" ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium leading-5 text-amber-900">
              Mostrando pendientes operativos: pedidos con estatus pendiente o pagos sin confirmar.
            </div>
          ) : null}

          <form className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_1.4fr_auto]" action="/admin/orders">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-neutral-700">
                Estado de orden
              </span>
              <select
                name="status"
                defaultValue={status}
                className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
              >
                {ORDER_STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-neutral-700">
                Estado de pago
              </span>
              <select
                name="payment"
                defaultValue={payment}
                className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
              >
                {PAYMENT_STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-neutral-700">
                Vista
              </span>
              <select
                name="view"
                defaultValue={view}
                className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
              >
                {VIEW_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-neutral-700">
                Buscar
              </span>
              <input
                name="q"
                defaultValue={search}
                placeholder="Orden, cliente, correo o teléfono"
                className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
              />
            </label>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Filtrar
              </button>

              <Link
                href="/admin/orders"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
              >
                Limpiar
              </Link>
            </div>
          </form>
        </section>

        {error ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            {error.message}
          </section>
        ) : null}

        <section className="space-y-4">
          {orderRows.length === 0 ? (
            <div className="rounded-[28px] border border-white/80 bg-white/95 p-8 text-center shadow-xl">
              <p className="text-sm text-neutral-600">
                Todavía no hay pedidos con estos filtros.
              </p>
            </div>
          ) : null}

          {orderRows.map((order) => {
            const isArchived = Boolean(order.archived_at);
            const summary = buildOrderSummary(order);
            const itemsLabel = getItemsLabel(order);

            return (
              <article
                key={order.id}
                className={`rounded-[30px] border p-5 shadow-xl ${
                  isArchived
                    ? "border-neutral-200 bg-neutral-100/85"
                    : "border-white/80 bg-white/95"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                      {order.order_number}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-neutral-950">
                      {order.customer_name || "Cliente RAMX"}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-600">
                      Mascota: {" "}
                      {order.pets?.public_slug ? (
                        <Link
                          href={`/p/${order.pets.public_slug}`}
                          target="_blank"
                          className="font-medium text-sky-700 hover:underline"
                        >
                          {order.pets.name || "Ver perfil"}
                        </Link>
                      ) : (
                        order.pets?.name || extractPetFromNotes(order.notes) || "Sin mascota vinculada"
                      )}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Creado: {formatDate(order.created_at)}
                      {order.updated_at
                        ? ` · Actualizado: ${formatDate(order.updated_at)}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusPill label={ORDER_LABELS[order.status] || order.status} />
                    <StatusPill
                      label={PAYMENT_LABELS[order.payment_status] || order.payment_status}
                      tone="payment"
                    />
                    {isArchived ? <StatusPill label="Archivado" tone="archive" /> : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-6">
                  <InfoBox label="Producto" value={itemsLabel} />
                  <InfoBox label="Cliente" value={order.customer_name || "—"} />
                  <InfoBox
                    label="Contacto"
                    value={`${order.customer_phone || "Sin teléfono"}${
                      order.customer_email ? `\n${order.customer_email}` : ""
                    }`}
                  />
                  <InfoBox
                    label="Entrega"
                    value={`${deliveryLabel(order.shipping_method || "to_confirm")}${
                      order.shipping_address ? `\n${order.shipping_address}` : ""
                    }`}
                  />
                  <InfoBox
                    label="Guía"
                    value={trackingLabel(order)}
                  />
                  <InfoBox
                    label="Total"
                    value={formatMxn(Number(order.total_amount || 0), order.currency || "MXN")}
                  />
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
                  <div className="rounded-[24px] border border-neutral-200 bg-neutral-50/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                          Línea de tiempo
                        </p>
                        <p className="mt-1 text-sm text-neutral-600">
                          Seguimiento operativo del pedido.
                        </p>
                      </div>
                    </div>
                    <OrderTimeline order={order} />
                  </div>

                  <div className="rounded-[24px] border border-neutral-200 bg-neutral-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Pago Mercado Pago
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-neutral-800">
                      {mercadoPagoSummary(order)}
                    </p>
                  </div>
                </div>

                {order.notes || order.admin_notes || order.archived_reason ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {order.notes ? (
                      <NoteBox label="Notas del cliente" value={order.notes} />
                    ) : null}
                    {order.admin_notes ? (
                      <NoteBox label="Notas admin" value={order.admin_notes} tone="sky" />
                    ) : null}
                    {order.archived_reason ? (
                      <NoteBox label="Motivo de archivo" value={order.archived_reason} tone="neutral" />
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_auto]">
                  <form
                    action={updateRamxOrderAdminAction}
                    className="rounded-[24px] border border-neutral-200 bg-neutral-50/80 p-4"
                  >
                    <input type="hidden" name="order_id" value={order.id} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <input type="hidden" name="current_shipped_at" value={order.shipped_at || ""} />
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                      Operación del pedido
                    </p>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-neutral-500">Estatus</span>
                        <select
                          name="status"
                          defaultValue={order.status}
                          className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
                          aria-label="Estatus de pedido"
                        >
                          {ORDER_STATUS_OPTIONS.filter(([value]) => value !== "all").map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-medium text-neutral-500">Pago</span>
                        <select
                          name="payment_status"
                          defaultValue={order.payment_status}
                          className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
                          aria-label="Estatus de pago"
                        >
                          {PAYMENT_STATUS_OPTIONS.filter(([value]) => value !== "all").map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-medium text-neutral-500">Paquetería</span>
                        <input
                          name="shipping_carrier"
                          defaultValue={order.shipping_carrier || ""}
                          placeholder="DHL, FedEx, Estafeta..."
                          className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-medium text-neutral-500">Número de guía</span>
                        <input
                          name="tracking_number"
                          defaultValue={order.tracking_number || ""}
                          placeholder="Guía / rastreo"
                          className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-medium text-neutral-500">Link de rastreo</span>
                        <input
                          name="tracking_url"
                          defaultValue={order.tracking_url || ""}
                          placeholder="https://..."
                          className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
                        />
                      </label>

                      <label className="space-y-1 md:col-span-2 xl:col-span-3">
                        <span className="text-xs font-medium text-neutral-500">Nota admin</span>
                        <input
                          name="admin_notes"
                          defaultValue={order.admin_notes || ""}
                          placeholder="Nota interna para producción, entrega o soporte"
                          className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
                        />
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="mt-3 h-11 rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
                    >
                      Guardar cambios
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-2">
                    <form action={resendRamxOrderConfirmationAction}>
                      <input type="hidden" name="order_id" value={order.id} />
                      <input type="hidden" name="return_to" value={returnTo} />
                      <button
                        type="submit"
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
                      >
                        Reenviar correo
                      </button>
                    </form>

                    {order.payment_provider === "mercado_pago" || order.mercado_pago_preference_id ? (
                      <form action={verifyRamxOrderMercadoPagoPaymentAction}>
                        <input type="hidden" name="order_id" value={order.id} />
                        <input type="hidden" name="return_to" value={returnTo} />
                        <button
                          type="submit"
                          className="inline-flex h-11 items-center justify-center rounded-2xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700"
                        >
                          Verificar pago
                        </button>
                      </form>
                    ) : null}

                    {isArchived ? (
                      <form action={unarchiveRamxOrderAction}>
                        <input type="hidden" name="order_id" value={order.id} />
                        <input type="hidden" name="return_to" value={returnTo} />
                        <button
                          type="submit"
                          className="inline-flex h-11 items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
                        >
                          Restaurar
                        </button>
                      </form>
                    ) : (
                      <form action={archiveRamxOrderAction} className="flex gap-2">
                        <input type="hidden" name="order_id" value={order.id} />
                        <input type="hidden" name="return_to" value={returnTo} />
                        <input
                          name="archive_reason"
                          placeholder="Motivo opcional"
                          className="hidden h-11 w-40 rounded-2xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950 sm:block"
                        />
                        <button
                          type="submit"
                          className="inline-flex h-11 items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
                        >
                          Archivar
                        </button>
                      </form>
                    )}

                    {order.customer_phone ? (
                      <a
                        href={whatsappHref(order.customer_phone, order.order_number)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        WhatsApp
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 border-t border-neutral-200 pt-4">
                  <OrderCrmActionsClient
                    orderNumber={order.order_number}
                    summary={summary}
                    supportHref={`/admin/support/new?order=${encodeURIComponent(
                      order.order_number,
                    )}`}
                  />
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-neutral-800">
        {value || "—"}
      </p>
    </div>
  );
}

function NoteBox({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "sky" | "neutral";
}) {
  const className =
    tone === "sky"
      ? "bg-sky-50 text-sky-900"
      : tone === "neutral"
        ? "bg-neutral-200/70 text-neutral-700"
        : "bg-neutral-50 text-neutral-700";

  return (
    <div className={`rounded-2xl p-4 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6">{value}</p>
    </div>
  );
}

function StatusPill({
  label,
  tone = "order",
}: {
  label: string;
  tone?: "order" | "payment" | "archive";
}) {
  const className =
    tone === "payment"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "archive"
        ? "border-neutral-300 bg-neutral-100 text-neutral-700"
        : "border-sky-200 bg-sky-50 text-sky-800";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "emerald" | "amber" | "sky" | "dark";
}) {
  const className =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : tone === "sky"
          ? "border-sky-200 bg-sky-50 text-sky-900"
          : tone === "dark"
            ? "border-neutral-950 bg-neutral-950 text-white"
            : "border-white/80 bg-white/95 text-neutral-950";

  return (
    <div className={`rounded-[24px] border p-5 shadow-sm ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function OrderTimeline({ order }: { order: OrderRow }) {
  const steps = getTimelineSteps(order);

  return (
    <ol className="mt-4 space-y-3">
      {steps.map((step) => (
        <li key={step.label} className="flex gap-3">
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
              step.done
                ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                : "border-neutral-200 bg-white text-neutral-300"
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

function getTimelineSteps(order: OrderRow) {
  const paidAt =
    order.mercado_pago_payment_updated_at ||
    (order.payment_status === "paid" ? order.updated_at : null);
  const productAssigned = Boolean(order.tracking_number) || ["ready", "delivered", "returned"].includes(order.status);
  const shippedOrDelivered = Boolean(order.tracking_number) || ["delivered", "returned"].includes(order.status);

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
      done: ["in_production", "ready", "delivered", "returned"].includes(order.status),
      date: order.status === "in_production" ? formatDate(order.updated_at) : null,
      help: "RAMX prepara el producto.",
    },
    {
      label: "Producto asignado",
      done: productAssigned,
      date: productAssigned ? formatDate(order.updated_at) : null,
      help: "Asignar placa/código físico al pedido.",
    },
    {
      label: "Enviado / entregado",
      done: shippedOrDelivered,
      date: order.shipped_at ? formatDate(order.shipped_at) : order.delivered_at ? formatDate(order.delivered_at) : null,
      help: "Pendiente de entrega.",
    },
    {
      label: "Devuelto",
      done: order.status === "returned",
      date: order.returned_at ? formatDate(order.returned_at) : null,
      help: "Solo aplica si hubo devolución.",
    },
  ];
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

function deliveryLabel(value: string) {
  const labels: Record<string, string> = {
    to_confirm: "Confirmar por WhatsApp",
    pickup: "Entrega / recolección local",
    shipping: "Envío a domicilio",
    digital: "Digital / sin envío",
  };

  return labels[value] || "Confirmar";
}

function whatsappHref(phone: string, orderNumber: string) {
  const normalized = phone.replace(/[^0-9]/g, "");
  const message = encodeURIComponent(
    `Hola, te escribo de RAMX sobre tu solicitud ${orderNumber}.`,
  );

  return `https://wa.me/${normalized}?text=${message}`;
}

function trackingLabel(order: OrderRow) {
  const carrier = order.shipping_carrier || "";
  const number = order.tracking_number || "";

  if (!carrier && !number) return "Sin guía";

  return [carrier, number].filter(Boolean).join(" · ");
}

function mercadoPagoSummary(order: OrderRow) {
  if (order.payment_provider !== "mercado_pago") return "Pago manual / por confirmar";

  return [
    order.mercado_pago_payment_status
      ? `Estado MP: ${mercadoPagoReadableStatus(order.mercado_pago_payment_status)}${
          order.mercado_pago_payment_status_detail
            ? ` · ${order.mercado_pago_payment_status_detail}`
            : ""
        }`
      : "Estado MP: Sin validación todavía",
    order.mercado_pago_payment_id ? `Pago: ${order.mercado_pago_payment_id}` : null,
    order.mercado_pago_preference_id
      ? `Preferencia: ${order.mercado_pago_preference_id}`
      : null,
    order.mercado_pago_payment_updated_at
      ? `Actualizado por MP: ${formatDate(order.mercado_pago_payment_updated_at)}`
      : null,
    order.mercado_pago_payment_checked_at
      ? `Última verificación RAMX: ${formatDate(order.mercado_pago_payment_checked_at)}`
      : null,
    order.mercado_pago_payment_notified_at
      ? `Correo de pago confirmado enviado: ${formatDate(order.mercado_pago_payment_notified_at)}`
      : null,
    order.mercado_pago_last_sync_error
      ? `Último aviso: ${order.mercado_pago_last_sync_error}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function mercadoPagoReadableStatus(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "approved") return "Pago aprobado";
  if (normalized === "pending") return "Pago pendiente";
  if (normalized === "in_process") return "Pago en revisión";
  if (normalized === "authorized") return "Pago autorizado";
  if (normalized === "rejected") return "Pago rechazado";
  if (normalized === "cancelled") return "Cancelado";
  if (normalized === "refunded") return "Pago devuelto";
  if (normalized === "charged_back") return "Contracargo";
  return value;
}


function buildOrderSummary(order: OrderRow) {
  return [
    `Pedido: ${order.order_number}`,
    `Estatus: ${ORDER_LABELS[order.status] || order.status}`,
    `Pago: ${PAYMENT_LABELS[order.payment_status] || order.payment_status}`,
    `Cliente: ${order.customer_name || "Cliente RAMX"}`,
    `Correo: ${order.customer_email || "Sin correo"}`,
    `Teléfono: ${order.customer_phone || "Sin teléfono"}`,
    `Producto: ${getItemsLabel(order) || "Sin producto"}`,
    `Total: ${formatMxn(Number(order.total_amount || 0), order.currency || "MXN")}`,
    `Entrega: ${deliveryLabel(order.shipping_method || "to_confirm")}`,
    `Dirección: ${order.shipping_address || "Sin dirección"}`,
    `Guía: ${trackingLabel(order)}`,
    `Rastreo: ${order.tracking_url || "Sin link"}`,
    `Mascota: ${order.pets?.name || extractPetFromNotes(order.notes) || "Sin mascota vinculada"}`,
    `Mercado Pago: ${mercadoPagoSummary(order).replaceAll("\n", " · ")}`,
    `Notas cliente: ${order.notes || "Sin notas"}`,
    `Notas admin: ${order.admin_notes || "Sin notas"}`,
  ].join("\n");
}

function extractPetFromNotes(notes: string | null) {
  if (!notes) return null;
  const match = notes.match(/Mascota capturada por comprador:\s*([^\n]+)/i);
  return match?.[1]?.trim() || null;
}

function buildStats(rows: Array<Record<string, unknown>>) {
  return rows.reduce(
    (acc, row) => {
      const archived = Boolean(row.archived_at);
      const status = String(row.status || "");
      const payment = String(row.payment_status || "");
      const total = Number(row.total_amount || 0);

      if (archived) return acc;

      acc.active += 1;
      if (payment === "paid") {
        acc.paid += 1;
        if (Number.isFinite(total)) acc.revenue += total;
      }
      if (status === "pending" || payment === "unpaid" || payment === "manual_pending") {
        acc.pending += 1;
      }
      if (status === "in_production") acc.inProduction += 1;

      return acc;
    },
    { active: 0, paid: 0, pending: 0, inProduction: 0, revenue: 0 },
  );
}

function normalizeOption<T extends readonly (readonly [string, string])[]>(
  value: string | undefined,
  options: T,
  fallback: T[number][0],
) {
  return options.some(([option]) => option === value) ? value! : fallback;
}

function buildReturnTo({
  status,
  payment,
  view,
  bucket,
  search,
}: {
  status: string;
  payment: string;
  view: string;
  bucket: string;
  search: string;
}) {
  const params = new URLSearchParams();

  if (status !== "all") params.set("status", status);
  if (payment !== "all") params.set("payment", payment);
  if (view !== "active") params.set("view", view);
  if (bucket !== "all") params.set("bucket", bucket);
  if (search) params.set("q", search);

  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

function quickFilterClass(
  key: string,
  current: { status: string; payment: string; view: string; bucket: string },
) {
  const active =
    (key === "active" &&
      current.view === "active" &&
      current.status === "all" &&
      current.payment === "all" &&
      current.bucket === "all") ||
    (key === "archived" && current.view === "archived") ||
    (key === "paid" && current.payment === "paid") ||
    (key === "pending" && current.bucket === "pending") ||
    (key === "in_production" && current.status === "in_production") ||
    (key === "delivered" && current.status === "delivered");

  return active
    ? "border-neutral-950 bg-neutral-950 text-white"
    : "border-neutral-200 bg-white text-neutral-700";
}

function escapeIlike(value: string) {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}
