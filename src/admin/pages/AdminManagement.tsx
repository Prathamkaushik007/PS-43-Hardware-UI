import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import type { AdminProfile } from '../contexts/AuthContext';
import { Check, X, ShieldAlert } from 'lucide-react';

export function AdminManagement() {
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('admin_profiles')
        .update({ approval_status: newStatus })
        .eq('user_id', userId);

      if (error) throw error;
      
      // Update local state
      setProfiles(profiles.map(p => 
        p.user_id === userId ? { ...p, approval_status: newStatus } : p
      ));
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-primary)' }}>Loading admins...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--accent-red)' }}>Error: {error}</div>;
  }

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <ShieldAlert size={24} style={{ color: 'var(--accent-gold)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Admin Management</h2>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card-dark)', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>Email</th>
              <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>Role</th>
              <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>Created</th>
              <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No admin profiles found.
                </td>
              </tr>
            ) : (
              profiles.map(profile => (
                <tr key={profile.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '1rem' }}>{profile.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      backgroundColor: profile.role === 'super_admin' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      color: profile.role === 'super_admin' ? 'var(--accent-gold)' : '#38bdf8',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {profile.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                     <span style={{ 
                      backgroundColor: profile.approval_status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : profile.approval_status === 'rejected' ? 'rgba(225, 29, 72, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                      color: profile.approval_status === 'approved' ? '#34d399' : profile.approval_status === 'rejected' ? '#fb7185' : '#cbd5e1',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {profile.approval_status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {profile.approval_status === 'pending' && profile.role !== 'super_admin' && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleUpdateStatus(profile.user_id, 'approved')}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid #34d399', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 'bold' }}
                        >
                          <Check size={16} /> Approve
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(profile.user_id, 'rejected')}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'rgba(225, 29, 72, 0.1)', color: '#fb7185', border: '1px solid #fb7185', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 'bold' }}
                        >
                          <X size={16} /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
