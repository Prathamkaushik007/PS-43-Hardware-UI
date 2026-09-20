import { App } from '../../App';

export function AdminDashboard() {
  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <App hideAdminButton={true} />
    </div>
  );
}
