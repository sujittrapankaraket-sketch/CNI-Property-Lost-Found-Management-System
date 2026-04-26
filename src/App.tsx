import { Component, useState, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { canUseRemoteDataStore } from './services/dataStore';
import type { PermissionMap } from './types';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import ToastContainer from './components/shared/ToastContainer';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  state = { hasError: false, message: '' };
  static getDerivedStateFromError(e: Error) { return { hasError: true, message: e.message }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center bg-gray-50 flex-col gap-4 p-6 text-center" style={{ height: '100dvh' }}>
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-bold text-gray-900">เกิดข้อผิดพลาด</h2>
          <p className="text-sm text-gray-500 max-w-sm">กรุณารีเฟรชหน้าเว็บ หากยังพบปัญหา กรุณาติดต่อผู้ดูแลระบบ</p>
          {this.state.message && (
            <code className="text-xs bg-gray-100 px-3 py-1.5 rounded text-gray-600 max-w-xs break-all">{this.state.message}</code>
          )}
          <button onClick={() => window.location.reload()} className="btn-primary text-sm">รีเฟรชหน้าเว็บ</button>
        </div>
      );
    }
    return this.props.children;
  }
}

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LostReportList from './pages/LostReport/LostReportList';
import LostReportForm from './pages/LostReport/LostReportForm';
import FoundReportList from './pages/FoundReport/FoundReportList';
import FoundReportForm from './pages/FoundReport/FoundReportForm';
import HandoverForm from './pages/FoundReport/HandoverForm';
import FoundIntakeForm from './pages/FoundReport/FoundIntakeForm';
import SearchMatch from './pages/SearchMatch/SearchMatch';
import PropertyList from './pages/PropertyManagement/PropertyList';
import Reports from './pages/Reports/Reports';
import Admin from './pages/Admin/Admin';
import ClaimResponse from './pages/ClaimResponse';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex overflow-hidden bg-gray-50" style={{ height: '100dvh' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(v => !v)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

function AuthGuard() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

function PermGuard({ perm }: { perm: keyof PermissionMap }) {
  const { user } = useAuth();
  if (!user || !user.permissions[perm]) return <Navigate to="/" replace />;
  return <Outlet />;
}

function DataLoadingGate({ children }: { children: ReactNode }) {
  const { remoteLoaded } = useData();
  if (!remoteLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-50 flex-col gap-4" style={{ height: '100dvh' }}>
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">กำลังโหลดข้อมูล…</p>
          <p className="text-xs text-gray-400 mt-1">กำลังเชื่อมต่อ Supabase</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            {canUseRemoteDataStore ? (
              <DataLoadingGate>
                <AppRoutes />
              </DataLoadingGate>
            ) : (
              <AppRoutes />
            )}
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

function AppRoutes() {
  return (
    <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/claim/:foundId/:lostId" element={<ClaimResponse />} />
            <Route element={<AuthGuard />}>
              <Route path="/" element={<Dashboard />} />

              <Route element={<PermGuard perm="lost_report" />}>
                <Route path="/lost" element={<LostReportList />} />
                <Route path="/lost/new" element={<LostReportForm />} />
              </Route>

              <Route element={<PermGuard perm="found_report" />}>
                <Route path="/found" element={<FoundReportList />} />
                <Route path="/found/new" element={<FoundReportForm />} />
                <Route path="/found/:id/intake" element={<FoundIntakeForm />} />
                <Route path="/found/:id/handover" element={<HandoverForm />} />
              </Route>

              <Route element={<PermGuard perm="search_match" />}>
                <Route path="/search" element={<SearchMatch />} />
              </Route>

              <Route element={<PermGuard perm="property_management" />}>
                <Route path="/property" element={<PropertyList />} />
              </Route>

              <Route element={<PermGuard perm="reports" />}>
                <Route path="/reports" element={<Reports />} />
              </Route>

              <Route element={<PermGuard perm="admin" />}>
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
  );
}
