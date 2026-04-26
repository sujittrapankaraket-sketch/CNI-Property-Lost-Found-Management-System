-- ─────────────────────────────────────────────────────────────
-- TOR 4.9.1(2)(3) — กลุ่มผู้ใช้งานและสิทธิ์รายกลุ่ม
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

alter table public.user_groups enable row level security;

drop policy if exists "anon read user_groups"  on public.user_groups;
create policy "anon read user_groups"
  on public.user_groups for select to anon using (true);

drop policy if exists "anon write user_groups" on public.user_groups;
create policy "anon write user_groups"
  on public.user_groups for all to anon using (true) with check (true);

-- seed default groups
insert into public.user_groups (id, name, permissions) values
  ('g1', 'ผู้ดูแลระบบ',
   '{"lost_report":true,"found_report":true,"search_match":true,"property_management":true,"reports":true,"admin":true}'),
  ('g2', 'เจ้าหน้าที่',
   '{"lost_report":true,"found_report":true,"search_match":true,"property_management":true,"reports":true,"admin":false}'),
  ('g3', 'ผู้ชม',
   '{"lost_report":false,"found_report":false,"search_match":true,"property_management":true,"reports":true,"admin":false}')
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- เพิ่ม index บน users.group_id (ถ้ายังไม่มี)
-- ─────────────────────────────────────────────────────────────
create index if not exists users_group_id_idx on public.users (group_id);
