/**
 * Comprehensive TypeScript types for the Kiosk Management System
 */

export type KioskStatus = 'online' | 'offline' | 'maintenance';

export interface KioskScreenOption {
  id: string;
  title: {
    en: string;
    hi: string;
    [key: string]: string;
  };
  description?: {
    en?: string;
    hi?: string;
    [key: string]: string | undefined;
  };
  icon?: string;
  enabled: boolean;
  displayOrder: number;
  actionType: string;
}

export interface KioskScreenConfig {
  heading: {
    en: string;
    hi: string;
    [key: string]: string;
  };
  subheading: {
    en: string;
    hi: string;
    [key: string]: string;
  };
  instructions?: {
    en?: string;
    hi?: string;
    [key: string]: string | undefined;
  };
  helpText?: {
    en?: string;
    hi?: string;
    [key: string]: string | undefined;
  };
  introductionText?: {
    en?: string;
    hi?: string;
    [key: string]: string | undefined;
  };
  options: KioskScreenOption[];
}

export interface KioskConfiguration {
  screenTitle?: string;
  language?: string;
  theme?: 'dark' | 'light';
  version?: number;
  status?: 'draft' | 'published';
  screenConfig?: KioskScreenConfig;
  customSettings?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Kiosk {
  id: string;
  kiosk_code: string;
  kiosk_name: string;
  description: string | null;
  status: KioskStatus;
  is_active: boolean;
  configuration: KioskConfiguration;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateKioskRequest {
  kiosk_code: string;
  kiosk_name: string;
  description?: string | null;
  status?: KioskStatus;
  is_active?: boolean;
  configuration?: KioskConfiguration;
}

export interface UpdateKioskRequest {
  kiosk_name?: string;
  description?: string | null;
  status?: KioskStatus;
  is_active?: boolean;
  configuration?: KioskConfiguration;
}

export interface KioskHeartbeatRequest {
  status?: 'online' | 'maintenance';
}

export interface KioskHeartbeatResponse {
  kiosk_id: string;
  kiosk_code: string;
  status: KioskStatus;
  last_seen: string;
}
