-- =====================================================================
-- Migration: cleanup_demo_kiosks.sql
-- Description: Safely removes ONLY demo/example kiosk entries
-- =====================================================================

DELETE FROM public.kiosks 
WHERE kiosk_code IN (
    'KIOSK-001', 'KIOSK-002', 'KIOSK-003', 'KIOSK-004',
    'KSK-001', 'KSK-002', 'KSK-003', 'KSK-004'
);
