import Link from "next/link";
import type { ReactNode } from "react";
import { requireRamxAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type OrderDashboardRow = {
  id: string;
  order_number: string;
  status: string | null;
  payment_status: string | null;
  payment_provider: string | null;
  mercado_pago_payment_status: string | null;
  mercado_pago_payment_status_detail: string | null;
  total_amount: number | string | null;
  currency: string | null;
  customer_name: string | null;
  customer_email: string | null;
  created_at: string | null;
  updated_at: string | null;
  shipped_at: string | null;
  tracking_number: string | null;
  archived_at: string | null;
  product_assigned_at: string | null;
  ramx_order_items?: Array<{
    id: string;
    product_type: string | null;
    product_name: string | null;
    quantity: number | null;
    unit_price: number | string | null;
    subtotal: number | string | null;
  }> | null;
};

type PhysicalCodeRow = {
  id: string;
  status: string | null;
  product_type: string | null;
  created_at: string | null;
  assigned_at?: string | null;
  activated_at: string | null;
};

type SupportTicketRow = {
  id: string;
  ticket_number: string;
  status: string | null;
  priority: string | null;
  subject: string | null;
  customer_name: string | null;
  customer_email: string | null;
  order_number: string | null;
  sla_due_at: string | null;
  archived_at: string | null;
  last_message_at: string | null;
  created_at: string | null;
};

type StoreSettingsRow = {
  preorder_enabled: boolean | null;
  preorder_goal: number | null;
  preorder_current_sales: number | null;
  preorder_badge: string | null;
};

type DashboardData = {
  orders: OrderDashboardRow[];
  codes: PhysicalCodeRow[];
  tickets: SupportTicketRow[];
  storeSettings: StoreSettingsRow | null;
  clientsTotal: number;
  clientsToday: number;
  petsTotal: number;
  petsToday: number;
};

type TopProduct = {
  key: string;
  label: string;
  quantity: number;
  revenue: number;
};

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
  manual_pending: "Pendiente",
  paid: "Pagado",
  refunded: "Devuelto",
  cancelled: "Cancelado",
};

const TICKET_LABELS: Record<string, string> = {
  new: "Nuevo",
  open: "Abierto",
  customer_replied: "Cliente respondió",
  in_progress: "En proceso",
  waiting_customer: "Esperando cliente",
  resolved: "Resuelto",
  closed: "Cerrado",
};

