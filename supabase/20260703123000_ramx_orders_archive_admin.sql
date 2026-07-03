-- RAMX admin pedidos: archivo de pedidos y normalización de estatus.
-- Ejecutar en Supabase SQL Editor antes de desplegar esta versión.

alter table if exists public.ramx_orders
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid,
  add column if not exists archived_reason text;

create index if not exists ramx_orders_archived_at_idx
  on public.ramx_orders (archived_at);

create index if not exists ramx_orders_status_payment_archived_idx
  on public.ramx_orders (status, payment_status, archived_at);

alter table if exists public.ramx_orders
  drop constraint if exists ramx_orders_status_check;

alter table if exists public.ramx_orders
  add constraint ramx_orders_status_check
  check (
    status in (
      'pending',
      'confirmed',
      'in_production',
      'ready',
      'delivered',
      'cancelled'
    )
  );

alter table if exists public.ramx_orders
  drop constraint if exists ramx_orders_payment_status_check;

alter table if exists public.ramx_orders
  add constraint ramx_orders_payment_status_check
  check (
    payment_status in (
      'unpaid',
      'manual_pending',
      'paid',
      'refunded',
      'cancelled'
    )
  );

notify pgrst, 'reload schema';
