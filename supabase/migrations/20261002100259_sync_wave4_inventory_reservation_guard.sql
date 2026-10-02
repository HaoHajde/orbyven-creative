-- Production parity marker.
-- The canonical implementation is:
--   20261001232600_wave4_inventory_reservation_guard.sql
-- It was applied to the live ORBYVEN project under this sync version after
-- runtime drift was detected on 2026-10-02.
select 1;
