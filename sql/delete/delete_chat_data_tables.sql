-- First disable RLS on all tables
ALTER TABLE IF EXISTS chat_data.active_chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_data.active_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_data.historical_chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_data.historical_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_data.session_message_counts DISABLE ROW LEVEL SECURITY;

-- Revoke all permissions from authenticated users
REVOKE ALL PRIVILEGES ON SCHEMA chat_data FROM authenticated;
REVOKE ALL ON chat_data.active_chat_sessions FROM authenticated;
REVOKE ALL ON chat_data.active_chat_messages FROM authenticated;
REVOKE ALL ON chat_data.historical_chat_sessions FROM authenticated;
REVOKE ALL ON chat_data.historical_chat_messages FROM authenticated;
REVOKE ALL ON chat_data.session_message_counts FROM authenticated;

-- Revoke function execution permissions
REVOKE EXECUTE ON FUNCTION chat_data.get_paginated_sessions(INT, TIMESTAMPTZ) FROM authenticated;
REVOKE EXECUTE ON FUNCTION chat_data.get_latest_session_for_character(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION chat_data.get_paginated_messages(UUID, INT, INT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION chat_data.fetch_context_messages(UUID, INT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION chat_data.update_message(UUID, TEXT, TEXT, TEXT, INT, TEXT[]) FROM authenticated;

-- Drop RLS policies
DROP POLICY IF EXISTS active_chat_sessions_select_policy ON chat_data.active_chat_sessions;
DROP POLICY IF EXISTS active_chat_sessions_insert_policy ON chat_data.active_chat_sessions;
DROP POLICY IF EXISTS active_chat_sessions_update_policy ON chat_data.active_chat_sessions;
DROP POLICY IF EXISTS active_chat_sessions_delete_policy ON chat_data.active_chat_sessions;

DROP POLICY IF EXISTS active_chat_messages_select_policy ON chat_data.active_chat_messages;
DROP POLICY IF EXISTS active_chat_messages_insert_policy ON chat_data.active_chat_messages;
DROP POLICY IF EXISTS active_chat_messages_delete_policy ON chat_data.active_chat_messages;

DROP POLICY IF EXISTS historical_sessions_select_policy ON chat_data.historical_chat_sessions;
DROP POLICY IF EXISTS historical_sessions_insert_policy ON chat_data.historical_chat_sessions;
DROP POLICY IF EXISTS historical_sessions_update_policy ON chat_data.historical_chat_sessions;

DROP POLICY IF EXISTS historical_messages_select_policy ON chat_data.historical_chat_messages;
DROP POLICY IF EXISTS historical_messages_insert_policy ON chat_data.historical_chat_messages;
DROP POLICY IF EXISTS historical_messages_update_policy ON chat_data.historical_chat_messages;

DROP POLICY IF EXISTS session_message_counts_select_policy ON chat_data.session_message_counts;
DROP POLICY IF EXISTS session_message_counts_insert_policy ON chat_data.session_message_counts;
DROP POLICY IF EXISTS session_message_counts_update_policy ON chat_data.session_message_counts;
DROP POLICY IF EXISTS session_message_counts_delete_policy ON chat_data.session_message_counts;

-- Drop triggers
DROP TRIGGER IF EXISTS set_message_position_trigger ON chat_data.active_chat_messages;
DROP TRIGGER IF EXISTS update_session_latest_message_timestamp ON chat_data.active_chat_messages;
DROP TRIGGER IF EXISTS set_previous_sessions_for_migration ON chat_data.active_chat_sessions;
DROP TRIGGER IF EXISTS check_relevant_content_trigger ON chat_data.active_chat_messages;
DROP TRIGGER IF EXISTS check_anonymous_session_limit ON chat_data.active_chat_sessions;
DROP TRIGGER IF EXISTS check_anonymous_message_limit ON chat_data.active_chat_messages;
DROP TRIGGER IF EXISTS initialize_session_message_count ON chat_data.active_chat_sessions;
DROP TRIGGER IF EXISTS update_message_count_insert ON chat_data.active_chat_messages;
DROP TRIGGER IF EXISTS update_message_count_delete ON chat_data.active_chat_messages;

-- Drop indexes
DROP INDEX IF EXISTS chat_data.idx_user_active_sessions;
DROP INDEX IF EXISTS chat_data.idx_character_active_sessions;
DROP INDEX IF EXISTS chat_data.idx_active_chat_sessions_user_character_created;
DROP INDEX IF EXISTS chat_data.idx_sessions_user_activity;
DROP INDEX IF EXISTS chat_data.idx_active_message_stop_reason;
DROP INDEX IF EXISTS chat_data.idx_active_message_session_id;
DROP INDEX IF EXISTS chat_data.idx_active_chat_messages_session_created;
DROP INDEX IF EXISTS chat_data.idx_active_chat_messages_created_at;
DROP INDEX IF EXISTS chat_data.idx_messages_context_lookup;
DROP INDEX IF EXISTS chat_data.idx_user_historical_sessions;
DROP INDEX IF EXISTS chat_data.idx_character_historical_sessions;
DROP INDEX IF EXISTS chat_data.idx_character_historical_sessions_created_at;
DROP INDEX IF EXISTS chat_data.idx_historical_message_stop_reason;
DROP INDEX IF EXISTS chat_data.idx_historical_message_session_id;
DROP INDEX IF EXISTS chat_data.idx_historical_message_created_at;
DROP INDEX IF EXISTS chat_data.idx_historical_messages_context_lookup;

-- Drop all functions (order matters due to dependencies)
DROP FUNCTION IF EXISTS chat_data.update_message_count() CASCADE;
DROP FUNCTION IF EXISTS chat_data.check_anonymous_limits() CASCADE;
DROP FUNCTION IF EXISTS chat_data.initialize_message_count() CASCADE;
DROP FUNCTION IF EXISTS chat_data.check_relevant_content() CASCADE;
DROP FUNCTION IF EXISTS chat_data.check_backend_worker() CASCADE;
DROP FUNCTION IF EXISTS chat_data.set_message_position() CASCADE;
DROP FUNCTION IF EXISTS chat_data.fetch_context_messages(UUID, INT) CASCADE;
DROP FUNCTION IF EXISTS chat_data.background_migrate_session(UUID, INT) CASCADE;
DROP FUNCTION IF EXISTS chat_data.handle_new_session_migration() CASCADE;
DROP FUNCTION IF EXISTS chat_data.update_session_latest_message_timestamp() CASCADE;
DROP FUNCTION IF EXISTS chat_data.get_paginated_sessions(INT, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS chat_data.get_latest_session_for_character(UUID) CASCADE;
DROP FUNCTION IF EXISTS chat_data.get_paginated_messages(UUID, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS chat_data.update_message(UUID, TEXT, TEXT, TEXT, INT, TEXT[]) CASCADE;

-- Drop tables in correct dependency order
DROP TABLE IF EXISTS chat_data.session_message_counts CASCADE;
DROP TABLE IF EXISTS chat_data.historical_chat_messages CASCADE;
DROP TABLE IF EXISTS chat_data.historical_chat_sessions CASCADE;
DROP TABLE IF EXISTS chat_data.active_chat_messages CASCADE;
DROP TABLE IF EXISTS chat_data.active_chat_sessions CASCADE;

-- Drop the schema itself (uuid-ossp is preserved)
DROP SCHEMA IF EXISTS chat_data CASCADE;
