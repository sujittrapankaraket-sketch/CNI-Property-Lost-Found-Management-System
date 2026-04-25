import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Package, GitMerge, Plus, ArrowRight, BarChart2, CalendarDays, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { eachDayOfInterval, endOfDay, format, isValid, isWithinInterval, parseISO, subDays } from 'date-fns';
import { th } from 'date-fns/locale';
import PageWrapper from '../components/layout/PageWrapper';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/ui/StatusBadge';

export default function Dashboard() {
  const { lostReports, foundReports } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chartFrom, setChartFrom] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [chartTo, setChartTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [lostStatus, setLostStatus] = useState('');
  const [foundStatus, setFoundStatus] = useState('');

  const totalLost = lostReports.length;
  const totalFound = foundReports.length;
  const matched = foundReports.filter(r => r.status === 'matched').length;
  const pendingLost = lostReports.filter(r => r.status === 'open').length;

  const recentActivity = [
    ...lostReports.slice(0, 3).map(r => ({ type: 'lost' as const, code: r.trackingNo, desc: r.description, time: r.createdAt, status: r.status })),
    ...foundReports.slice(0, 3).map(r => ({ type: 'found' as const, code: r.foundCode, desc: r.description, time: r.createdAt, status: r.status })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6);

  const quickLinks = [
    {
      label: 'รายการสูญหาย',
      desc: `${pendingLost} รายการรอดำเนินการ`,
      value: totalLost,
      path: '/lost',
      icon: AlertCircle,
      cls: 'border-red-100 bg-red-50/70 text-red-700 hover:border-red-200 hover:bg-red-50',
      iconCls: 'bg-red-100 text-red-600',
    },
    {
      label: 'ทรัพย์สินหลงลืม',
      desc: 'ตรวจสอบทรัพย์สินที่จัดเก็บ',
      value: totalFound,
      path: '/found',
      icon: Package,
      cls: 'border-blue-100 bg-blue-50/70 text-blue-700 hover:border-blue-200 hover:bg-blue-50',
      iconCls: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'ค้นหา/จับคู่',
      desc: `${matched} รายการจับคู่แล้ว`,
      value: foundReports.filter(r => r.status === 'stored').length,
      path: '/search',
      icon: GitMerge,
      cls: 'border-purple-100 bg-purple-50/70 text-purple-700 hover:border-purple-200 hover:bg-purple-50',
      iconCls: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'รายงานสถิติ',
      desc: 'ดูแนวโน้มและสรุปผล',
      value: lostReports.length + foundReports.length,
      path: '/reports',
      icon: BarChart2,
      cls: 'border-emerald-100 bg-emerald-50/70 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50',
      iconCls: 'bg-emerald-100 text-emerald-600',
    },
  ];

  const chartData = useMemo(() => {
    const parsedFrom = parseISO(chartFrom);
    const parsedTo = parseISO(chartTo);
    const from = isValid(parsedFrom) ? parsedFrom : subDays(new Date(), 6);
    const to = isValid(parsedTo) ? parsedTo : new Date();
    const rangeStart = from <= to ? from : to;
    const rangeEnd = from <= to ? to : from;
    const interval = { start: rangeStart, end: rangeEnd };

    return eachDayOfInterval(interval).map(day => {
      const dayStart = day;
      const dayEnd = endOfDay(day);
      const dayInterval = { start: dayStart, end: dayEnd };
      const lost = lostReports.filter(report => {
        const createdAt = parseISO(report.createdAt);
        return isWithinInterval(createdAt, dayInterval) && (!lostStatus || report.status === lostStatus);
      }).length;
      const found = foundReports.filter(report => {
        const createdAt = parseISO(report.createdAt);
        return isWithinInterval(createdAt, dayInterval) && (!foundStatus || report.status === foundStatus);
      }).length;

      return {
        date: format(day, 'd MMM', { locale: th }),
        lost,
        found,
      };
    });
  }, [chartFrom, chartTo, foundReports, foundStatus, lostReports, lostStatus]);

  const filteredChartTotal = chartData.reduce((sum, item) => sum + item.lost + item.found, 0);

  return (
    <PageWrapper
      title={`สวัสดี, ${user?.fullName}`}
      subtitle={`วันที่ ${format(new Date(), 'EEEE d MMMM yyyy', { locale: th })}`}
      actions={
        <div className="flex gap-2">
          {user?.permissions.lost_report && (
            <button onClick={() => navigate('/lost/new')} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={15} /> แจ้งสูญหาย
            </button>
          )}
          {user?.permissions.found_report && (
            <button onClick={() => navigate('/found/new')} className="btn-secondary flex items-center gap-2 text-sm">
              <Plus size={15} /> บันทึกพบ
            </button>
          )}
        </div>
      }
    >
      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {quickLinks.map(q => {
          const Icon = q.icon;
          return (
            <button
              key={q.path}
              onClick={() => navigate(q.path)}
              className={`${q.cls} group rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${q.iconCls}`}>
                  <Icon size={19} />
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold opacity-70 group-hover:opacity-100">
                  เปิด <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900">{q.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{q.desc}</div>
                </div>
                <div className="text-2xl font-bold tabular-nums">{q.value}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="card lg:col-span-2 p-5">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">สถิติตามช่วงวันที่</h3>
                <p className="text-xs text-gray-400 mt-0.5">แสดง {filteredChartTotal} รายการจากเงื่อนไขที่เลือก</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CalendarDays size={14} />
                <span>{chartFrom} ถึง {chartTo}</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 no-print">
              <div>
                <label className="form-label text-xs">วันที่เริ่มต้น</label>
                <input type="date" value={chartFrom} onChange={e => setChartFrom(e.target.value)} className="form-input py-2" />
              </div>
              <div>
                <label className="form-label text-xs">วันที่สิ้นสุด</label>
                <input type="date" value={chartTo} onChange={e => setChartTo(e.target.value)} className="form-input py-2" />
              </div>
              <div>
                <label className="form-label text-xs flex items-center gap-1"><Filter size={12} /> สถานะสูญหาย</label>
                <select value={lostStatus} onChange={e => setLostStatus(e.target.value)} className="form-input py-2">
                  <option value="">ทุกสถานะ</option>
                  <option value="open">รอดำเนินการ</option>
                  <option value="matched">จับคู่แล้ว</option>
                  <option value="closed">ปิดแล้ว</option>
                </select>
              </div>
              <div>
                <label className="form-label text-xs flex items-center gap-1"><Filter size={12} /> สถานะทรัพย์สินพบ</label>
                <select value={foundStatus} onChange={e => setFoundStatus(e.target.value)} className="form-input py-2">
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
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                cursor={{ fill: '#F9FAFB' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="lost" name="สูญหาย" fill="#C8102E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="found" name="พบ" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">กิจกรรมล่าสุด</h3>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  a.type === 'lost' ? 'bg-red-50' : 'bg-blue-50'
                }`}>
                  {a.type === 'lost'
                    ? <AlertCircle size={13} className="text-red-500" />
                    : <Package size={13} className="text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-700 font-mono">{a.code}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">{a.desc}</div>
                  <div className="text-[10px] text-gray-300 mt-0.5">
                    {format(new Date(a.time), 'd MMM HH:mm', { locale: th })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/property')} className="w-full mt-4 text-xs text-primary font-medium hover:underline text-center">
            ดูทั้งหมด →
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
