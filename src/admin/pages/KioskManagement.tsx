import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Power, RefreshCw, Activity } from 'lucide-react';
import { configService } from '../services/configurationService';
import type { Kiosk } from '../types';

export function KioskManagement() {
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [newKiosk, setNewKiosk] = useState<Partial<Kiosk>>({
    status: 'offline',
    active: true,
  });

  useEffect(() => {
    loadKiosks();
  }, []);

  const loadKiosks = async () => {
    setLoading(true);
    try {
      const data = await configService.getKiosks();
      setKiosks(data);
    } catch (err) {
      console.error('Failed to load kiosks', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleAddKiosk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKiosk.kioskId || !newKiosk.name) return;

    try {
      const kioskToAdd: Kiosk = {
        id: crypto.randomUUID(),
        kioskId: newKiosk.kioskId.trim().toUpperCase(),
        kiosk_code: newKiosk.kioskId.trim().toUpperCase(),
        name: newKiosk.name.trim(),
        kiosk_name: newKiosk.name.trim(),
        location: newKiosk.location || '',
        description: newKiosk.description || newKiosk.location || '',
        status: 'offline',
        active: newKiosk.active ?? true,
        is_active: newKiosk.active ?? true,
      };

      await configService.createKiosk(kioskToAdd);
      setShowAddModal(false);
      setNewKiosk({ status: 'offline', active: true });
      showNotification(`${kioskToAdd.kioskId} successfully created`);
      await loadKiosks();
    } catch (err: any) {
      alert(err.message || 'Error creating kiosk');
    }
  };

  const handleToggleActive = async (kiosk: Kiosk) => {
    const nextActive = !kiosk.active;
    try {
      await configService.updateKiosk(kiosk.kioskId, { active: nextActive, is_active: nextActive });
      showNotification(`${kiosk.kioskId} ${nextActive ? 'activated' : 'deactivated'}`);
      await loadKiosks();
    } catch (err: any) {
      alert(err.message || 'Failed to update kiosk status');
    }
  };

  const handleDelete = async (kiosk: Kiosk) => {
    const code = kiosk.kioskId || kiosk.kiosk_code || '';
    const name = kiosk.name || kiosk.kiosk_name || code;
    if (confirm(`Are you sure you want to delete ${code} (${name})?`)) {
      try {
        setKiosks((prev) => prev.filter((k) => (k.kioskId !== code && k.kiosk_code !== code && k.id !== kiosk.id)));
        await configService.deleteKiosk(code, kiosk.id);
        showNotification(`${code} deleted successfully`);
        await loadKiosks();
      } catch (err: any) {
        alert(err.message || 'Failed to delete kiosk');
        await loadKiosks();
      }
    }
  };

  const handleSimulateHeartbeat = async (kiosk: Kiosk) => {
    try {
      await configService.sendHeartbeat(kiosk.kioskId, 'online');
      showNotification(`Heartbeat received from ${kiosk.kioskId} - marked online`);
      await loadKiosks();
    } catch (err: any) {
      alert(err.message || 'Heartbeat failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Kiosk Management</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Configure, monitor, and manage device identities and real-time status
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={loadKiosks}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              backgroundColor: 'var(--bg-card-dark)', color: 'var(--text-primary)',
              padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
              border: '1px solid var(--border-subtle)', cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem',
              borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: 600
            }}
          >
            <Plus size={16} /> Add Kiosk
          </button>
        </div>
      </div>

      {actionMessage && (
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid #3b82f6',
          color: '#93c5fd',
          padding: '0.75rem 1rem',
          borderRadius: '0.375rem',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          {actionMessage}
        </div>
      )}

      <div style={{ backgroundColor: 'var(--bg-card-dark)', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: 'var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Kiosk Code</th>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Location</th>
              <th style={{ padding: '1rem' }}>Status (Live)</th>
              <th style={{ padding: '1rem' }}>Admin Control</th>
              <th style={{ padding: '1rem' }}>Last Seen</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {kiosks.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {loading ? 'Loading kiosks...' : 'No kiosks found. Click "Add Kiosk" to register your first device.'}
                </td>
              </tr>
            ) : (
              kiosks.map((kiosk) => (
                <tr key={kiosk.id || kiosk.kioskId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>
                    <code>{kiosk.kioskId || kiosk.kiosk_code}</code>
                  </td>
                  <td style={{ padding: '1rem' }}>{kiosk.name || kiosk.kiosk_name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{kiosk.location || kiosk.description || '-'}</td>
                  
                  {/* Status: online / offline / maintenance */}
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: kiosk.status === 'online' ? '#064e3b' : kiosk.status === 'maintenance' ? '#78350f' : '#27272a',
                      color: kiosk.status === 'online' ? '#34d399' : kiosk.status === 'maintenance' ? '#fde047' : '#a1a1aa'
                    }}>
                      <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        backgroundColor: kiosk.status === 'online' ? '#34d399' : kiosk.status === 'maintenance' ? '#fde047' : '#71717a'
                      }} />
                      {kiosk.status ? kiosk.status.toUpperCase() : 'OFFLINE'}
                    </span>
                  </td>

                  {/* is_active: enabled / disabled by Admin */}
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => handleToggleActive(kiosk)}
                      title="Toggle administrative active state"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem',
                        border: 'none', cursor: 'pointer',
                        backgroundColor: kiosk.active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: kiosk.active ? '#60a5fa' : '#f87171'
                      }}
                    >
                      <Power size={12} />
                      {kiosk.active ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>

                  {/* Last seen */}
                  <td style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {kiosk.lastSeen || kiosk.last_seen
                      ? new Date(kiosk.lastSeen || kiosk.last_seen!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : 'Never'}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <Link
                      to={`/admin/kiosks/${kiosk.kioskId || kiosk.kiosk_code}/editor`}
                      title="Edit Kiosk Configuration"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '28px', height: '28px', borderRadius: '0.25rem',
                        backgroundColor: 'var(--bg-kiosk)', color: '#60a5fa', textDecoration: 'none'
                      }}
                    >
                      <Edit size={16} />
                    </Link>

                    <button
                      onClick={() => handleSimulateHeartbeat(kiosk)}
                      title="Simulate Kiosk Heartbeat (Test Ping)"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '28px', height: '28px', borderRadius: '0.25rem', border: 'none',
                        backgroundColor: 'var(--bg-kiosk)', color: '#34d399', cursor: 'pointer'
                      }}
                    >
                      <Activity size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(kiosk)}
                      title="Delete Kiosk"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '28px', height: '28px', borderRadius: '0.25rem', border: 'none',
                        backgroundColor: 'var(--bg-kiosk)', color: '#f87171', cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'var(--bg-card-dark)', padding: '2rem', borderRadius: '0.5rem', width: '420px', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Add New Kiosk</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Assign a unique identifier and location for the new device.
            </p>
            <form onSubmit={handleAddKiosk} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.875rem' }}>
                  Kiosk Code (Unique ID) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  required
                  type="text"
                  value={newKiosk.kioskId || ''}
                  onChange={(e) => setNewKiosk({ ...newKiosk, kioskId: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.25rem', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                  placeholder="e.g. KIOSK-004"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.875rem' }}>
                  Kiosk Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  required
                  type="text"
                  value={newKiosk.name || ''}
                  onChange={(e) => setNewKiosk({ ...newKiosk, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.25rem', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                  placeholder="e.g. Main Gate Kiosk 4"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.875rem' }}>Location / Description</label>
                <input
                  type="text"
                  value={newKiosk.location || ''}
                  onChange={(e) => setNewKiosk({ ...newKiosk, location: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.25rem', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-kiosk)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                  placeholder="e.g. South Gate Entrance Hall"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', border: '1px solid var(--border-subtle)', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '0.25rem', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 600 }}
                >
                  Save Kiosk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
