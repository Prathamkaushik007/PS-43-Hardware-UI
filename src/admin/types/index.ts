export type KioskStatus = 'online' | 'offline' | 'maintenance';

export type Kiosk = {
  id: string;
  kioskId: string;
  kiosk_code?: string;
  name: string;
  kiosk_name?: string;
  location?: string;
  description?: string;
  status: KioskStatus;
  active: boolean;
  is_active?: boolean;
  configuration?: Record<string, any>;
  lastSeen?: string;
  last_seen?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};


export type ScreenOption = {
  id: string;
  title: { hi: string; en: string };
  description?: { hi?: string; en?: string };
  icon?: string;
  enabled: boolean;
  displayOrder: number;
  actionType: string;
};

export type KioskScreenConfig = {
  heading: { hi: string; en: string };
  subheading: { hi: string; en: string };
  instructions?: { hi?: string; en?: string };
  helpText?: { hi?: string; en?: string };
  introductionText?: { hi?: string; en?: string };
  options: ScreenOption[];
};

export type KioskConfiguration = {
  kioskId: string;
  version: number;
  config: KioskScreenConfig;
  status: 'draft' | 'published';
  updatedAt: string;
  updatedBy?: string;
};
