create table if not exists public.lost_reports (
  id text primary key,
  tracking_no text not null unique,
  status text not null check (status in ('open', 'matched', 'closed')),
  matched_found_id text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.found_reports (
  id text primary key,
  found_code text not null unique,
  rfid_tag text,
  status text not null check (status in ('stored', 'matched', 'returned', 'expired', 'pending_return', 'rejected_return', 'disposal_requested')),
  matched_lost_id text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id text primary key,
  action text not null,
  module text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists lost_reports_status_idx on public.lost_reports (status);
create index if not exists lost_reports_tracking_no_idx on public.lost_reports (tracking_no);
create index if not exists found_reports_status_idx on public.found_reports (status);
create index if not exists found_reports_found_code_idx on public.found_reports (found_code);
create index if not exists found_reports_rfid_tag_idx on public.found_reports (rfid_tag);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_lost_reports_updated_at on public.lost_reports;
create trigger set_lost_reports_updated_at
before update on public.lost_reports
for each row execute function public.set_updated_at();

drop trigger if exists set_found_reports_updated_at on public.found_reports;
create trigger set_found_reports_updated_at
before update on public.found_reports
for each row execute function public.set_updated_at();

alter table public.lost_reports enable row level security;
alter table public.found_reports enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Allow public read lost reports" on public.lost_reports;
create policy "Allow public read lost reports"
on public.lost_reports for select
to anon
using (true);

drop policy if exists "Allow public write lost reports" on public.lost_reports;
create policy "Allow public write lost reports"
on public.lost_reports for all
to anon
using (true)
with check (true);

drop policy if exists "Allow public read found reports" on public.found_reports;
create policy "Allow public read found reports"
on public.found_reports for select
to anon
using (true);

drop policy if exists "Allow public write found reports" on public.found_reports;
create policy "Allow public write found reports"
on public.found_reports for all
to anon
using (true)
with check (true);

drop policy if exists "Allow public read audit logs" on public.audit_logs;
create policy "Allow public read audit logs"
on public.audit_logs for select
to anon
using (true);

drop policy if exists "Allow public write audit logs" on public.audit_logs;
create policy "Allow public write audit logs"
on public.audit_logs for insert
to anon
with check (true);
