import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './pages/AdminDashboard';
import { KioskManagement } from './pages/KioskManagement';
import { KioskScreenEditor } from './pages/KioskScreenEditor';
import { AdminLogin } from './pages/AdminLogin';
import { AdminManagement } from './pages/AdminManagement';
import { useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, isLoading } = useAuth();
  
  if (isLoading) {
    return <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-kiosk)', color: 'white', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }
  
  if (!session || profile?.approval_status !== 'approved') {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, isLoading } = useAuth();
  
  if (isLoading) return null;
  
  if (!session || profile?.role !== 'super_admin' || profile?.approval_status !== 'approved') {
    return <Navigate to="/admin" replace />;
  }
  
  return <>{children}</>;
}

export function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="kiosks" element={<KioskManagement />} />
        <Route path="kiosks/:kioskId/editor" element={<KioskScreenEditor />} />
        <Route path="management" element={<SuperAdminRoute><AdminManagement /></SuperAdminRoute>} />
      </Route>
    </Routes>
  );
}
