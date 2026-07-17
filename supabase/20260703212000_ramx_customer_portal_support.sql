create table if not exists public.ramx_support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  order_id uuid references public.ramx_orders(id) on delete set null,
  order_number text,
  customer_name text,
  customer_email text,
  customer_phone text,
  category text not null default 'otro',
  priority text not null default 'normal',
  status text not null default 'new',
  subject text not null,
  description text,
  source text not null default 'portal',
  assigned_to text,
  last_message_at timestamptz default now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.ramx_support_tickets
  drop constraint if exists ramx_support_tickets_category_check;

alter table if exists public.ramx_support_tickets
  add constraint ramx_support_tickets_category_check
  check (
    category in (
      'pedido_preventa',
      'pago_mercado_pago',
      'activacion_qr_nfc',
      'registro_mascota',
      'modo_extraviado',
      'cuenta_acceso',
      'garantia_reposicion',
      'donacion',
      'premium_addons',
      'otro'
    )
  );

alter table if exists public.ramx_support_tickets
  drop constraint if exists ramx_support_tickets_priority_check;

alter table if exists public.ramx_support_tickets
  add constraint ramx_support_tickets_priority_check
  check (priority in ('low', 'normal', 'high', 'urgent'));

alter table if exists public.ramx_support_tickets
  drop constraint if exists ramx_support_tickets_status_check;

alter table if exists public.ramx_support_tickets
  add constraint ramx_support_tickets_status_check
  check (
    status in (
      'new',
      'open',
      'customer_replied',
      'waiting_customer',
      'in_progress',
      'resolved',
      'closed'
    )
  );

create table if not exists public.ramx_support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.ramx_support_tickets(id) on delete cascade,
  sender_type text not null default 'customer',
  author_name text,
  author_email text,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

alter table if exists public.ramx_support_messages
  drop constraint if exists ramx_support_messages_sender_type_check;

alter table if exists public.ramx_support_messages
  add constraint ramx_support_messages_sender_type_check
  check (sender_type in ('customer', 'admin', 'system'));

create table if not exists public.ramx_support_ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.ramx_support_tickets(id) on delete cascade,
  message_id uuid references public.ramx_support_messages(id) on delete set null,
  file_name text,
  file_url text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists ramx_support_tickets_order_idx
  on public.ramx_support_tickets (order_number, customer_email);

create index if not exists ramx_support_tickets_status_idx
  on public.ramx_support_tickets (status, archived_at, last_message_at desc);

create index if not exists ramx_support_tickets_customer_idx
  on public.ramx_support_tickets (customer_email);

create index if not exists ramx_support_messages_ticket_idx
  on public.ramx_support_messages (ticket_id, created_at);

create index if not exists ramx_support_attachments_ticket_idx
  on public.ramx_support_ticket_attachments (ticket_id, created_at);

notify pgrst, 'reload schema';
