import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MonitorSmartphone, Settings, LogOut } from 'lucide-react';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Kiosks', path: '/admin/kiosks', icon: MonitorSmartphone },
  ];

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex h-screen" style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', backgroundColor: 'var(--bg-card-dark)', padding: '1rem', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
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
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    backgroundColor: isActive ? 'var(--border-subtle)' : 'transparent',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--accent-red, #ef4444)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            width: '100%',
            textAlign: 'left'
          }}
        >
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
