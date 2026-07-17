-- RAMX pedidos CRM: devolución, timeline y compatibilidad de estatus.
-- Ejecutar en Supabase SQL Editor antes de desplegar esta versión.

alter table if exists public.ramx_orders
  add column if not exists returned_at timestamptz;

create index if not exists ramx_orders_returned_at_idx
  on public.ramx_orders (returned_at);

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
      'returned',
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
