import type { FoundReport, LostReport, PropertyCategory, Area } from '../types';
import { buildPublicAppUrl } from './appUrl';

interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}

interface MatchedEmailContext {
  found: FoundReport;
  lost: LostReport;
  category?: PropertyCategory;
  area?: Area;
  appointment?: string;
  claimUrl?: string;
}

interface FoundIntakeEmailContext {
  found: FoundReport;
  category?: PropertyCategory;
  area?: Area;
  storageName?: string;
}

export function buildGmailComposeUrl({ to, subject, body }: EmailDraft) {
  // Use encodeURIComponent (%20 for spaces) — URLSearchParams uses + which Gmail may not decode correctly
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// mailto: เปิด Gmail App / email app ที่ผูก Google account บนเครื่อง (iOS / Android / Desktop)
// RFC 2368 requires percent-encoding (not +) for mailto: body
export function buildMailtoUrl({ to, subject, body }: EmailDraft): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// เปิด Gmail Web ใน tab ใหม่ (desktop-friendly)
export function openGmailCompose(draft: EmailDraft): boolean {
  if (!draft.to.trim()) return false;
  window.open(buildGmailComposeUrl(draft), '_blank', 'noopener,noreferrer');
  return true;
}

// เปิด email app ที่เชื่อมกับ Google account บนเครื่อง (mobile-friendly)
export function openMailtoCompose(draft: EmailDraft): boolean {
  if (!draft.to.trim()) return false;
  const a = document.createElement('a');
  a.href = buildMailtoUrl(draft);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return true;
}

export function buildClaimResponseUrl(foundId: string, lostId: string) {
  return buildPublicAppUrl(`/claim/${encodeURIComponent(foundId)}/${encodeURIComponent(lostId)}`);
}

export function buildLostReporterMatchEmail({ found, lost, category, area, appointment, claimUrl }: MatchedEmailContext): EmailDraft {
  const subject = `พบทรัพย์สินที่อาจเป็นของคุณ - ${lost.trackingNo}`;
  const url = claimUrl ?? buildClaimResponseUrl(found.id, lost.id);
  const body = [
    `เรียนคุณ ${lost.reporter.name}`,
    '',
    `ระบบ Lost & Found พบทรัพย์สินที่ตรงกับรายการแจ้งสูญหายของคุณ`,
    '',
    `หมายเลขแจ้งสูญหาย: ${lost.trackingNo}`,
    `ผู้แจ้งสูญหาย: ${lost.reporter.name}`,
    `สัญชาติ: ${lost.reporter.nationality || '-'}`,
    `รหัสทรัพย์สินที่พบ: ${found.foundCode}`,
    `ประเภท: ${category?.name ?? found.categoryId}`,
    `รายละเอียด: ${found.description}`,
    `สถานที่พบ: ${area?.name ?? found.foundAreaId}`,
    appointment ? `วัน/เวลานัดคืน: ${appointment}` : 'วัน/เวลานัดคืน: กรุณารอเจ้าหน้าที่นัดหมาย',
    '',
    '------------------------------------------------------------',
    'กรุณาคลิกลิงก์ด้านล่างเพื่อดูข้อมูลและยืนยันนัดรับทรัพย์สิน:',
    '',
    url,
    '',
    '(หากลิงก์ไม่สามารถคลิกได้ กรุณาคัดลอกลิงก์ข้างต้นไปวางในเบราว์เซอร์)',
    '------------------------------------------------------------',
    '',
    'ขอบคุณ',
    'ClickNext Innovation Lost & Found',
  ].join('\n');

  return { to: lost.reporter.email, subject, body };
}

export function buildFoundIntakeReceiptEmail({ found, category, area, storageName }: FoundIntakeEmailContext): EmailDraft {
  const subject = `แบบฟอร์มนำส่งทรัพย์สินหลงลืม - ${found.foundCode}`;
  const body = [
    `เรียนคุณ ${found.finder.name}`,
    '',
    'ระบบ Lost & Found ได้บันทึกข้อมูลทรัพย์สินหลงลืมที่คุณนำส่งเรียบร้อยแล้ว',
    '',
    `รหัสทรัพย์สิน: ${found.foundCode}`,
    `RFID Tag: ${found.rfidTag}`,
    `ประเภท: ${category?.name ?? found.categoryId}`,
    `รายละเอียด: ${found.description}`,
    `สี/ขนาด/จำนวน: ${found.color} / ${found.size} / ${found.qty} ชิ้น`,
    `วันที่และเวลาที่พบ: ${found.foundDate} ${found.foundTime}`,
    `บริเวณที่พบ: ${area?.name ?? found.foundAreaId}`,
    found.foundAreaNote ? `รายละเอียดบริเวณ: ${found.foundAreaNote}` : '',
    `สถานที่จัดเก็บ: ${storageName ?? found.storageLocationId ?? '-'}`,
    `วันหมดอายุการจัดเก็บ: ${found.expiresAt}`,
    '',
    'ข้อมูลผู้นำส่ง',
    `ชื่อ-นามสกุล: ${found.finder.name}`,
    `สัญชาติ: ${found.finder.nationality}`,
    `โทรศัพท์: ${found.finder.phone}`,
    `อีเมล: ${found.finder.email}`,
    '',
    'แบบฟอร์มนี้ใช้เป็นหลักฐานการนำส่งทรัพย์สินหลงลืมให้เจ้าหน้าที่ Lost & Found',
    '',
    'ขอบคุณ',
    'ClickNext Innovation Lost & Found',
  ].filter(Boolean).join('\n');

  return { to: found.finder.email, subject, body };
}
