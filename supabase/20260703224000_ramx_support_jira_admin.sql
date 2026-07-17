alter table if exists public.ramx_support_tickets
  add column if not exists status_changed_at timestamptz,
  add column if not exists first_response_at timestamptz,
  add column if not exists last_customer_message_at timestamptz,
  add column if not exists last_admin_message_at timestamptz,
  add column if not exists sla_due_at timestamptz,
  add column if not exists tags text[] not null default '{}',
  add column if not exists admin_summary text,
  add column if not exists resolution_summary text;

update public.ramx_support_tickets
set status_changed_at = coalesce(status_changed_at, updated_at, created_at),
    sla_due_at = coalesce(
      sla_due_at,
      case
        when priority = 'urgent' then created_at + interval '4 hours'
        when priority = 'high' then created_at + interval '12 hours'
        else created_at + interval '24 hours'
      end
    )
where status_changed_at is null
   or sla_due_at is null;

create index if not exists ramx_support_tickets_jira_board_idx
  on public.ramx_support_tickets (archived_at, status, priority, last_message_at desc);

create index if not exists ramx_support_tickets_assigned_idx
  on public.ramx_support_tickets (assigned_to, status, archived_at);

create index if not exists ramx_support_tickets_sla_idx
  on public.ramx_support_tickets (sla_due_at, status, archived_at);

create index if not exists ramx_support_tickets_tags_gin_idx
  on public.ramx_support_tickets using gin (tags);

notify pgrst, 'reload schema';
