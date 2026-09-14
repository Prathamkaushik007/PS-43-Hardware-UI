import { z } from 'zod';

export const kioskStatusSchema = z.enum(['online', 'offline', 'maintenance']);

export const kioskCodeSchema = z
  .string()
  .min(3, 'Kiosk code must be at least 3 characters')
  .max(50, 'Kiosk code cannot exceed 50 characters')
  .regex(/^[A-Za-z0-9_-]+$/, 'Kiosk code can only contain alphanumeric characters, underscores, and dashes')
  .transform((val) => val.trim().toUpperCase());

export const kioskNameSchema = z
  .string()
  .min(2, 'Kiosk name must be at least 2 characters')
  .max(255, 'Kiosk name cannot exceed 255 characters')
  .transform((val) => val.trim());

export const kioskDescriptionSchema = z
  .string()
  .max(1000, 'Description cannot exceed 1000 characters')
  .optional()
  .nullable();

export const kioskConfigurationSchema = z
  .record(z.unknown())
  .default({
    screenTitle: 'Welcome',
    language: 'en',
    theme: 'dark'
  });

export const createKioskSchema = z.object({
  kiosk_code: kioskCodeSchema,
  kiosk_name: kioskNameSchema,
  description: kioskDescriptionSchema,
  status: kioskStatusSchema.default('offline'),
  is_active: z.boolean().default(true),
  configuration: kioskConfigurationSchema.optional()
});

export const updateKioskSchema = z.object({
  kiosk_name: kioskNameSchema.optional(),
  description: kioskDescriptionSchema,
  status: kioskStatusSchema.optional(),
  is_active: z.boolean().optional(),
  configuration: kioskConfigurationSchema.optional()
});

export const kioskHeartbeatSchema = z.object({
  status: z.enum(['online', 'maintenance']).optional().default('online')
});

export const uuidParamSchema = z
  .string()
  .uuid('Invalid Kiosk ID format. Must be a valid UUID');
