alter table if exists public.ramx_orders
  add column if not exists shipping_carrier text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists shipped_at timestamptz;

create index if not exists ramx_orders_tracking_number_idx
  on public.ramx_orders (tracking_number);

create index if not exists ramx_orders_shipped_at_idx
  on public.ramx_orders (shipped_at);

notify pgrst, 'reload schema';
