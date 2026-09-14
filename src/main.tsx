import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AdminApp } from './admin/AdminApp.tsx'

function RootRedirect() {
  const isAuthenticated = localStorage.getItem('admin_auth') === 'true';
  return <Navigate to={isAuthenticated ? "/admin" : "/admin/login"} replace />;
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/*" element={<App />} />
    </Routes>
  </BrowserRouter>
)
