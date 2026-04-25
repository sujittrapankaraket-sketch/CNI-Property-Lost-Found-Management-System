import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import PageWrapper from '../../components/layout/PageWrapper';
import StatusBadge from '../../components/ui/StatusBadge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

export default function LostReportList() {
  const { lostReports, masterData } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = lostReports.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.trackingNo.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.reporter.name.toLowerCase().includes(q);
    const matchS = !filterStatus || r.status === filterStatus;
    return matchQ && matchS;
  });

  const getCatName = (id: string) => masterData.categories.find(c => c.id === id)?.name ?? id;
  const getAreaName = (id: string) => masterData.areas.find(a => a.id === id)?.name ?? id;

  return (
    <PageWrapper
      title="รายการแจ้งทรัพย์สินสูญหาย"
      subtitle={`${lostReports.length} รายการ`}
      actions={
        user?.permissions.lost_report && (
          <button onClick={() => navigate('/lost/new')} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> แจ้งสูญหายใหม่
          </button>
        )
      }
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9"
            placeholder="ค้นหาจากหมายเลข, รายละเอียด, ชื่อผู้แจ้ง..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-input w-40">
            <option value="">ทุกสถานะ</option>
            <option value="open">รอดำเนินการ</option>
            <option value="matched">จับคู่แล้ว</option>
            <option value="closed">ปิดแล้ว</option>
          </select>
        </div>
      </div>

      {/* Table (desktop) / Cards (mobile) */}
      <div className="hidden md:block card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">หมายเลขติดตาม</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ประเภท</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">รายละเอียด</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">บริเวณ</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ผู้แจ้ง</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">สัญชาติ</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันที่</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">{r.trackingNo}</td>
                <td className="px-4 py-3 text-gray-700">{getCatName(r.categoryId)}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{r.description}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{getAreaName(r.lostAreaId)}</td>
                <td className="px-4 py-3 text-gray-700">{r.reporter.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{r.reporter.nationality || '-'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {format(new Date(r.createdAt), 'd MMM yy', { locale: th })}
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">ไม่พบรายการ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(r => (
          <div key={r.id} className="card p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-semibold text-primary">{r.trackingNo}</span>
              <StatusBadge status={r.status} />
            </div>
            <div className="text-sm font-medium text-gray-900 truncate">{r.description}</div>
            <div className="text-xs text-gray-500 mt-1">{getCatName(r.categoryId)} · {getAreaName(r.lostAreaId)}</div>
            <div className="text-xs text-gray-400 mt-1">
              {r.reporter.name} · {r.reporter.nationality || '-'} · {format(new Date(r.createdAt), 'd MMM yy', { locale: th })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">ไม่พบรายการ</div>
        )}
      </div>
    </PageWrapper>
  );
}
