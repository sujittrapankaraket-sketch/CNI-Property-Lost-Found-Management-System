import React, { createContext, useContext, useEffect, useState } from 'react';
import { addDays, format } from 'date-fns';
import type {
  LostReport, FoundReport, MasterData, PropertyCategory, Area,
  StorageLocation, AuditLog, Toast, RFIDReaderConfig, WorkstationConfig
} from '../types';
import {
  canUseRemoteDataStore,
  deleteArea,
  deleteCategory,
  deleteRFIDReaderRecord,
  deleteStorageLocationRecord,
  deleteWorkstationRecord,
  insertAuditLog,
  loadRemoteAppState,
  upsertArea,
  upsertCategory,
  upsertFoundReport,
  upsertLostReport,
  upsertRFIDReader,
  upsertStorageLocation,
  upsertWorkstation,
} from '../services/dataStore';

const CATEGORIES: PropertyCategory[] = [
  { id: 'c1', name: 'บัตร/เอกสาร', nameEn: 'Card/Document', retentionDays: 365, icon: '🪪' },
  { id: 'c2', name: 'พวงกุญแจ', nameEn: 'Keys', retentionDays: 365, icon: '🔑' },
  { id: 'c3', name: 'กระเป๋า', nameEn: 'Bag', retentionDays: 365, icon: '👜' },
  { id: 'c4', name: 'อุปกรณ์อิเล็กทรอนิกส์', nameEn: 'Electronics', retentionDays: 365, icon: '📱' },
  { id: 'c5', name: 'อาหาร/เครื่องดื่ม', nameEn: 'Food/Beverage', retentionDays: 1, icon: '🍱' },
  { id: 'c6', name: 'เสื้อผ้า/แฟชั่น', nameEn: 'Clothing', retentionDays: 365, icon: '👔' },
  { id: 'c7', name: 'เครื่องประดับ', nameEn: 'Jewelry', retentionDays: 365, icon: '💍' },
  { id: 'c8', name: 'อื่นๆ', nameEn: 'Others', retentionDays: 365, icon: '📦' },
];

const AREAS: Area[] = [
  { id: 'a1', name: 'ชั้น 1 - ประตูทางเข้าหลัก', floor: '1', zone: 'A' },
  { id: 'a2', name: 'ชั้น 1 - ลานกิจกรรม', floor: '1', zone: 'B' },
  { id: 'a3', name: 'ชั้น 2 - ห้องน้ำ', floor: '2', zone: 'A' },
  { id: 'a4', name: 'ชั้น 2 - ร้านอาหาร', floor: '2', zone: 'B' },
  { id: 'a5', name: 'ชั้น 3 - Cinema', floor: '3', zone: 'A' },
  { id: 'a6', name: 'ชั้น B1 - ที่จอดรถ', floor: 'B1', zone: 'A' },
  { id: 'a7', name: 'ชั้น B2 - ที่จอดรถ', floor: 'B2', zone: 'A' },
  { id: 'a8', name: 'ชั้น 4 - Zone Kids', floor: '4', zone: 'B' },
];

const STORAGE_LOCATIONS: StorageLocation[] = [
  { id: 'sl1', name: 'ตู้ A-01', capacity: 20 },
  { id: 'sl2', name: 'ตู้ A-02', capacity: 20 },
  { id: 'sl3', name: 'ตู้ B-01', capacity: 15 },
  { id: 'sl4', name: 'ห้องเก็บของชั้น 1', capacity: 100 },
  { id: 'sl5', name: 'ตู้เย็น (อาหาร)', capacity: 30 },
];

const today = new Date();
const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

