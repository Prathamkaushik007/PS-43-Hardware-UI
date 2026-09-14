-- =====================================================================
-- Migration: 0001_create_kiosks_table.sql
-- Description: Creates the core `kiosks` table with constraints, indexes,
--              and automatic timestamp management.
-- =====================================================================

-- Ensure pgcrypto extension for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create kiosks table
CREATE TABLE IF NOT EXISTS public.kiosks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kiosk_code VARCHAR(50) NOT NULL,
    kiosk_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'offline',
    is_active BOOLEAN NOT NULL DEFAULT true,
    configuration JSONB NOT NULL DEFAULT '{
        "screenTitle": "Welcome",
        "language": "en",
        "theme": "dark"
    }'::jsonb,
    last_seen TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ DEFAULT NULL,

    -- Constraints
    CONSTRAINT kiosks_kiosk_code_unique UNIQUE (kiosk_code),
    CONSTRAINT kiosks_status_check CHECK (status IN ('online', 'offline', 'maintenance'))
);

-- Comments on table and columns
COMMENT ON TABLE public.kiosks IS 'Registered kiosks managed by the Admin Panel.';
COMMENT ON COLUMN public.kiosks.id IS 'Primary key (UUID).';
COMMENT ON COLUMN public.kiosks.kiosk_code IS 'Unique kiosk device identifier (e.g. KIOSK-001, KIOSK-004).';
COMMENT ON COLUMN public.kiosks.kiosk_name IS 'Human-readable name of the kiosk location/purpose.';
COMMENT ON COLUMN public.kiosks.status IS 'Connectivity and operational status: online, offline, or maintenance.';
COMMENT ON COLUMN public.kiosks.is_active IS 'Administrative enablement flag. Separated from status.';
COMMENT ON COLUMN public.kiosks.configuration IS 'Dynamic extensible JSONB configuration for UI, themes, languages, etc.';
COMMENT ON COLUMN public.kiosks.last_seen IS 'Timestamp of the most recent heartbeat received from this kiosk.';
COMMENT ON COLUMN public.kiosks.deleted_at IS 'Soft-delete timestamp. NULL if active.';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kiosks_kiosk_code ON public.kiosks (kiosk_code);
CREATE INDEX IF NOT EXISTS idx_kiosks_status ON public.kiosks (status);
CREATE INDEX IF NOT EXISTS idx_kiosks_is_active ON public.kiosks (is_active);
CREATE INDEX IF NOT EXISTS idx_kiosks_deleted_at ON public.kiosks (deleted_at);
CREATE INDEX IF NOT EXISTS idx_kiosks_created_at ON public.kiosks (created_at DESC);

-- Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_kiosks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to kiosks
DROP TRIGGER IF EXISTS set_kiosks_updated_at ON public.kiosks;
CREATE TRIGGER set_kiosks_updated_at
    BEFORE UPDATE ON public.kiosks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_kiosks_updated_at();

-- Enable Supabase Realtime for kiosks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.kiosks;
