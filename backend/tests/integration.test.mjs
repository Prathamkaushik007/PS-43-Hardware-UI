// Comprehensive integration test verifying the exact test flow required in Section 22

const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('--- STARTING BACKEND INTEGRATION TEST SUITE ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name, details) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`, details || '');
      failed++;
    }
  }

  // 1. Health check
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    assert(res.status === 200 && data.data?.status === 'healthy', 'GET /api/health returns 200 Healthy', data);
  } catch (err) {
    assert(false, 'GET /api/health reachable', err.message);
  }

  // 2. Test 12: Try accessing Admin API without authorization -> Expected: 401
  try {
    const res = await fetch(`${BASE_URL}/api/kiosks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kiosk_code: 'KIOSK-UNAUTHORIZED',
        kiosk_name: 'Hacker Kiosk',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 401 && (data.error?.code === 'UNAUTHORIZED' || data.error?.code === 'INVALID_TOKEN'),
      'Test 12: Unauthorized POST /api/kiosks blocked with 401',
      { status: res.status, data }
    );
  } catch (err) {
    assert(false, 'Test 12: Unauthorized check', err.message);
  }

  // 3. GET all initial kiosks
  let initialKiosks = [];
  try {
    const res = await fetch(`${BASE_URL}/api/kiosks`);
    const data = await res.json();
    assert(res.status === 200 && Array.isArray(data.data), 'GET /api/kiosks returns list of kiosks', data);
    initialKiosks = data.data;
  } catch (err) {
    assert(false, 'GET /api/kiosks call', err.message);
  }

  // 4. Test 3 & 4: Admin creates Kiosk 4 (KIOSK-004) with admin auth
  let createdKioskId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/kiosks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'dev-admin-secret-key-change-in-production',
      },
      body: JSON.stringify({
        kiosk_code: 'KIOSK-004',
        kiosk_name: 'Kiosk 4',
        description: 'South Wing Gate 4',
        status: 'offline',
        is_active: true,
        configuration: {
          screenTitle: 'Welcome to Kiosk 4',
          language: 'en',
          theme: 'light',
        },
      }),
    });

    const data = await res.json();
    assert(
      res.status === 201 && data.data?.kiosk_code === 'KIOSK-004',
      'Test 4: Admin creates KIOSK-004 successfully',
      data
    );
    createdKioskId = data.data?.id;
  } catch (err) {
    assert(false, 'Test 4: Create Kiosk 4', err.message);
  }

  // 5. Test duplicate kiosk code rejection -> Expected: 409 Conflict
  try {
    const res = await fetch(`${BASE_URL}/api/kiosks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'dev-admin-secret-key-change-in-production',
      },
      body: JSON.stringify({
        kiosk_code: 'KIOSK-004',
        kiosk_name: 'Duplicate Kiosk 4',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 409 && data.error?.code === 'CONFLICT',
      'Duplicate kiosk_code KIOSK-004 rejected with 409 Conflict',
      { status: res.status, data }
    );
  } catch (err) {
    assert(false, 'Conflict check', err.message);
  }

  // 6. Test 5: Verify Kiosk 4 appears in the kiosk list
  try {
    const res = await fetch(`${BASE_URL}/api/kiosks`);
    const data = await res.json();
    const found = data.data?.find((k) => k.kiosk_code === 'KIOSK-004');
    assert(Boolean(found), 'Test 5: Kiosk 4 appears in GET /api/kiosks list', data.data);
  } catch (err) {
    assert(false, 'Test 5: List includes Kiosk 4', err.message);
  }

  // 7. Test 6 & 7: Admin selects KIOSK-004 and edits configuration
  try {
    const targetId = createdKioskId || 'KIOSK-004';
    const res = await fetch(`${BASE_URL}/api/kiosks/${targetId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'dev-admin-secret-key-change-in-production',
      },
      body: JSON.stringify({
        configuration: {
          screenTitle: 'Special Grievance Portal',
          language: 'hi',
          theme: 'dark',
          version: 2,
        },
      }),
    });

    const data = await res.json();
    assert(
      res.status === 200 && data.data?.configuration?.theme === 'dark',
      'Test 7 & 8: Admin updates configuration for KIOSK-004',
      data
    );
  } catch (err) {
    assert(false, 'Update config', err.message);
  }

  // 8. Test 10: Kiosk 4 sends heartbeat
  try {
    const targetId = createdKioskId || 'KIOSK-004';
    const res = await fetch(`${BASE_URL}/api/kiosks/${targetId}/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'online' }),
    });

    const data = await res.json();
    assert(
      res.status === 200 && data.data?.status === 'online' && Boolean(data.data?.last_seen),
      'Test 10: Kiosk 4 sends heartbeat and status becomes online',
      data
    );
  } catch (err) {
    assert(false, 'Heartbeat test', err.message);
  }

  // 9. Test 11: Admin Panel shows the correct online/offline state
  try {
    const targetId = createdKioskId || 'KIOSK-004';
    const res = await fetch(`${BASE_URL}/api/kiosks/${targetId}`);
    const data = await res.json();
    assert(
      res.status === 200 && data.data?.status === 'online' && data.data?.is_active === true,
      'Test 11: Single kiosk verification confirms online status and is_active=true',
      data
    );
  } catch (err) {
    assert(false, 'Kiosk single status check', err.message);
  }

  console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) process.exit(1);
}

runTests();
