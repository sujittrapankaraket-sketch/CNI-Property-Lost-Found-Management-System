import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { endOfMonth, format, isWithinInterval, parseISO, startOfMonth, subMonths } from 'date-fns';
import { th } from 'date-fns/locale';
import { Printer, TrendingUp } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import { useData } from '../../context/DataContext';

type Tab = 'lost' | 'found' | 'user';

const COLORS = ['#C8102E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function Reports() {
  const { lostReports, foundReports, masterData, auditLogs } = useData();
  const [tab, setTab] = useState<Tab>('lost');

  const TABS = [
    { key: 'lost',  label: 'รายงานสูญหาย' },
    { key: 'found', label: 'รายงานหลงลืม' },
    { key: 'user',  label: 'ปฏิบัติงานผู้ใช้' },
  ] as const;

  // ── real monthly data (6 months) ─────────────────────────────────────────
  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const interval = { start: startOfMonth(d), end: endOfMonth(d) };
      const inInterval = (s: string) => {
        try { return isWithinInterval(parseISO(s), interval); } catch { return false; }
      };
      return {
        month:    format(d, 'MMM yy', { locale: th }),
        lost:     lostReports.filter(r => inInterval(r.createdAt)).length,
        found:    foundReports.filter(r => inInterval(r.createdAt)).length,
        matched:  lostReports.filter(r => r.status === 'matched' && inInterval(r.createdAt)).length,
        returned: foundReports.filter(r => r.status === 'returned' && inInterval(r.returnedAt ?? r.createdAt)).length,
      };
    });
  }, [lostReports, foundReports]);

  // ── user activity from real data ──────────────────────────────────────────
  const userActivity = useMemo(() => {
    const usernames = [...new Set([
      ...lostReports.map(r => r.createdBy),
      ...foundReports.map(r => r.createdBy),
    ])].filter(Boolean);

    return usernames.map(username => ({
      username,
      lostReceived:  lostReports.filter(r => r.createdBy === username).length,
      foundReceived: foundReports.filter(r => r.createdBy === username).length,
      returned:      auditLogs.filter(l => l.username === username && l.action === 'RETURN').length,
    }));
  }, [lostReports, foundReports, auditLogs]);

  // ── category breakdowns ───────────────────────────────────────────────────
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

  // ── summary numbers ───────────────────────────────────────────────────────
  const returnedCount    = foundReports.filter(r => r.status === 'returned').length;
  const pendingReturn    = foundReports.filter(r => r.status === 'pending_return').length;
  const disposalCount    = foundReports.filter(r => r.status === 'disposal_requested').length;
  const expiredCount     = foundReports.filter(r => r.status === 'expired').length;
  const returnRate       = foundReports.length > 0
    ? Math.round((returnedCount / foundReports.length) * 100) : 0;

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

      {/* ── Lost Stats ─────────────────────────────────────────────────────── */}
      {tab === 'lost' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'ทั้งหมด',       value: lostReports.length,                                    color: 'text-gray-900' },
              { label: 'รอดำเนินการ',   value: lostReports.filter(r => r.status === 'open').length,    color: 'text-amber-600' },
              { label: 'จับคู่แล้ว',    value: lostReports.filter(r => r.status === 'matched').length, color: 'text-green-600' },
              { label: 'ปิดแล้ว',       value: lostReports.filter(r => r.status === 'closed').length,  color: 'text-blue-600' },
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
                <BarChart data={monthlyData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="lost"    name="แจ้งสูญหาย" fill="#C8102E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="matched" name="จับคู่"      fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">แยกตามประเภทสูญหาย</h3>
              {lostByCat.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={lostByCat} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false} fontSize={10}
                    >
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

      {/* ── Found Stats ─────────────────────────────────────────────────────── */}
      {tab === 'found' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'ทั้งหมด',          value: foundReports.length,  color: 'text-gray-900'   },
              { label: 'กำลังจัดเก็บ',     value: foundReports.filter(r => r.status === 'stored').length, color: 'text-blue-600' },
              { label: 'รอส่งคืน',         value: pendingReturn,        color: 'text-purple-600' },
              { label: 'ส่งคืนแล้ว',       value: returnedCount,        color: 'text-green-600'  },
              { label: 'รอทิ้ง/ทำลาย',     value: disposalCount,        color: 'text-orange-600' },
              { label: 'หมดอายุ',           value: expiredCount,         color: 'text-red-600'    },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Return rate highlight */}
          <div className="card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={22} className="text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">อัตราการส่งคืนทรัพย์สิน</div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-green-600">{returnRate}%</span>
                <span className="text-sm text-gray-500 mb-1">({returnedCount} จาก {foundReports.length} รายการ)</span>
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${returnRate}%` }} />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Monthly trend: found vs returned */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">พบ vs ส่งคืนรายเดือน</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="found"    name="พบ"         fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="returned" name="ส่งคืนแล้ว" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* By area */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">แยกตามบริเวณที่พบ</h3>
              {foundByArea.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={foundByArea} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} width={80} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="value" name="จำนวน" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">ไม่มีข้อมูล</div>
              )}
            </div>

            {/* Comparison line chart */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">เปรียบเทียบ สูญหาย vs พบ vs คืน</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="lost"     name="สูญหาย"     stroke="#C8102E" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="found"    name="พบ"         stroke="#3B82F6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="returned" name="ส่งคืนแล้ว" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* By category */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">แยกตามประเภทหลงลืม</h3>
              {foundByCat.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={foundByCat} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false} fontSize={10}
                    >
                      {foundByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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

      {/* ── User Activity ───────────────────────────────────────────────────── */}
      {tab === 'user' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'รับแจ้งสูญหายรวม',   value: lostReports.length,   color: 'text-red-600'   },
              { label: 'รับนำส่งหลงลืมรวม',  value: foundReports.length,  color: 'text-blue-600'  },
              { label: 'ส่งมอบคืนทั้งหมด',    value: auditLogs.filter(l => l.action === 'RETURN').length, color: 'text-green-600' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ผู้ใช้งาน</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">รับแจ้งสูญหาย</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">รับนำส่งหลงลืม</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ส่งมอบคืน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {userActivity.length > 0 ? userActivity.map(u => (
                  <tr key={u.username} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.username}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">{u.lostReceived}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">{u.foundReceived}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={u.returned > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                        {u.returned}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-400 text-sm">ไม่มีข้อมูล</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
