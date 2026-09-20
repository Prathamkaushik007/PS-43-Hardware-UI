import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AdminApp } from './admin/AdminApp.tsx'
import { AuthProvider, useAuth } from './admin/contexts/AuthContext'

function RootRedirect() {
  const { session, profile, isLoading } = useAuth();
  
  if (isLoading) {
    return <div style={{ display: 'flex', height: '100vh', backgroundColor: '#070a13' }}></div>; // Or a spinner
  }

  // If we have a session AND an approved profile, go to dashboard
  if (session && profile?.approval_status === 'approved') {
    return <Navigate to="/admin" replace />;
  }

  // Otherwise login
  return <Navigate to="/admin/login" replace />;
}

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)
