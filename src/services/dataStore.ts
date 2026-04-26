import type { AuditLog, Area, FoundReport, LostReport, PermissionMap, PropertyCategory, StorageLocation, SystemSettings, User, UserGroup } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

// ── row types ──────────────────────────────────────────────────────────────

type LostReportRow = {
  id: string;
  tracking_no: string;
  status: LostReport['status'];
  matched_found_id: string | null;
  payload: LostReport;
  created_at: string;
};

type FoundReportRow = {
  id: string;
  found_code: string;
  rfid_tag: string;
  status: FoundReport['status'];
  matched_lost_id: string | null;
  payload: FoundReport;
  created_at: string;
};

type AuditLogRow = {
  id: string;
  action: string;
  module: string;
  payload: AuditLog;
  created_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
  name_en: string;
  retention_days: number;
  icon: string;
};

type AreaRow = {
  id: string;
  name: string;
  floor: string;
  zone: string;
};

type StorageLocationRow = {
  id: string;
  name: string;
  capacity: number;
};

type SystemSettingsRow = {
  id: string;
  session_timeout_minutes: number;
  organization_name: string;
  logo_url: string;
};

type UserRow = {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: User['role'];
  group_id: string | null;
  permissions: PermissionMap;
  is_active: boolean;
  created_at: string;
};

// ── helpers ────────────────────────────────────────────────────────────────

export const canUseRemoteDataStore = isSupabaseConfigured && Boolean(supabase);

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

const toLostReport = (row: LostReportRow): LostReport => ({
  ...row.payload,
  id: row.id,
  trackingNo: row.tracking_no || row.payload.trackingNo,
  status: row.status || row.payload.status,
  matchedFoundId: row.matched_found_id ?? row.payload.matchedFoundId,
  createdAt: row.created_at || row.payload.createdAt,
});

const toFoundReport = (row: FoundReportRow): FoundReport => ({
  ...row.payload,
  id: row.id,
  foundCode: row.found_code || row.payload.foundCode,
  rfidTag: row.rfid_tag || row.payload.rfidTag,
  status: row.status || row.payload.status,
  matchedLostId: row.matched_lost_id ?? row.payload.matchedLostId,
  createdAt: row.created_at || row.payload.createdAt,
});

const toAuditLog = (row: AuditLogRow): AuditLog => ({
  ...row.payload,
  id: row.id,
  action: row.action || row.payload.action,
  module: row.module || row.payload.module,
  timestamp: row.created_at || row.payload.timestamp,
});

const toUser = (row: UserRow): User & { password: string } => ({
  id: row.id,
  username: row.username,
  password: row.password_hash,
  fullName: row.full_name,
  role: row.role,
  groupId: row.group_id ?? '',
  permissions: row.permissions,
  isActive: row.is_active,
  createdAt: row.created_at,
});

const toCategory = (row: CategoryRow): PropertyCategory => ({
  id: row.id,
  name: row.name,
  nameEn: row.name_en,
  retentionDays: row.retention_days,
  icon: row.icon,
});

const toArea = (row: AreaRow): Area => ({
  id: row.id,
  name: row.name,
  floor: row.floor,
  zone: row.zone,
});

const toStorageLocation = (row: StorageLocationRow): StorageLocation => ({
  id: row.id,
  name: row.name,
  capacity: row.capacity,
});

const toSystemSettings = (row: SystemSettingsRow): Partial<SystemSettings> => ({
  sessionTimeoutMinutes: row.session_timeout_minutes,
  organizationName: row.organization_name,
  logoUrl: row.logo_url,
});

// ── load all remote state ──────────────────────────────────────────────────

