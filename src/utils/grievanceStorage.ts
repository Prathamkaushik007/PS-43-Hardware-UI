import type { GrievanceTicket } from './aiClassifier';

export interface StoredGrievance extends GrievanceTicket {
  mediaBlob?: Blob;
  mediaBlobUrl?: string | null;
  savedTimestamp: number;
}

const DB_NAME = 'KioskGrievanceLocalDB';
const DB_VERSION = 1;
const STORE_NAME = 'grievances';
const LOCAL_STORAGE_BACKUP_KEY = 'kiosk_saved_grievances_meta';

// Helper to open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'ticketId' });
        store.createIndex('savedTimestamp', 'savedTimestamp', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save a grievance ticket along with its recorded media to IndexedDB & localStorage
export async function saveGrievanceToLocalDB(
  ticket: GrievanceTicket,
  mediaUrl?: string | null
): Promise<void> {
  let mediaBlob: Blob | undefined = undefined;

  // If a blob url was provided, fetch the binary blob so it can be saved persistently
  if (mediaUrl) {
    try {
      const res = await fetch(mediaUrl);
      if (res.ok) {
        mediaBlob = await res.blob();
      }
    } catch (err) {
      console.debug('Could not fetch blob for storage:', err);
    }
  }

  const record: StoredGrievance = {
    ...ticket,
    mediaBlob,
    savedTimestamp: Date.now(),
  };

  // 1. Save to IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (idbErr) {
    console.warn('IndexedDB write failed, falling back to localStorage:', idbErr);
  }

  // 2. Also keep a lightweight metadata backup in localStorage
  try {
    const existing = getLocalGrievancesMeta();
    const metaList = [
      {
        ticketId: ticket.ticketId,
        category: ticket.category,
        subcategory: ticket.subcategory,
        department: ticket.department,
        priority: ticket.priority,
        summary: ticket.summary,
        citizenTranscript: ticket.citizenTranscript,
        mediaType: ticket.mediaType,
        createdAt: ticket.createdAt,
        kioskLocation: ticket.kioskLocation,
        hasMedia: Boolean(mediaBlob),
        savedTimestamp: Date.now(),
      },
      ...existing.filter(item => item.ticketId !== ticket.ticketId),
    ];
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(metaList.slice(0, 100)));
  } catch (lsErr) {
    console.debug('localStorage backup write error:', lsErr);
  }
}

// Get all stored grievances (with media blob URLs created for playback)
export async function getAllStoredGrievances(): Promise<StoredGrievance[]> {
  try {
    const db = await openDB();
    const records = await new Promise<StoredGrievance[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result as StoredGrievance[]);
      req.onerror = () => reject(req.error);
    });

    // Attach object URLs for any stored media blobs so they are playable in UI
    const processed = records.map(r => {
      let mediaBlobUrl: string | null = null;
      if (r.mediaBlob) {
        try {
          mediaBlobUrl = URL.createObjectURL(r.mediaBlob);
        } catch {}
      }
      return {
        ...r,
        mediaBlobUrl,
      };
    });

    // Sort newest first
    processed.sort((a, b) => (b.savedTimestamp || 0) - (a.savedTimestamp || 0));
    return processed;
  } catch (idbErr) {
    console.warn('IndexedDB read failed, falling back to localStorage meta:', idbErr);
    return getLocalGrievancesMeta().map(m => ({
      ...m,
      urgencyReason: '',
      estimatedResolutionDays: 3,
      mediaBlobUrl: null,
    }));
  }
}

// Delete a single grievance by ticketId
export async function deleteStoredGrievance(ticketId: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(ticketId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Delete from IndexedDB failed:', err);
  }

  // Also remove from localStorage backup
  try {
    const existing = getLocalGrievancesMeta();
    const filtered = existing.filter(g => g.ticketId !== ticketId);
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(filtered));
  } catch {}
}

// Clear all records from local DB
export async function clearAllStoredGrievances(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}

  try {
    localStorage.removeItem(LOCAL_STORAGE_BACKUP_KEY);
  } catch {}
}

// Synchronous helper for quick badge count from localStorage
export function getLocalGrievancesCount(): number {
  try {
    const meta = getLocalGrievancesMeta();
    return meta.length;
  } catch {
    return 0;
  }
}

// Helper to get localStorage meta
function getLocalGrievancesMeta(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Export all records as a downloadable JSON file
export async function exportGrievancesAsJSON(): Promise<void> {
  const records = await getAllStoredGrievances();
  const exportData = records.map(({ mediaBlob, mediaBlobUrl, ...rest }) => rest);
  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `kiosk_grievance_export_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
