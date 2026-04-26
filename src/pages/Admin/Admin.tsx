import { useState } from 'react';
import { Users, Database, ClipboardList, Settings, Plus, Pencil, Trash2, Shield, Clock, UsersRound, Calendar, Wifi, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import PageWrapper from '../../components/layout/PageWrapper';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import type { User, UserGroup, PropertyCategory, Area, StorageLocation, RFIDReaderConfig, RFIDConnectionType } from '../../types';

type Tab = 'users' | 'groups' | 'master' | 'audit' | 'settings' | 'rfid';

const CONN_LABELS: Record<RFIDConnectionType, string> = {
  keyboard: 'Keyboard Emulation (USB HID)',
  usb_serial: 'USB Serial (COM Port)',
  tcp_ip: 'Network TCP/IP',
  bluetooth: 'Bluetooth',
};

const DEFAULT_PERMS = {
  lost_report: true, found_report: true, search_match: true,
  property_management: true, reports: true, admin: false,
};

export default function Admin() {
  const { getUsers, updateUser, addUser, deleteUser, getGroups, addGroup, updateGroup, deleteGroup, settings, updateSettings } = useAuth();
  const { masterData, addCategory, updateCategory, deleteCategory, addArea, updateArea, deleteArea, addStorageLocation, updateStorageLocation, deleteStorageLocation, auditLogs, rfidReaders, activeReaderId, addRFIDReader, updateRFIDReader, deleteRFIDReader, setActiveReader } = useData();
  const [tab, setTab] = useState<Tab>('users');

  // ── user state ────────────────────────────────────────────────────────────
  const [userModal, setUserModal] = useState(false);
  const [editUser, setEditUser]   = useState<User | null>(null);
  const [uForm, setUForm]         = useState({ username: '', fullName: '', password: '', role: 'staff' as User['role'], groupId: 'g2', permissions: DEFAULT_PERMS });

  const users  = getUsers();
  const groups = getGroups();

  const openNewUser = () => {
    setEditUser(null);
    setUForm({ username: '', fullName: '', password: '', role: 'staff', groupId: 'g2', permissions: DEFAULT_PERMS });
    setUserModal(true);
  };
  const openEditUser = (u: User) => {
    setEditUser(u);
    setUForm({ username: u.username, fullName: u.fullName, password: '', role: u.role, groupId: u.groupId || 'g2', permissions: u.permissions });
    setUserModal(true);
  };
  const saveUser = () => {
    if (editUser) {
      updateUser({ ...editUser, ...uForm });
    } else {
      addUser({ id: Date.now().toString(), ...uForm, isActive: true, createdAt: new Date().toISOString().split('T')[0] });
    }
    setUserModal(false);
  };
  const applyGroupPerms = (groupId: string) => {
    const g = groups.find(x => x.id === groupId);
    if (g) setUForm(f => ({ ...f, groupId, permissions: { ...g.permissions } }));
  };

  // ── group state (TOR 4.9.1.2, 4.9.1.3) ───────────────────────────────────
  const [groupModal, setGroupModal] = useState(false);
  const [editGroup, setEditGroup]   = useState<UserGroup | null>(null);
  const [gForm, setGForm]           = useState({ name: '', permissions: DEFAULT_PERMS });

  const openNewGroup  = () => { setEditGroup(null); setGForm({ name: '', permissions: DEFAULT_PERMS }); setGroupModal(true); };
  const openEditGroup = (g: UserGroup) => { setEditGroup(g); setGForm({ name: g.name, permissions: g.permissions }); setGroupModal(true); };
  const saveGroup     = () => {
    const data = { ...gForm, id: editGroup?.id ?? Date.now().toString() };
    editGroup ? updateGroup(data) : addGroup(data);
    setGroupModal(false);
  };

  // ── category state ────────────────────────────────────────────────────────
  const [catModal, setCatModal] = useState(false);
  const [editCat,  setEditCat]  = useState<PropertyCategory | null>(null);
  const [cForm,    setCForm]    = useState({ name: '', nameEn: '', retentionDays: 365, icon: '📦' });

  const openNewCat  = () => { setEditCat(null); setCForm({ name: '', nameEn: '', retentionDays: 365, icon: '📦' }); setCatModal(true); };
  const openEditCat = (c: PropertyCategory) => { setEditCat(c); setCForm({ name: c.name, nameEn: c.nameEn, retentionDays: c.retentionDays, icon: c.icon }); setCatModal(true); };
  const saveCat     = () => {
    const data = { ...cForm, id: editCat?.id ?? Date.now().toString() };
    editCat ? updateCategory(data) : addCategory(data);
    setCatModal(false);
  };

  // ── area state ────────────────────────────────────────────────────────────
  const [areaModal, setAreaModal] = useState(false);
  const [editArea,  setEditArea]  = useState<Area | null>(null);
  const [aForm,     setAForm]     = useState({ name: '', floor: '', zone: '' });

  const openNewArea  = () => { setEditArea(null); setAForm({ name: '', floor: '', zone: '' }); setAreaModal(true); };
  const openEditArea = (a: Area) => { setEditArea(a); setAForm({ name: a.name, floor: a.floor, zone: a.zone }); setAreaModal(true); };
  const saveArea     = () => {
    const data = { ...aForm, id: editArea?.id ?? Date.now().toString() };
    editArea ? updateArea(data) : addArea(data);
    setAreaModal(false);
  };

  // ── storage location state (TOR 4.9.2.4) ─────────────────────────────────
  const [storageModal, setStorageModal] = useState(false);
  const [editStorage,  setEditStorage]  = useState<StorageLocation | null>(null);
  const [slForm,       setSlForm]       = useState({ name: '', capacity: 20 });

  const openNewStorage  = () => { setEditStorage(null); setSlForm({ name: '', capacity: 20 }); setStorageModal(true); };
  const openEditStorage = (s: StorageLocation) => { setEditStorage(s); setSlForm({ name: s.name, capacity: s.capacity }); setStorageModal(true); };
  const saveStorage     = () => {
    const data = { ...slForm, id: editStorage?.id ?? Date.now().toString() };
    editStorage ? updateStorageLocation(data) : addStorageLocation(data);
    setStorageModal(false);
  };

  // ── audit state (TOR 4.9.1.5) ────────────────────────────────────────────
  const [auditSearch,   setAuditSearch]   = useState('');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo,   setAuditDateTo]   = useState('');

  const filteredLogs = auditLogs.filter(l => {
    const q  = auditSearch.toLowerCase();
    const ds = l.timestamp.split('T')[0];
    return (!q || l.username.toLowerCase().includes(q) || l.module.toLowerCase().includes(q) || l.action.toLowerCase().includes(q))
      && (!auditDateFrom || ds >= auditDateFrom)
      && (!auditDateTo   || ds <= auditDateTo);
  });

  // ── settings state ────────────────────────────────────────────────────────
  const [sessionMin, setSessionMin] = useState(settings.sessionTimeoutMinutes);

  // ── RFID reader state ─────────────────────────────────────────────────────
  const [rfidModal, setRfidModal] = useState(false);
  const [editRfid, setEditRfid] = useState<RFIDReaderConfig | null>(null);
  const RFID_DEFAULT = { name: '', areaId: '', connectionType: 'keyboard' as RFIDConnectionType, serialPort: '', baudRate: 9600, ipAddress: '', tcpPort: 8080, bluetoothName: '', tagPrefix: '', tagSuffix: '', isActive: true, note: '' };
  const [rfidForm, setRfidForm] = useState(RFID_DEFAULT);

  const openNewRfid = () => { setEditRfid(null); setRfidForm(RFID_DEFAULT); setRfidModal(true); };
  const openEditRfid = (r: RFIDReaderConfig) => {
    setEditRfid(r);
    setRfidForm({ name: r.name, areaId: r.areaId, connectionType: r.connectionType, serialPort: r.serialPort ?? '', baudRate: r.baudRate ?? 9600, ipAddress: r.ipAddress ?? '', tcpPort: r.tcpPort ?? 8080, bluetoothName: r.bluetoothName ?? '', tagPrefix: r.tagPrefix ?? '', tagSuffix: r.tagSuffix ?? '', isActive: r.isActive, note: r.note ?? '' });
    setRfidModal(true);
  };
  const saveRfid = () => {
    const data: RFIDReaderConfig = { ...editRfid, ...rfidForm, id: editRfid?.id ?? Date.now().toString(), createdAt: editRfid?.createdAt ?? new Date().toISOString() };
    editRfid ? updateRFIDReader(data) : addRFIDReader(data);
    setRfidModal(false);
  };

  // ── shared label maps ─────────────────────────────────────────────────────
  const PERM_LABELS: [keyof typeof DEFAULT_PERMS, string][] = [
    ['lost_report',          'แจ้งสูญหาย'],
    ['found_report',         'บันทึกหลงลืม'],
    ['search_match',         'ค้นหา/จับคู่'],
    ['property_management',  'จัดการทรัพย์สิน'],
    ['reports',              'รายงาน'],
    ['admin',                'ผู้ดูแลระบบ'],
  ];

  const TABS = [
    { key: 'users',    label: 'ผู้ใช้งาน',         icon: Users         },
    { key: 'groups',   label: 'กลุ่มผู้ใช้',        icon: UsersRound    },
    { key: 'master',   label: 'ข้อมูลหลัก',         icon: Database      },
    { key: 'rfid',     label: 'RFID Reader',        icon: Wifi          },
    { key: 'audit',    label: 'ประวัติการใช้งาน',   icon: ClipboardList },
    { key: 'settings', label: 'ตั้งค่าระบบ',        icon: Settings      },
  ] as const;

  return (
    <PageWrapper title="ผู้ดูแลระบบ" subtitle="จัดการผู้ใช้งาน ข้อมูลหลัก และการตั้งค่าระบบ">

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Users Tab ──────────────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={openNewUser} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={15} /> เพิ่มผู้ใช้งาน
            </button>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ชื่อผู้ใช้</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ชื่อ-นามสกุล</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">บทบาท</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">กลุ่ม</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">สิทธิ์</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">สถานะ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{u.username}</td>
                    <td className="px-4 py-3 text-gray-700">{u.fullName}</td>
                    <td className="px-4 py-3">
                      <span className={`status-badge ${u.role === 'admin' ? 'bg-red-50 text-red-700' : u.role === 'staff' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role === 'admin' ? 'Admin' : u.role === 'staff' ? 'Staff' : 'Viewer'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                      {groups.find(g => g.id === u.groupId)?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {PERM_LABELS.filter(([k]) => u.permissions[k]).map(([, label]) => (
                          <span key={label} className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">{label}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`status-badge ${u.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {u.isActive ? 'ใช้งาน' : 'ระงับ'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditUser(u)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Pencil size={13} /></button>
                        <button onClick={() => deleteUser(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Groups Tab (TOR 4.9.1.2, 4.9.1.3) ─────────────────────────────── */}
      {tab === 'groups' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">กำหนดสิทธิ์รายกลุ่ม แล้วกำหนดให้ผู้ใช้แต่ละคนในแท็บ "ผู้ใช้งาน"</p>
            <button onClick={openNewGroup} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={15} /> เพิ่มกลุ่ม
            </button>
          </div>
          <div className="space-y-3">
            {groups.map(g => (
              <div key={g.id} className="card p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={15} className="text-primary" />
                    <span className="font-semibold text-gray-900 text-sm">{g.name}</span>
                    <span className="text-xs text-gray-400">({users.filter(u => u.groupId === g.id).length} คน)</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {PERM_LABELS.map(([key, label]) => (
                      <span key={key} className={`text-[10px] px-2 py-0.5 rounded-full ${
                        g.permissions[key] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 line-through'
                      }`}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEditGroup(g)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Pencil size={13} /></button>
                  <button onClick={() => deleteGroup(g.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Master Data Tab ─────────────────────────────────────────────────── */}
      {tab === 'master' && (
        <div className="space-y-6">
          {/* Categories */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">ประเภทของทรัพย์สิน</h3>
              <button onClick={openNewCat} className="btn-secondary text-sm flex items-center gap-2"><Plus size={14} /> เพิ่ม</button>
            </div>
            <div className="space-y-2">
              {masterData.categories.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{c.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-700">{c.name} <span className="text-gray-400 text-xs">/ {c.nameEn}</span></div>
                      <div className="text-xs text-gray-400">อายุเก็บ: {c.retentionDays === 1 ? '24 ชม.' : `${c.retentionDays} วัน`}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditCat(c)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><Pencil size={13} /></button>
                    <button onClick={() => deleteCategory(c.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Areas */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">บริเวณ/โซน</h3>
              <button onClick={openNewArea} className="btn-secondary text-sm flex items-center gap-2"><Plus size={14} /> เพิ่ม</button>
            </div>
            <div className="space-y-2">
              {masterData.areas.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-700">{a.name}</div>
                    <div className="text-xs text-gray-400">ชั้น {a.floor} · โซน {a.zone}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditArea(a)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><Pencil size={13} /></button>
                    <button onClick={() => deleteArea(a.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Storage Locations (TOR 4.9.2.4) — now with CRUD */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">สถานที่จัดเก็บ</h3>
              <button onClick={openNewStorage} className="btn-secondary text-sm flex items-center gap-2"><Plus size={14} /> เพิ่ม</button>
            </div>
            <div className="space-y-2">
              {masterData.storageLocations.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-700">{s.name}</div>
                    <div className="text-xs text-gray-400">ความจุ: {s.capacity} ชิ้น</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditStorage(s)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><Pencil size={13} /></button>
                    <button onClick={() => deleteStorageLocation(s.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── RFID Reader Config Tab ─────────────────────────────────────────── */}
      {tab === 'rfid' && (
        <div className="space-y-4">
          {/* Device active reader selector */}
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 flex-shrink-0">
              <Wifi size={15} className="text-primary" /> เครื่องอ่าน RFID ของอุปกรณ์นี้:
            </div>
            <select
              value={activeReaderId}
              onChange={e => setActiveReader(e.target.value)}
              className="form-input flex-1 max-w-xs"
            >
              <option value="">— ยังไม่เลือกเครื่องอ่าน —</option>
              {rfidReaders.filter(r => r.isActive).map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {activeReaderId && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle2 size={13} /> เลือกแล้ว
              </span>
            )}
            <p className="text-xs text-gray-400 sm:ml-auto">ค่านี้เก็บเฉพาะอุปกรณ์นี้ ไม่แชร์กับผู้ใช้อื่น</p>
          </div>

          {/* Readers list */}
          <div className="flex justify-end">
            <button onClick={openNewRfid} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={15} /> เพิ่มเครื่องอ่าน RFID
            </button>
          </div>

          {rfidReaders.length === 0 ? (
            <div className="card p-10 text-center text-gray-400 text-sm">ยังไม่มีการตั้งค่าเครื่องอ่าน RFID — กดปุ่มเพิ่มเพื่อเริ่มต้น</div>
          ) : (
            <div className="space-y-3">
              {rfidReaders.map(r => {
                const area = masterData.areas.find(a => a.id === r.areaId);
                const isActive = r.id === activeReaderId;
                return (
                  <div key={r.id} className={`card p-4 flex flex-col sm:flex-row sm:items-start gap-3 ${isActive ? 'border-primary/30 bg-primary/5' : ''}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${r.isActive ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      <Wifi size={16} className={r.isActive ? 'text-emerald-600' : 'text-gray-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{r.name}</span>
                        {isActive && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-medium">อุปกรณ์นี้</span>}
                        <span className={`status-badge text-[10px] ${r.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                        <div>การเชื่อมต่อ: <span className="font-medium text-gray-700">{CONN_LABELS[r.connectionType]}</span></div>
                        {area && <div>ติดตั้งที่: {area.name}</div>}
                        {r.connectionType === 'usb_serial' && r.serialPort && <div>Port: <span className="font-mono">{r.serialPort}</span> · {r.baudRate} bps</div>}
                        {r.connectionType === 'tcp_ip' && r.ipAddress && <div>IP: <span className="font-mono">{r.ipAddress}:{r.tcpPort}</span></div>}
                        {r.connectionType === 'bluetooth' && r.bluetoothName && <div>อุปกรณ์: {r.bluetoothName}</div>}
                        {(r.tagPrefix || r.tagSuffix) && <div>Prefix/Suffix: <span className="font-mono">"{r.tagPrefix}"…"{r.tagSuffix}"</span></div>}
                        {r.note && <div className="text-gray-400 italic">{r.note}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isActive && (
                        <button onClick={() => setActiveReader(r.id)} className="text-xs text-primary font-medium hover:underline px-2 py-1">
                          ใช้อุปกรณ์นี้
                        </button>
                      )}
                      <button onClick={() => openEditRfid(r)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Pencil size={13} /></button>
                      <button onClick={() => deleteRFIDReader(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Audit Log Tab (TOR 4.9.1.5) ────────────────────────────────────── */}
      {tab === 'audit' && (
        <div>
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              value={auditSearch}
              onChange={e => setAuditSearch(e.target.value)}
              className="form-input flex-1 min-w-48"
              placeholder="ค้นหาผู้ใช้, โมดูล, การกระทำ..."
            />
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <input type="date" value={auditDateFrom} onChange={e => setAuditDateFrom(e.target.value)} className="form-input w-auto text-sm" />
              <span className="text-gray-400 text-sm">–</span>
              <input type="date" value={auditDateTo}   onChange={e => setAuditDateTo(e.target.value)}   className="form-input w-auto text-sm" />
              {(auditDateFrom || auditDateTo) && (
                <button onClick={() => { setAuditDateFrom(''); setAuditDateTo(''); }} className="text-xs text-primary hover:underline">ล้าง</button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-3">แสดง {filteredLogs.length} รายการ</p>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">เวลา</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ผู้ใช้</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">การกระทำ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">โมดูล</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">รายละเอียด</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {format(new Date(l.timestamp), 'd MMM yy HH:mm', { locale: th })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{l.username}</td>
                    <td className="px-4 py-3">
                      <span className={`status-badge text-[10px] ${
                        l.action === 'CREATE'  ? 'bg-green-50 text-green-700' :
                        l.action === 'DELETE'  ? 'bg-red-50 text-red-700' :
                        l.action === 'MATCH'   ? 'bg-purple-50 text-purple-700' :
                        l.action === 'RETURN'  ? 'bg-teal-50 text-teal-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>{l.action}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{l.module}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[240px] truncate">{l.detail}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">{l.ipAddress}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">ไม่พบรายการ</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Settings Tab ───────────────────────────────────────────────────── */}
      {tab === 'settings' && (
        <div className="max-w-md space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={16} className="text-primary" /> Session Timeout (TOR 4.9.1.6)
            </h3>
            <div>
              <label className="form-label">ระยะเวลา Timeout (นาที)</label>
              <div className="flex items-center gap-4">
                <input type="range" min={5} max={120} step={5} value={sessionMin}
                  onChange={e => setSessionMin(Number(e.target.value))} className="flex-1 accent-primary" />
                <span className="text-lg font-bold text-gray-900 w-16 text-right">{sessionMin} นาที</span>
              </div>
            </div>
            <button onClick={() => updateSettings({ sessionTimeoutMinutes: sessionMin })}
              className="btn-primary flex items-center gap-2 text-sm">
              <Shield size={14} /> บันทึกการตั้งค่า
            </button>
            <p className="text-xs text-gray-400">ระบบจะออกจากหน้าจออัตโนมัติเมื่อไม่มีการใช้งานเกิน {sessionMin} นาที</p>
          </div>

          <div className="card p-6 space-y-3">
            <h3 className="font-semibold text-gray-900">ข้อมูลองค์กร</h3>
            <div>
              <label className="form-label">ชื่อองค์กร</label>
              <input defaultValue={settings.organizationName || 'ClickNext Innovation'} className="form-input" />
            </div>
          </div>
        </div>
      )}

      {/* ── User Modal ─────────────────────────────────────────────────────── */}
      <Modal open={userModal} onClose={() => setUserModal(false)} title={editUser ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งาน'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">ชื่อผู้ใช้</label>
              <input value={uForm.username} onChange={e => setUForm(f => ({ ...f, username: e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="form-label">รหัสผ่าน</label>
              <input value={uForm.password} onChange={e => setUForm(f => ({ ...f, password: e.target.value }))} type="password" className="form-input" placeholder={editUser ? '(ไม่เปลี่ยนหากว่าง)' : ''} />
            </div>
            <div className="col-span-2">
              <label className="form-label">ชื่อ-นามสกุล</label>
              <input value={uForm.fullName} onChange={e => setUForm(f => ({ ...f, fullName: e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="form-label">บทบาท</label>
              <select value={uForm.role} onChange={e => setUForm(f => ({ ...f, role: e.target.value as User['role'] }))} className="form-input">
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="form-label">กลุ่มผู้ใช้</label>
              <select value={uForm.groupId} onChange={e => applyGroupPerms(e.target.value)} className="form-input">
                <option value="">— ไม่ระบุกลุ่ม —</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">สิทธิ์การใช้งาน (รายบุคคล)</label>
            <div className="grid grid-cols-2 gap-2">
              {PERM_LABELS.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={uForm.permissions[key]}
                    onChange={e => setUForm(f => ({ ...f, permissions: { ...f.permissions, [key]: e.target.checked } }))}
                    className="rounded accent-primary" />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setUserModal(false)} className="btn-secondary flex-1">ยกเลิก</button>
            <button onClick={saveUser} className="btn-primary flex-1">บันทึก</button>
          </div>
        </div>
      </Modal>

      {/* ── Group Modal ────────────────────────────────────────────────────── */}
      <Modal open={groupModal} onClose={() => setGroupModal(false)} title={editGroup ? 'แก้ไขกลุ่ม' : 'เพิ่มกลุ่มผู้ใช้'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label">ชื่อกลุ่ม</label>
            <input value={gForm.name} onChange={e => setGForm(f => ({ ...f, name: e.target.value }))} className="form-input" placeholder="เช่น เจ้าหน้าที่ชั้น 1" />
          </div>
          <div>
            <label className="form-label">สิทธิ์ของกลุ่ม</label>
            <div className="grid grid-cols-2 gap-2">
              {PERM_LABELS.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={gForm.permissions[key]}
                    onChange={e => setGForm(f => ({ ...f, permissions: { ...f.permissions, [key]: e.target.checked } }))}
                    className="rounded accent-primary" />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setGroupModal(false)} className="btn-secondary flex-1">ยกเลิก</button>
            <button onClick={saveGroup} className="btn-primary flex-1">บันทึก</button>
          </div>
        </div>
      </Modal>

      {/* ── Category Modal ─────────────────────────────────────────────────── */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title={editCat ? 'แก้ไขประเภท' : 'เพิ่มประเภท'} size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">ไอคอน (Emoji)</label>
              <input value={cForm.icon} onChange={e => setCForm(f => ({ ...f, icon: e.target.value }))} className="form-input text-center text-2xl" maxLength={4} />
            </div>
            <div>
              <label className="form-label">อายุเก็บ (วัน)</label>
              <input value={cForm.retentionDays} onChange={e => setCForm(f => ({ ...f, retentionDays: Number(e.target.value) }))} type="number" className="form-input" min={1} />
            </div>
            <div className="col-span-2">
              <label className="form-label">ชื่อ (ไทย)</label>
              <input value={cForm.name} onChange={e => setCForm(f => ({ ...f, name: e.target.value }))} className="form-input" />
            </div>
            <div className="col-span-2">
              <label className="form-label">ชื่อ (อังกฤษ)</label>
              <input value={cForm.nameEn} onChange={e => setCForm(f => ({ ...f, nameEn: e.target.value }))} className="form-input" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setCatModal(false)} className="btn-secondary flex-1">ยกเลิก</button>
            <button onClick={saveCat} className="btn-primary flex-1">บันทึก</button>
          </div>
        </div>
      </Modal>

      {/* ── Area Modal ─────────────────────────────────────────────────────── */}
      <Modal open={areaModal} onClose={() => setAreaModal(false)} title={editArea ? 'แก้ไขบริเวณ' : 'เพิ่มบริเวณ'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label">ชื่อบริเวณ</label>
            <input value={aForm.name} onChange={e => setAForm(f => ({ ...f, name: e.target.value }))} className="form-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">ชั้น</label>
              <input value={aForm.floor} onChange={e => setAForm(f => ({ ...f, floor: e.target.value }))} className="form-input" placeholder="1, 2, B1..." />
            </div>
            <div>
              <label className="form-label">โซน</label>
              <input value={aForm.zone} onChange={e => setAForm(f => ({ ...f, zone: e.target.value }))} className="form-input" placeholder="A, B, C..." />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setAreaModal(false)} className="btn-secondary flex-1">ยกเลิก</button>
            <button onClick={saveArea} className="btn-primary flex-1">บันทึก</button>
          </div>
        </div>
      </Modal>

      {/* ── RFID Reader Modal ──────────────────────────────────────────────── */}
      <Modal open={rfidModal} onClose={() => setRfidModal(false)} title={editRfid ? 'แก้ไขเครื่องอ่าน RFID' : 'เพิ่มเครื่องอ่าน RFID'} size="md">
        <div className="space-y-4">
          <div>
            <label className="form-label">ชื่อเครื่องอ่าน <span className="text-red-500">*</span></label>
            <input value={rfidForm.name} onChange={e => setRfidForm(f => ({ ...f, name: e.target.value }))} className="form-input" placeholder="เช่น Reader ประตูทางเข้าหลัก" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">บริเวณที่ติดตั้ง</label>
              <select value={rfidForm.areaId} onChange={e => setRfidForm(f => ({ ...f, areaId: e.target.value }))} className="form-input">
                <option value="">— เลือกบริเวณ —</option>
                {masterData.areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">ประเภทการเชื่อมต่อ</label>
              <select value={rfidForm.connectionType} onChange={e => setRfidForm(f => ({ ...f, connectionType: e.target.value as RFIDConnectionType }))} className="form-input">
                {(Object.entries(CONN_LABELS) as [RFIDConnectionType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Connection-specific fields */}
          {rfidForm.connectionType === 'usb_serial' && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <label className="form-label">COM Port</label>
                <input value={rfidForm.serialPort} onChange={e => setRfidForm(f => ({ ...f, serialPort: e.target.value }))} className="form-input font-mono" placeholder="COM3 หรือ /dev/ttyUSB0" />
              </div>
              <div>
                <label className="form-label">Baud Rate</label>
                <select value={rfidForm.baudRate} onChange={e => setRfidForm(f => ({ ...f, baudRate: Number(e.target.value) }))} className="form-input">
                  {[9600, 19200, 38400, 57600, 115200].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          )}
          {rfidForm.connectionType === 'tcp_ip' && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <label className="form-label">IP Address</label>
                <input value={rfidForm.ipAddress} onChange={e => setRfidForm(f => ({ ...f, ipAddress: e.target.value }))} className="form-input font-mono" placeholder="192.168.1.100" />
              </div>
              <div>
                <label className="form-label">Port</label>
                <input value={rfidForm.tcpPort} onChange={e => setRfidForm(f => ({ ...f, tcpPort: Number(e.target.value) }))} type="number" className="form-input" min={1} max={65535} />
              </div>
            </div>
          )}
          {rfidForm.connectionType === 'bluetooth' && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="form-label">ชื่ออุปกรณ์ Bluetooth</label>
              <input value={rfidForm.bluetoothName} onChange={e => setRfidForm(f => ({ ...f, bluetoothName: e.target.value }))} className="form-input" placeholder="เช่น RFID-BT-001" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Tag Prefix (ตัดออก)</label>
              <input value={rfidForm.tagPrefix} onChange={e => setRfidForm(f => ({ ...f, tagPrefix: e.target.value }))} className="form-input font-mono" placeholder="เช่น RFID-" />
            </div>
            <div>
              <label className="form-label">Tag Suffix (ตัดออก)</label>
              <input value={rfidForm.tagSuffix} onChange={e => setRfidForm(f => ({ ...f, tagSuffix: e.target.value }))} className="form-input font-mono" placeholder="เช่น -END" />
            </div>
          </div>

          <div>
            <label className="form-label">หมายเหตุ</label>
            <input value={rfidForm.note} onChange={e => setRfidForm(f => ({ ...f, note: e.target.value }))} className="form-input" placeholder="รายละเอียดเพิ่มเติม..." />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={rfidForm.isActive} onChange={e => setRfidForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-primary w-4 h-4" />
            เปิดใช้งานเครื่องอ่านนี้
          </label>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setRfidModal(false)} className="btn-secondary flex-1">ยกเลิก</button>
            <button onClick={saveRfid} disabled={!rfidForm.name.trim()} className="btn-primary flex-1">บันทึก</button>
          </div>
        </div>
      </Modal>

      {/* ── Storage Location Modal ─────────────────────────────────────────── */}
      <Modal open={storageModal} onClose={() => setStorageModal(false)} title={editStorage ? 'แก้ไขที่จัดเก็บ' : 'เพิ่มที่จัดเก็บ'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label">ชื่อสถานที่จัดเก็บ</label>
            <input value={slForm.name} onChange={e => setSlForm(f => ({ ...f, name: e.target.value }))} className="form-input" placeholder="เช่น ตู้ C-01" />
          </div>
          <div>
            <label className="form-label">ความจุ (ชิ้น)</label>
            <input value={slForm.capacity} onChange={e => setSlForm(f => ({ ...f, capacity: Number(e.target.value) }))} type="number" className="form-input" min={1} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStorageModal(false)} className="btn-secondary flex-1">ยกเลิก</button>
            <button onClick={saveStorage} className="btn-primary flex-1">บันทึก</button>
          </div>
        </div>
      </Modal>

    </PageWrapper>
  );
}
