import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertCircle, Package, Search, FolderOpen, BarChart2, Settings, X, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { path: '/', label: 'แดชบอร์ด', labelEn: 'Dashboard', icon: LayoutDashboard, perm: null },
  { path: '/lost', label: 'แจ้งทรัพย์สินสูญหาย', labelEn: 'Lost Report', icon: AlertCircle, perm: 'lost_report' },
  { path: '/found', label: 'ทรัพย์สินหลงลืม', labelEn: 'Found Report', icon: Package, perm: 'found_report' },
  { path: '/search', label: 'ค้นหา / จับคู่', labelEn: 'Search & Match', icon: Search, perm: 'search_match' },
  { path: '/property', label: 'จัดการทรัพย์สิน', labelEn: 'Property Mgmt', icon: FolderOpen, perm: 'property_management' },
  { path: '/reports', label: 'รายงานและสถิติ', labelEn: 'Reports', icon: BarChart2, perm: 'reports' },
  { path: '/admin', label: 'ผู้ดูแลระบบ', labelEn: 'Admin', icon: Settings, perm: 'admin' },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-40 flex flex-col transition-transform duration-300',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CNI</span>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">Lost & Found</div>
              <div className="text-[10px] text-gray-400">ClickNext Innovation</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-gray-100">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(item => {
            if (item.perm && user && !user.permissions[item.perm as keyof typeof user.permissions]) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx('sidebar-link', isActive ? 'sidebar-link-active' : 'sidebar-link-inactive')
                }
              >
                <Icon size={17} />
                <span className="flex-1">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User info */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-sm">{user?.fullName?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</div>
              <div className="text-xs text-gray-400">{user?.role === 'admin' ? 'ผู้ดูแลระบบ' : user?.role === 'staff' ? 'เจ้าหน้าที่' : 'ผู้ดูระบบ'}</div>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-primary transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
