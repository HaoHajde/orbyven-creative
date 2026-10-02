-- Production parity marker.
-- The canonical implementation is:
--   20261001234500_wave5_procurement_finance_bridge.sql
-- The canonical migration was corrected to use SQL special expressions
-- COALESCE/GREATEST without invalid pg_catalog qualification before the live
-- sync migration was applied.
select 1;
