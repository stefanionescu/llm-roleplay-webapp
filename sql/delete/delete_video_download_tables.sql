-- Disable RLS on tables
ALTER TABLE IF EXISTS private.failed_downloads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS private.successful_downloads DISABLE ROW LEVEL SECURITY;

-- Drop policies for failed_downloads
DROP POLICY IF EXISTS select_failed_downloads ON private.failed_downloads;
DROP POLICY IF EXISTS insert_failed_downloads ON private.failed_downloads;
DROP POLICY IF EXISTS update_failed_downloads ON private.failed_downloads; 
DROP POLICY IF EXISTS delete_failed_downloads ON private.failed_downloads;

-- Drop policy for successful_downloads
DROP POLICY IF EXISTS "BACKEND WORKER full access" ON private.successful_downloads;

-- Drop indexes for failed_downloads
DROP INDEX IF EXISTS private.idx_failed_downloads_post_url;
DROP INDEX IF EXISTS private.idx_failed_downloads_main_hashtag;

-- Drop indexes for successful_downloads
DROP INDEX IF EXISTS private.idx_successful_downloads_storage_object_id;
DROP INDEX IF EXISTS private.idx_successful_downloads_post_url;
DROP INDEX IF EXISTS private.idx_successful_downloads_main_hashtag;

-- Drop tables
DROP TABLE IF EXISTS private.failed_downloads;
DROP TABLE IF EXISTS private.successful_downloads;

-- Revoke privileges
REVOKE ALL ON SCHEMA private FROM authenticated;

-- Drop schema
DROP SCHEMA IF EXISTS private;