alter table if exists public.ramx_orders
  add column if not exists order_in_production_notified_at timestamptz,
  add column if not exists order_ready_notified_at timestamptz,
  add column if not exists order_shipped_notified_at timestamptz,
  add column if not exists order_delivered_notified_at timestamptz,
  add column if not exists order_returned_notified_at timestamptz,
  add column if not exists order_last_email_error text;

create index if not exists ramx_orders_order_in_production_notified_idx
  on public.ramx_orders (order_in_production_notified_at);

create index if not exists ramx_orders_order_shipped_notified_idx
  on public.ramx_orders (order_shipped_notified_at);

create index if not exists ramx_orders_order_delivered_notified_idx
  on public.ramx_orders (order_delivered_notified_at);

notify pgrst, 'reload schema';
