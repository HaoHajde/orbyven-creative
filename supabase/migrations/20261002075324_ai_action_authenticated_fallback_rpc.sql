-- Migration-history parity marker.
-- Production applied the authenticated Action fallback under version 20261002075324.
-- Its function definitions are tracked in 20261002074430_ai_action_authenticated_fallback_rpc.sql.
-- The later 20261002083824_ai_action_rpc_server_only_relock.sql intentionally
-- revokes authenticated execution and makes Agent Actions server-only again.
select 1;
