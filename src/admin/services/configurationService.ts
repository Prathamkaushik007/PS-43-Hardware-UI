import type { Kiosk, KioskConfiguration } from '../types';

const KIOSKS_KEY = 'admin_mock_kiosks';
const CONFIGS_KEY = 'admin_mock_configs';

class ConfigurationService {
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

  async getKiosks(): Promise<Kiosk[]> {
    return this.getStorage<Kiosk[]>(KIOSKS_KEY, []);
  }

  async getKiosk(kioskId: string): Promise<Kiosk | null> {
    const kiosks = await this.getKiosks();
    return kiosks.find(k => k.kioskId === kioskId) || null;
  }

  async createKiosk(kiosk: Kiosk): Promise<void> {
    const kiosks = await this.getKiosks();
    if (kiosks.some(k => k.kioskId === kiosk.kioskId)) {
      throw new Error(`Kiosk with ID ${kiosk.kioskId} already exists.`);
    }
    this.setStorage(KIOSKS_KEY, [...kiosks, kiosk]);
  }

  async getConfiguration(kioskId: string): Promise<KioskConfiguration | null> {
    const configs = this.getStorage<Record<string, KioskConfiguration>>(CONFIGS_KEY, {});
    return configs[kioskId] || null;
  }

  async saveDraft(config: KioskConfiguration): Promise<void> {
    config.status = 'draft';
    config.updatedAt = new Date().toISOString();
    
    const configs = this.getStorage<Record<string, KioskConfiguration>>(CONFIGS_KEY, {});
    configs[config.kioskId] = config;
    this.setStorage(CONFIGS_KEY, configs);
  }

  async publish(config: KioskConfiguration): Promise<void> {
    config.status = 'published';
    config.updatedAt = new Date().toISOString();
    
    const configs = this.getStorage<Record<string, KioskConfiguration>>(CONFIGS_KEY, {});
    configs[config.kioskId] = config;
    this.setStorage(CONFIGS_KEY, configs);
  }

  async applyToAll(config: KioskConfiguration): Promise<void> {
    const kiosks = await this.getKiosks();
    const activeKiosks = kiosks.filter(k => k.active);
    
    const configs = this.getStorage<Record<string, KioskConfiguration>>(CONFIGS_KEY, {});
    
    for (const kiosk of activeKiosks) {
      configs[kiosk.kioskId] = {
        ...config,
        kioskId: kiosk.kioskId,
        status: 'published',
        updatedAt: new Date().toISOString()
      };
    }
    
    this.setStorage(CONFIGS_KEY, configs);
  }
}

export const configService = new ConfigurationService();
