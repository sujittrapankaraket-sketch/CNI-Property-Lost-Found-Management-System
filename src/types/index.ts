export type PropertyStatus = 'stored' | 'matched' | 'returned' | 'expired' | 'pending_return' | 'rejected_return' | 'disposal_requested';

export type UserRole = 'admin' | 'staff' | 'viewer';

export interface Person {
  name: string;
  nationality: string;
  phone: string;
  email: string; // Required field
}

export interface LostReport {
  id: string;
  trackingNo: string;
  categoryId: string;
  color: string;
  size: string;
  qty: number;
  description: string;
  photos: string[];
  lostAreaId: string;
  lostAreaNote: string;
  lostDateFrom: string;
  lostDateTo: string;
  lostTimeFrom: string;
  lostTimeTo: string;
  reporter: Person;
  status: 'open' | 'matched' | 'closed';
  matchedFoundId?: string;
  createdAt: string;
  createdBy: string;
}

export interface FoundReport {
  id: string;
  foundCode: string;
  rfidTag: string;
  categoryId: string;
  color: string;
  size: string;
  qty: number;
  description: string;
  photos: string[];
  foundAreaId: string;
  foundAreaNote: string;
  foundDate: string;
  foundTime: string;
  finder: Person;
  finderSignature?: string;
  storageLocationId: string;
  status: PropertyStatus;
  expiresAt: string;
  matchedLostId?: string;
  returnAppointment?: string;
  disposalReason?: string;
  recipientSignature?: string;
  returnedAt?: string;
  createdAt: string;
  createdBy: string;
}

export interface PropertyCategory {
  id: string;
  name: string;
  nameEn: string;
  retentionDays: number;
  icon: string;
}

export interface Area {
  id: string;
  name: string;
  floor: string;
  zone: string;
}

export interface StorageLocation {
  id: string;
  name: string;
  capacity: number;
}

export interface MasterData {
  categories: PropertyCategory[];
  areas: Area[];
  storageLocations: StorageLocation[];
}

export interface PermissionMap {
  lost_report: boolean;
  found_report: boolean;
  search_match: boolean;
  property_management: boolean;
  reports: boolean;
  admin: boolean;
}

export interface UserGroup {
  id: string;
  name: string;
  permissions: PermissionMap;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  groupId: string;
  permissions: PermissionMap;
  isActive: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  module: string;
  detail: string;
  timestamp: string;
  ipAddress: string;
}

export interface SystemSettings {
  sessionTimeoutMinutes: number;
  organizationName: string;
  logoUrl: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export type RFIDConnectionType = 'keyboard' | 'usb_serial' | 'tcp_ip' | 'bluetooth';

export interface RFIDReaderConfig {
  id: string;
  name: string;           // ชื่อเครื่องอ่าน
  areaId: string;         // บริเวณที่ติดตั้ง
  connectionType: RFIDConnectionType;
  // USB Serial
  serialPort?: string;    // COM3, /dev/ttyUSB0
  baudRate?: number;      // 9600, 115200
  // TCP/IP
  ipAddress?: string;
  tcpPort?: number;
  // Bluetooth
  bluetoothName?: string;
  // Tag format
  tagPrefix?: string;     // prefix to strip from raw scan
  tagSuffix?: string;     // suffix to strip from raw scan
  isActive: boolean;
  note?: string;
  createdAt: string;
}