export default async function AdminHomePage() {
  await requireRamxAdmin();
  const admin = createAdminClient();
  const data = await loadDashboardData(admin);
  const model = buildDashboardModel(data);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_42%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex text-sm font-medium text-neutral-600 hover:text-neutral-950"
          >
            ← Volver al dashboard
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/tienda"
              className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Ver tienda
            </Link>
            <Link
              href="/portal"
              className="rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-neutral-800"
            >
              Portal cliente
            </Link>
          </div>
        </div>

        <section className="overflow-hidden rounded-[36px] border border-white/80 bg-white/95 shadow-2xl backdrop-blur">
          <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="p-6 sm:p-8">
              <p className="text-sm font-semibold text-orange-700">RAMX · Centro Operativo</p>
              <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
                Todo lo que está pasando en RAMX, en una sola pantalla.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-neutral-600 sm:text-base">
                Ventas, pagos, preventa, activaciones QR/NFC, soporte, clientes, mascotas y acciones rápidas para operar RAMX como una plataforma real.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <HeroMetric
                  label="Ingresos cobrados"
                  value={formatMxn(model.revenuePaid)}
                  caption="Órdenes pagadas"
                />
                <HeroMetric
                  label="Preventa"
                  value={`${model.preorderCurrent}/${model.preorderGoal}`}
                  caption={`${model.preorderProgress}% de la meta`}
                />
                <HeroMetric
                  label="Tickets activos"
                  value={model.openTickets}
                  caption={`${model.overdueTickets} vencidos`}
                />
              </div>
            </div>

            <div className="border-t border-orange-100 bg-[radial-gradient(circle_at_top,#fed7aa_0%,#fff7ed_42%,#ffffff_100%)] p-6 sm:p-8 lg:border-l lg:border-t-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
                Resumen del día
              </p>
              <div className="mt-5 space-y-3">
                <DailyRow label="Órdenes nuevas" value={model.ordersToday} />
                <DailyRow label="Ingresos de hoy" value={formatMxn(model.revenueToday)} />
                <DailyRow label="Clientes nuevos" value={data.clientsToday} />
                <DailyRow label="Mascotas nuevas" value={data.petsToday} />
                <DailyRow label="Tickets nuevos" value={model.ticketsToday} />
              </div>

              <Link
                href="/admin/orders"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-neutral-800"
              >
                Ir a pedidos
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Ventas totales" value={model.totalOrders} detail="Órdenes registradas" icon="🧾" />
          <MetricCard label="Ventas preventa" value={model.preorderSales} detail="Productos físicos vendidos" icon="🚀" tone="orange" />
          <MetricCard label="Pagos pendientes" value={model.pendingPayments} detail="Requieren seguimiento" icon="⏳" tone="amber" href="/admin/orders?bucket=pending" />
          <MetricCard label="Donaciones" value={formatMxn(model.donationRevenue)} detail={`${model.donationCount} aportaciones`} icon="💛" tone="emerald" />
          <MetricCard label="En producción" value={model.ordersInProduction} detail="Pedidos en preparación" icon="🛠️" tone="sky" href="/admin/orders?status=in_production" />
          <MetricCard label="Listas / enviadas" value={model.readyOrShipped} detail="Con guía o listas" icon="📦" tone="indigo" href="/admin/orders?status=ready" />
          <MetricCard label="QR/NFC asignados" value={model.assignedCodes} detail="Códigos apartados" icon="🔗" href="/admin/products/codes" />
          <MetricCard label="Productos activados" value={model.activatedCodes} detail="Ya vinculados a mascota" icon="🐾" tone="emerald" href="/admin/products/codes" />
          <MetricCard label="Clientes" value={data.clientsTotal} detail="Cuentas registradas" icon="👤" />
          <MetricCard label="Mascotas" value={data.petsTotal} detail="Identidades digitales" icon="🐶" tone="sky" />
          <MetricCard label="Tickets abiertos" value={model.openTickets} detail="Soporte activo" icon="🎧" tone="indigo" href="/admin/support" />
          <MetricCard label="Tickets vencidos" value={model.overdueTickets} detail="SLA requiere atención" icon="⚠️" tone="red" href="/admin/support" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
          <div className="space-y-6">
            <PreorderPanel
              current={model.preorderCurrent}
              goal={model.preorderGoal}
              progress={model.preorderProgress}
              badge={data.storeSettings?.preorder_badge || "Preventa fundadora"}
              enabled={data.storeSettings?.preorder_enabled !== false}
              revenue={model.revenuePaid}
            />

            <RecentOrdersPanel orders={model.recentOrders} />
          </div>

          <div className="space-y-6">
            <PaymentPanel
              paid={model.paidOrders}
              pending={model.pendingPayments}
              rejected={model.rejectedPayments}
              refunded={model.refundedPayments}
              revenue={model.revenuePaid}
            />

            <ActivationPanel
              available={model.availableCodes}
              assigned={model.assignedCodes}
              activated={model.activatedCodes}
              blocked={model.blockedCodes}
              recentActivations={model.recentActivations}
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SupportPanel tickets={model.urgentTickets} open={model.openTickets} overdue={model.overdueTickets} />
          <TopProductsPanel products={model.topProducts} />
        </section>

        <section className="rounded-[34px] border border-white/80 bg-white/95 p-5 shadow-xl sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Accesos rápidos</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                Operación diaria
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                Entra directo a las áreas que mueven RAMX: ventas, soporte, activación, tienda e IA.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <QuickAction href="/admin/orders" icon="🧾" title="Ver pedidos" />
            <QuickAction href="/admin/products/codes" icon="QR" title="Crear códigos" />
            <QuickAction href="/admin/support" icon="🎧" title="Ver tickets" />
            <QuickAction href="/admin/store" icon="🛍️" title="Editar tienda" />
            <QuickAction href="/admin/support/knowledge" icon="🧠" title="Base IA" />
            <QuickAction href="/portal" icon="👤" title="Portal cliente" />
          </div>
        </section>
      </div>
    </main>
  );
}

