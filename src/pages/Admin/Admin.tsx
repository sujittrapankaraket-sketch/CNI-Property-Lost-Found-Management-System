import { useState } from 'react';
import { Users, Database, ClipboardList, Settings, Plus, Pencil, Trash2, Shield, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import PageWrapper from '../../components/layout/PageWrapper';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import type { User, PropertyCategory, Area } from '../../types';

type Tab = 'users' | 'master' | 'audit' | 'settings';

const DEFAULT_PERMS = {
  lost_report: true, found_report: true, search_match: true,
  property_management: true, reports: true, admin: false,
};

export default function Admin() {
  const { getUsers, updateUser, addUser, deleteUser, settings, updateSettings } = useAuth();
  const { masterData, addCategory, updateCategory, deleteCategory, addArea, updateArea, deleteArea, addStorageLocation, auditLogs } = useData();
  const [tab, setTab] = useState<Tab>('users');
  const [userModal, setUserModal] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [areaModal, setAreaModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editCat, setEditCat] = useState<PropertyCategory | null>(null);
  const [editArea, setEditArea] = useState<Area | null>(null);
  const [auditSearch, setAuditSearch] = useState('');
  const [sessionMin, setSessionMin] = useState(settings.sessionTimeoutMinutes);

  const users = getUsers();

  // User form state
  const [uForm, setUForm] = useState({ username: '', fullName: '', password: '', role: 'staff' as User['role'], permissions: DEFAULT_PERMS });

  const openNewUser = () => {
    setEditUser(null);
    setUForm({ username: '', fullName: '', password: '', role: 'staff', permissions: DEFAULT_PERMS });
    setUserModal(true);
  };

  const openEditUser = (u: User) => {
    setEditUser(u);
    setUForm({ username: u.username, fullName: u.fullName, password: '', role: u.role, permissions: u.permissions });
    setUserModal(true);
  };

  const saveUser = () => {
    if (editUser) {
      updateUser({ ...editUser, ...uForm });
    } else {
      addUser({
        id: Date.now().toString(),
        ...uForm,
        groupId: 'g2',
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
      });
    }
    setUserModal(false);
  };

  // Category form
  const [cForm, setCForm] = useState({ name: '', nameEn: '', retentionDays: 365, icon: '📦' });
  const openNewCat = () => { setEditCat(null); setCForm({ name: '', nameEn: '', retentionDays: 365, icon: '📦' }); setCatModal(true); };
  const openEditCat = (c: PropertyCategory) => { setEditCat(c); setCForm({ name: c.name, nameEn: c.nameEn, retentionDays: c.retentionDays, icon: c.icon }); setCatModal(true); };
  const saveCat = () => {
    const data = { ...cForm, id: editCat?.id ?? Date.now().toString() };
    editCat ? updateCategory(data) : addCategory(data);
    setCatModal(false);
  };

  // Area form
  const [aForm, setAForm] = useState({ name: '', floor: '', zone: '' });
  const openNewArea = () => { setEditArea(null); setAForm({ name: '', floor: '', zone: '' }); setAreaModal(true); };
  const openEditArea = (a: Area) => { setEditArea(a); setAForm({ name: a.name, floor: a.floor, zone: a.zone }); setAreaModal(true); };
  const saveArea = () => {
    const data = { ...aForm, id: editArea?.id ?? Date.now().toString() };
    editArea ? updateArea(data) : addArea(data);
    setAreaModal(false);
  };

  const filteredLogs = auditLogs.filter(l =>
    !auditSearch || l.username.includes(auditSearch) || l.module.includes(auditSearch) || l.action.includes(auditSearch)
  );

  const TABS = [
    { key: 'users', label: 'ผู้ใช้งาน', icon: Users },
    { key: 'master', label: 'ข้อมูลหลัก', icon: Database },
    { key: 'audit', label: 'ประวัติการใช้งาน', icon: ClipboardList },
    { key: 'settings', label: 'ตั้งค่าระบบ', icon: Settings },
  ] as const;

  const PERM_LABELS: [keyof typeof DEFAULT_PERMS, string][] = [
    ['lost_report', 'แจ้งสูญหาย'],
    ['found_report', 'บันทึกหลงลืม'],
    ['search_match', 'ค้นหา/จับคู่'],
    ['property_management', 'จัดการทรัพย์สิน'],
    ['reports', 'รายงาน'],
    ['admin', 'ผู้ดูแลระบบ'],
  ];

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

      {/* Users Tab */}
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">สิทธิ์</th>
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
                    <td className="px-4 py-3">
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

      {/* Master Data Tab */}
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
                      <div className="text-sm font-medium text-gray-700">{c.name}</div>
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

          {/* Storage Locations */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">สถานที่จัดเก็บ</h3>
            </div>
            <div className="space-y-2">
              {masterData.storageLocations.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="text-sm font-medium text-gray-700">{s.name}</div>
                  <div className="text-xs text-gray-400">ความจุ: {s.capacity}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {tab === 'audit' && (
        <div>
          <div className="flex gap-3 mb-4">
            <input
              value={auditSearch}
              onChange={e => setAuditSearch(e.target.value)}
              className="form-input flex-1"
              placeholder="ค้นหาผู้ใช้, โมดูล, การกระทำ..."
            />
          </div>
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
                        l.action === 'CREATE' ? 'bg-green-50 text-green-700' :
                        l.action === 'DELETE' ? 'bg-red-50 text-red-700' :
                        l.action === 'MATCH' ? 'bg-purple-50 text-purple-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>{l.action}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{l.module}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[240px] truncate">{l.detail}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">{l.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="max-w-md space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={16} className="text-primary" /> Session Timeout
            </h3>
            <div>
              <label className="form-label">ระยะเวลา Timeout (นาที)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={5}
                  max={120}
                  step={5}
                  value={sessionMin}
                  onChange={e => setSessionMin(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-lg font-bold text-gray-900 w-16 text-right">{sessionMin} นาที</span>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ sessionTimeoutMinutes: sessionMin })}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Shield size={14} /> บันทึกการตั้งค่า
            </button>
            <p className="text-xs text-gray-400">ระบบจะออกจากหน้าจออัตโนมัติเมื่อไม่มีการใช้งานเกิน {sessionMin} นาที</p>
          </div>

          <div className="card p-6 space-y-3">
            <h3 className="font-semibold text-gray-900">ข้อมูลองค์กร</h3>
            <div>
              <label className="form-label">ชื่อองค์กร</label>
              <input defaultValue="ClickNext Innovation" className="form-input" />
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
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
            <div className="col-span-2">
              <label className="form-label">บทบาท</label>
              <select value={uForm.role} onChange={e => setUForm(f => ({ ...f, role: e.target.value as User['role'] }))} className="form-input">
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">สิทธิ์การใช้งาน</label>
            <div className="grid grid-cols-2 gap-2">
              {PERM_LABELS.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uForm.permissions[key]}
                    onChange={e => setUForm(f => ({ ...f, permissions: { ...f.permissions, [key]: e.target.checked } }))}
                    className="rounded accent-primary"
                  />
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

      {/* Category Modal */}
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

      {/* Area Modal */}
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
    </PageWrapper>
  );
}
