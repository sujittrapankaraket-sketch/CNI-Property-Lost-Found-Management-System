import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, CheckCircle2, CalendarDays, FileSignature } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import PageWrapper from '../../components/layout/PageWrapper';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { FoundReport } from '../../types';

type Tab = 'all' | 'expired';

export default function PropertyList() {
  const { foundReports, masterData, updateFoundReport, addToast, addAuditLog } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [selected, setSelected] = useState<FoundReport | null>(null);
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');

  const expired = foundReports.filter(r => r.status === 'expired');
  const display = tab === 'expired' ? expired : foundReports;

  const filtered = display.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.foundCode.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    const matchS = !filterStatus || r.status === filterStatus;
    return matchQ && matchS;
  });

  const getCatName = (id: string) => masterData.categories.find(c => c.id === id)?.name ?? id;
  const getAreaName = (id: string) => masterData.areas.find(a => a.id === id)?.name ?? id;
  const getStorage = (id: string) => masterData.storageLocations.find(s => s.id === id)?.name ?? '-';

  const handleStatusUpdate = (r: FoundReport, status: string) => {
    const extra = status === 'returned' ? { returnedAt: new Date().toISOString() } : {};
    updateFoundReport(r.id, { status: status as any, ...extra });
    addAuditLog({
      userId: user?.id ?? '',
      username: user?.username ?? '',
      action: 'UPDATE',
      module: 'Property Management',
      detail: `อัปเดตสถานะ ${r.foundCode} เป็น ${status}`,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100',
    });
    addToast({ type: 'success', title: 'อัปเดตสถานะสำเร็จ' });
    setSelected(null);
  };

  const handleAppt = () => {
    if (!selected || !apptDate || !apptTime) return;
    updateFoundReport(selected.id, { returnAppointment: `${apptDate}T${apptTime}`, status: 'pending_return' });
    addToast({ type: 'success', title: 'บันทึกวันนัดหมายสำเร็จ' });
    setSelected(null);
    setApptDate('');
    setApptTime('');
  };

  const TABS = [
    { key: 'all', label: 'ทั้งหมด', count: foundReports.length },
    { key: 'expired', label: 'หมดอายุ', count: expired.length },
  ] as const;

  return (
    <PageWrapper title="จัดการทรัพย์สิน" subtitle="ตรวจสอบและจัดการทรัพย์สินหลงลืมที่จัดเก็บ">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-100 pb-0">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                t.key === 'expired' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="ค้นหา..." />
        </div>
        {tab === 'all' && (
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-input sm:w-44">
            <option value="">ทุกสถานะ</option>
            <option value="stored">จัดเก็บ</option>
            <option value="matched">จับคู่แล้ว</option>
            <option value="pending_return">รอส่งคืน</option>
            <option value="returned">ส่งคืนแล้ว</option>
            <option value="rejected_return">ปฏิเสธรับคืน</option>
            <option value="disposal_requested">รอทิ้ง/ทำลาย</option>
            <option value="expired">หมดอายุ</option>
          </select>
        )}
      </div>

      {/* Table */}
      <div className="hidden md:block card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">รหัส</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ประเภท</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">รายละเอียด</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ที่จัดเก็บ</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">นัดส่งคืน</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันหมดอายุ</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">{r.foundCode}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{getCatName(r.categoryId)}</td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-[180px] truncate">{r.description}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{getStorage(r.storageLocationId)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.returnAppointment || '-'}</td>
                <td className="px-4 py-3 text-xs">
                  <span className={r.status === 'expired' ? 'text-red-500 font-medium' : 'text-gray-500'}>{r.expiresAt}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(r)} className="text-xs text-primary hover:underline font-medium">จัดการ</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">ไม่พบรายการ</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map(r => (
          <div key={r.id} className="card p-4" onClick={() => setSelected(r)}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-semibold text-primary">{r.foundCode}</span>
              <StatusBadge status={r.status} />
            </div>
            <div className="text-sm text-gray-900 truncate">{r.description}</div>
            <div className="text-xs text-gray-500 mt-1">{getCatName(r.categoryId)} · {getStorage(r.storageLocationId)}</div>
            {r.status === 'expired' && (
              <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
                <Clock size={11} /> หมดอายุ {r.expiresAt}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detail / Action Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="จัดการทรัพย์สิน" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="font-mono font-bold text-primary text-base">{selected.foundCode}</div>
              <div className="text-gray-700">{selected.description}</div>
              <div className="text-gray-500 text-xs">{getCatName(selected.categoryId)} · {getAreaName(selected.foundAreaId)}</div>
              <StatusBadge status={selected.status} />
              {selected.disposalReason && (
                <div className="mt-2 rounded-lg bg-orange-50 border border-orange-100 p-3 text-xs text-orange-700">
                  <span className="font-semibold">เหตุผลไม่รับคืน:</span> {selected.disposalReason}
                </div>
              )}
            </div>

            {/* Set appointment */}
            {['stored', 'matched'].includes(selected.status) && (
              <div className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays size={15} className="text-primary" />
                  <span className="text-sm font-medium">นัดหมายส่งคืน</span>
                </div>
                <div className="grid grid-cols-[1fr_110px_auto] gap-2">
                  <input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)} className="form-input flex-1" />
                  <input type="time" value={apptTime} onChange={e => setApptTime(e.target.value)} className="form-input" />
                  <button onClick={handleAppt} className="btn-primary text-sm px-4">บันทึก</button>
                </div>
              </div>
            )}

            {selected.matchedLostId && (
              <button
                onClick={() => navigate(`/found/${selected.id}/handover`)}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                <FileSignature size={15} /> เปิดเอกสารยืนยันการคืน
              </button>
            )}

            {/* Status actions */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">เปลี่ยนสถานะ</p>
              <div className="grid grid-cols-2 gap-2">
                {selected.status !== 'returned' && (
                  <button onClick={() => handleStatusUpdate(selected, 'returned')} className="btn-secondary text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 size={14} className="text-green-500" /> ส่งคืนแล้ว
                  </button>
                )}
                {['stored', 'disposal_requested'].includes(selected.status) && (
                  <button onClick={() => handleStatusUpdate(selected, 'expired')} className="btn-secondary text-sm text-red-500 flex items-center justify-center gap-2">
                    <Clock size={14} /> ทำลาย/หมดอายุ
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
