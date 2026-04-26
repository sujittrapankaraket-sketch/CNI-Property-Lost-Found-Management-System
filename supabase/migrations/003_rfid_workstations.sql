-- ─────────────────────────────────────────────────────────────
-- Migration 003 — RFID readers & Workstations
-- Run this on an existing database that already has 001 + 002.
-- ─────────────────────────────────────────────────────────────

-- rfid_readers: hardware config for each RFID scanner device
create table if not exists public.rfid_readers (
  id              text primary key,
  name            text not null,
  area_id         text references public.areas(id) on delete set null,
  connection_type text not null default 'keyboard'
    check (connection_type in ('keyboard', 'usb_serial', 'tcp_ip', 'bluetooth')),
  serial_port     text,
  baud_rate       int,
  ip_address      text,
  tcp_port        int,
  bluetooth_name  text,
  tag_prefix      text not null default '',
  tag_suffix      text not null default '',
  is_active       boolean not null default true,
  note            text not null default '',
  created_at      timestamptz not null default now()
);

-- workstations: one row per browser/device, links to an rfid_reader
create table if not exists public.workstations (
  id         text primary key,   -- deviceId (UUID stored in localStorage)
  name       text not null,
  reader_id  text references public.rfid_readers(id) on delete set null,
  last_seen  timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- indexes
create index if not exists rfid_readers_area_id_idx   on public.rfid_readers (area_id);
create index if not exists workstations_reader_id_idx  on public.workstations (reader_id);
create index if not exists workstations_last_seen_idx  on public.workstations (last_seen desc);

-- RLS
alter table public.rfid_readers  enable row level security;
alter table public.workstations  enable row level security;

drop policy if exists "anon read rfid_readers"  on public.rfid_readers;
create policy "anon read rfid_readers"
  on public.rfid_readers for select to anon using (true);
drop policy if exists "anon write rfid_readers" on public.rfid_readers;
create policy "anon write rfid_readers"
  on public.rfid_readers for all to anon using (true) with check (true);

drop policy if exists "anon read workstations"  on public.workstations;
create policy "anon read workstations"
  on public.workstations for select to anon using (true);
drop policy if exists "anon write workstations" on public.workstations;
create policy "anon write workstations"
  on public.workstations for all to anon using (true) with check (true);

-- also fix return_appointment column type if it was previously timestamptz
-- (the app stores this as a date string, e.g. '2026-04-28')
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'found_reports'
      and column_name  = 'return_appointment'
      and data_type    = 'timestamp with time zone'
  ) then
    alter table public.found_reports
      alter column return_appointment type date
      using return_appointment::date;
  end if;
end $$;
