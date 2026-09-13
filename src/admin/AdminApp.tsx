import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './pages/AdminDashboard';
import { KioskManagement } from './pages/KioskManagement';
import { KioskScreenEditor } from './pages/KioskScreenEditor';
import { AdminLogin } from './pages/AdminLogin';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('admin_auth') === 'true';
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}

export function AdminApp() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="kiosks" element={<KioskManagement />} />
        <Route path="kiosks/:kioskId/editor" element={<KioskScreenEditor />} />
      </Route>
    </Routes>
  );
}
