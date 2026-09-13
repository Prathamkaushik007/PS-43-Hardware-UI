export type Kiosk = {
  id: string;
  kioskId: string;
  name: string;
  location?: string;
  description?: string;
  status: 'online' | 'offline';
  active: boolean;
  lastSeen?: string;
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
