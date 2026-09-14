import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already authenticated, preserve session and navigate to Dashboard
    if (localStorage.getItem('admin_auth') === 'true') {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      localStorage.setItem('admin_auth', 'true');
      navigate('/admin', { replace: true });
    } else {
      setError('Invalid password. Try admin123');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)' }}>
      <form onSubmit={handleLogin} style={{ backgroundColor: 'var(--bg-card-dark)', padding: '2rem', borderRadius: '0.5rem', width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-subtle)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}>Admin Login</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center' }}>Development mode</p>
        
        {error && <div style={{ color: 'var(--accent-red)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
        
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Enter password"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '0.25rem', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
        />
        <button 
          type="submit"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '0.25rem', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Login
        </button>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
          Hint: admin123
        </div>
      </form>
    </div>
  );
}
