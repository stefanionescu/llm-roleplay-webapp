-- Ensure the extension for UUID generation is enabled if it is used in your tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create new schemas if they do not exist
CREATE SCHEMA IF NOT EXISTS private;

-- Grant schema usage to authenticated users
GRANT USAGE ON SCHEMA private TO authenticated;

-- Create tables within the private schema if they do not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'private' AND table_name = 'failed_downloads') THEN
    CREATE TABLE private.failed_downloads (
      id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
      platform text NOT NULL CHECK (platform IN ('tiktok', 'youtube')),
      profile_url text NOT NULL CHECK (
          profile_url LIKE 'https://www.youtube.com/@%' OR 
          profile_url LIKE 'https://www.tiktok.com/@%'
      ),
      apify_run_id text,
      profile_id text NOT NULL,
      post_url text NOT NULL CHECK (
          post_url LIKE 'https://www.youtube.com/shorts/%' OR 
          post_url ~ '^https://www\.tiktok\.com/@[\w.-]+/video/\d+$'
      ),
      main_hashtag text NOT NULL CHECK (
          main_hashtag ~ '^[a-z]{1,30}$'
      ),
      secondary_hashtags text[] NOT NULL CHECK (
          array_length(secondary_hashtags, 1) >= 1
      ),
      post_duration int,
      is_muted boolean DEFAULT false NOT NULL,
      specific_hashtags text[],
      post_description text,
      failure_explanation text
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_failed_downloads_post_url 
        ON private.failed_downloads(post_url);

    CREATE INDEX IF NOT EXISTS idx_failed_downloads_main_hashtag
        ON private.failed_downloads(main_hashtag);
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'private' AND table_name = 'successful_downloads') THEN
    CREATE TABLE private.successful_downloads (
      id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
      storage_object_id uuid NOT NULL REFERENCES storage.objects(id) ON DELETE CASCADE,
      bucket_id text NOT NULL CHECK (bucket_id LIKE '%-content'),
      platform text NOT NULL CHECK (platform IN ('tiktok', 'youtube')),
      profile_url text NOT NULL CHECK (
          profile_url LIKE 'https://www.youtube.com/@%' OR 
          profile_url LIKE 'https://www.tiktok.com/@%'
      ),
      profile_id text NOT NULL,
      post_url text NOT NULL CHECK (
          post_url LIKE 'https://www.youtube.com/shorts/%' OR 
          post_url ~ '^https://www\.tiktok\.com/@[\w.-]+/video/\d+$'
      ),
      post_duration int NOT NULL CHECK (
          post_duration > 0 AND 
          post_duration <= 150
      ),
      is_muted boolean NOT NULL DEFAULT false,
      main_hashtag text NOT NULL CHECK (
          main_hashtag ~ '^[a-z]{1,30}$'
      ),
      secondary_hashtags text[] NOT NULL CHECK (
          array_length(secondary_hashtags, 1) >= 1 AND
          array_length(secondary_hashtags, 1) <= 50 AND
          NOT (main_hashtag = ANY(secondary_hashtags))
      ),
      failed_to_analyze boolean NOT NULL DEFAULT false,
      scheduled_for_deletion boolean NOT NULL DEFAULT false,
      specific_hashtags text[] CHECK (
          array_length(specific_hashtags, 1) <= 50 AND
          NOT (main_hashtag = ANY(specific_hashtags))
      ),
      post_description text CHECK (
          length(post_description) <= 500
      ),
      music_title text,
      music_lyrics text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_successful_downloads_storage_object_id 
        ON private.successful_downloads(storage_object_id);

    CREATE INDEX IF NOT EXISTS idx_successful_downloads_post_url 
        ON private.successful_downloads(post_url);

    CREATE INDEX IF NOT EXISTS idx_successful_downloads_main_hashtag
        ON private.successful_downloads(main_hashtag);
  END IF;
END $$;

-- Grant ALL privileges on the table to authenticated users
GRANT ALL ON private.failed_downloads TO authenticated;
GRANT ALL ON private.successful_downloads TO authenticated;

-- Enable RLS
ALTER TABLE private.failed_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.successful_downloads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for failed_downloads
-- SELECT
CREATE POLICY select_failed_downloads ON private.failed_downloads
  FOR SELECT TO authenticated
  USING (
    (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

-- INSERT
CREATE POLICY insert_failed_downloads ON private.failed_downloads
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

-- UPDATE
CREATE POLICY update_failed_downloads ON private.failed_downloads
  FOR UPDATE TO authenticated
  USING (
    (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  )
  WITH CHECK (
    (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

-- DELETE
CREATE POLICY delete_failed_downloads ON private.failed_downloads
  FOR DELETE TO authenticated
  USING (
    (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

-- Create RLS policy for successful_downloads
CREATE POLICY "BACKEND WORKER full access" ON private.successful_downloads
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker')
  WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');
