-- =============================================================
-- CNI Lost & Found System — Complete Database Schema
-- Run this on a fresh database to set up everything from scratch.
-- For existing databases use the incremental migration files.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- RESET: drop all tables in dependency order (safe to re-run)
-- ─────────────────────────────────────────────────────────────

drop table if exists public.audit_logs          cascade;
drop table if exists public.found_reports       cascade;
drop table if exists public.lost_reports        cascade;
drop table if exists public.workstations        cascade;
drop table if exists public.rfid_readers        cascade;
drop table if exists public.storage_locations   cascade;
drop table if exists public.areas               cascade;
drop table if exists public.property_categories cascade;
drop table if exists public.user_groups         cascade;
drop table if exists public.users               cascade;
drop table if exists public.system_settings     cascade;

-- ─────────────────────────────────────────────────────────────
-- SHARED TRIGGER: updated_at
-- ─────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─────────────────────────────────────────────────────────────
-- MASTER DATA: property_categories
-- ─────────────────────────────────────────────────────────────

create table if not exists public.property_categories (
  id             text primary key,
  name           text not null,
  name_en        text not null default '',
  retention_days int  not null default 365,
  icon           text not null default '📦',
  created_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- MASTER DATA: areas
-- ─────────────────────────────────────────────────────────────

create table if not exists public.areas (
  id         text primary key,
  name       text not null,
  floor      text not null default '',
  zone       text not null default '',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- MASTER DATA: storage_locations
-- ─────────────────────────────────────────────────────────────

create table if not exists public.storage_locations (
  id         text primary key,
  name       text not null,
  capacity   int  not null default 0,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- USER GROUPS (TOR 4.9.1.2, 4.9.1.3)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.user_groups (
  id          text primary key,
  name        text not null,
  permissions jsonb not null default '{
    "lost_report": true,
    "found_report": true,
    "search_match": true,
    "property_management": true,
    "reports": true,
    "admin": false
  }',
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────

create table if not exists public.users (
  id            text primary key,
  username      text not null unique,
  password_hash text not null,
  full_name     text not null,
  role          text not null default 'staff'
    check (role in ('admin', 'staff', 'viewer')),
  group_id      text references public.user_groups(id) on delete set null,
  permissions   jsonb not null default '{
    "lost_report": true,
    "found_report": true,
    "search_match": true,
    "property_management": true,
    "reports": true,
    "admin": false
  }',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- SYSTEM SETTINGS  (single-row table)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.system_settings (
  id                      text primary key default 'default',
  session_timeout_minutes int  not null default 30,
  organization_name       text not null default 'ClickNext Innovation',
  logo_url                text not null default '',
  updated_at              timestamptz not null default now(),
  constraint single_row check (id = 'default')
);

-- ─────────────────────────────────────────────────────────────
-- RFID READERS  (hardware configuration per reader device)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.rfid_readers (
  id              text primary key,
  name            text not null,
  area_id         text references public.areas(id) on delete set null,
  connection_type text not null default 'keyboard'
    check (connection_type in ('keyboard', 'usb_serial', 'tcp_ip', 'bluetooth')),
  -- USB Serial
  serial_port     text,
  baud_rate       int,
  -- TCP/IP
  ip_address      text,
  tcp_port        int,
  -- Bluetooth
  bluetooth_name  text,
  -- Tag format normalization
  tag_prefix      text not null default '',
  tag_suffix      text not null default '',
  is_active       boolean not null default true,
  note            text not null default '',
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- WORKSTATIONS  (per-device registration & reader assignment)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.workstations (
  id         text primary key,   -- deviceId (UUID per browser/device)
  name       text not null,
  reader_id  text references public.rfid_readers(id) on delete set null,
  last_seen  timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- LOST REPORTS
-- ─────────────────────────────────────────────────────────────

create table if not exists public.lost_reports (
  id                   text primary key,
  tracking_no          text not null unique,

  category_id          text references public.property_categories(id) on delete set null,
  color                text not null default '',
  size                 text not null default '',
  qty                  int  not null default 1,
  description          text not null default '',
  photos               jsonb not null default '[]',

  lost_area_id         text references public.areas(id) on delete set null,
  lost_area_note       text not null default '',
  lost_date_from       date,
  lost_date_to         date,
  lost_time_from       text not null default '',
  lost_time_to         text not null default '',

  reporter_name        text not null default '',
  reporter_nationality text not null default '',
  reporter_phone       text not null default '',
  reporter_email       text not null default '',

  status               text not null default 'open'
    check (status in ('open', 'matched', 'closed')),
  matched_found_id     text,          -- FK added after found_reports exists

  created_by           text not null default '',
  payload              jsonb not null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- FOUND REPORTS
-- ─────────────────────────────────────────────────────────────

create table if not exists public.found_reports (
  id                   text primary key,
  found_code           text not null unique,
  rfid_tag             text not null default '',

  category_id          text references public.property_categories(id) on delete set null,
  color                text not null default '',
  size                 text not null default '',
  qty                  int  not null default 1,
  description          text not null default '',
  photos               jsonb not null default '[]',

  found_area_id        text references public.areas(id) on delete set null,
  found_area_note      text not null default '',
  found_date           date,
  found_time           text not null default '',

  finder_name          text not null default '',
  finder_nationality   text not null default '',
  finder_phone         text not null default '',
  finder_email         text not null default '',
  finder_signature     text,          -- base64 data-url

  storage_location_id  text references public.storage_locations(id) on delete set null,
  status               text not null default 'stored'
    check (status in (
      'stored', 'matched', 'returned', 'expired',
      'pending_return', 'rejected_return', 'disposal_requested'
    )),
  expires_at           date,
  matched_lost_id      text references public.lost_reports(id) on delete set null,
  return_appointment   date,
  disposal_reason      text,
  recipient_signature  text,          -- base64 data-url
  returned_at          timestamptz,

  created_by           text not null default '',
  payload              jsonb not null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- cross-reference FK (both tables now exist)
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'lost_reports_matched_found_id_fkey'
  ) then
    alter table public.lost_reports
      add constraint lost_reports_matched_found_id_fkey
      foreign key (matched_found_id) references public.found_reports(id) on delete set null;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────────────────────────

create table if not exists public.audit_logs (
  id         text primary key,
  user_id    text not null default '',
  username   text not null default '',
  action     text not null,
  module     text not null,
  detail     text not null default '',
  ip_address text not null default '',
  payload    jsonb not null,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────

-- lost_reports
create index if not exists lost_reports_status_idx       on public.lost_reports (status);
create index if not exists lost_reports_tracking_no_idx  on public.lost_reports (tracking_no);
create index if not exists lost_reports_category_idx     on public.lost_reports (category_id);
create index if not exists lost_reports_created_at_idx   on public.lost_reports (created_at desc);
create index if not exists lost_reports_reporter_email   on public.lost_reports (reporter_email);

-- found_reports
create index if not exists found_reports_status_idx      on public.found_reports (status);
create index if not exists found_reports_found_code_idx  on public.found_reports (found_code);
create index if not exists found_reports_rfid_tag_idx    on public.found_reports (rfid_tag);
create index if not exists found_reports_category_idx    on public.found_reports (category_id);
create index if not exists found_reports_expires_at_idx  on public.found_reports (expires_at);
create index if not exists found_reports_created_at_idx  on public.found_reports (created_at desc);

-- audit_logs
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_user_id_idx    on public.audit_logs (user_id);
create index if not exists audit_logs_action_idx     on public.audit_logs (action);

-- users
create index if not exists users_username_idx  on public.users (username);
create index if not exists users_role_idx      on public.users (role);
create index if not exists users_group_id_idx  on public.users (group_id);

-- rfid_readers
create index if not exists rfid_readers_area_id_idx on public.rfid_readers (area_id);

-- workstations
create index if not exists workstations_reader_id_idx on public.workstations (reader_id);
create index if not exists workstations_last_seen_idx on public.workstations (last_seen desc);

-- ─────────────────────────────────────────────────────────────
-- TRIGGERS: updated_at
-- ─────────────────────────────────────────────────────────────

drop trigger if exists trg_lost_reports_updated_at    on public.lost_reports;
create trigger trg_lost_reports_updated_at
  before update on public.lost_reports
  for each row execute function public.set_updated_at();

drop trigger if exists trg_found_reports_updated_at   on public.found_reports;
create trigger trg_found_reports_updated_at
  before update on public.found_reports
  for each row execute function public.set_updated_at();

drop trigger if exists trg_users_updated_at           on public.users;
create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists trg_system_settings_updated_at on public.system_settings;
create trigger trg_system_settings_updated_at
  before update on public.system_settings
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

alter table public.property_categories  enable row level security;
alter table public.areas                enable row level security;
alter table public.storage_locations    enable row level security;
alter table public.user_groups          enable row level security;
alter table public.users                enable row level security;
alter table public.system_settings      enable row level security;
alter table public.rfid_readers         enable row level security;
alter table public.workstations         enable row level security;
alter table public.lost_reports         enable row level security;
alter table public.found_reports        enable row level security;
alter table public.audit_logs           enable row level security;

-- property_categories
drop policy if exists "anon read property_categories"  on public.property_categories;
create policy "anon read property_categories"
  on public.property_categories for select to anon using (true);
drop policy if exists "anon write property_categories" on public.property_categories;
create policy "anon write property_categories"
  on public.property_categories for all to anon using (true) with check (true);

-- areas
drop policy if exists "anon read areas"  on public.areas;
create policy "anon read areas"
  on public.areas for select to anon using (true);
drop policy if exists "anon write areas" on public.areas;
create policy "anon write areas"
  on public.areas for all to anon using (true) with check (true);

-- storage_locations
drop policy if exists "anon read storage_locations"  on public.storage_locations;
create policy "anon read storage_locations"
  on public.storage_locations for select to anon using (true);
drop policy if exists "anon write storage_locations" on public.storage_locations;
create policy "anon write storage_locations"
  on public.storage_locations for all to anon using (true) with check (true);

-- user_groups
drop policy if exists "anon read user_groups"  on public.user_groups;
create policy "anon read user_groups"
  on public.user_groups for select to anon using (true);
drop policy if exists "anon write user_groups" on public.user_groups;
create policy "anon write user_groups"
  on public.user_groups for all to anon using (true) with check (true);

-- users
drop policy if exists "anon read users"  on public.users;
create policy "anon read users"
  on public.users for select to anon using (true);
drop policy if exists "anon write users" on public.users;
create policy "anon write users"
  on public.users for all to anon using (true) with check (true);

-- system_settings
drop policy if exists "anon read system_settings"  on public.system_settings;
create policy "anon read system_settings"
  on public.system_settings for select to anon using (true);
drop policy if exists "anon write system_settings" on public.system_settings;
create policy "anon write system_settings"
  on public.system_settings for all to anon using (true) with check (true);

-- rfid_readers
drop policy if exists "anon read rfid_readers"  on public.rfid_readers;
create policy "anon read rfid_readers"
  on public.rfid_readers for select to anon using (true);
drop policy if exists "anon write rfid_readers" on public.rfid_readers;
create policy "anon write rfid_readers"
  on public.rfid_readers for all to anon using (true) with check (true);

-- workstations
drop policy if exists "anon read workstations"  on public.workstations;
create policy "anon read workstations"
  on public.workstations for select to anon using (true);
drop policy if exists "anon write workstations" on public.workstations;
create policy "anon write workstations"
  on public.workstations for all to anon using (true) with check (true);

-- lost_reports
drop policy if exists "anon read lost_reports"  on public.lost_reports;
create policy "anon read lost_reports"
  on public.lost_reports for select to anon using (true);
drop policy if exists "anon write lost_reports" on public.lost_reports;
create policy "anon write lost_reports"
  on public.lost_reports for all to anon using (true) with check (true);

-- found_reports
drop policy if exists "anon read found_reports"  on public.found_reports;
create policy "anon read found_reports"
  on public.found_reports for select to anon using (true);
drop policy if exists "anon write found_reports" on public.found_reports;
create policy "anon write found_reports"
  on public.found_reports for all to anon using (true) with check (true);

-- audit_logs  (read + insert only — no update/delete)
drop policy if exists "anon read audit_logs"   on public.audit_logs;
create policy "anon read audit_logs"
  on public.audit_logs for select to anon using (true);
drop policy if exists "anon insert audit_logs" on public.audit_logs;
create policy "anon insert audit_logs"
  on public.audit_logs for insert to anon with check (true);

-- ─────────────────────────────────────────────────────────────
-- SEED DATA — master data (idempotent)
-- ─────────────────────────────────────────────────────────────

insert into public.property_categories (id, name, name_en, retention_days, icon) values
  ('c1', 'บัตร/เอกสาร',            'Card/Document', 365, '🪪'),
  ('c2', 'พวงกุญแจ',               'Keys',          365, '🔑'),
  ('c3', 'กระเป๋า',                'Bag',           365, '👜'),
  ('c4', 'อุปกรณ์อิเล็กทรอนิกส์', 'Electronics',   365, '📱'),
  ('c5', 'อาหาร/เครื่องดื่ม',      'Food/Beverage',   1, '🍱'),
  ('c6', 'เสื้อผ้า/แฟชั่น',        'Clothing',      365, '👔'),
  ('c7', 'เครื่องประดับ',           'Jewelry',       365, '💍'),
  ('c8', 'อื่นๆ',                   'Others',        365, '📦')
on conflict (id) do nothing;

insert into public.areas (id, name, floor, zone) values
  ('a1', 'ชั้น 1 - ประตูทางเข้าหลัก', '1',  'A'),
  ('a2', 'ชั้น 1 - ลานกิจกรรม',       '1',  'B'),
  ('a3', 'ชั้น 2 - ห้องน้ำ',           '2',  'A'),
  ('a4', 'ชั้น 2 - ร้านอาหาร',         '2',  'B'),
  ('a5', 'ชั้น 3 - Cinema',            '3',  'A'),
  ('a6', 'ชั้น B1 - ที่จอดรถ',         'B1', 'A'),
  ('a7', 'ชั้น B2 - ที่จอดรถ',         'B2', 'A'),
  ('a8', 'ชั้น 4 - Zone Kids',         '4',  'B')
on conflict (id) do nothing;

insert into public.storage_locations (id, name, capacity) values
  ('sl1', 'ตู้ A-01',           20),
  ('sl2', 'ตู้ A-02',           20),
  ('sl3', 'ตู้ B-01',           15),
  ('sl4', 'ห้องเก็บของชั้น 1', 100),
  ('sl5', 'ตู้เย็น (อาหาร)',    30)
on conflict (id) do nothing;

insert into public.user_groups (id, name, permissions) values
  ('g1', 'ผู้ดูแลระบบ',
   '{"lost_report":true,"found_report":true,"search_match":true,"property_management":true,"reports":true,"admin":true}'),
  ('g2', 'เจ้าหน้าที่',
   '{"lost_report":true,"found_report":true,"search_match":true,"property_management":true,"reports":true,"admin":false}'),
  ('g3', 'ผู้ชม',
   '{"lost_report":false,"found_report":false,"search_match":true,"property_management":true,"reports":true,"admin":false}')
on conflict (id) do nothing;

insert into public.system_settings (id, session_timeout_minutes, organization_name, logo_url) values
  ('default', 30, 'ClickNext Innovation', '')
on conflict (id) do nothing;
