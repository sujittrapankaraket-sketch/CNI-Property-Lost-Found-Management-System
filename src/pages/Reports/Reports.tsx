import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  addDays, addMonths, differenceInDays, endOfMonth, format,
  isWithinInterval, parseISO, startOfMonth, subDays, subMonths,
} from 'date-fns';
import { th } from 'date-fns/locale';
import { Printer, TrendingUp, Calendar } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import { useData } from '../../context/DataContext';

type Tab    = 'lost' | 'found' | 'user';
type Period = 'day' | 'month' | 'year';

const COLORS = ['#C8102E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function Reports() {
  const { lostReports, foundReports, masterData, auditLogs } = useData();
  const [tab, setTab]         = useState<Tab>('lost');
  const [period, setPeriod]   = useState<Period>('month');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo,   setRangeTo]   = useState('');

  const TABS = [
    { key: 'lost',  label: 'รายงานสูญหาย' },
    { key: 'found', label: 'รายงานหลงลืม' },
    { key: 'user',  label: 'ปฏิบัติงานผู้ใช้' },
  ] as const;

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'day',   label: 'รายวัน' },
    { key: 'month', label: 'รายเดือน' },
    { key: 'year',  label: 'รายปี' },
  ];

  // ── date-range filter for summary cards & pie charts ────────────────────
  const filteredLost = useMemo(() => {
    if (!rangeFrom && !rangeTo) return lostReports;
    return lostReports.filter(r => {
      const d = r.createdAt.split('T')[0];
      return (!rangeFrom || d >= rangeFrom) && (!rangeTo || d <= rangeTo);
    });
  }, [lostReports, rangeFrom, rangeTo]);

  const filteredFound = useMemo(() => {
    if (!rangeFrom && !rangeTo) return foundReports;
    return foundReports.filter(r => {
      const d = r.createdAt.split('T')[0];
      return (!rangeFrom || d >= rangeFrom) && (!rangeTo || d <= rangeTo);
    });
  }, [foundReports, rangeFrom, rangeTo]);

  const filteredAudit = useMemo(() => {
    if (!rangeFrom && !rangeTo) return auditLogs;
    return auditLogs.filter(l => {
      const d = l.timestamp.split('T')[0];
      return (!rangeFrom || d >= rangeFrom) && (!rangeTo || d <= rangeTo);
    });
  }, [auditLogs, rangeFrom, rangeTo]);

  // ── period-based chart data (TOR 4.8.1, 4.8.2) ──────────────────────────
  const reportData = useMemo(() => {
    const now = new Date();
    type Row = { label: string; lost: number; found: number; matched: number; returned: number };

    if (period === 'day') {
      const start = rangeFrom ? parseISO(rangeFrom) : subDays(now, 29);
      const end   = rangeTo   ? parseISO(rangeTo)   : now;
      const days  = Math.min(Math.max(differenceInDays(end, start) + 1, 1), 60);
      const rows: Row[] = [];
      for (let i = 0; i < days; i++) {
        const d  = addDays(start, i);
        const ds = format(d, 'yyyy-MM-dd');
        rows.push({
          label:    format(d, 'd/M', { locale: th }),
          lost:     lostReports.filter(r => r.createdAt.startsWith(ds)).length,
          found:    foundReports.filter(r => r.createdAt.startsWith(ds)).length,
          matched:  lostReports.filter(r => r.status === 'matched' && r.createdAt.startsWith(ds)).length,
          returned: foundReports.filter(r => r.status === 'returned' && (r.returnedAt ?? r.createdAt).startsWith(ds)).length,
        });
      }
      return rows;
    }

    if (period === 'year') {
      const endY   = rangeTo   ? parseISO(rangeTo).getFullYear()   : now.getFullYear();
      const startY = rangeFrom ? parseISO(rangeFrom).getFullYear() : endY - 4;
      const rows: Row[] = [];
      for (let y = startY; y <= Math.min(endY, startY + 9); y++) {
        const ys = String(y);
        rows.push({
          label:    `พ.ศ.${y + 543}`,
          lost:     lostReports.filter(r => r.createdAt.startsWith(ys)).length,
          found:    foundReports.filter(r => r.createdAt.startsWith(ys)).length,
          matched:  lostReports.filter(r => r.status === 'matched' && r.createdAt.startsWith(ys)).length,
          returned: foundReports.filter(r => r.status === 'returned' && (r.returnedAt ?? r.createdAt).startsWith(ys)).length,
        });
      }
      return rows;
    }

    // month
    const start = startOfMonth(rangeFrom ? parseISO(rangeFrom) : subMonths(now, 11));
    const end   = endOfMonth(rangeTo ? parseISO(rangeTo) : now);
    const rows: Row[] = [];
    let cur = start;
    while (cur <= end && rows.length < 24) {
      const interval = { start: startOfMonth(cur), end: endOfMonth(cur) };
      const inI = (s: string) => { try { return isWithinInterval(parseISO(s), interval); } catch { return false; } };
      rows.push({
        label:    format(cur, 'MMM yy', { locale: th }),
        lost:     lostReports.filter(r => inI(r.createdAt)).length,
        found:    foundReports.filter(r => inI(r.createdAt)).length,
        matched:  lostReports.filter(r => r.status === 'matched' && inI(r.createdAt)).length,
        returned: foundReports.filter(r => r.status === 'returned' && inI(r.returnedAt ?? r.createdAt)).length,
      });
      cur = addMonths(cur, 1);
    }
    return rows;
  }, [lostReports, foundReports, period, rangeFrom, rangeTo]);

  // ── user activity (TOR 4.8.3) ────────────────────────────────────────────
  const userActivity = useMemo(() => {
    const usernames = [...new Set([
      ...filteredLost.map(r => r.createdBy),
      ...filteredFound.map(r => r.createdBy),
    ])].filter(Boolean);

    return usernames.map(username => ({
      username,
      lostReceived:  filteredLost.filter(r => r.createdBy === username).length,
      foundReceived: filteredFound.filter(r => r.createdBy === username).length,
      returned:      filteredAudit.filter(l => l.username === username && l.action === 'RETURN').length,
    }));
  }, [filteredLost, filteredFound, filteredAudit]);

  // ── category & area breakdowns ────────────────────────────────────────────
  const lostByCat = masterData.categories.map(c => ({
    name: c.name,
    value: filteredLost.filter(r => r.categoryId === c.id).length,
  })).filter(d => d.value > 0);

  const foundByCat = masterData.categories.map(c => ({
    name: c.name,
    value: filteredFound.filter(r => r.categoryId === c.id).length,
  })).filter(d => d.value > 0);

  const foundByArea = masterData.areas.map(a => ({
    name: a.name.split(' - ')[1] || a.name,
    value: filteredFound.filter(r => r.foundAreaId === a.id).length,
  })).filter(d => d.value > 0);

  // ── summary numbers ───────────────────────────────────────────────────────
  const returnedCount = filteredFound.filter(r => r.status === 'returned').length;
  const pendingReturn = filteredFound.filter(r => r.status === 'pending_return').length;
  const disposalCount = filteredFound.filter(r => r.status === 'disposal_requested').length;
  const expiredCount  = filteredFound.filter(r => r.status === 'expired').length;
  const returnRate    = filteredFound.length > 0
    ? Math.round((returnedCount / filteredFound.length) * 100) : 0;

  // ── shared period + range controls ───────────────────────────────────────
  const PeriodControls = () => (
    <div className="flex flex-wrap items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl no-print">
      {/* period buttons */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => { setPeriod(p.key); setRangeFrom(''); setRangeTo(''); }}
            className={`px-3 py-1.5 font-medium transition-colors ${
              period === p.key ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {/* date range */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Calendar size={14} className="text-gray-400" />
        <input
          type="date"
          value={rangeFrom}
          onChange={e => setRangeFrom(e.target.value)}
          className="form-input w-auto text-sm"
          placeholder="ตั้งแต่"
        />
        <span className="text-gray-400">–</span>
        <input
          type="date"
          value={rangeTo}
          onChange={e => setRangeTo(e.target.value)}
          className="form-input w-auto text-sm"
          placeholder="ถึง"
        />
        {(rangeFrom || rangeTo) && (
          <button onClick={() => { setRangeFrom(''); setRangeTo(''); }} className="text-xs text-primary hover:underline">
            ล้าง
          </button>
        )}
      </div>
    </div>
  );

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

      {/* ── Lost Stats (TOR 4.8.1) ─────────────────────────────────────────── */}
      {tab === 'lost' && (
        <div className="space-y-4">
          <PeriodControls />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'ทั้งหมด',     value: filteredLost.length,                                      color: 'text-gray-900' },
              { label: 'รอดำเนินการ', value: filteredLost.filter(r => r.status === 'open').length,     color: 'text-amber-600' },
              { label: 'จับคู่แล้ว',  value: filteredLost.filter(r => r.status === 'matched').length,  color: 'text-green-600' },
              { label: 'ปิดแล้ว',     value: filteredLost.filter(r => r.status === 'closed').length,   color: 'text-blue-600' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                รายการสูญหาย{period === 'day' ? 'รายวัน' : period === 'year' ? 'รายปี' : 'รายเดือน'}
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={reportData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
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

      {/* ── Found Stats (TOR 4.8.2) ────────────────────────────────────────── */}
      {tab === 'found' && (
        <div className="space-y-4">
          <PeriodControls />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'ทั้งหมด',      value: filteredFound.length,  color: 'text-gray-900'   },
              { label: 'กำลังจัดเก็บ', value: filteredFound.filter(r => r.status === 'stored').length, color: 'text-blue-600' },
              { label: 'รอส่งคืน',     value: pendingReturn,         color: 'text-purple-600' },
              { label: 'ส่งคืนแล้ว',   value: returnedCount,         color: 'text-green-600'  },
              { label: 'รอทิ้ง/ทำลาย', value: disposalCount,         color: 'text-orange-600' },
              { label: 'หมดอายุ',       value: expiredCount,          color: 'text-red-600'    },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={22} className="text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">อัตราการส่งคืนทรัพย์สิน</div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-green-600">{returnRate}%</span>
                <span className="text-sm text-gray-500 mb-1">({returnedCount} จาก {filteredFound.length} รายการ)</span>
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${returnRate}%` }} />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                พบ vs ส่งคืน{period === 'day' ? 'รายวัน' : period === 'year' ? 'รายปี' : 'รายเดือน'}
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={reportData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="found"    name="พบ"         fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="returned" name="ส่งคืนแล้ว" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

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

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">เปรียบเทียบ สูญหาย vs พบ vs คืน</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="lost"     name="สูญหาย"     stroke="#C8102E" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="found"    name="พบ"         stroke="#3B82F6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="returned" name="ส่งคืนแล้ว" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

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

      {/* ── User Activity (TOR 4.8.3) ──────────────────────────────────────── */}
      {tab === 'user' && (
        <div className="space-y-4">
          {/* date range filter only (no period needed for user activity) */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-xl no-print">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500">ช่วงเวลา:</span>
            <input type="date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} className="form-input w-auto text-sm" />
            <span className="text-gray-400 text-sm">–</span>
            <input type="date" value={rangeTo}   onChange={e => setRangeTo(e.target.value)}   className="form-input w-auto text-sm" />
            {(rangeFrom || rangeTo) && (
              <button onClick={() => { setRangeFrom(''); setRangeTo(''); }} className="text-xs text-primary hover:underline">ล้าง</button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'รับแจ้งสูญหายรวม',  value: filteredLost.length,                                                  color: 'text-red-600'   },
              { label: 'รับนำส่งหลงลืมรวม', value: filteredFound.length,                                                 color: 'text-blue-600'  },
              { label: 'ส่งมอบคืนทั้งหมด',  value: filteredAudit.filter(l => l.action === 'RETURN').length, color: 'text-green-600' },
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
