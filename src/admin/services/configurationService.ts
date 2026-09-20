import type { Kiosk, KioskConfiguration } from '../types';
import { supabase, isSupabaseConfigured } from '../../utils/supabaseClient';

const KIOSKS_KEY = 'admin_mock_kiosks';
const CONFIGS_KEY = 'admin_mock_configs';

const DEMO_KIOSK_CODES = new Set([
  'KIOSK-001', 'KIOSK-002', 'KIOSK-003', 'KIOSK-004',
  'KSK-001', 'KSK-002', 'KSK-003', 'KSK-004'
]);

class ConfigurationService {
  constructor() {
    this.purgeDemoDataFromStorage();
  }

  /**
   * Automatically cleans any cached demo kiosk records from localStorage
   */
  private purgeDemoDataFromStorage(): void {
    try {
      const raw = localStorage.getItem(KIOSKS_KEY);
      if (raw) {
        const parsed: Kiosk[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (k) => !DEMO_KIOSK_CODES.has(k.kioskId) && !DEMO_KIOSK_CODES.has(k.kiosk_code || '')
          );
          if (cleaned.length !== parsed.length) {
            this.setStorage(KIOSKS_KEY, cleaned);
          }
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('admin_token');
    const isAdminAuth = localStorage.getItem('admin_auth') === 'true';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-dev-admin': 'true',
      'x-admin-session': isAdminAuth ? 'true' : 'false',
      'x-admin-key': 'dev-admin-secret-key-change-in-production',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private getStorage<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Fetch all kiosks from Next.js backend, fallback to localStorage
   */
  async getKiosks(): Promise<Kiosk[]> {
    this.purgeDemoDataFromStorage();

    // 1. Try Backend API
    try {
      const res = await fetch('/api/kiosks', {
        headers: this.getAuthHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const nonDemo = json.data.filter(
            (item: any) => !DEMO_KIOSK_CODES.has(item.kiosk_code) && !DEMO_KIOSK_CODES.has(item.kioskId)
          );

          const mapped: Kiosk[] = nonDemo.map((item: any) => ({
            id: item.id,
            kioskId: item.kiosk_code || item.kioskId,
            kiosk_code: item.kiosk_code,
            name: item.kiosk_name || item.name,
            kiosk_name: item.kiosk_name,
            location: item.description || '',
            description: item.description || '',
            status: item.status || 'offline',
            active: item.is_active ?? item.active ?? true,
            is_active: item.is_active ?? item.active ?? true,
            configuration: item.configuration || {},
            lastSeen: item.last_seen || item.lastSeen,
            last_seen: item.last_seen || item.lastSeen,
          }));

          this.setStorage(KIOSKS_KEY, mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Backend API unavailable, using local cache:', err);
    }

    // 2. Direct Supabase fallback if configured
    try {
      if (isSupabaseConfigured() && supabase && typeof supabase.from === 'function') {
        const { data, error } = await supabase
          .from('kiosks')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const nonDemo = data.filter((item: any) => !DEMO_KIOSK_CODES.has(item.kiosk_code));
          const mapped: Kiosk[] = nonDemo.map((item: any) => ({
            id: item.id,
            kioskId: item.kiosk_code,
            kiosk_code: item.kiosk_code,
            name: item.kiosk_name,
            kiosk_name: item.kiosk_name,
            location: item.description || '',
            description: item.description || '',
            status: item.status || 'offline',
            active: item.is_active ?? true,
            is_active: item.is_active ?? true,
            configuration: item.configuration || {},
            lastSeen: item.last_seen,
            last_seen: item.last_seen,
          }));

          this.setStorage(KIOSKS_KEY, mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Supabase direct query notice:', err);
    }

    // 3. Fallback to storage
    const cached = this.getStorage<Kiosk[]>(KIOSKS_KEY, []);
    return cached.filter(
      (k) => !DEMO_KIOSK_CODES.has(k.kioskId) && !DEMO_KIOSK_CODES.has(k.kiosk_code || '')
    );
  }

  /**
   * Fetch single kiosk by ID or kiosk_code
   */
  async getKiosk(kioskId: string): Promise<Kiosk | null> {
    try {
      const res = await fetch(`/api/kiosks/${kioskId}`, {
        headers: this.getAuthHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const item = json.data;
          return {
            id: item.id,
            kioskId: item.kiosk_code || item.kioskId,
            kiosk_code: item.kiosk_code,
            name: item.kiosk_name || item.name,
            kiosk_name: item.kiosk_name,
            location: item.description || '',
            description: item.description || '',
            status: item.status || 'offline',
            active: item.is_active ?? item.active ?? true,
            is_active: item.is_active ?? item.active ?? true,
            configuration: item.configuration || {},
            lastSeen: item.last_seen || item.lastSeen,
            last_seen: item.last_seen || item.lastSeen,
          };
        }
      }
    } catch (err) {
      console.warn('Backend API single kiosk fetch error, falling back:', err);
    }

    const kiosks = await this.getKiosks();
    return kiosks.find((k) => k.kioskId === kioskId || k.id === kioskId) || null;
  }

  /**
   * Create a new kiosk via Next.js backend API
   */
  async createKiosk(kiosk: Kiosk): Promise<Kiosk> {
    const payload = {
      kiosk_code: (kiosk.kioskId || (kiosk as any).kiosk_code || '').trim().toUpperCase(),
      kiosk_name: (kiosk.name || (kiosk as any).kiosk_name || '').trim(),
      description: kiosk.location || kiosk.description || '',
      status: kiosk.status || 'offline',
      is_active: kiosk.active ?? kiosk.is_active ?? true,
      configuration: kiosk.configuration || {
        screenTitle: kiosk.name,
        language: 'en',
        theme: 'dark',
      },
    };

    let createdKiosk: Kiosk = {
      id: kiosk.id || crypto.randomUUID(),
      kioskId: payload.kiosk_code,
      kiosk_code: payload.kiosk_code,
      name: payload.kiosk_name,
      kiosk_name: payload.kiosk_name,
      location: payload.description,
      description: payload.description,
      status: payload.status,
      active: payload.is_active,
      is_active: payload.is_active,
      configuration: payload.configuration,
      lastSeen: undefined,
      last_seen: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    // 1. Send to Backend API
    try {
      const res = await fetch('/api/kiosks', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || `Failed to create kiosk (${res.status})`);
      }

      if (json.data) {
        createdKiosk = {
          id: json.data.id,
          kioskId: json.data.kiosk_code,
          kiosk_code: json.data.kiosk_code,
          name: json.data.kiosk_name,
          kiosk_name: json.data.kiosk_name,
          location: json.data.description || '',
          description: json.data.description || '',
          status: json.data.status,
          active: json.data.is_active,
          is_active: json.data.is_active,
          configuration: json.data.configuration,
          lastSeen: json.data.last_seen,
          last_seen: json.data.last_seen,
        };
      }
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        throw err;
      }
      console.warn('API creation notice, saving locally:', err);
    }

    // 2. Update local storage
    const currentList = this.getStorage<Kiosk[]>(KIOSKS_KEY, []);
    if (currentList.some((k) => k.kioskId === createdKiosk.kioskId)) {
      throw new Error(`Kiosk with ID ${createdKiosk.kioskId} already exists.`);
    }
    this.setStorage(KIOSKS_KEY, [...currentList, createdKiosk]);

    return createdKiosk;
  }

  /**
   * Update kiosk details
   */
  async updateKiosk(kioskId: string, partial: Partial<Kiosk>): Promise<void> {
    const payload: Record<string, any> = {};
    if (partial.name) payload.kiosk_name = partial.name;
    if (partial.description !== undefined) payload.description = partial.description;
    if (partial.location !== undefined) payload.description = partial.location;
    if (partial.status) payload.status = partial.status;
    if (partial.active !== undefined) payload.is_active = partial.active;
    if (partial.configuration) payload.configuration = partial.configuration;

    try {
      await fetch(`/api/kiosks/${kioskId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Error patching kiosk via API:', err);
    }

    // Update local cache
    const kiosks = this.getStorage<Kiosk[]>(KIOSKS_KEY, []);
    const updated = kiosks.map((k) => {
      if (k.kioskId === kioskId || k.id === kioskId) {
        return {
          ...k,
          ...partial,
          active: partial.active !== undefined ? partial.active : k.active,
          is_active: partial.active !== undefined ? partial.active : k.active,
        };
      }
      return k;
    });
    this.setStorage(KIOSKS_KEY, updated);
  }

  /**
   * Delete kiosk from backend, Supabase, and local cache
   */
  async deleteKiosk(kioskId: string, id?: string): Promise<void> {
    const identifier = id || kioskId;

    // 1. Delete via Backend API
    try {
      const res = await fetch(`/api/kiosks/${identifier}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!res.ok && id && kioskId && id !== kioskId) {
        // Retry with kioskId if id was used
        await fetch(`/api/kiosks/${kioskId}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        });
      }
    } catch (err) {
      console.warn('Backend API delete notice:', err);
    }

    // 2. Direct Supabase deletion if configured in frontend
    try {
      if (isSupabaseConfigured() && supabase && typeof supabase.from === 'function') {
        await supabase
          .from('kiosks')
          .delete()
          .or(`id.eq.${identifier},kiosk_code.eq.${kioskId}`);
      }
    } catch (err) {
      console.warn('Supabase direct delete notice:', err);
    }

    // 3. Purge from local cache immediately
    const kiosks = this.getStorage<Kiosk[]>(KIOSKS_KEY, []);
    const filtered = kiosks.filter(
      (k) => k.kioskId !== kioskId && k.kiosk_code !== kioskId && k.id !== identifier
    );
    this.setStorage(KIOSKS_KEY, filtered);
  }

  /**
   * Send heartbeat to backend
   */
  async sendHeartbeat(kioskId: string, status: 'online' | 'maintenance' = 'online'): Promise<void> {
    try {
      await fetch(`/api/kiosks/${kioskId}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.warn('Failed to send heartbeat:', err);
    }
  }

  /**
   * Get Kiosk Configuration
   */
  async getConfiguration(kioskId: string): Promise<KioskConfiguration | null> {
    const kiosk = await this.getKiosk(kioskId);
    if (kiosk && kiosk.configuration && Object.keys(kiosk.configuration).length > 0) {
      if (kiosk.configuration.screenConfig) {
        return {
          kioskId: kiosk.kioskId,
          version: kiosk.configuration.version || 1,
          config: kiosk.configuration.screenConfig,
          status: kiosk.configuration.status || 'published',
          updatedAt: kiosk.updated_at || new Date().toISOString(),
        };
      }
    }

    const configs = this.getStorage<Record<string, KioskConfiguration>>(CONFIGS_KEY, {});
    return configs[kioskId] || null;
  }

  /**
   * Save draft configuration
   */
  async saveDraft(config: KioskConfiguration): Promise<void> {
    config.status = 'draft';
    config.updatedAt = new Date().toISOString();

    const configs = this.getStorage<Record<string, KioskConfiguration>>(CONFIGS_KEY, {});
    configs[config.kioskId] = config;
    this.setStorage(CONFIGS_KEY, configs);

    await this.updateKiosk(config.kioskId, {
      configuration: {
        screenConfig: config.config,
        status: 'draft',
        version: config.version,
      },
    });
  }

  /**
   * Publish configuration to specific kiosk
   */
  async publish(config: KioskConfiguration): Promise<void> {
    config.status = 'published';
    config.updatedAt = new Date().toISOString();

    const configs = this.getStorage<Record<string, KioskConfiguration>>(CONFIGS_KEY, {});
    configs[config.kioskId] = config;
    this.setStorage(CONFIGS_KEY, configs);

    await this.updateKiosk(config.kioskId, {
      configuration: {
        screenConfig: config.config,
        status: 'published',
        version: config.version,
        updatedAt: config.updatedAt,
      },
    });
  }

  /**
   * Apply configuration to all active kiosks
   */
  async applyToAll(config: KioskConfiguration): Promise<void> {
    const kiosks = await this.getKiosks();
    const activeKiosks = kiosks.filter((k) => k.active || k.is_active);

    const configs = this.getStorage<Record<string, KioskConfiguration>>(CONFIGS_KEY, {});

    for (const kiosk of activeKiosks) {
      const clonedConfig: KioskConfiguration = {
        ...config,
        kioskId: kiosk.kioskId,
        status: 'published',
        updatedAt: new Date().toISOString(),
      };
      configs[kiosk.kioskId] = clonedConfig;

      await this.updateKiosk(kiosk.kioskId, {
        configuration: {
          screenConfig: config.config,
          status: 'published',
          version: config.version,
          updatedAt: clonedConfig.updatedAt,
        },
      });
    }

    this.setStorage(CONFIGS_KEY, configs);
  }

  /**
   * Real-time subscription to configuration changes for ONLY this specific kiosk
   */
  subscribeToKioskConfig(
    kioskCode: string,
    onConfigChange: (newConfig: any) => void
  ) {
    const channelName = `kiosk-sync-${kioskCode}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kiosks',
          filter: `kiosk_code=eq.${kioskCode}`,
        },
        (payload) => {
          if (payload.new && payload.new.configuration) {
            onConfigChange(payload.new.configuration);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const configService = new ConfigurationService();
