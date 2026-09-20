import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export function AdminLogin() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const navigate = useNavigate();
  const { session, profile, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && session) {
      if (profile?.approval_status === 'approved') {
        navigate('/admin', { replace: true });
      }
    }
  }, [session, profile, isLoading, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured properly. Please update your .env.local file with real credentials.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg('Account created successfully. Your request is pending approval.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('Unable to connect to the server. Please check your connection.');
      } else if (err.message.includes('Invalid login credentials')) {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // If we are currently loading auth state, show a loading screen
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)' }}>
        Loading authentication...
      </div>
    );
  }

  // If logged in but not approved, show status message
  if (session && profile) {
    if (profile.approval_status === 'pending') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)' }}>
          <div style={{ backgroundColor: 'var(--bg-card-dark)', padding: '2rem', borderRadius: '0.5rem', width: '350px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Access Denied</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--accent-gold)' }}>Your admin access request is pending approval.</p>
            <button onClick={() => supabase.auth.signOut()} style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </div>
      );
    }
    
    if (profile.approval_status === 'rejected') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)' }}>
          <div style={{ backgroundColor: 'var(--bg-card-dark)', padding: '2rem', borderRadius: '0.5rem', width: '350px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--accent-red)' }}>Access Denied</h2>
            <p style={{ marginBottom: '1.5rem' }}>Your admin access request was rejected.</p>
            <button onClick={() => supabase.auth.signOut()} style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)' }}>
      <form onSubmit={handleAuth} style={{ backgroundColor: 'var(--bg-card-dark)', padding: '2rem', borderRadius: '0.5rem', width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-subtle)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}>{isSignUp ? 'Admin Sign Up' : 'Admin Login'}</h2>
        
        {error && <div style={{ color: 'var(--accent-red)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
        {successMsg && <div style={{ color: 'var(--accent-green, #10b981)', fontSize: '0.875rem', textAlign: 'center' }}>{successMsg}</div>}
        
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="Enter email"
          required
          style={{ width: '100%', padding: '0.75rem', borderRadius: '0.25rem', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
        />
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Enter password"
          required
          minLength={6}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '0.25rem', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
        />
        <button 
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '0.25rem', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 'bold', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
        </button>
        
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
          {isSignUp ? 'Already have an account? ' : 'Need an account? '}
          <button 
            type="button" 
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMsg(''); }}
            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: 0, fontSize: 'inherit', textDecoration: 'underline' }}
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </div>
      </form>
    </div>
  );
}
