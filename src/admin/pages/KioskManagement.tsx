import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit } from 'lucide-react';
import { configService } from '../services/configurationService';
import type { Kiosk } from '../types';

export function KioskManagement() {
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKiosk, setNewKiosk] = useState<Partial<Kiosk>>({
    status: 'offline',
    active: true,
  });

  useEffect(() => {
    loadKiosks();
  }, []);

  const loadKiosks = async () => {
    const data = await configService.getKiosks();
    setKiosks(data);
  };

  const handleAddKiosk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKiosk.kioskId || !newKiosk.name) return;

    try {
      const kioskToAdd: Kiosk = {
        id: crypto.randomUUID(),
        kioskId: newKiosk.kioskId,
        name: newKiosk.name,
        location: newKiosk.location || '',
        description: newKiosk.description || '',
        status: 'offline',
        active: newKiosk.active ?? true,
      };
      await configService.createKiosk(kioskToAdd);
      setShowAddModal(false);
      setNewKiosk({ status: 'offline', active: true });
      loadKiosks();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Kiosk Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem',
            borderRadius: '0.375rem', border: 'none', cursor: 'pointer'
          }}
        >
          <Plus size={16} /> Add Kiosk
        </button>
      </div>

      <div style={{ backgroundColor: '#1f2937', borderRadius: '0.5rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#374151', color: '#9ca3af', fontSize: '0.875rem' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Kiosk ID</th>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Location</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {kiosks.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af' }}>
                  No kiosks found. Add one to get started.
                </td>
              </tr>
            ) : (
              kiosks.map((kiosk) => (
                <tr key={kiosk.id} style={{ borderBottom: '1px solid #374151' }}>
                  <td style={{ padding: '1rem' }}>{kiosk.kioskId}</td>
                  <td style={{ padding: '1rem' }}>{kiosk.name}</td>
                  <td style={{ padding: '1rem' }}>{kiosk.location || '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem',
                      backgroundColor: kiosk.active ? '#064e3b' : '#7f1d1d',
                      color: kiosk.active ? '#34d399' : '#fca5a5'
                    }}>
                      {kiosk.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/admin/kiosks/${kiosk.kioskId}/editor`} style={{ color: '#60a5fa', textDecoration: 'none' }}>
                      <Edit size={18} />
                    </Link>
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
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ backgroundColor: '#1f2937', padding: '2rem', borderRadius: '0.5rem', width: '400px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Add New Kiosk</h3>
            <form onSubmit={handleAddKiosk} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Kiosk ID</label>
                <input
                  required
                  type="text"
                  value={newKiosk.kioskId || ''}
                  onChange={(e) => setNewKiosk({ ...newKiosk, kioskId: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #4b5563', backgroundColor: '#374151', color: 'white' }}
                  placeholder="e.g. KIOSK-001"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Name</label>
                <input
                  required
                  type="text"
                  value={newKiosk.name || ''}
                  onChange={(e) => setNewKiosk({ ...newKiosk, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #4b5563', backgroundColor: '#374151', color: 'white' }}
                  placeholder="Main Entrance Kiosk"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Location</label>
                <input
                  type="text"
                  value={newKiosk.location || ''}
                  onChange={(e) => setNewKiosk({ ...newKiosk, location: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #4b5563', backgroundColor: '#374151', color: 'white' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', backgroundColor: '#374151', color: 'white', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}
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
