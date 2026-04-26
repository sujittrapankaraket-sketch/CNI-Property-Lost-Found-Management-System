import { Menu, Bell, ChevronRight, CloudOff, Cloud } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import RFIDScanner from '../ui/RFIDScanner';
import { canUseRemoteDataStore } from '../../services/dataStore';
import { useData } from '../../context/DataContext';

interface NavbarProps {
  onMenuClick: () => void;
}

const ROUTE_LABELS: Record<string, string> = {
  '/': 'แดชบอร์ด',
  '/lost': 'แจ้งทรัพย์สินสูญหาย',
  '/lost/new': 'สร้างรายการใหม่',
  '/found': 'ทรัพย์สินหลงลืม',
  '/found/new': 'บันทึกทรัพย์สินหลงลืม',
  '/search': 'ค้นหา / จับคู่',
  '/property': 'จัดการทรัพย์สิน',
  '/reports': 'รายงานและสถิติ',
  '/admin': 'ผู้ดูแลระบบ',
  '/admin/users': 'จัดการผู้ใช้งาน',
  '/admin/master': 'ข้อมูลหลัก',
  '/admin/audit': 'ประวัติการใช้งาน',
};

export default function Navbar({ onMenuClick }: NavbarProps) {
  const location = useLocation();
  const { rfidReaders, activeReaderId } = useData();
  const activeReader = rfidReaders.find(r => r.id === activeReaderId);
  const parts = location.pathname.split('/').filter(Boolean);
  const crumbs = [{ path: '/', label: 'หน้าหลัก' }];
  parts.forEach((_, i) => {
    const path = '/' + parts.slice(0, i + 1).join('/');
    if (ROUTE_LABELS[path]) crumbs.push({ path, label: ROUTE_LABELS[path] });
  });

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb */}
        <nav className="hidden sm:flex items-center gap-1 text-sm min-w-0">
          {crumbs.map((c, i) => (
            <span key={c.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />}
              <span className={i === crumbs.length - 1 ? 'text-gray-900 font-medium truncate' : 'text-gray-400'}>
                {c.label}
              </span>
            </span>
          ))}
        </nav>

        {/* Mobile title */}
        <span className="sm:hidden text-sm font-semibold text-gray-900">
          {ROUTE_LABELS[location.pathname] || 'Lost & Found'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Supabase sync status badge */}
        <div
          title={canUseRemoteDataStore ? 'เชื่อมต่อ Supabase แล้ว — ข้อมูล sync อัตโนมัติ' : 'ไม่ได้เชื่อมต่อ Supabase — ข้อมูลเก็บในเครื่องเท่านั้น'}
          className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
            canUseRemoteDataStore
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {canUseRemoteDataStore
            ? <><Cloud size={10} /> Synced</>
            : <><CloudOff size={10} /> Local only</>
          }
        </div>
        <RFIDScanner compact activeReaderName={activeReader?.name} />
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