export async function loadRemoteAppState() {
  if (!canUseRemoteDataStore) return null;

  const client = requireSupabase();
  const [lostResult, foundResult, auditResult, catResult, areaResult, storageResult] = await Promise.all([
    client.from('lost_reports').select('*').order('created_at', { ascending: false }),
    client.from('found_reports').select('*').order('created_at', { ascending: false }),
    client.from('audit_logs').select('*').order('created_at', { ascending: false }),
    client.from('property_categories').select('*'),
    client.from('areas').select('*'),
    client.from('storage_locations').select('*'),
  ]);

  if (lostResult.error) throw lostResult.error;
  if (foundResult.error) throw foundResult.error;
  if (auditResult.error) throw auditResult.error;

  return {
    lostReports: ((lostResult.data ?? []) as LostReportRow[]).map(toLostReport),
    foundReports: ((foundResult.data ?? []) as FoundReportRow[]).map(toFoundReport),
    auditLogs: ((auditResult.data ?? []) as AuditLogRow[]).map(toAuditLog),
    categories: catResult.error ? null : ((catResult.data ?? []) as CategoryRow[]).map(toCategory),
    areas: areaResult.error ? null : ((areaResult.data ?? []) as AreaRow[]).map(toArea),
    storageLocations: storageResult.error ? null : ((storageResult.data ?? []) as StorageLocationRow[]).map(toStorageLocation),
  };
}

// ── system settings ────────────────────────────────────────────────────────

export async function loadSystemSettings(): Promise<Partial<SystemSettings> | null> {
  if (!canUseRemoteDataStore) return null;
  const client = requireSupabase();
  const { data, error } = await client.from('system_settings').select('*').eq('id', 'default').single();
  if (error) return null;
  return toSystemSettings(data as SystemSettingsRow);
}

export async function saveSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
  if (!canUseRemoteDataStore) return;
  const client = requireSupabase();
  const { error } = await client.from('system_settings').upsert({
    id: 'default',
    session_timeout_minutes: settings.sessionTimeoutMinutes,
    organization_name: settings.organizationName,
    logo_url: settings.logoUrl,
  });
  if (error) throw error;
}

// ── lost reports ───────────────────────────────────────────────────────────

export async function upsertLostReport(report: LostReport) {
  if (!canUseRemoteDataStore) return;
  const client = requireSupabase();
  const { error } = await client.from('lost_reports').upsert({
    id: report.id,
    tracking_no: report.trackingNo,
    category_id: report.categoryId,
    color: report.color,
    size: report.size,
    qty: report.qty,
    description: report.description,
    photos: report.photos,
    lost_area_id: report.lostAreaId,
    lost_area_note: report.lostAreaNote,
    lost_date_from: report.lostDateFrom || null,
    lost_date_to: report.lostDateTo || null,
    lost_time_from: report.lostTimeFrom,
    lost_time_to: report.lostTimeTo,
    reporter_name: report.reporter.name,
    reporter_nationality: report.reporter.nationality,
    reporter_phone: report.reporter.phone,
    reporter_email: report.reporter.email,
    status: report.status,
    matched_found_id: report.matchedFoundId ?? null,
    created_by: report.createdBy,
    payload: report,
    created_at: report.createdAt,
  });
  if (error) throw error;
}

// ── found reports ──────────────────────────────────────────────────────────

export async function upsertFoundReport(report: FoundReport) {
  if (!canUseRemoteDataStore) return;
  const client = requireSupabase();
  const { error } = await client.from('found_reports').upsert({
    id: report.id,
    found_code: report.foundCode,
    rfid_tag: report.rfidTag,
    category_id: report.categoryId,
    color: report.color,
    size: report.size,
    qty: report.qty,
    description: report.description,
    photos: report.photos,
    found_area_id: report.foundAreaId,
    found_area_note: report.foundAreaNote,
    found_date: report.foundDate || null,
    found_time: report.foundTime,
    finder_name: report.finder.name,
    finder_nationality: report.finder.nationality,
    finder_phone: report.finder.phone,
    finder_email: report.finder.email,
    finder_signature: report.finderSignature ?? null,
    storage_location_id: report.storageLocationId,
    status: report.status,
    expires_at: report.expiresAt || null,
    matched_lost_id: report.matchedLostId ?? null,
    return_appointment: report.returnAppointment ?? null,
    disposal_reason: report.disposalReason ?? null,
    recipient_signature: report.recipientSignature ?? null,
    returned_at: report.returnedAt ?? null,
    created_by: report.createdBy,
    payload: report,
    created_at: report.createdAt,
  });
  if (error) throw error;
}

// ── audit logs ─────────────────────────────────────────────────────────────

export async function insertAuditLog(log: AuditLog) {
  if (!canUseRemoteDataStore) return;
  const client = requireSupabase();
  const { error } = await client.from('audit_logs').upsert({
    id: log.id,
    user_id: log.userId,
    username: log.username,
    action: log.action,
    module: log.module,
    detail: log.detail,
    ip_address: log.ipAddress,
    payload: log,
    created_at: log.timestamp,
  });
  if (error) throw error;
}

