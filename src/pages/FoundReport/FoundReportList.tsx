import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import PageWrapper from '../../components/layout/PageWrapper';
import StatusBadge from '../../components/ui/StatusBadge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

export default function FoundReportList() {
  const { foundReports, masterData } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = foundReports.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.foundCode.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.rfidTag.toLowerCase().includes(q);
    const matchS = !filterStatus || r.status === filterStatus;
    return matchQ && matchS;
  });

  const getCatName = (id: string) => masterData.categories.find(c => c.id === id)?.name ?? id;
  const getAreaName = (id: string) => masterData.areas.find(a => a.id === id)?.name ?? id;
  const getStorage = (id: string) => masterData.storageLocations.find(s => s.id === id)?.name ?? '-';

  return (
    <PageWrapper
      title="รายการทรัพย์สินหลงลืม"
      subtitle={`${foundReports.length} รายการ`}
      actions={
        user?.permissions.found_report && (
          <button onClick={() => navigate('/found/new')} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> บันทึกทรัพย์สิน
          </button>
        )
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="ค้นหารหัส, RFID, รายละเอียด..." />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-input w-40">
            <option value="">ทุกสถานะ</option>
            <option value="stored">จัดเก็บ</option>
            <option value="matched">จับคู่แล้ว</option>
            <option value="pending_return">รอส่งคืน</option>
            <option value="returned">ส่งคืนแล้ว</option>
            <option value="rejected_return">ปฏิเสธรับคืน</option>
            <option value="disposal_requested">รอทิ้ง/ทำลาย</option>
            <option value="expired">หมดอายุ</option>
          </select>
        </div>
      </div>

      <div className="hidden md:block card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">รหัส</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">RFID</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ประเภท</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">รายละเอียด</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">บริเวณที่พบ</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ที่จัดเก็บ</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันหมดอายุ</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/found/${r.id}/intake`)}>
                <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">{r.foundCode}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.rfidTag}</td>
                <td className="px-4 py-3 text-gray-700 text-xs">{getCatName(r.categoryId)}</td>
                <td className="px-4 py-3 text-gray-600 text-xs max-w-[160px] truncate">{r.description}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{getAreaName(r.foundAreaId)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{getStorage(r.storageLocationId)}</td>
                <td className="px-4 py-3 text-xs">
                  <span className={r.status === 'expired' ? 'text-red-500 font-medium' : 'text-gray-500'}>{r.expiresAt}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">ไม่พบรายการ</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {filtered.map(r => (
          <div key={r.id} className="card p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-semibold text-primary">{r.foundCode}</span>
              <StatusBadge status={r.status} />
            </div>
            <div className="text-sm font-medium text-gray-900 truncate">{r.description}</div>
            <div className="text-xs text-gray-500 mt-1">{getCatName(r.categoryId)} · {getAreaName(r.foundAreaId)}</div>
            <div className="text-xs text-gray-400 mt-1 font-mono">{r.rfidTag}</div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