const MOCK_LOST: LostReport[] = [
  {
    id: 'l1', trackingNo: 'LST-20260420-0001', categoryId: 'c4', color: 'สีดำ', size: 'กลาง',
    qty: 1, description: 'iPhone 15 Pro สีดำ มีเคสใส', photos: [],
    lostAreaId: 'a1', lostAreaNote: 'บริเวณประตูหมุน',
    lostDateFrom: '2026-04-20', lostDateTo: '2026-04-20',
    lostTimeFrom: '14:00', lostTimeTo: '16:00',
    reporter: { name: 'สมชาย มีทรัพย์', nationality: 'ไทย', phone: '081-234-5678', email: 'somchai@email.com' },
    status: 'open', createdAt: '2026-04-20T16:30:00', createdBy: 'staff01',
  },
  {
    id: 'l2', trackingNo: 'LST-20260421-0001', categoryId: 'c3', color: 'สีน้ำตาล', size: 'เล็ก',
    qty: 1, description: 'กระเป๋าสตางค์หนังสีน้ำตาล มีบัตรประชาชน', photos: [],
    lostAreaId: 'a4', lostAreaNote: 'โซนร้านอาหาร ชั้น 2',
    lostDateFrom: '2026-04-21', lostDateTo: '2026-04-21',
    lostTimeFrom: '12:00', lostTimeTo: '13:30',
    reporter: { name: 'วิภา รักสวย', nationality: 'ไทย', phone: '089-876-5432', email: 'wipa@email.com' },
    status: 'matched', matchedFoundId: 'f2', createdAt: '2026-04-21T14:00:00', createdBy: 'staff01',
  },
  {
    id: 'l3', trackingNo: 'LST-20260422-0001', categoryId: 'c1', color: '-', size: '-',
    qty: 2, description: 'บัตรเดบิต SCB และบัตรประชาชน', photos: [],
    lostAreaId: 'a5', lostAreaNote: 'ลิฟท์ใกล้โรงหนัง',
    lostDateFrom: '2026-04-22', lostDateTo: '2026-04-22',
    lostTimeFrom: '19:00', lostTimeTo: '21:00',
    reporter: { name: 'พิชัย ดีใจ', nationality: 'ไทย', phone: '062-111-2233', email: '' },
    status: 'open', createdAt: '2026-04-22T21:30:00', createdBy: 'staff01',
  },
  {
    id: 'l4', trackingNo: 'LST-20260424-0001', categoryId: 'c2', color: 'สีเงิน', size: '-',
    qty: 1, description: 'พวงกุญแจรถ Toyota มีพวงกุญแจรูปหมี', photos: [],
    lostAreaId: 'a6', lostAreaNote: 'ที่จอดรถชั้น B1 โซน A',
    lostDateFrom: '2026-04-24', lostDateTo: '2026-04-25',
    lostTimeFrom: '09:00', lostTimeTo: '18:00',
    reporter: { name: 'กานต์ สุขใจ', nationality: 'ไทย', phone: '095-333-4444', email: 'kant@email.com' },
    status: 'open', createdAt: '2026-04-25T10:00:00', createdBy: 'staff01',
  },
];

