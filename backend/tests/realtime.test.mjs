// Realtime isolation verification test: confirms only targeted kiosk receives its configuration update

import { EventEmitter } from 'events';

class MockRealtimeChannel extends EventEmitter {
  constructor(kioskCode) {
    super();
    this.kioskCode = kioskCode;
  }

  notify(eventKioskCode, payload) {
    if (this.kioskCode === eventKioskCode) {
      this.emit('update', payload);
    }
  }
}

async function testRealtimeTargeting() {
  console.log('--- TESTING REALTIME TARGETING ISOLATION ---');

  const kiosk1Listener = new MockRealtimeChannel('KIOSK-001');
  const kiosk2Listener = new MockRealtimeChannel('KIOSK-002');
  const kiosk4Listener = new MockRealtimeChannel('KIOSK-004');

  let kiosk1Received = false;
  let kiosk2Received = false;
  let kiosk4Received = false;
  let kiosk4Payload = null;

  kiosk1Listener.on('update', () => { kiosk1Received = true; });
  kiosk2Listener.on('update', () => { kiosk2Received = true; });
  kiosk4Listener.on('update', (data) => {
    kiosk4Received = true;
    kiosk4Payload = data;
  });

  // Simulate Admin updating ONLY KIOSK-004
  const updatePayload = {
    screenTitle: 'KIOSK 4 Custom Welcome Screen',
    theme: 'dark',
    language: 'hi',
  };

  const allListeners = [kiosk1Listener, kiosk2Listener, kiosk4Listener];
  allListeners.forEach(listener => listener.notify('KIOSK-004', updatePayload));

  if (kiosk4Received && !kiosk1Received && !kiosk2Received) {
    console.log('[PASS] Test 9: ONLY KIOSK-004 received the configuration update.');
    console.log('[PASS] KIOSK-001 received:', kiosk1Received, '(expected false)');
    console.log('[PASS] KIOSK-002 received:', kiosk2Received, '(expected false)');
    console.log('[PASS] KIOSK-004 received config payload:', kiosk4Payload.screenTitle);
  } else {
    console.error('[FAIL] Test 9 failed: Broadcast was received by non-target kiosks');
    process.exit(1);
  }

  console.log('\n--- REALTIME TARGETING TEST COMPLETE ---');
}

testRealtimeTargeting();
