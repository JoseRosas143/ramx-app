-- Mercado Pago robusto: verificación manual, webhook idempotente y notificación de pago confirmado.

alter table if exists public.ramx_orders
  add column if not exists mercado_pago_payment_checked_at timestamptz,
  add column if not exists mercado_pago_payment_notified_at timestamptz,
  add column if not exists mercado_pago_last_sync_error text;

create index if not exists ramx_orders_mp_payment_checked_idx
  on public.ramx_orders (mercado_pago_payment_checked_at);

create index if not exists ramx_orders_mp_payment_notified_idx
  on public.ramx_orders (mercado_pago_payment_notified_at);

notify pgrst, 'reload schema';