async function loadDashboardData(admin: ReturnType<typeof createAdminClient>): Promise<DashboardData> {
  const todayIso = getStartOfTodayIso();

  const [ordersResult, codesResult, ticketsResult, settingsResult, clientsTotal, clientsToday, petsTotal, petsToday] = await Promise.all([
    safeSelect<OrderDashboardRow>(
      admin
        .from("ramx_orders")
        .select(
          `
          id,
          order_number,
          status,
          payment_status,
          payment_provider,
          mercado_pago_payment_status,
          mercado_pago_payment_status_detail,
          total_amount,
          currency,
          customer_name,
          customer_email,
          created_at,
          updated_at,
          shipped_at,
          tracking_number,
          archived_at,
          product_assigned_at,
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
        .limit(1200),
    ),
    safeSelect<PhysicalCodeRow>(
      admin
        .from("ramx_physical_codes")
        .select("id, status, product_type, created_at, assigned_at, activated_at")
        .order("created_at", { ascending: false })
        .limit(2500),
    ),
    safeSelect<SupportTicketRow>(
      admin
        .from("ramx_support_tickets")
        .select("id, ticket_number, status, priority, subject, customer_name, customer_email, order_number, sla_due_at, archived_at, last_message_at, created_at")
        .order("last_message_at", { ascending: false })
        .limit(1200),
    ),
    safeMaybeSingle<StoreSettingsRow>(
      admin
        .from("ramx_store_settings")
        .select("preorder_enabled, preorder_goal, preorder_current_sales, preorder_badge")
        .eq("id", "default")
        .maybeSingle(),
    ),
    safeCount(admin, "profiles"),
    safeCount(admin, "profiles", todayIso),
    safeCount(admin, "pets"),
    safeCount(admin, "pets", todayIso),
  ]);

  return {
    orders: ordersResult,
    codes: codesResult,
    tickets: ticketsResult,
    storeSettings: settingsResult,
    clientsTotal,
    clientsToday,
    petsTotal,
    petsToday,
  };
}

function buildDashboardModel(data: DashboardData) {
  const now = Date.now();
  const todayIso = getStartOfTodayIso();
  const activeOrders = data.orders.filter((order) => !order.archived_at);
  const notCancelledOrders = activeOrders.filter((order) => !["cancelled", "returned"].includes(order.status || ""));
  const paidOrders = activeOrders.filter((order) => order.payment_status === "paid");
  const pendingPaymentOrders = activeOrders.filter((order) => ["unpaid", "manual_pending"].includes(order.payment_status || ""));
  const refundedOrders = activeOrders.filter((order) => order.payment_status === "refunded");
  const rejectedOrders = activeOrders.filter((order) => order.payment_status === "cancelled" || order.mercado_pago_payment_status === "rejected");
  const physicalItemRows = notCancelledOrders.flatMap((order) =>
    (order.ramx_order_items || []).filter((item) => item.product_type !== "donacion_ramx"),
  );
  const donationItemRows = activeOrders.flatMap((order) =>
    (order.ramx_order_items || []).filter((item) => item.product_type === "donacion_ramx"),
  );

  const topProducts = buildTopProducts(notCancelledOrders);
  const openTickets = data.tickets.filter((ticket) =>
    !ticket.archived_at && !["resolved", "closed"].includes(ticket.status || ""),
  );
  const overdueTickets = openTickets.filter((ticket) => {
    if (!ticket.sla_due_at) return false;
    return new Date(ticket.sla_due_at).getTime() < now;
  });
  const urgentTickets = openTickets
    .slice()
    .sort((a, b) => ticketSortScore(b, now) - ticketSortScore(a, now))
    .slice(0, 5);

  const activatedCodes = data.codes.filter((code) => code.status === "activated");
  const assignedCodes = data.codes.filter((code) => ["assigned", "reserved"].includes(code.status || ""));
  const recentActivations = activatedCodes
    .filter((code) => code.activated_at)
    .sort((a, b) => new Date(b.activated_at || 0).getTime() - new Date(a.activated_at || 0).getTime())
    .slice(0, 5);

  const revenuePaid = sumOrders(paidOrders);
  const revenueToday = sumOrders(paidOrders.filter((order) => isSameOrAfter(order.created_at, todayIso)));
  const ordersToday = activeOrders.filter((order) => isSameOrAfter(order.created_at, todayIso)).length;
  const ticketsToday = data.tickets.filter((ticket) => isSameOrAfter(ticket.created_at, todayIso)).length;
  const preorderGoal = Math.max(1, Number(data.storeSettings?.preorder_goal || 200));
  const realPreorderSales = physicalItemRows.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0);
  const configuredPreorderSales = Number(data.storeSettings?.preorder_current_sales || 0);
  const preorderCurrent = Math.max(configuredPreorderSales, realPreorderSales);
  const preorderProgress = Math.min(100, Math.round((preorderCurrent / preorderGoal) * 100));

  return {
    totalOrders: activeOrders.length,
    paidOrders: paidOrders.length,
    pendingPayments: pendingPaymentOrders.length,
    refundedPayments: refundedOrders.length,
    rejectedPayments: rejectedOrders.length,
    revenuePaid,
    revenueToday,
    ordersToday,
    ordersInProduction: activeOrders.filter((order) => order.status === "in_production").length,
    readyOrShipped: activeOrders.filter((order) => order.status === "ready" || order.status === "delivered" || Boolean(order.shipped_at)).length,
    preorderSales: realPreorderSales,
    preorderGoal,
    preorderCurrent,
    preorderProgress,
    donationCount: donationItemRows.length,
    donationRevenue: donationItemRows.reduce((sum, item) => sum + money(item.subtotal || item.unit_price), 0),
    availableCodes: data.codes.filter((code) => code.status === "available").length,
    assignedCodes: assignedCodes.length,
    activatedCodes: activatedCodes.length,
    blockedCodes: data.codes.filter((code) => ["blocked", "disabled", "replaced"].includes(code.status || "")).length,
    recentActivations,
    openTickets: openTickets.length,
    overdueTickets: overdueTickets.length,
    ticketsToday,
    urgentTickets,
    topProducts,
    recentOrders: activeOrders.slice(0, 6),
  };
}

async function safeSelect<T>(query: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T[]> {
  const result = await query;
  if (result.error || !Array.isArray(result.data)) return [];
  return result.data as T[];
}

async function safeMaybeSingle<T>(query: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T | null> {
  const result = await query;
  if (result.error || !result.data) return null;
  return result.data as T;
}

async function safeCount(
  admin: ReturnType<typeof createAdminClient>,
  table: string,
  createdAfterIso?: string,
): Promise<number> {
  let request = admin.from(table).select("*", { count: "exact", head: true });
  if (createdAfterIso) {
    request = request.gte("created_at", createdAfterIso);
  }
  const { count, error } = await request;
  if (error) return 0;
  return count || 0;
}

function buildTopProducts(orders: OrderDashboardRow[]): TopProduct[] {
  const map = new Map<string, TopProduct>();
  for (const order of orders) {
    for (const item of order.ramx_order_items || []) {
      const key = item.product_type || item.product_name || "producto";
      const current = map.get(key) || {
        key,
        label: item.product_name || readableProduct(key),
        quantity: 0,
        revenue: 0,
      };
      const quantity = Math.max(1, Number(item.quantity || 1));
      current.quantity += quantity;
      current.revenue += money(item.subtotal || 0) || money(item.unit_price) * quantity;
      map.set(key, current);
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity)
    .slice(0, 6);
}

function ticketSortScore(ticket: SupportTicketRow, now: number) {
  const priorityScore: Record<string, number> = { urgent: 5, high: 4, normal: 2, low: 1 };
  const overdue = ticket.sla_due_at && new Date(ticket.sla_due_at).getTime() < now ? 10 : 0;
  const recent = ticket.last_message_at ? new Date(ticket.last_message_at).getTime() / 1_000_000_000_000 : 0;
  return overdue + (priorityScore[ticket.priority || "normal"] || 2) + recent;
}

function getStartOfTodayIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function isSameOrAfter(value: string | null, iso: string) {
  if (!value) return false;
  return new Date(value).getTime() >= new Date(iso).getTime();
}

function sumOrders(orders: OrderDashboardRow[]) {
  return orders.reduce((sum, order) => sum + money(order.total_amount), 0);
}

function money(value: number | string | null | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMxn(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function readableProduct(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getOrderItemsLabel(order: OrderDashboardRow) {
  const items = order.ramx_order_items || [];
  if (items.length === 0) return "Sin producto";
  return items
    .map((item) => `${item.quantity || 1}× ${item.product_name || readableProduct(item.product_type || "producto")}`)
    .join(" · ");
}

function paymentLabel(status: string | null) {
  return PAYMENT_LABELS[status || ""] || status || "Sin estado";
}

function orderLabel(status: string | null) {
  return ORDER_LABELS[status || ""] || status || "Sin estado";
}

function ticketLabel(status: string | null) {
  return TICKET_LABELS[status || ""] || status || "Sin estado";
}

function HeroMetric({ label, value, caption }: { label: string; value: string | number; caption: string }) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-neutral-50/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{caption}</p>
    </div>
  );
}

function DailyRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-sm shadow-sm">
      <span className="text-neutral-600">{label}</span>
      <span className="font-semibold text-neutral-950">{value}</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: string;
  tone?: "neutral" | "orange" | "amber" | "emerald" | "sky" | "indigo" | "red";
  href?: string;
}) {
  const content = (
    <div className="h-full rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold ${toneClass(tone)}`}>
          {icon}
        </div>
        {href ? <span className="text-xs font-medium text-neutral-400">Abrir →</span> : null}
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{value}</p>
      <p className="mt-1 text-sm text-neutral-500">{detail}</p>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function toneClass(tone: "neutral" | "orange" | "amber" | "emerald" | "sky" | "indigo" | "red") {
  const classes: Record<typeof tone, string> = {
    neutral: "bg-neutral-950 text-white",
    orange: "bg-orange-100 text-orange-900",
    amber: "bg-amber-100 text-amber-900",
    emerald: "bg-emerald-100 text-emerald-900",
    sky: "bg-sky-100 text-sky-900",
    indigo: "bg-indigo-100 text-indigo-900",
    red: "bg-red-100 text-red-900",
  };
  return classes[tone];
}

function PreorderPanel({
  current,
  goal,
  progress,
  badge,
  enabled,
  revenue,
}: {
  current: number;
  goal: number;
  progress: number;
  badge: string;
  enabled: boolean;
  revenue: number;
}) {
  return (
    <section className="rounded-[34px] border border-white/80 bg-white/95 p-5 shadow-xl sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Preventa RAMX</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
            Meta fundadora de lanzamiento
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            {badge}. Cada venta ayuda a fabricar los primeros productos físicos, activar códigos QR/NFC y lanzar la red RAMX.
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${enabled ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-600"}`}>
          {enabled ? "Preventa activa" : "Preventa pausada"}
        </span>
      </div>

      <div className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-4xl font-semibold tracking-tight text-neutral-950">{current}</p>
            <p className="text-sm text-neutral-500">de {goal} ventas meta</p>
          </div>
          <p className="text-sm font-semibold text-orange-700">{progress}%</p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-neutral-950 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniStat label="Ingresos cobrados" value={formatMxn(revenue)} />
        <MiniStat label="Faltan" value={Math.max(0, goal - current)} />
        <MiniStat label="Siguiente hito" value={current >= goal ? "Launch" : `${Math.min(goal, current + 25)} ventas`} />
      </div>
    </section>
  );
}

function PaymentPanel({ paid, pending, rejected, refunded, revenue }: { paid: number; pending: number; rejected: number; refunded: number; revenue: number }) {
  return (
    <section className="rounded-[34px] border border-white/80 bg-white/95 p-5 shadow-xl sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Pagos Mercado Pago</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Estado de cobranza</h2>
        </div>
        <Link href="/admin/orders?payment=paid" className="text-sm font-semibold text-neutral-600 hover:text-neutral-950">
          Ver pagos →
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MiniStat label="Aprobados" value={paid} tone="emerald" />
        <MiniStat label="Pendientes" value={pending} tone="amber" />
        <MiniStat label="Rechazados/cancelados" value={rejected} tone="red" />
        <MiniStat label="Devueltos" value={refunded} />
      </div>
      <div className="mt-4 rounded-3xl bg-neutral-950 p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Ingresos confirmados</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{formatMxn(revenue)}</p>
      </div>
    </section>
  );
}

function ActivationPanel({
  available,
  assigned,
  activated,
  blocked,
  recentActivations,
}: {
  available: number;
  assigned: number;
  activated: number;
  blocked: number;
  recentActivations: PhysicalCodeRow[];
}) {
  return (
    <section className="rounded-[34px] border border-white/80 bg-white/95 p-5 shadow-xl sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Activaciones QR/NFC</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Inventario conectado</h2>
        </div>
        <Link href="/admin/products/codes" className="text-sm font-semibold text-neutral-600 hover:text-neutral-950">
          Códigos →
        </Link>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MiniStat label="Disponibles" value={available} />
        <MiniStat label="Asignados" value={assigned} tone="sky" />
        <MiniStat label="Activados" value={activated} tone="emerald" />
        <MiniStat label="Bloqueados/reemplazados" value={blocked} tone="red" />
      </div>
      <div className="mt-5 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Activaciones recientes</p>
        {recentActivations.length === 0 ? (
          <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-500">Aún no hay activaciones recientes.</p>
        ) : (
          recentActivations.map((code) => (
            <div key={code.id} className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3 text-sm">
              <span className="font-medium text-neutral-800">{readableProduct(code.product_type || "Código")}</span>
              <span className="text-neutral-500">{formatDate(code.activated_at)}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function RecentOrdersPanel({ orders }: { orders: OrderDashboardRow[] }) {
  return (
    <section className="rounded-[34px] border border-white/80 bg-white/95 p-5 shadow-xl sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Órdenes recientes</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Últimos movimientos</h2>
        </div>
        <Link href="/admin/orders" className="text-sm font-semibold text-neutral-600 hover:text-neutral-950">
          Todas →
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {orders.length === 0 ? (
          <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-500">Todavía no hay órdenes.</p>
        ) : (
          orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders?q=${encodeURIComponent(order.order_number)}`}
              className="block rounded-[24px] border border-neutral-200 bg-neutral-50/70 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{order.order_number}</p>
                  <h3 className="mt-1 font-semibold text-neutral-950">{order.customer_name || "Cliente RAMX"}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{getOrderItemsLabel(order)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-neutral-950">{formatMxn(money(order.total_amount))}</p>
                  <p className="text-xs text-neutral-500">{formatDate(order.created_at)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{orderLabel(order.status)}</Badge>
                <Badge tone="payment">{paymentLabel(order.payment_status)}</Badge>
                {order.tracking_number ? <Badge tone="sky">Guía: {order.tracking_number}</Badge> : null}
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

function SupportPanel({ tickets, open, overdue }: { tickets: SupportTicketRow[]; open: number; overdue: number }) {
  return (
    <section className="rounded-[34px] border border-white/80 bg-white/95 p-5 shadow-xl sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Soporte / tickets urgentes</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Atención al cliente</h2>
          <p className="mt-2 text-sm text-neutral-600">{open} abiertos · {overdue} vencidos</p>
        </div>
        <Link href="/admin/support" className="text-sm font-semibold text-neutral-600 hover:text-neutral-950">
          Jira RAMX →
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {tickets.length === 0 ? (
          <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-500">Sin tickets urgentes por ahora.</p>
        ) : (
          tickets.map((ticket) => (
            <Link
              href={`/admin/support/${ticket.ticket_number}`}
              key={ticket.id}
              className="block rounded-[24px] border border-neutral-200 bg-neutral-50/70 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{ticket.ticket_number}</p>
                  <h3 className="mt-1 font-semibold text-neutral-950">{ticket.subject || "Solicitud RAMX"}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{ticket.customer_name || ticket.customer_email || "Cliente"}</p>
                </div>
                <Badge tone={ticket.priority === "urgent" ? "red" : "amber"}>{ticket.priority || "normal"}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{ticketLabel(ticket.status)}</Badge>
                {ticket.order_number ? <Badge tone="sky">{ticket.order_number}</Badge> : null}
                {ticket.sla_due_at ? <Badge tone="amber">SLA {formatDate(ticket.sla_due_at)}</Badge> : null}
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

function TopProductsPanel({ products }: { products: TopProduct[] }) {
  const maxRevenue = Math.max(1, ...products.map((product) => product.revenue));

  return (
    <section className="rounded-[34px] border border-white/80 bg-white/95 p-5 shadow-xl sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Productos más vendidos</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Demanda por producto</h2>
        </div>
        <Link href="/admin/store" className="text-sm font-semibold text-neutral-600 hover:text-neutral-950">
          Editar tienda →
        </Link>
      </div>

      <div className="mt-5 space-y-4">
        {products.length === 0 ? (
          <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-500">Aún no hay ventas por producto.</p>
        ) : (
          products.map((product) => {
            const width = Math.max(6, Math.round((product.revenue / maxRevenue) * 100));
            return (
              <div key={product.key}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-neutral-950">{product.label}</p>
                    <p className="text-xs text-neutral-500">{product.quantity} unidades</p>
                  </div>
                  <p className="font-semibold text-neutral-800">{formatMxn(product.revenue)}</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-neutral-950" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function MiniStat({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "neutral" | "emerald" | "amber" | "red" | "sky" }) {
  const toneStyles: Record<typeof tone, string> = {
    neutral: "bg-neutral-50 text-neutral-950",
    emerald: "bg-emerald-50 text-emerald-950",
    amber: "bg-amber-50 text-amber-950",
    red: "bg-red-50 text-red-950",
    sky: "bg-sky-50 text-sky-950",
  };

  return (
    <div className={`rounded-[22px] p-4 ${toneStyles[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function QuickAction({ href, icon, title }: { href: string; icon: string; title: string }) {
  return (
    <Link
      href={href}
      className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4 text-center transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-bold shadow-sm">
        {icon}
      </div>
      <p className="mt-3 text-sm font-semibold text-neutral-900">{title}</p>
    </Link>
  );
}

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "payment" | "sky" | "amber" | "red" }) {
  const styles: Record<typeof tone, string> = {
    neutral: "bg-neutral-100 text-neutral-700",
    payment: "bg-emerald-100 text-emerald-800",
    sky: "bg-sky-100 text-sky-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}
