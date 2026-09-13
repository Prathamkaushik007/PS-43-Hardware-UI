import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MonitorSmartphone, Settings } from 'lucide-react';

export function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Kiosks', path: '/admin/kiosks', icon: MonitorSmartphone },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-white" style={{ display: 'flex', height: '100vh', backgroundColor: '#111827', color: 'white' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', backgroundColor: '#1f2937', padding: '1rem', borderRight: '1px solid #374151' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={24} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Central Admin</h1>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  color: isActive ? 'white' : '#9ca3af',
                  backgroundColor: isActive ? '#374151' : 'transparent',
                  transition: 'background-color 0.2s',
                }}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
