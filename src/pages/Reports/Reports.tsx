import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subMonths, startOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';
import { Printer } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import { useData } from '../../context/DataContext';

type Tab = 'lost' | 'found' | 'user';
type Period = 'daily' | 'monthly' | 'yearly';

const COLORS = ['#C8102E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const MONTHLY_DATA = Array.from({ length: 6 }, (_, i) => {
  const d = subMonths(new Date(), 5 - i);
  return {
    month: format(d, 'MMM yy', { locale: th }),
    lost: Math.floor(Math.random() * 15) + 3,
    found: Math.floor(Math.random() * 12) + 2,
    matched: Math.floor(Math.random() * 8) + 1,
  };
});

const USER_ACTIVITY = [
  { username: 'staff01', lostReceived: 8, foundReceived: 12, returned: 5, period: 'เม.ย. 2026' },
  { username: 'admin', lostReceived: 2, foundReceived: 1, returned: 3, period: 'เม.ย. 2026' },
];

export default function Reports() {
  const { lostReports, foundReports, masterData } = useData();
  const [tab, setTab] = useState<Tab>('lost');
  const [period, setPeriod] = useState<Period>('monthly');

  const getCatName = (id: string) => masterData.categories.find(c => c.id === id)?.name ?? id;

  // Category breakdown
  const lostByCat = masterData.categories.map(c => ({
    name: c.name,
    value: lostReports.filter(r => r.categoryId === c.id).length,
  })).filter(d => d.value > 0);

  const foundByCat = masterData.categories.map(c => ({
    name: c.name,
    value: foundReports.filter(r => r.categoryId === c.id).length,
  })).filter(d => d.value > 0);

  const foundByArea = masterData.areas.map(a => ({
    name: a.name.split(' - ')[1] || a.name,
    value: foundReports.filter(r => r.foundAreaId === a.id).length,
  })).filter(d => d.value > 0);

  const TABS = [
    { key: 'lost', label: 'รายงานสูญหาย' },
    { key: 'found', label: 'รายงานหลงลืม' },
    { key: 'user', label: 'ปฏิบัติงานผู้ใช้' },
  ] as const;

  return (
    <PageWrapper
      title="รายงานและสถิติ"
      subtitle="วิเคราะห์ข้อมูลทรัพย์สินสูญหายและหลงลืม"
      actions={
        <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 text-sm no-print">
          <Printer size={15} /> พิมพ์รายงาน
        </button>
      }
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Period selector */}
      {tab !== 'user' && (
        <div className="flex gap-2 mb-6">
          {(['daily', 'monthly', 'yearly'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                period === p ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === 'daily' ? 'รายวัน' : p === 'monthly' ? 'รายเดือน' : 'รายปี'}
            </button>
          ))}
        </div>
      )}

      {/* Lost Stats */}
      {tab === 'lost' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'ทั้งหมด', value: lostReports.length, color: 'text-gray-900' },
              { label: 'รอดำเนินการ', value: lostReports.filter(r => r.status === 'open').length, color: 'text-amber-600' },
              { label: 'จับคู่แล้ว', value: lostReports.filter(r => r.status === 'matched').length, color: 'text-green-600' },
              { label: 'ปิดแล้ว', value: lostReports.filter(r => r.status === 'closed').length, color: 'text-blue-600' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">รายการสูญหายรายเดือน</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={MONTHLY_DATA} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="lost" name="แจ้งสูญหาย" fill="#C8102E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="matched" name="จับคู่" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">แยกตามประเภทสูญหาย</h3>
              {lostByCat.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={lostByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {lostByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">ไม่มีข้อมูล</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Found Stats */}
      {tab === 'found' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'ทั้งหมด', value: foundReports.length, color: 'text-gray-900' },
              { label: 'กำลังจัดเก็บ', value: foundReports.filter(r => r.status === 'stored').length, color: 'text-blue-600' },
              { label: 'ส่งคืนแล้ว', value: foundReports.filter(r => r.status === 'returned').length, color: 'text-green-600' },
              { label: 'รอทิ้ง/ทำลาย', value: foundReports.filter(r => r.status === 'disposal_requested').length, color: 'text-orange-600' },
              { label: 'หมดอายุ', value: foundReports.filter(r => r.status === 'expired').length, color: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">เปรียบเทียบ สูญหาย vs พบ</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={MONTHLY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="lost" name="สูญหาย" stroke="#C8102E" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="found" name="พบ" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">แยกตามบริเวณที่พบ</h3>
              {foundByArea.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={foundByArea} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} width={80} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="value" name="จำนวน" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">ไม่มีข้อมูล</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Activity */}
      {tab === 'user' && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ผู้ใช้งาน</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">รับแจ้งสูญหาย</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">รับนำส่งหลงลืม</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ส่งมอบคืน</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ช่วงเวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {USER_ACTIVITY.map(u => (
                  <tr key={u.username} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.username}</td>
                    <td className="px-4 py-3 text-gray-600">{u.lostReceived}</td>
                    <td className="px-4 py-3 text-gray-600">{u.foundReceived}</td>
                    <td className="px-4 py-3 text-gray-600">{u.returned}</td>
                    <td className="px-4 py-3 text-gray-500">{u.period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
