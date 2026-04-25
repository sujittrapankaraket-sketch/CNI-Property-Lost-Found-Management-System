import type { AuditLog, FoundReport, LostReport } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

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

export const canUseRemoteDataStore = isSupabaseConfigured && Boolean(supabase);

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

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

export async function loadRemoteAppState() {
  if (!canUseRemoteDataStore) return null;

  const client = requireSupabase();
  const [lostResult, foundResult, auditResult] = await Promise.all([
    client.from('lost_reports').select('*').order('created_at', { ascending: false }),
    client.from('found_reports').select('*').order('created_at', { ascending: false }),
    client.from('audit_logs').select('*').order('created_at', { ascending: false }),
  ]);

  if (lostResult.error) throw lostResult.error;
  if (foundResult.error) throw foundResult.error;
  if (auditResult.error) throw auditResult.error;

  return {
    lostReports: ((lostResult.data ?? []) as LostReportRow[]).map(toLostReport),
    foundReports: ((foundResult.data ?? []) as FoundReportRow[]).map(toFoundReport),
    auditLogs: ((auditResult.data ?? []) as AuditLogRow[]).map(toAuditLog),
  };
}

export async function upsertLostReport(report: LostReport) {
  if (!canUseRemoteDataStore) return;

  const client = requireSupabase();
  const { error } = await client.from('lost_reports').upsert({
    id: report.id,
    tracking_no: report.trackingNo,
    status: report.status,
    matched_found_id: report.matchedFoundId ?? null,
    payload: report,
    created_at: report.createdAt,
  });

  if (error) throw error;
}

export async function upsertFoundReport(report: FoundReport) {
  if (!canUseRemoteDataStore) return;

  const client = requireSupabase();
  const { error } = await client.from('found_reports').upsert({
    id: report.id,
    found_code: report.foundCode,
    rfid_tag: report.rfidTag,
    status: report.status,
    matched_lost_id: report.matchedLostId ?? null,
    payload: report,
    created_at: report.createdAt,
  });

  if (error) throw error;
}

export async function insertAuditLog(log: AuditLog) {
  if (!canUseRemoteDataStore) return;

  const client = requireSupabase();
  const { error } = await client.from('audit_logs').upsert({
    id: log.id,
    action: log.action,
    module: log.module,
    payload: log,
    created_at: log.timestamp,
  });

  if (error) throw error;
}
