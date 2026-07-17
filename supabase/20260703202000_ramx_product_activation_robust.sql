-- RAMX · Activación robusta de productos físicos
-- Conecta códigos físicos con órdenes, portal de cliente y mascota vinculada.

alter table if exists public.ramx_physical_codes
  add column if not exists assigned_order_id uuid,
  add column if not exists assigned_order_item_id uuid,
  add column if not exists assigned_at timestamptz,
  add column if not exists replaced_by_code_id uuid,
  add column if not exists replaced_at timestamptz,
  add column if not exists blocked_at timestamptz,
  add column if not exists blocked_reason text,
  add column if not exists activation_notes text;

alter table if exists public.ramx_physical_codes
  drop constraint if exists ramx_physical_codes_status_check;

alter table if exists public.ramx_physical_codes
  add constraint ramx_physical_codes_status_check
  check (status in ('available', 'reserved', 'assigned', 'activated', 'blocked', 'disabled', 'replaced'));

alter table if exists public.ramx_physical_codes
  drop constraint if exists ramx_physical_codes_product_type_check;

alter table if exists public.ramx_physical_codes
  add constraint ramx_physical_codes_product_type_check
  check (
    product_type in (
      'qr_plate',
      'qr_nfc_plate',
      'nfc_card',
      'kit',
      'other',
      'placa_inteligente_nfc_qr',
      'combo_identificacion_inteligente',
      'combo_identidad_inteligente'
    )
  );

create table if not exists public.ramx_order_product_codes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ramx_orders(id) on delete cascade,
  order_item_id uuid references public.ramx_order_items(id) on delete set null,
  code_id uuid not null references public.ramx_physical_codes(id) on delete restrict,
  code text not null,
  product_type text not null,
  status text not null default 'assigned' check (status in ('assigned', 'activated', 'released', 'replaced', 'blocked')),
  assigned_at timestamptz not null default now(),
  activated_at timestamptz,
  released_at timestamptz,
  replaced_at timestamptz,
  replaced_by_code_id uuid references public.ramx_physical_codes(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code_id)
);

create index if not exists ramx_order_product_codes_order_idx
  on public.ramx_order_product_codes (order_id);

create index if not exists ramx_order_product_codes_status_idx
  on public.ramx_order_product_codes (status);

create index if not exists ramx_order_product_codes_code_idx
  on public.ramx_order_product_codes (code);

create index if not exists ramx_physical_codes_assigned_order_idx
  on public.ramx_physical_codes (assigned_order_id);

create index if not exists ramx_physical_codes_status_product_idx
  on public.ramx_physical_codes (status, product_type);

create table if not exists public.ramx_product_assignments (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.ramx_physical_codes(id) on delete cascade,
  code text not null,
  profile_id uuid,
  pet_id uuid,
  order_id uuid references public.ramx_orders(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'released', 'replaced', 'blocked')),
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists ramx_product_assignments_pet_idx
  on public.ramx_product_assignments (pet_id);

create index if not exists ramx_product_assignments_code_idx
  on public.ramx_product_assignments (code_id);

create table if not exists public.ramx_product_scan_events (
  id uuid primary key default gen_random_uuid(),
  code_id uuid references public.ramx_physical_codes(id) on delete set null,
  code text not null,
  pet_id uuid,
  profile_id uuid,
  source text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists ramx_product_scan_events_code_created_idx
  on public.ramx_product_scan_events (code, created_at desc);

alter table if exists public.ramx_orders
  add column if not exists product_assigned_at timestamptz,
  add column if not exists product_assigned_notified_at timestamptz;

create index if not exists ramx_orders_product_assigned_at_idx
  on public.ramx_orders (product_assigned_at);

notify pgrst, 'reload schema';