const MOCK_FOUND: FoundReport[] = [
  {
    id: 'f1', foundCode: 'FND-20260420-0001', rfidTag: 'RFID-A001', categoryId: 'c4',
    color: 'สีดำ', size: 'กลาง', qty: 1, description: 'Samsung Galaxy S24 สีดำ ไม่มีเคส',
    photos: [], foundAreaId: 'a2', foundAreaNote: 'ใต้เก้าอี้ลานกิจกรรม',
    foundDate: '2026-04-20', foundTime: '15:30',
    finder: { name: 'พนักงานรักษาความปลอดภัย', nationality: 'ไทย', phone: '02-123-4567', email: 'security@cni.example' },
    storageLocationId: 'sl1', status: 'stored',
    expiresAt: fmt(addDays(today, 300)), createdAt: '2026-04-20T15:45:00', createdBy: 'staff01',
  },
  {
    id: 'f2', foundCode: 'FND-20260421-0001', rfidTag: 'RFID-A002', categoryId: 'c3',
    color: 'สีน้ำตาล', size: 'เล็ก', qty: 1, description: 'กระเป๋าสตางค์หนังมีบัตรหลายใบ',
    photos: [], foundAreaId: 'a4', foundAreaNote: 'โต๊ะร้านอาหาร ชั้น 2 ร้าน A',
    foundDate: '2026-04-21', foundTime: '13:00',
    finder: { name: 'แม่บ้านห้าง', nationality: 'ไทย', phone: '02-123-4567', email: 'housekeeping@cni.example' },
    storageLocationId: 'sl1', status: 'matched', matchedLostId: 'l2',
    returnAppointment: '2026-04-28',
    expiresAt: fmt(addDays(today, 299)), createdAt: '2026-04-21T13:30:00', createdBy: 'staff01',
  },
  {
    id: 'f3', foundCode: 'FND-20260423-0001', rfidTag: 'RFID-A003', categoryId: 'c5',
    color: '-', size: 'กลาง', qty: 1, description: 'กล่องข้าวกุ้งทอด',
    photos: [], foundAreaId: 'a4', foundAreaNote: 'โต๊ะร้านอาหารชั้น 2',
    foundDate: '2026-04-23', foundTime: '12:45',
    finder: { name: 'พนักงานร้านอาหาร', nationality: 'ไทย', phone: '', email: 'restaurant@cni.example' },
    storageLocationId: 'sl5', status: 'expired',
    expiresAt: '2026-04-24', createdAt: '2026-04-23T13:00:00', createdBy: 'staff01',
  },
  {
    id: 'f4', foundCode: 'FND-20260425-0001', rfidTag: 'RFID-A004', categoryId: 'c2',
    color: 'สีเงิน', size: '-', qty: 1, description: 'พวงกุญแจรถ มีพวงกุญแจหมีสีน้ำตาล',
    photos: [], foundAreaId: 'a6', foundAreaNote: 'พบในที่จอดรถ B1',
    foundDate: '2026-04-25', foundTime: '10:30',
    finder: { name: 'เจ้าหน้าที่รักษาความปลอดภัย', nationality: 'ไทย', phone: '02-123-4567', email: 'guard@cni.example' },
    storageLocationId: 'sl2', status: 'stored',
    expiresAt: fmt(addDays(today, 364)), createdAt: '2026-04-25T10:45:00', createdBy: 'staff01',
  },
];

const MOCK_AUDIT: AuditLog[] = [
  { id: 'au1', userId: 'u2', username: 'staff01', action: 'CREATE', module: 'Lost Report', detail: 'สร้างรายการแจ้งทรัพย์สินสูญหาย LST-20260420-0001', timestamp: '2026-04-20T16:30:00', ipAddress: '192.168.1.100' },
  { id: 'au2', userId: 'u2', username: 'staff01', action: 'CREATE', module: 'Found Report', detail: 'บันทึกทรัพย์สินหลงลืม FND-20260421-0001', timestamp: '2026-04-21T13:30:00', ipAddress: '192.168.1.100' },
  { id: 'au3', userId: 'u1', username: 'admin', action: 'MATCH', module: 'Search & Match', detail: 'จับคู่ FND-20260421-0001 กับ LST-20260421-0001', timestamp: '2026-04-21T15:00:00', ipAddress: '192.168.1.1' },
  { id: 'au4', userId: 'u1', username: 'admin', action: 'LOGIN', module: 'Auth', detail: 'เข้าสู่ระบบสำเร็จ', timestamp: '2026-04-26T08:00:00', ipAddress: '192.168.1.1' },
];

const STORAGE_KEYS = {
  lostReports: 'cni_lost_reports',
  foundReports: 'cni_found_reports',
  auditLogs: 'cni_audit_logs',
};

function readStoredState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredState(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota / private browsing — skip cache */ }
}

function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem('cni_device_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('cni_device_id', id);
    }
    return id;
  } catch {
    return 'unknown-device';
  }
}

const DEVICE_ID = getOrCreateDeviceId();

