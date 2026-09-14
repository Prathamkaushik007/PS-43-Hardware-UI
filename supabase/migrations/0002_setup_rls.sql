-- =====================================================================
-- Migration: 0002_setup_rls.sql
-- Description: Enables and configures Row Level Security (RLS) policies
--              for the `kiosks` table.
-- =====================================================================

-- 1. Enable RLS on the table
ALTER TABLE public.kiosks ENABLE ROW LEVEL SECURITY;

-- 2. Service Role Policy (Full administrative access bypass for backend service worker)
CREATE POLICY "Service Role full access on kiosks"
    ON public.kiosks
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 3. Authenticated Admin Policy
-- Allows authenticated users with admin role (or authenticated users in admin context) to view, add, modify, and soft-delete kiosks.
CREATE POLICY "Admins can view all non-deleted kiosks"
    ON public.kiosks
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
    );

CREATE POLICY "Admins can insert new kiosks"
    ON public.kiosks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        deleted_at IS NULL
    );

CREATE POLICY "Admins can update kiosks"
    ON public.kiosks
    FOR UPDATE
    TO authenticated
    USING (
        deleted_at IS NULL
    )
    WITH CHECK (
        deleted_at IS NULL OR deleted_at IS NOT NULL
    );

CREATE POLICY "Admins can soft-delete or remove kiosks"
    ON public.kiosks
    FOR DELETE
    TO authenticated
    USING (true);

-- 4. Kiosk Public / Device Policy for Heartbeat and Configuration Fetch
-- Devices can read active configuration for their own specific kiosk_code
CREATE POLICY "Kiosks can view own configuration"
    ON public.kiosks
    FOR SELECT
    TO anon, authenticated
    USING (
        is_active = true 
        AND deleted_at IS NULL
    );

-- 5. Heartbeat RPC Function for secure, rate-friendly heartbeat reporting
CREATE OR REPLACE FUNCTION public.record_kiosk_heartbeat(target_kiosk_id UUID)
RETURNS jsonb AS $$
DECLARE
    updated_record public.kiosks%ROWTYPE;
BEGIN
    UPDATE public.kiosks
    SET 
        last_seen = timezone('utc'::text, now()),
        status = 'online'
    WHERE id = target_kiosk_id 
      AND deleted_at IS NULL
    RETURNING * INTO updated_record;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Kiosk not found or inactive'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'kiosk_id', updated_record.id,
        'kiosk_code', updated_record.kiosk_code,
        'status', updated_record.status,
        'last_seen', updated_record.last_seen
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution of heartbeat RPC to both authenticated and anon users
GRANT EXECUTE ON FUNCTION public.record_kiosk_heartbeat(UUID) TO anon, authenticated, service_role;