// ── property categories ────────────────────────────────────────────────────

export async function upsertCategory(cat: PropertyCategory) {
  if (!canUseRemoteDataStore) return;
  const client = requireSupabase();
  const { error } = await client.from('property_categories').upsert({
    id: cat.id,
    name: cat.name,
    name_en: cat.nameEn,
    retention_days: cat.retentionDays,
    icon: cat.icon,
  });
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  if (!canUseRemoteDataStore) return;
  const client = requireSupabase();
  const { error } = await client.from('property_categories').delete().eq('id', id);
  if (error) throw error;
}

// ── areas ──────────────────────────────────────────────────────────────────

export async function upsertArea(area: Area) {
  if (!canUseRemoteDataStore) return;
  const client = requireSupabase();
  const { error } = await client.from('areas').upsert({
    id: area.id,
    name: area.name,
    floor: area.floor,
    zone: area.zone,
  });
  if (error) throw error;
}

export async function deleteArea(id: string) {
  if (!canUseRemoteDataStore) return;
  const client = requireSupabase();
  const { error } = await client.from('areas').delete().eq('id', id);
  if (error) throw error;
}

// ── storage locations ──────────────────────────────────────────────────────

export async function upsertStorageLocation(loc: StorageLocation) {
  if (!canUseRemoteDataStore) return;
  const client = requireSupabase();
  const { error } = await client.from('storage_locations').upsert({
    id: loc.id,
    name: loc.name,
    capacity: loc.capacity,
  });
  if (error) throw error;
}

// ── users ──────────────────────────────────────────────────────────────────

export async function loadUsers(): Promise<(User & { password: string })[] | null> {
  if (!canUseRemoteDataStore) return null;
  const client = requireSupabase();
  const { data, error } = await client
    .from('users')
    .select('id, username, password_hash, full_name, role, group_id, permissions, is_active, created_at')
    .order('created_at', { ascending: true });
  if (error) return null;
  return ((data ?? []) as UserRow[]).map(toUser);
}

export async function upsertUser(user: User & { password: string }) {
  if (!canUseRemoteDataStore) return;
  const client = requireSupabase();
  const { error } = await client.from('users').upsert({
    id: user.id,
    username: user.username,
    password_hash: user.password,
    full_name: user.fullName,
    role: user.role,
    group_id: user.groupId || null,
    permissions: user.permissions,
    is_active: user.isActive,
    created_at: user.createdAt,
  });
  if (error) throw error;
}

export async function deleteUserRecord(id: string) {
  if (!canUseRemoteDataStore) return;
  const client = requireSupabase();
  const { error } = await client.from('users').delete().eq('id', id);
  if (error) throw error;
}

// ── user groups ────────────────────────────────────────────────────────────

type UserGroupRow = {
  id: string;
  name: string;
  permissions: PermissionMap;
  created_at: string;
};

const toUserGroup = (row: UserGroupRow): UserGroup => ({
  id: row.id,
  name: row.name,
  permissions: row.permissions,
});

export async function loadUserGroups(): Promise<UserGroup[] | null> {
  if (!canUseRemoteDataStore) return null;
  const client = requireSupabase();
  const { data, error } = await client.from('user_groups').select('*').order('created_at', { ascending: true });
  if (error) return null;
  return ((data ?? []) as UserGroupRow[]).map(toUserGroup);
}

export async function upsertUserGroup(group: UserGroup): Promise<void> {
  if (!canUseRemoteDataStore) return;
  const client = requireSupabase();
  const { error } = await client.from('user_groups').upsert({
    id: group.id,
    name: group.name,
    permissions: group.permissions,
  });
  if (error) throw error;
}

export async function deleteUserGroup(id: string): Promise<void> {
  if (!canUseRemoteDataStore) return;
  const client = requireSupabase();
  const { error } = await client.from('user_groups').delete().eq('id', id);
  if (error) throw error;
}

// ── storage locations (delete) ─────────────────────────────────────────────

export async function deleteStorageLocationRecord(id: string): Promise<void> {
  if (!canUseRemoteDataStore) return;
  const client = requireSupabase();
  const { error } = await client.from('storage_locations').delete().eq('id', id);
  if (error) throw error;
}
