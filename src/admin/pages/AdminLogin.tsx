import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple development login
    if (password === 'admin123') {
      localStorage.setItem('admin_auth', 'true');
      navigate('/admin');
    } else {
      setError('Invalid password. Try admin123');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#111827', color: 'white' }}>
      <form onSubmit={handleLogin} style={{ backgroundColor: '#1f2937', padding: '2rem', borderRadius: '0.5rem', width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}>Admin Login</h2>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', textAlign: 'center' }}>Development mode</p>
        
        {error && <div style={{ color: '#fca5a5', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
        
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Enter password"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '0.25rem', border: '1px solid #374151', backgroundColor: '#374151', color: 'white', boxSizing: 'border-box' }}
        />
        <button 
          type="submit"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '0.25rem', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Login
        </button>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', marginTop: '1rem' }}>
          Hint: admin123
        </div>
      </form>
    </div>
  );
}
