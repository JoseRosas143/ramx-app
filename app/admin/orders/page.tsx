import Link from 'next/link'
import { requireRamxAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  updateRamxOrderPaymentStatusAction,
  updateRamxOrderStatusAction,
} from './actions'

type PageProps = {
  searchParams?: Promise<{
    status?: string
    payment?: string
  }>
}

const ORDER_STATUS_OPTIONS = [
  ['all', 'Todos'],
  ['pending', 'Pendientes'],
  ['confirmed', 'Confirmadas'],
  ['in_production', 'En producción'],
  ['ready', 'Listas'],
  ['delivered', 'Entregadas'],
  ['cancelled', 'Canceladas'],
] as const

const PAYMENT_STATUS_OPTIONS = [
  ['all', 'Todos'],
  ['unpaid', 'Sin pagar'],
  ['manual_pending', 'Pendiente manual'],
  ['paid', 'Pagado'],
  ['refunded', 'Reembolsado'],
  ['cancelled', 'Cancelado'],
] as const

const ORDER_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  in_production: 'En producción',
  ready: 'Lista',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
}

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: 'Sin pagar',
  manual_pending: 'Pendiente manual',
  paid: 'Pagado',
  refunded: 'Reembolsado',
  cancelled: 'Cancelado',
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  await requireRamxAdmin()
  const admin = createAdminClient()
  const query = searchParams ? await searchParams : {}

  const status = query.status || 'all'
  const payment = query.payment || 'all'

  let request = admin
    .from('ramx_orders')
    .select(
      `
      id,
      order_number,
      status,
      payment_status,
      customer_name,
      customer_email,
      customer_phone,
      shipping_method,
      shipping_address,
      notes,
      total_amount,
      currency,
      created_at,
      admin_notes,
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
    `
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (status !== 'all') {
    request = request.eq('status', status)
  }

  if (payment !== 'all') {
    request = request.eq('payment_status', payment)
  }

  const { data: orders, error } = await request

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
              Órdenes RAMX
            </h1>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Solicitudes de Placa Inteligente NFC/Qr y combos de identidad RAMX.
            </p>
          </div>

          <Link
            href="/admin/products/codes"
            className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Códigos físicos
          </Link>
        </div>

        <section className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-xl">
          <form className="grid gap-4 sm:grid-cols-3" action="/admin/orders">
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
          {(orders || []).length === 0 ? (
            <div className="rounded-[28px] border border-white/80 bg-white/95 p-8 text-center shadow-xl">
              <p className="text-sm text-neutral-600">
                Todavía no hay órdenes con estos filtros.
              </p>
            </div>
          ) : null}

          {(orders || []).map((order: any) => (
            <article
              key={order.id}
              className="rounded-[30px] border border-white/80 bg-white/95 p-5 shadow-xl"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    {order.order_number}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-neutral-950">
                    {order.customer_name || 'Cliente RAMX'}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Mascota:{' '}
                    {order.pets?.public_slug ? (
                      <Link
                        href={`/p/${order.pets.public_slug}`}
                        target="_blank"
                        className="font-medium text-sky-700 hover:underline"
                      >
                        {order.pets.name}
                      </Link>
                    ) : (
                      order.pets?.name || 'Sin mascota'
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusPill label={ORDER_LABELS[order.status] || order.status} />
                  <StatusPill
                    label={PAYMENT_LABELS[order.payment_status] || order.payment_status}
                    tone="payment"
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-4">
                <InfoBox
                  label="Producto"
                  value={(order.ramx_order_items || [])
                    .map((item: any) => `${item.quantity} × ${item.product_name}`)
                    .join(', ')}
                />
                <InfoBox
                  label="Contacto"
                  value={`${order.customer_phone || 'Sin teléfono'}${
                    order.customer_email ? ` · ${order.customer_email}` : ''
                  }`}
                />
                <InfoBox
                  label="Entrega"
                  value={`${deliveryLabel(order.shipping_method)}${
                    order.shipping_address ? `\n${order.shipping_address}` : ''
                  }`}
                />
                <InfoBox
                  label="Total"
                  value={formatMxn(Number(order.total_amount || 0), order.currency)}
                />
              </div>

              {order.notes || order.admin_notes ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {order.notes ? (
                    <div className="rounded-2xl bg-neutral-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        Notas del cliente
                      </p>
                      <p className="mt-1 text-sm leading-6 text-neutral-700">
                        {order.notes}
                      </p>
                    </div>
                  ) : null}

                  {order.admin_notes ? (
                    <div className="rounded-2xl bg-sky-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                        Notas admin
                      </p>
                      <p className="mt-1 text-sm leading-6 text-sky-900">
                        {order.admin_notes}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_0.8fr_auto]">
                <form action={updateRamxOrderStatusAction} className="grid gap-2 sm:grid-cols-[1fr_1.2fr_auto]">
                  <input type="hidden" name="order_id" value={order.id} />
                  <select
                    name="status"
                    defaultValue={order.status}
                    className="h-11 rounded-2xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
                  >
                    {ORDER_STATUS_OPTIONS.filter(([value]) => value !== 'all').map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                  <input
                    name="admin_notes"
                    defaultValue={order.admin_notes || ''}
                    placeholder="Nota admin"
                    className="h-11 rounded-2xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
                  />
                  <button
                    type="submit"
                    className="h-11 rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white"
                  >
                    Guardar
                  </button>
                </form>

                <form action={updateRamxOrderPaymentStatusAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input type="hidden" name="order_id" value={order.id} />
                  <select
                    name="payment_status"
                    defaultValue={order.payment_status}
                    className="h-11 rounded-2xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
                  >
                    {PAYMENT_STATUS_OPTIONS.filter(([value]) => value !== 'all').map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                  <button
                    type="submit"
                    className="h-11 rounded-2xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800"
                  >
                    Pago
                  </button>
                </form>

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
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-neutral-800">{value || '—'}</p>
    </div>
  )
}

function StatusPill({
  label,
  tone = 'order',
}: {
  label: string
  tone?: 'order' | 'payment'
}) {
  const className =
    tone === 'payment'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-sky-200 bg-sky-50 text-sky-800'

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}

function formatMxn(amount: number, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
    maximumFractionDigits: 0,
  }).format(amount)
}

function deliveryLabel(value: string) {
  const labels: Record<string, string> = {
    to_confirm: 'Confirmar por WhatsApp',
    pickup: 'Entrega / recolección local',
    shipping: 'Envío a domicilio',
  }

  return labels[value] || 'Confirmar'
}

function whatsappHref(phone: string, orderNumber: string) {
  const normalized = phone.replace(/[^0-9]/g, '')
  const message = encodeURIComponent(
    `Hola, te escribo de RAMX sobre tu solicitud ${orderNumber}.`
  )

  return `https://wa.me/${normalized}?text=${message}`
}