interface DataContextType {
  lostReports: LostReport[];
  foundReports: FoundReport[];
  masterData: MasterData;
  auditLogs: AuditLog[];
  toasts: Toast[];
  remoteLoaded: boolean;
  rfidReaders: RFIDReaderConfig[];
  activeReaderId: string;
  workstations: WorkstationConfig[];
  deviceId: string;
  addLostReport: (r: Omit<LostReport, 'id' | 'trackingNo' | 'createdAt'>) => LostReport;
  addFoundReport: (r: Omit<FoundReport, 'id' | 'foundCode' | 'createdAt'>) => { report: FoundReport; matches: LostReport[] };
  updateLostReport: (id: string, updates: Partial<LostReport>) => void;
  updateFoundReport: (id: string, updates: Partial<FoundReport>) => void;
  matchReports: (foundId: string, lostId: string) => void;
  addCategory: (c: PropertyCategory) => void;
  updateCategory: (c: PropertyCategory) => void;
  deleteCategory: (id: string) => void;
  addArea: (a: Area) => void;
  updateArea: (a: Area) => void;
  deleteArea: (id: string) => void;
  addStorageLocation: (s: StorageLocation) => void;
  updateStorageLocation: (s: StorageLocation) => void;
  deleteStorageLocation: (id: string) => void;
  addRFIDReader: (r: RFIDReaderConfig) => void;
  updateRFIDReader: (r: RFIDReaderConfig) => void;
  deleteRFIDReader: (id: string) => void;
  setActiveReader: (id: string) => void;
  updateWorkstation: (w: WorkstationConfig) => void;
  deleteWorkstation: (id: string) => void;
  addToast: (t: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  addAuditLog: (log: Omit<AuditLog, 'id'>) => void;
}

const DataContext = createContext<DataContextType | null>(null);

let lostCounter = 1;
let foundCounter = 1;

function genLostNo() {
  const d = format(new Date(), 'yyyyMMdd');
  return `LST-${d}-${String(lostCounter++).padStart(4, '0')}`;
}

function genFoundCode() {
  const d = format(new Date(), 'yyyyMMdd');
  return `FND-${d}-${String(foundCounter++).padStart(4, '0')}`;
}

function initCounters(lost: LostReport[], found: FoundReport[]) {
  const today = format(new Date(), 'yyyyMMdd');
  const todayLost = lost.filter(r => r.trackingNo?.includes(today));
  const todayFound = found.filter(r => r.foundCode?.includes(today));
  if (todayLost.length >= lostCounter) lostCounter = todayLost.length + 1;
  if (todayFound.length >= foundCounter) foundCounter = todayFound.length + 1;
}

function findMatches(newFound: FoundReport, lostList: LostReport[]): LostReport[] {
  return lostList.filter(l =>
    l.status === 'open' &&
    (l.categoryId === newFound.categoryId ||
      l.color.toLowerCase() === newFound.color.toLowerCase() ||
      l.lostAreaId === newFound.foundAreaId)
  );
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  // เมื่อ Supabase configured → เริ่มด้วย [] แล้วโหลดจาก remote เป็น source of truth
  // เมื่อไม่มี Supabase → ใช้ localStorage / MOCK data ตามปกติ
  const [lostReports, setLostReports] = useState<LostReport[]>(() =>
    canUseRemoteDataStore ? [] : readStoredState(STORAGE_KEYS.lostReports, MOCK_LOST)
  );
  const [foundReports, setFoundReports] = useState<FoundReport[]>(() =>
    canUseRemoteDataStore ? [] : readStoredState(STORAGE_KEYS.foundReports, MOCK_FOUND)
  );
  const [categories, setCategories] = useState<PropertyCategory[]>(CATEGORIES);
  const [areas, setAreas] = useState<Area[]>(AREAS);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>(STORAGE_LOCATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    canUseRemoteDataStore ? [] : readStoredState(STORAGE_KEYS.auditLogs, MOCK_AUDIT)
  );
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [rfidReaders, setRfidReaders] = useState<RFIDReaderConfig[]>(() =>
    readStoredState('cni_rfid_readers', [] as RFIDReaderConfig[])
  );
  const [workstations, setWorkstations] = useState<WorkstationConfig[]>(() =>
    readStoredState('cni_workstations', [] as WorkstationConfig[])
  );
  const activeReaderId = workstations.find(w => w.id === DEVICE_ID)?.readerId ?? '';
  // remoteLoaded: false = กำลังโหลดจาก Supabase, true = พร้อมใช้งาน
  const [remoteLoaded, setRemoteLoaded] = useState(!canUseRemoteDataStore);

  useEffect(() => {
    if (!canUseRemoteDataStore) return;

    let cancelled = false;
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase load timeout')), 10000)
    );
    Promise.race([loadRemoteAppState(), timeout])
      .then(state => {
        if (cancelled) return;
        if (!state) {
          // Supabase configured แต่ return null → ใช้ localStorage แทน
          setLostReports(readStoredState(STORAGE_KEYS.lostReports, MOCK_LOST));
          setFoundReports(readStoredState(STORAGE_KEYS.foundReports, MOCK_FOUND));
          setAuditLogs(readStoredState(STORAGE_KEYS.auditLogs, MOCK_AUDIT));
          setRemoteLoaded(true);
          return;
        }
        setLostReports(state.lostReports);
        setFoundReports(state.foundReports);
        setAuditLogs(state.auditLogs);
        if (state.categories?.length) setCategories(state.categories);
        if (state.areas?.length) setAreas(state.areas);
        if (state.storageLocations?.length) setStorageLocations(state.storageLocations);
        initCounters(state.lostReports, state.foundReports);
        if (!cancelled) setRemoteLoaded(true);
      })
      .catch(error => {
        console.error('Failed to load Supabase state', error);
        if (!cancelled) {
          // Fallback to localStorage / MOCK
          setLostReports(readStoredState(STORAGE_KEYS.lostReports, MOCK_LOST));
          setFoundReports(readStoredState(STORAGE_KEYS.foundReports, MOCK_FOUND));
          setAuditLogs(readStoredState(STORAGE_KEYS.auditLogs, MOCK_AUDIT));
          setRemoteLoaded(true);
          // toast จะ call ผ่าน setToasts โดยตรงเพราะ addToast ยังไม่ stable ตรงนี้
          const id = Date.now().toString();
          setToasts(prev => [...prev, {
            id,
            type: 'error',
            title: 'เชื่อมต่อ Supabase ไม่สำเร็จ',
            message: 'ข้อมูลอาจไม่ sync — ตรวจสอบ SUPABASE_URL / KEY',
          }]);
          setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // localStorage เป็น cache สำหรับ offline / local-only mode
  // เมื่อใช้ Supabase ก็ยังเขียน localStorage ไว้เป็น fast-cache ระหว่าง reload
  useEffect(() => {
    if (remoteLoaded) writeStoredState(STORAGE_KEYS.lostReports, lostReports);
  }, [lostReports, remoteLoaded]);

  useEffect(() => {
    if (remoteLoaded) writeStoredState(STORAGE_KEYS.foundReports, foundReports);
  }, [foundReports, remoteLoaded]);

  useEffect(() => {
    if (remoteLoaded) writeStoredState(STORAGE_KEYS.auditLogs, auditLogs);
  }, [auditLogs, remoteLoaded]);

  // RFID reader configs and workstations are device-local (localStorage only)
  useEffect(() => { writeStoredState('cni_rfid_readers', rfidReaders); }, [rfidReaders]);
  useEffect(() => { writeStoredState('cni_workstations', workstations); }, [workstations]);

  // Auto-register this device as a workstation on first load, update lastSeen thereafter
  useEffect(() => {
    const now = new Date().toISOString();
    setWorkstations(prev => {
      const existing = prev.find(w => w.id === DEVICE_ID);
      let next: WorkstationConfig[];
      if (existing) {
        next = prev.map(w => w.id === DEVICE_ID ? { ...w, lastSeen: now } : w);
      } else {
        next = [...prev, { id: DEVICE_ID, name: `สถานี ${prev.length + 1}`, readerId: '', lastSeen: now, createdAt: now }];
      }
      const updated = next.find(w => w.id === DEVICE_ID)!;
      void upsertWorkstation(updated).catch(() => {/* non-critical */});
      return next;
    });
  }, []);

  const addRFIDReader = (r: RFIDReaderConfig) => {
    setRfidReaders(prev => [...prev, r]);
    void upsertRFIDReader(r).catch(err => console.error('Failed to sync rfid reader', err));
  };
  const updateRFIDReader = (r: RFIDReaderConfig) => {
    setRfidReaders(prev => prev.map(x => x.id === r.id ? r : x));
    void upsertRFIDReader(r).catch(err => console.error('Failed to sync rfid reader', err));
  };
  const deleteRFIDReader = (id: string) => {
    setRfidReaders(prev => prev.filter(x => x.id !== id));
    setWorkstations(prev => prev.map(w => w.readerId === id ? { ...w, readerId: '' } : w));
    void deleteRFIDReaderRecord(id).catch(err => console.error('Failed to delete rfid reader', err));
  };
  const setActiveReader = (id: string) =>
    setWorkstations(prev => prev.map(w => w.id === DEVICE_ID ? { ...w, readerId: id } : w));
  const updateWorkstation = (w: WorkstationConfig) => {
    setWorkstations(prev => prev.map(x => x.id === w.id ? w : x));
    void upsertWorkstation(w).catch(err => console.error('Failed to sync workstation', err));
  };
  const deleteWorkstation = (id: string) => {
    setWorkstations(prev => prev.filter(x => x.id !== id));
    void deleteWorkstationRecord(id).catch(err => console.error('Failed to delete workstation', err));
  };

  const addToast = (t: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(toast => toast.id !== id)), 4000);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const addAuditLog = (log: Omit<AuditLog, 'id'>) => {
    const savedLog = { ...log, id: Date.now().toString() };
    setAuditLogs(prev => [savedLog, ...prev]);
    void insertAuditLog(savedLog).catch(error => {
      console.error('Failed to save audit log to Supabase', error);
    });
  };

  const addLostReport = (r: Omit<LostReport, 'id' | 'trackingNo' | 'createdAt'>) => {
    const report: LostReport = {
      ...r,
      id: Date.now().toString(),
      trackingNo: genLostNo(),
      createdAt: new Date().toISOString(),
    };
    setLostReports(prev => [report, ...prev]);
    void upsertLostReport(report).catch(error => {
      console.error('Failed to save lost report to Supabase', error);
      addToast({ type: 'warning', title: 'บันทึก Supabase ไม่สำเร็จ', message: 'รายการถูกเก็บในเครื่องชั่วคราว' });
    });
    return report;
  };

  const addFoundReport = (r: Omit<FoundReport, 'id' | 'foundCode' | 'createdAt'>) => {
    const cat = categories.find(c => c.id === r.categoryId);
    const report: FoundReport = {
      ...r,
      id: Date.now().toString(),
      foundCode: genFoundCode(),
      createdAt: new Date().toISOString(),
      expiresAt: fmt(addDays(new Date(), cat?.retentionDays ?? 365)),
    };
    setFoundReports(prev => [report, ...prev]);
    void upsertFoundReport(report).catch(error => {
      console.error('Failed to save found report to Supabase', error);
      addToast({ type: 'warning', title: 'บันทึก Supabase ไม่สำเร็จ', message: 'รายการถูกเก็บในเครื่องชั่วคราว' });
    });
    const matches = findMatches(report, lostReports);
    return { report, matches };
  };

  const updateLostReport = (id: string, updates: Partial<LostReport>) => {
    const currentReport = lostReports.find(r => r.id === id);
    const updatedReport = currentReport ? { ...currentReport, ...updates } : undefined;
    setLostReports(prev => prev.map(r => r.id === id && updatedReport ? updatedReport : r));
    if (updatedReport) {
      void upsertLostReport(updatedReport).catch(error => {
        console.error('Failed to update lost report in Supabase', error);
        addToast({ type: 'warning', title: 'อัปเดต Supabase ไม่สำเร็จ', message: 'ระบบยังอัปเดตข้อมูลในเครื่องแล้ว' });
      });
    }
  };

  const updateFoundReport = (id: string, updates: Partial<FoundReport>) => {
    const currentReport = foundReports.find(r => r.id === id);
    const updatedReport = currentReport ? { ...currentReport, ...updates } : undefined;
    setFoundReports(prev => prev.map(r => r.id === id && updatedReport ? updatedReport : r));
    if (updatedReport) {
      void upsertFoundReport(updatedReport).catch(error => {
        console.error('Failed to update found report in Supabase', error);
        addToast({ type: 'warning', title: 'อัปเดต Supabase ไม่สำเร็จ', message: 'ระบบยังอัปเดตข้อมูลในเครื่องแล้ว' });
      });
    }
  };

  const matchReports = (foundId: string, lostId: string) => {
    updateFoundReport(foundId, { status: 'matched', matchedLostId: lostId });
    updateLostReport(lostId, { status: 'matched', matchedFoundId: foundId });
  };

  const addCategory = (c: PropertyCategory) => {
    setCategories(prev => [...prev, c]);
    void upsertCategory(c).catch(err => console.error('Failed to sync category', err));
  };
  const updateCategory = (c: PropertyCategory) => {
    setCategories(prev => prev.map(x => x.id === c.id ? c : x));
    void upsertCategory(c).catch(err => console.error('Failed to sync category', err));
  };
  const deleteCategoryLocal = (id: string) => {
    setCategories(prev => prev.filter(x => x.id !== id));
    void deleteCategory(id).catch(err => console.error('Failed to delete category', err));
  };

  const addArea = (a: Area) => {
    setAreas(prev => [...prev, a]);
    void upsertArea(a).catch(err => console.error('Failed to sync area', err));
  };
  const updateArea = (a: Area) => {
    setAreas(prev => prev.map(x => x.id === a.id ? a : x));
    void upsertArea(a).catch(err => console.error('Failed to sync area', err));
  };
  const deleteAreaLocal = (id: string) => {
    setAreas(prev => prev.filter(x => x.id !== id));
    void deleteArea(id).catch(err => console.error('Failed to delete area', err));
  };

  const addStorageLocation = (s: StorageLocation) => {
    setStorageLocations(prev => [...prev, s]);
    void upsertStorageLocation(s).catch(err => console.error('Failed to sync storage location', err));
  };

  const updateStorageLocation = (s: StorageLocation) => {
    setStorageLocations(prev => prev.map(x => x.id === s.id ? s : x));
    void upsertStorageLocation(s).catch(err => console.error('Failed to sync storage location', err));
  };

  const deleteStorageLoc = (id: string) => {
    setStorageLocations(prev => prev.filter(x => x.id !== id));
    void deleteStorageLocationRecord(id).catch(err => console.error('Failed to delete storage location', err));
  };

  return (
    <DataContext.Provider value={{
      lostReports,
      foundReports,
      masterData: { categories, areas, storageLocations },
      auditLogs,
      toasts,
      remoteLoaded,
      rfidReaders,
      activeReaderId,
      workstations,
      deviceId: DEVICE_ID,
      addLostReport,
      addFoundReport,
      updateLostReport,
      updateFoundReport,
      matchReports,
      addCategory,
      updateCategory,
      deleteCategory: deleteCategoryLocal,
      addArea,
      updateArea,
      deleteArea: deleteAreaLocal,
      addStorageLocation,
      updateStorageLocation,
      deleteStorageLocation: deleteStorageLoc,
      addRFIDReader,
      updateRFIDReader,
      deleteRFIDReader,
      setActiveReader,
      updateWorkstation,
      deleteWorkstation,
      addToast,
      removeToast,
      addAuditLog,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
