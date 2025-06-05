-- Create schemas if they don't exist
CREATE SCHEMA IF NOT EXISTS content_data;

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS pg_trgm
WITH
  SCHEMA content_data;

CREATE EXTENSION IF NOT EXISTS vector
WITH
  SCHEMA content_data;

-- Authentication functions that check for specific JWT roles
CREATE
OR REPLACE FUNCTION content_data.check_backend_worker () RETURNS void AS $$
BEGIN
    -- Check if the caller is using the service role
    IF auth.role() = 'service_role' THEN
        -- If it's the service role, allow access and exit the function
        RETURN;
    END IF;

    IF auth.jwt() ->> 'app_role' != 'backend_worker' THEN
        RAISE EXCEPTION 'Permission denied. Backend worker role required.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = content_data,
  pg_temp;

CREATE
OR REPLACE FUNCTION content_data.check_rag_middleware () RETURNS void AS $$
BEGIN
    -- Check if the caller is using the service role
    IF auth.role() = 'service_role' THEN
        -- If it's the service role, allow access and exit the function
        RETURN;
    END IF;

    IF auth.jwt() ->> 'app_role' != 'rag_middleware' THEN
        RAISE EXCEPTION 'Permission denied. RAG middleware role required.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = content_data,
  pg_temp;

-- Create core tables
CREATE TABLE IF NOT EXISTS
  content_data.full_content_descriptions (
    id uuid DEFAULT uuid_generate_v4 () PRIMARY KEY,
    storage_object_id uuid,
    platform text NOT NULL,
    main_hashtag text NOT NULL,
    secondary_hashtags text[] NOT NULL,
    specific_hashtags text[],
    post_url text NOT NULL,
    content text NOT NULL,
    CONSTRAINT fk_content_object FOREIGN KEY (storage_object_id) REFERENCES storage.objects (id) ON DELETE SET NULL
  );

-- Create translations table for full content
CREATE TABLE IF NOT EXISTS
  content_data.full_content_translations (
    id uuid DEFAULT uuid_generate_v4 () PRIMARY KEY,
    full_content_id uuid NOT NULL REFERENCES content_data.full_content_descriptions (id) ON DELETE CASCADE,
    language_code text NOT NULL,
    content text NOT NULL,
    UNIQUE (full_content_id, language_code)
  );

-- Create partitioned table for sectioned content with language support
CREATE TABLE IF NOT EXISTS
  content_data.sectioned_content_descriptions_partitioned (
    id uuid DEFAULT uuid_generate_v4 (),
    full_content_id uuid REFERENCES content_data.full_content_descriptions (id) ON DELETE CASCADE,
    content text NOT NULL,
    embedding content_data.vector (1024),
    all_hashtags text[],
    main_hashtag text,
    language_code text NOT NULL DEFAULT 'en',
    post_url text NOT NULL,
    storage_bucket_id text NOT NULL,
    storage_object_name text NOT NULL,
    PRIMARY KEY (id, main_hashtag, language_code)
  )
PARTITION BY
  LIST (main_hashtag);

-- Create active penalties table
CREATE TABLE IF NOT EXISTS content_data.active_penalties (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_content_id uuid NOT NULL REFERENCES content_data.full_content_descriptions(id) ON DELETE CASCADE,
    penalty float NOT NULL,
    last_used_at timestamptz NOT NULL,
    PRIMARY KEY (user_id, full_content_id)
);

-- Create content settings table
CREATE TABLE IF NOT EXISTS
  content_data.content_settings (
    id int PRIMARY KEY DEFAULT 1,
    max_anonymous_sessions int NOT NULL CHECK (
      max_anonymous_sessions > 0
      AND max_anonymous_sessions <= 10
    ) DEFAULT 3,
    max_anonymous_session_messages int NOT NULL CHECK (
      max_anonymous_session_messages > 0
      AND max_anonymous_session_messages <= 20
    ) DEFAULT 4,
    penalty_expiry_seconds int NOT NULL DEFAULT 604800, -- Default to 7 days
    penalty_value float NOT NULL CHECK (
      penalty_value > 0
      AND penalty_value <= 0.75
    ) DEFAULT 0.50,
    min_similarity float NOT NULL CHECK (
      min_similarity >= 0.1
      AND min_similarity <= 0.5
    ) DEFAULT 0.1,
    top_rag_result_multiplier int NOT NULL CHECK (
      top_rag_result_multiplier >= 1
      AND top_rag_result_multiplier <= 300
    ) DEFAULT 100
  );

-- Insert default content settings if not exists
INSERT INTO
  content_data.content_settings (id)
VALUES
  (1)
ON CONFLICT (id) DO NOTHING;

-- Create materialized view refresh control table with language support
CREATE TABLE IF NOT EXISTS
  content_data.mv_refresh_control (
    id uuid DEFAULT uuid_generate_v4 () PRIMARY KEY,
    language_code text NOT NULL,
    last_refresh_time timestamptz DEFAULT now(),
    refresh_interval interval DEFAULT '1 hour',
    is_refreshing boolean DEFAULT false,
    rows_since_last_refresh bigint DEFAULT 0,
    max_rows_before_refresh bigint DEFAULT 10000,
    refresh_duration interval DEFAULT '0 seconds',
    last_error text,
    last_error_time timestamptz,
    UNIQUE (language_code)
  );

-- Insert default English control record
INSERT INTO
  content_data.mv_refresh_control (language_code)
VALUES
  ('en')
ON CONFLICT (language_code) DO NOTHING;

-- Create indexes for full_content_descriptions
CREATE INDEX IF NOT EXISTS idx_full_content_platform ON content_data.full_content_descriptions (platform);

CREATE INDEX IF NOT EXISTS idx_full_content_main_hashtag ON content_data.full_content_descriptions (main_hashtag);

CREATE INDEX IF NOT EXISTS idx_full_content_secondary_hashtags ON content_data.full_content_descriptions USING GIN (secondary_hashtags);

CREATE INDEX IF NOT EXISTS idx_full_content_specific_hashtags ON content_data.full_content_descriptions USING GIN (specific_hashtags);

-- Create indexes for full_content_translations
CREATE INDEX IF NOT EXISTS idx_full_content_translations_lang ON content_data.full_content_translations (language_code, full_content_id);

-- Create indexes for active_penalties
CREATE INDEX IF NOT EXISTS idx_active_penalties_user_id ON content_data.active_penalties (user_id);
CREATE INDEX IF NOT EXISTS idx_active_penalties_full_content_id ON content_data.active_penalties (full_content_id);

-- Triggers for checking content added in full_content_descriptions
-- 1. Function to check valid bucket
CREATE
OR REPLACE FUNCTION content_data.check_valid_bucket () RETURNS TRIGGER AS $$
DECLARE
    bucket_id text;
BEGIN
    SELECT storage.objects.bucket_id INTO bucket_id
    FROM storage.objects
    WHERE storage.objects.id = NEW.storage_object_id
    FOR SHARE;

    IF bucket_id NOT LIKE '%-content' THEN
        RAISE EXCEPTION 'Invalid bucket for content object';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET
  search_path = content_data,
  pg_temp;

CREATE TRIGGER check_valid_bucket_trigger BEFORE INSERT
OR
UPDATE ON content_data.full_content_descriptions FOR EACH ROW
EXECUTE FUNCTION content_data.check_valid_bucket ();

-- 2. Function to check metadata match
CREATE
OR REPLACE FUNCTION content_data.check_metadata_match () RETURNS TRIGGER AS $$
DECLARE
    download_record private.successful_downloads;
BEGIN
    SELECT * INTO download_record
    FROM private.successful_downloads 
    WHERE storage_object_id = NEW.storage_object_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No matching record found in successful_downloads for storage_object_id: %', NEW.storage_object_id;
    END IF;

    IF download_record.failed_to_analyze IS NOT TRUE
        AND download_record.scheduled_for_deletion IS NOT TRUE
        AND NEW.platform = download_record.platform
        AND NEW.main_hashtag = download_record.main_hashtag
        AND NEW.secondary_hashtags = download_record.secondary_hashtags
        AND NEW.specific_hashtags IS NOT DISTINCT FROM download_record.specific_hashtags
        AND NEW.post_url = download_record.post_url THEN
        RETURN NEW;
    ELSE
        RAISE EXCEPTION 'Metadata mismatch between full_content_descriptions and successful_downloads, or content marked as failed/scheduled for deletion';
    END IF;
END;
$$ LANGUAGE plpgsql
SET
  search_path = content_data,
  pg_temp;

CREATE TRIGGER check_metadata_match_trigger BEFORE INSERT
OR
UPDATE ON content_data.full_content_descriptions FOR EACH ROW
EXECUTE FUNCTION content_data.check_metadata_match ();

-- Create a function to update the derived columns in sectioned_content_descriptions_partitioned table
CREATE
OR REPLACE FUNCTION content_data.update_sectioned_content_derived_columns () RETURNS TRIGGER AS $$
DECLARE
    v_secondary_hashtags text[];
    v_post_url text;
    v_storage_bucket_id text;
    v_storage_object_name text;
BEGIN    
    -- Fetch secondary_hashtags, post_url, and storage information from full_content_descriptions
    SELECT 
        fcd.secondary_hashtags,
        fcd.post_url,
        obj.bucket_id,
        obj.name
    INTO 
        v_secondary_hashtags,
        v_post_url,
        v_storage_bucket_id,
        v_storage_object_name
    FROM content_data.full_content_descriptions fcd
    LEFT JOIN storage.objects obj ON fcd.storage_object_id = obj.id
    WHERE fcd.id = NEW.full_content_id;

    -- Set main_hashtag if not already set (fallback to full_content_descriptions)
    IF NEW.main_hashtag IS NULL THEN
        SELECT main_hashtag INTO NEW.main_hashtag
        FROM content_data.full_content_descriptions
        WHERE id = NEW.full_content_id;
    END IF;

    -- Set post_url from parent
    NEW.post_url := v_post_url;

    -- Set storage information
    NEW.storage_bucket_id := v_storage_bucket_id;
    NEW.storage_object_name := v_storage_object_name;

    -- Set all_hashtags:
    -- Combine main_hashtag with secondary_hashtags, avoiding duplicates
    NEW.all_hashtags := CASE 
        WHEN NEW.main_hashtag = ANY(v_secondary_hashtags) THEN 
            v_secondary_hashtags
        ELSE 
            ARRAY[NEW.main_hashtag] || v_secondary_hashtags
    END;

    -- Ensure language_code is set
    IF NEW.language_code IS NULL THEN
        RAISE EXCEPTION 'language_code must be specified';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET
  search_path = content_data,
  pg_temp;

CREATE TRIGGER update_sectioned_content_derived_columns_trigger BEFORE INSERT
OR
UPDATE ON content_data.sectioned_content_descriptions_partitioned FOR EACH ROW
EXECUTE FUNCTION content_data.update_sectioned_content_derived_columns ();

-- Trigger for creating partitions by hashtag and language
CREATE
OR REPLACE FUNCTION content_data.create_partition_if_not_exists (hashtag text, language_code text DEFAULT 'en') RETURNS void AS $$
DECLARE
    partition_name text;
    language_partition_name text;
BEGIN
    -- Add advisory lock at start
    PERFORM pg_advisory_xact_lock(hashtext('create_partition_' || hashtag || '_' || language_code));
    
    -- Normalize names
    partition_name := 'sectioned_content_' || 
                     regexp_replace(lower(hashtag), '[^a-z0-9]+', '_', 'g');
    language_partition_name := partition_name || '_' || language_code;
    
    -- Create hashtag partition if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_class WHERE relname = partition_name) THEN
        EXECUTE format(
            'CREATE TABLE content_data.%I PARTITION OF content_data.sectioned_content_descriptions_partitioned 
             FOR VALUES IN (%L) 
             PARTITION BY LIST (language_code)',
            partition_name,
            hashtag
        );
        
        -- Always create English partition for the hashtag
        EXECUTE format(
            'CREATE TABLE content_data.%I PARTITION OF content_data.%I 
             FOR VALUES IN (%L)',
            partition_name || '_en',
            partition_name,
            'en'
        );
        
        -- Create indexes for English partition
        EXECUTE format(
            'CREATE INDEX %I ON content_data.%I USING hnsw (embedding content_data.vector_cosine_ops) WITH (
                m = 16,
                ef_construction = 256
            )',
            'idx_' || partition_name || '_en_embedding_hnsw',
            partition_name || '_en'
        );
        
        EXECUTE format(
            'CREATE INDEX %I ON content_data.%I (full_content_id)',
            'idx_' || partition_name || '_en_full_content_id',
            partition_name || '_en'
        );
        
        EXECUTE format(
            'CREATE INDEX %I ON content_data.%I USING GIN (all_hashtags)',
            'idx_' || partition_name || '_en_all_hashtags',
            partition_name || '_en'
        );
    END IF;

    -- Create language partition if it doesn't exist and isn't English
    IF language_code != 'en' AND NOT EXISTS (SELECT FROM pg_class WHERE relname = language_partition_name) THEN
        EXECUTE format(
            'CREATE TABLE content_data.%I PARTITION OF content_data.%I 
             FOR VALUES IN (%L)',
            language_partition_name,
            partition_name,
            language_code
        );
        
        -- Create indexes for non-English partition
        EXECUTE format(
            'CREATE INDEX %I ON content_data.%I USING hnsw (embedding content_data.vector_cosine_ops) WITH (
                m = 16,
                ef_construction = 256
            )',
            'idx_' || language_partition_name || '_embedding_hnsw',
            language_partition_name
        );
        
        EXECUTE format(
            'CREATE INDEX %I ON content_data.%I (full_content_id)',
            'idx_' || language_partition_name || '_full_content_id',
            language_partition_name
        );
        
        EXECUTE format(
            'CREATE INDEX %I ON content_data.%I USING GIN (all_hashtags)',
            'idx_' || language_partition_name || '_all_hashtags',
            language_partition_name
        );
    END IF;
END;
$$ LANGUAGE plpgsql
SET
  search_path = content_data,
  pg_temp;

-- Create partition trigger function
CREATE
OR REPLACE FUNCTION content_data.create_partition_trigger_function () RETURNS TRIGGER AS $$
DECLARE
    lang text;
BEGIN
    -- Always create English partition (for base content)
    BEGIN
        IF pg_try_advisory_xact_lock(hashtext('create_partition_' || NEW.main_hashtag || '_en')) THEN
            PERFORM content_data.create_partition_if_not_exists(NEW.main_hashtag, 'en');
        ELSE
            PERFORM pg_advisory_xact_lock(hashtext('create_partition_' || NEW.main_hashtag || '_en'));
            PERFORM content_data.create_partition_if_not_exists(NEW.main_hashtag, 'en');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error creating English partition for hashtag %: %', NEW.main_hashtag, SQLERRM;
        RAISE;
    END;

    -- Create partitions for all languages that have translations
    FOR lang IN 
        SELECT DISTINCT language_code 
        FROM content_data.full_content_translations 
        WHERE language_code != 'en'
    LOOP
        BEGIN
            IF pg_try_advisory_xact_lock(hashtext('create_partition_' || NEW.main_hashtag || '_' || lang)) THEN
                PERFORM content_data.create_partition_if_not_exists(NEW.main_hashtag, lang);
            ELSE
                PERFORM pg_advisory_xact_lock(hashtext('create_partition_' || NEW.main_hashtag || '_' || lang));
                PERFORM content_data.create_partition_if_not_exists(NEW.main_hashtag, lang);
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error creating partition for hashtag % and language %: %', NEW.main_hashtag, lang, SQLERRM;
        END;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET
  search_path = content_data,
  pg_temp;

-- Create the trigger on full_content_descriptions
CREATE TRIGGER create_partition_trigger BEFORE INSERT ON content_data.full_content_descriptions FOR EACH ROW
EXECUTE FUNCTION content_data.create_partition_trigger_function ();

-- Create trigger for English content insertion and subsequent materialized view creation
CREATE
OR REPLACE FUNCTION content_data.create_mv_for_english_content () RETURNS TRIGGER AS $$
BEGIN
    -- Ensure language exists in refresh control
    INSERT INTO content_data.mv_refresh_control(language_code)
    VALUES ('en')
    ON CONFLICT (language_code) DO NOTHING;
    
    -- Create/refresh materialized view
    PERFORM content_data.create_language_materialized_view('en');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET
  search_path = content_data,
  pg_temp;

CREATE TRIGGER create_mv_english_trigger
AFTER INSERT ON content_data.full_content_descriptions FOR EACH ROW
EXECUTE FUNCTION content_data.create_mv_for_english_content ();

-- Create trigger function for translations
CREATE
OR REPLACE FUNCTION content_data.create_translation_partition_trigger_function () RETURNS TRIGGER AS $$
DECLARE
    hashtag text;
BEGIN
    -- Get main_hashtag from parent content
    SELECT main_hashtag INTO hashtag
    FROM content_data.full_content_descriptions
    WHERE id = NEW.full_content_id;

    -- Create partition for this language if it doesn't exist
    BEGIN
        IF pg_try_advisory_xact_lock(hashtext('create_partition_' || hashtag || '_' || NEW.language_code)) THEN
            PERFORM content_data.create_partition_if_not_exists(hashtag, NEW.language_code);
        ELSE
            PERFORM pg_advisory_xact_lock(hashtext('create_partition_' || hashtag || '_' || NEW.language_code));
            PERFORM content_data.create_partition_if_not_exists(hashtag, NEW.language_code);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error creating partition for hashtag % and language %: %', hashtag, NEW.language_code, SQLERRM;
        RAISE;
    END;
    
    -- Ensure language exists in refresh control
    INSERT INTO content_data.mv_refresh_control(language_code)
    VALUES (NEW.language_code)
    ON CONFLICT (language_code) DO NOTHING;
    
    -- Create materialized view if it doesn't exist (but don't refresh if it does)
    PERFORM content_data.create_language_materialized_view(NEW.language_code);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET
  search_path = content_data,
  pg_temp;

-- Create the trigger on full_content_translations
CREATE TRIGGER create_translation_partition_trigger BEFORE INSERT ON content_data.full_content_translations FOR EACH ROW
EXECUTE FUNCTION content_data.create_translation_partition_trigger_function ();

-- Helper function to determine text search method
CREATE
OR REPLACE FUNCTION content_data.get_text_search_config (p_language_code text) RETURNS text AS $$
BEGIN
    RETURN CASE p_language_code
        WHEN 'ar' THEN 'arabic'
        WHEN 'da' THEN 'danish'
        WHEN 'nl' THEN 'dutch'
        WHEN 'en' THEN 'english'
        WHEN 'fi' THEN 'finnish'
        WHEN 'fr' THEN 'french'
        WHEN 'de' THEN 'german'
        WHEN 'el' THEN 'greek'
        WHEN 'hi' THEN 'hindi'
        WHEN 'hu' THEN 'hungarian'
        WHEN 'id' THEN 'indonesian'
        WHEN 'it' THEN 'italian'
        WHEN 'lt' THEN 'lithuanian'
        WHEN 'ne' THEN 'nepali'
        WHEN 'no' THEN 'norwegian'
        WHEN 'pt' THEN 'portuguese'
        WHEN 'ro' THEN 'romanian'
        WHEN 'ru' THEN 'russian'
        WHEN 'sr' THEN 'serbian'
        WHEN 'es' THEN 'spanish'
        WHEN 'sv' THEN 'swedish'
        WHEN 'tr' THEN 'turkish'
        ELSE NULL -- signals to use pattern matching instead
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER
SET
  search_path = content_data,
  pg_temp;

-- Create function to manage language-specific materialized views
CREATE
OR REPLACE FUNCTION content_data.create_language_materialized_view (p_language_code text) RETURNS void AS $$
DECLARE
    view_name text;
    search_config text;
BEGIN
    view_name := format('normalized_sectioned_content_descriptions_%s', p_language_code);
    search_config := content_data.get_text_search_config(p_language_code);

    -- Check if the materialized view already exists
    IF EXISTS (
        SELECT 1 
        FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = view_name 
        AND n.nspname = 'content_data'
    ) THEN
        -- If it exists, do nothing and return
        RETURN;
    END IF;

    -- Create the materialized view if it doesn't exist
    EXECUTE format(
        'CREATE MATERIALIZED VIEW content_data.%I AS
         SELECT
           id,
           full_content_id,
           content,
           embedding AS normalized_embedding,
           all_hashtags,
           main_hashtag,
           language_code,
           post_url,
           storage_bucket_id,
           storage_object_name
         FROM content_data.sectioned_content_descriptions_partitioned
         WHERE language_code = %L', 
        view_name, p_language_code
    );

    -- Create the indexes (existing indexes remain the same)
    EXECUTE format(
        'CREATE UNIQUE INDEX idx_%I_id ON content_data.%I (id)',
        view_name, view_name
    );

    -- Create different types of text search indexes based on language support
    IF search_config IS NOT NULL THEN
        EXECUTE format(
            'CREATE INDEX idx_%I_content ON content_data.%I USING GIN (to_tsvector(%L, content))',
            view_name, view_name, search_config
        );
    ELSE
        EXECUTE format(
            'CREATE INDEX idx_%I_content_trigram ON content_data.%I USING GIN (content gin_trgm_ops)',
            view_name, view_name
        );
    END IF;

    EXECUTE format(
        'CREATE INDEX idx_%I_embedding ON content_data.%I 
         USING hnsw (normalized_embedding content_data.vector_cosine_ops)
         WITH (m = 16, ef_construction = 256)',
        view_name, view_name
    );

    EXECUTE format(
        'CREATE INDEX idx_%I_hashtags ON content_data.%I USING GIN (all_hashtags)',
        view_name, view_name
    );

    EXECUTE format(
        'CREATE INDEX idx_%I_main_hashtag ON content_data.%I (main_hashtag)',
        view_name, view_name
    );

    -- Add index for post_url
    EXECUTE format(
        'CREATE INDEX idx_%I_post_url ON content_data.%I (post_url)',
        view_name, view_name
    );

    -- Add indexes for storage fields
    EXECUTE format(
        'CREATE INDEX idx_%I_storage_bucket ON content_data.%I (storage_bucket_id)',
        view_name, view_name
    );

    EXECUTE format(
        'CREATE INDEX idx_%I_storage_object ON content_data.%I (storage_object_name)',
        view_name, view_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = content_data,
  pg_temp;

-- Function to perform materialized view refresh for a specific language
CREATE
OR REPLACE FUNCTION content_data.perform_materialized_view_refresh (p_language_code text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = content_data,
  pg_temp
SET
  statement_timeout TO '1800s' AS $$
DECLARE
    start_time timestamptz;
    end_time timestamptz;
    duration interval;
BEGIN
    PERFORM content_data.check_backend_worker();

    start_time := clock_timestamp();

    -- Set the is_refreshing flag for this language
    UPDATE content_data.mv_refresh_control
    SET is_refreshing = true
    WHERE language_code = p_language_code;

    BEGIN
        -- Refresh the materialized view for this language
        EXECUTE format(
            'REFRESH MATERIALIZED VIEW CONCURRENTLY content_data.normalized_sectioned_content_descriptions_%s',
            p_language_code
        );

        end_time := clock_timestamp();
        duration := end_time - start_time;

        -- Update the control record
        UPDATE content_data.mv_refresh_control
        SET last_refresh_time = end_time,
            is_refreshing = false,
            rows_since_last_refresh = 0,
            refresh_duration = duration
        WHERE language_code = p_language_code;

        RAISE NOTICE 'Materialized view for language % refreshed successfully in %', p_language_code, duration;
    EXCEPTION
        WHEN others THEN
            RAISE WARNING 'Error refreshing materialized view for language %: %', p_language_code, SQLERRM;
            
            -- Update the control record to indicate refresh failure
            UPDATE content_data.mv_refresh_control
            SET is_refreshing = false,
                last_error = SQLERRM,
                last_error_time = clock_timestamp()
            WHERE language_code = p_language_code;
            
            -- Re-raise the exception
            RAISE EXCEPTION 'Materialized view refresh failed for language %: %', p_language_code, SQLERRM;
    END;
END;
$$;

-- Function to get all language-specific materialized views
CREATE
OR REPLACE FUNCTION content_data.get_language_materialized_views () RETURNS TABLE (
  view_name text,
  language_code text,
  last_refresh_time timestamptz,
  row_estimate bigint,
  total_size text
) LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = content_data,
  pg_temp AS $$
BEGIN
    PERFORM content_data.check_backend_worker();

    RETURN QUERY
    SELECT 
        c.relname::text as view_name,
        substring(c.relname from 'normalized_sectioned_content_descriptions_(.+)$') as language_code,
        mrc.last_refresh_time as last_refresh_time,
        c.reltuples::bigint as row_estimate,
        pg_size_pretty(pg_total_relation_size(c.oid)) as total_size
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN content_data.mv_refresh_control mrc 
        ON mrc.language_code = substring(c.relname from 'normalized_sectioned_content_descriptions_(.+)$')
    WHERE n.nspname = 'content_data'
    AND c.relkind = 'm'  -- materialized view
    AND c.relname LIKE 'normalized_sectioned_content_descriptions_%'
    ORDER BY c.relname;
END;
$$;

-- Create general util functions
-- 1. Create a function to get the current content settings
CREATE
OR REPLACE FUNCTION content_data.get_current_content_settings () RETURNS content_data.content_settings AS $$
DECLARE
    settings content_data.content_settings;
BEGIN
    SELECT * INTO settings
    FROM content_data.content_settings
    ORDER BY id DESC
    LIMIT 1;
    
    RETURN settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = content_data,
  pg_temp;

-- 2. Function that returns the size of all partitions in sectioned_content_descriptions_partitioned
CREATE
OR REPLACE FUNCTION content_data.get_partition_sizes (p_language_code text DEFAULT 'en') RETURNS TABLE (
  partition_name text,
  row_count bigint,
  total_size text
) LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = content_data,
  pg_temp AS $$
BEGIN
    PERFORM content_data.check_backend_worker();

    RETURN QUERY
    SELECT
        child.relname::text AS partition_name,
        child.reltuples::bigint AS row_count,
        pg_size_pretty(pg_total_relation_size(child.oid)) AS total_size
    FROM pg_inherits
    JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
    JOIN pg_class child ON pg_inherits.inhrelid = child.oid
    JOIN content_data.sectioned_content_descriptions_partitioned part 
        ON part.language_code = p_language_code 
        AND part.tableoid = child.oid
    WHERE parent.relname = 'sectioned_content_descriptions_partitioned'
    GROUP BY child.relname, child.reltuples, child.oid
    ORDER BY child.reltuples DESC;
END;
$$;

-- Create function to update params in the content_settings table
CREATE
OR REPLACE FUNCTION content_data.update_content_settings (
  p_max_anonymous_sessions int = NULL,
  p_max_anonymous_session_messages int = NULL,
  p_penalty_expiry_seconds int = NULL,
  p_penalty_value float = NULL,
  p_min_similarity float = NULL,
  p_top_rag_result_multiplier int = NULL
) RETURNS void AS $$
BEGIN
    PERFORM content_data.check_backend_worker();

    UPDATE content_data.content_settings
    SET
        max_anonymous_sessions = COALESCE(p_max_anonymous_sessions, max_anonymous_sessions),
        max_anonymous_session_messages = COALESCE(p_max_anonymous_session_messages, max_anonymous_session_messages),
        penalty_expiry_seconds = COALESCE(p_penalty_expiry_seconds, penalty_expiry_seconds),
        penalty_value = COALESCE(p_penalty_value, penalty_value),
        min_similarity = COALESCE(p_min_similarity, min_similarity),
        top_rag_result_multiplier = COALESCE(p_top_rag_result_multiplier, top_rag_result_multiplier)
    WHERE id = 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No content settings found to update';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = content_data,
  pg_temp;

-- Insert functions for RAG data
-- 1. Bulk insert function for full_content_descriptions and translations
CREATE
OR REPLACE FUNCTION content_data.bulk_insert_full_content (
  content_data json,
  p_language_code text DEFAULT 'en'
) RETURNS uuid[] AS $$
DECLARE
    inserted_ids uuid[];
BEGIN
    -- Check permissions
    PERFORM content_data.check_backend_worker();

    -- Validate inputs
    IF content_data IS NULL OR json_array_length(content_data) = 0 THEN
        RAISE EXCEPTION 'content_data cannot be null or empty';
    END IF;

    IF p_language_code IS NULL OR p_language_code = '' THEN
        RAISE EXCEPTION 'language_code cannot be null or empty';
    END IF;

    -- Set client encoding explicitly
    SET LOCAL client_encoding = 'UTF8';

    -- Handle English content differently from translations
    IF p_language_code = 'en' THEN
        WITH inserted AS (
            INSERT INTO content_data.full_content_descriptions (
                storage_object_id, platform, 
                main_hashtag, secondary_hashtags, specific_hashtags, 
                post_url, content
            )
            SELECT 
                (entry->>'storage_object_id')::uuid,
                entry->>'platform',
                entry->>'main_hashtag',
                string_to_array(NULLIF(trim(both '"' from (entry->>'secondary_hashtags')), ''), ','),
                string_to_array(entry->>'specific_hashtags', ','),
                entry->>'post_url',
                entry->>'content'
            FROM json_array_elements(content_data) AS entry
            RETURNING id
        )
        SELECT array_agg(id) INTO inserted_ids FROM inserted;
    ELSE
        -- Special handling for Korean translations
        IF p_language_code = 'ko' THEN
            WITH translations_inserted AS (
                INSERT INTO content_data.full_content_translations (
                    full_content_id,
                    language_code,
                    content
                )
                SELECT DISTINCT ON (fcd.id)
                    fcd.id,
                    p_language_code,
                    -- Use simpler conversion for Korean to avoid encoding overhead
                    convert_from(convert_to(entry->>'content', 'UTF8'), 'UTF8') COLLATE "C"
                FROM content_data.full_content_descriptions fcd
                INNER JOIN json_array_elements(content_data) entry 
                    ON fcd.storage_object_id = (entry->>'storage_object_id')::uuid
                WHERE NOT EXISTS (
                    SELECT 1 
                    FROM content_data.full_content_translations fct 
                    WHERE fct.full_content_id = fcd.id 
                    AND fct.language_code = p_language_code
                )
                RETURNING full_content_id
            )
            SELECT array_agg(full_content_id) INTO inserted_ids FROM translations_inserted;
        ELSE
            -- Normal handling for other translations
            WITH translations_inserted AS (
                INSERT INTO content_data.full_content_translations (
                    full_content_id,
                    language_code,
                    content
                )
                SELECT DISTINCT ON (fcd.id)
                    fcd.id,
                    p_language_code,
                    entry->>'content'
                FROM content_data.full_content_descriptions fcd
                INNER JOIN json_array_elements(content_data) entry 
                    ON fcd.storage_object_id = (entry->>'storage_object_id')::uuid
                WHERE NOT EXISTS (
                    SELECT 1 
                    FROM content_data.full_content_translations fct 
                    WHERE fct.full_content_id = fcd.id 
                    AND fct.language_code = p_language_code
                )
                RETURNING full_content_id
            )
            SELECT array_agg(full_content_id) INTO inserted_ids FROM translations_inserted;
        END IF;
    END IF;

    -- Validate we have inserted something
    IF array_length(inserted_ids, 1) IS NULL THEN
        RAISE EXCEPTION 'No records were inserted';
    END IF;
    
    RETURN inserted_ids;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in bulk_insert_full_content: %, SQLSTATE: %', SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET
  statement_timeout TO '120s'
SET
  search_path = content_data,
  pg_temp;

-- 2. Bulk insert function for sectioned_content_descriptions_partitioned
CREATE
OR REPLACE FUNCTION content_data.bulk_insert_sectioned_content (
  content_data json,
  p_language_code text DEFAULT 'en'
) RETURNS boolean AS $$
BEGIN
    -- Check permissions using the standard function
    PERFORM content_data.check_backend_worker();

    -- Validate inputs
    IF content_data IS NULL OR json_array_length(content_data) = 0 THEN
        RAISE EXCEPTION 'content_data cannot be null or empty';
    END IF;

    IF p_language_code IS NULL OR p_language_code = '' THEN
        RAISE EXCEPTION 'language_code cannot be null or empty';
    END IF;

    -- Special handling for Korean text
    IF p_language_code = 'ko' THEN
        -- Set Korean-specific collation and encoding
        SET LOCAL client_encoding = 'UTF8';
        
        -- Insert with Korean-specific handling
        WITH validated_data AS (
            SELECT 
                (entry->>'full_content_id')::uuid AS full_content_id,
                -- Use NVARCHAR cast for Korean text to avoid encoding issues
                convert_from(convert_to(entry->>'content', 'UTF8'), 'UTF8') COLLATE "C" AS content,
                (entry->>'embedding')::content_data.vector AS embedding,
                entry->>'main_hashtag' AS main_hashtag
            FROM json_array_elements(content_data) AS entry
            WHERE 
                (entry->>'full_content_id') IS NOT NULL AND
                (entry->>'content') IS NOT NULL AND
                (entry->>'embedding') IS NOT NULL AND
                (entry->>'main_hashtag') IS NOT NULL
        )
        INSERT INTO content_data.sectioned_content_descriptions_partitioned (
            full_content_id,
            content,
            embedding,
            main_hashtag,
            language_code
        )
        SELECT 
            full_content_id,
            content,
            embedding,
            main_hashtag,
            p_language_code
        FROM validated_data;
    ELSE
        -- Normal handling for non-Korean languages
        WITH validated_data AS (
            SELECT 
                (entry->>'full_content_id')::uuid AS full_content_id,
                entry->>'content' AS content,
                (entry->>'embedding')::content_data.vector AS embedding,
                entry->>'main_hashtag' AS main_hashtag
            FROM json_array_elements(content_data) AS entry
            WHERE 
                (entry->>'full_content_id') IS NOT NULL AND
                (entry->>'content') IS NOT NULL AND
                (entry->>'embedding') IS NOT NULL AND
                (entry->>'main_hashtag') IS NOT NULL
        )
        INSERT INTO content_data.sectioned_content_descriptions_partitioned (
            full_content_id,
            content,
            embedding,
            main_hashtag,
            language_code
        )
        SELECT 
            full_content_id,
            content,
            embedding,
            main_hashtag,
            p_language_code
        FROM validated_data;
    END IF;

    RETURN true;

EXCEPTION 
    WHEN insufficient_privilege THEN
        RAISE EXCEPTION 'Permission denied';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in bulk_insert_sectioned_content: %, SQLSTATE: %', SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql
SET
  statement_timeout TO '120s' SECURITY DEFINER
SET
  search_path = content_data,
  pg_temp;

-- 3. Function to retrieve a custom amount of entries from full_content_descriptions
CREATE
OR REPLACE FUNCTION content_data.get_full_content_paginated (
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0,
  p_language_code text DEFAULT 'en',
  p_content_id uuid DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  platform text,
  main_hashtag text,
  secondary_hashtags text[],
  specific_hashtags text[],
  post_url text,
  content text,
  content_language text,
  has_translation boolean,
  storage_object_id uuid
) LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = content_data,
  pg_temp AS $$
BEGIN
    PERFORM content_data.check_backend_worker();
    
    -- Validate parameters
    IF p_limit > 1000 THEN 
        RAISE EXCEPTION 'Limit cannot exceed 1000 records';
    END IF;
    
    IF p_limit < 1 THEN
        RAISE EXCEPTION 'Limit must be at least 1';
    END IF;
    
    IF p_offset < 0 THEN
        RAISE EXCEPTION 'Offset cannot be negative';
    END IF;

    -- Return paginated results with proper language handling
    RETURN QUERY
    WITH content_with_translations AS (
        SELECT 
            fcd.id,
            fcd.platform,
            fcd.main_hashtag,
            fcd.secondary_hashtags,
            fcd.specific_hashtags,
            fcd.post_url,
            fcd.content as original_content,
            fct.content as translated_content,
            fcd.storage_object_id,
            CASE 
                WHEN fct.content IS NOT NULL THEN p_language_code
                WHEN p_language_code = 'en' THEN 'en'
                ELSE NULL
            END as content_lang,
            (fct.content IS NOT NULL OR p_language_code = 'en') as translation_exists
        FROM content_data.full_content_descriptions fcd
        LEFT JOIN content_data.full_content_translations fct 
            ON fcd.id = fct.full_content_id 
            AND fct.language_code = p_language_code
        WHERE (p_content_id IS NULL OR fcd.id = p_content_id)
    )
    SELECT 
        cwt.id,
        cwt.platform,
        cwt.main_hashtag,
        cwt.secondary_hashtags,
        cwt.specific_hashtags,
        cwt.post_url,
        COALESCE(cwt.translated_content, cwt.original_content) as content,
        COALESCE(cwt.content_lang, 'en') as content_language,
        cwt.translation_exists as has_translation,
        cwt.storage_object_id 
    FROM content_with_translations cwt
    WHERE 
        CASE 
            WHEN p_language_code = 'en' THEN true
            ELSE cwt.translation_exists
        END
    ORDER BY cwt.id
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 4. Function to get translations for a specific content
CREATE
OR REPLACE FUNCTION content_data.get_content_translations (p_content_id uuid) RETURNS TABLE (language_code text, content text) LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = content_data,
  pg_temp AS $$
BEGIN
    PERFORM content_data.check_backend_worker();

    RETURN QUERY
    SELECT 
        fct.language_code,
        fct.content
    FROM content_data.full_content_translations fct
    WHERE fct.full_content_id = p_content_id;
END;
$$;

-- 5. Function to check if an entry exists in full_content_descriptions
CREATE
OR REPLACE FUNCTION content_data.is_in_full_content (p_storage_object_id uuid) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = content_data,
  pg_temp AS $$
BEGIN
    -- Parameter validation
    IF p_storage_object_id IS NULL THEN
        RAISE EXCEPTION 'Storage object ID cannot be null';
    END IF;

    -- Check backend worker role
    PERFORM content_data.check_backend_worker();
    
    -- Check if storage object exists in storage.objects first
    IF NOT EXISTS (
        SELECT 1 
        FROM storage.objects 
        WHERE id = p_storage_object_id
    ) THEN
        RAISE EXCEPTION 'Storage object with ID % does not exist', p_storage_object_id;
    END IF;

    -- Check existence in full_content_descriptions
    RETURN EXISTS (
        SELECT 1 
        FROM content_data.full_content_descriptions 
        WHERE storage_object_id = p_storage_object_id
        AND storage_object_id IS NOT NULL  -- Extra safety check
    );
END;
$$;

-- Common validation function
CREATE OR REPLACE FUNCTION content_data.validate_rag_parameters (
  p_user_id uuid,
  p_query_embedding content_data.vector (1024),
  p_language_code text,
  p_similarity_threshold float,
  p_max_results integer,
  p_hashtags text[] DEFAULT NULL,
  p_secondary_hashtags text[][] DEFAULT NULL
) RETURNS void AS $$
BEGIN
    -- Basic parameter validation
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID cannot be null';
    END IF;

    IF p_query_embedding IS NULL THEN
        RAISE EXCEPTION 'Query embedding cannot be null';
    END IF;

    IF p_language_code IS NULL OR NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_collation 
        WHERE collname LIKE p_language_code || '%'
    ) THEN
        RAISE EXCEPTION 'Invalid language code: %', p_language_code;
    END IF;

    IF p_similarity_threshold IS NULL 
        OR p_similarity_threshold <= 0 
        OR p_similarity_threshold > 1 
    THEN
        RAISE EXCEPTION 'Similarity threshold must be between 0 and 1';
    END IF;

    IF p_max_results IS NULL 
        OR p_max_results < 1 
        OR p_max_results > 20 
    THEN
        RAISE EXCEPTION 'Max results must be between 1 and 20';
    END IF;

    -- Optional parameter validation
    IF p_hashtags IS NOT NULL THEN
        IF array_length(p_hashtags, 1) = 0 THEN
            RAISE EXCEPTION 'Hashtags array cannot be empty if provided';
        END IF;
        
        IF array_length(p_hashtags, 1) > 20 THEN
            RAISE EXCEPTION 'Too many hashtags provided (max 20)';
        END IF;
    END IF;

    IF p_secondary_hashtags IS NOT NULL THEN
        IF array_length(p_secondary_hashtags, 1) > 20 THEN
            RAISE EXCEPTION 'Too many secondary hashtag arrays provided (max 20)';
        END IF;

        IF array_length(p_secondary_hashtags, 1) IS NOT NULL THEN
            FOR i IN 1..array_length(p_secondary_hashtags, 1) LOOP
                IF p_secondary_hashtags[i] IS NOT NULL 
                   AND array_length(p_secondary_hashtags[i], 1) > 20 THEN
                    RAISE EXCEPTION 'Too many secondary hashtags in array % (max 20)', i;
                END IF;
            END LOOP;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER
SET search_path = content_data, pg_temp;

-- 1. Basic similarity search with storage fields
CREATE OR REPLACE FUNCTION content_data.search_similar_content_with_penalties (
  p_user_id uuid,
  query_embedding content_data.vector (1024),
  p_language_code text DEFAULT 'en',
  similarity_threshold float DEFAULT 0.75,
  max_results integer DEFAULT 3
) RETURNS TABLE (
  id uuid,
  full_content_id uuid,
  content text,
  similarity float,
  post_url text,
  storage_bucket_id text,
  storage_object_name text
) LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = content_data,
  pg_temp
SET
  statement_timeout = '5s' AS $$
DECLARE
    v_min_similarity float;
    v_top_multiplier int;
    v_penalty_expiry_seconds int;
    v_view_name text;
BEGIN
    -- Validate parameters
    PERFORM content_data.validate_rag_parameters(
        p_user_id, query_embedding, p_language_code, 
        similarity_threshold, max_results
    );

    -- Check permissions
    PERFORM content_data.check_rag_middleware();

    -- Get settings once
    SELECT 
        min_similarity, 
        top_rag_result_multiplier,
        penalty_expiry_seconds
    INTO 
        v_min_similarity, 
        v_top_multiplier,
        v_penalty_expiry_seconds
    FROM content_data.get_current_content_settings();

    -- Verify view exists and get name
    v_view_name := format('normalized_sectioned_content_descriptions_%s', p_language_code);
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = v_view_name 
        AND n.nspname = 'content_data'
    ) THEN
        RAISE EXCEPTION 'Materialized view % does not exist', v_view_name;
    END IF;

    BEGIN
        RETURN QUERY EXECUTE format(
            'WITH initial_scores AS (
                SELECT 
                    nscd.id AS result_id,
                    nscd.full_content_id AS result_full_content_id,
                    nscd.content AS result_content,
                    1 - (nscd.normalized_embedding <=> $1) AS initial_score,
                    nscd.post_url AS result_post_url,
                    nscd.storage_bucket_id AS result_storage_bucket_id,
                    nscd.storage_object_name AS result_storage_object_name
                FROM content_data.%I nscd
                WHERE 1 - (nscd.normalized_embedding <=> $1) > $2
                ORDER BY 1 - (nscd.normalized_embedding <=> $1) DESC
                LIMIT ($3 * $4)
            ),
            penalties AS (
                SELECT ap.full_content_id, ap.penalty
                FROM content_data.active_penalties ap
                WHERE ap.user_id = $5
                AND ap.full_content_id = ANY (
                    SELECT result_full_content_id FROM initial_scores
                )
                AND ap.last_used_at > (CURRENT_TIMESTAMP - make_interval(secs => $6))
            ),
            final_scores AS (
                SELECT 
                    i.result_id,
                    i.result_full_content_id,
                    i.result_content,
                    CASE
                        WHEN i.initial_score <= COALESCE(p.penalty, 0) THEN $7
                        ELSE i.initial_score - COALESCE(p.penalty, 0)
                    END AS similarity,
                    i.result_post_url,
                    i.result_storage_bucket_id,
                    i.result_storage_object_name
                FROM initial_scores i
                LEFT JOIN penalties p ON i.result_full_content_id = p.full_content_id
                WHERE CASE
                    WHEN i.initial_score <= COALESCE(p.penalty, 0) THEN $7
                    ELSE i.initial_score - COALESCE(p.penalty, 0)
                END > $2
            )
            SELECT *
            FROM final_scores
            ORDER BY similarity DESC, result_id
            LIMIT $3',
            v_view_name
        )
        USING 
            query_embedding,
            similarity_threshold,
            max_results,
            v_top_multiplier,
            p_user_id,
            v_penalty_expiry_seconds,
            v_min_similarity;
    END;
END;
$$;

-- 2. Similarity search with hashtags and storage fields
CREATE OR REPLACE FUNCTION content_data.search_similar_content_with_hashtags_and_penalties(
    hashtags text[],
    secondary_hashtags text[],
    hashtag_groups int[],
    p_user_id uuid,
    query_embedding content_data.vector(1024),
    p_language_code text DEFAULT 'en',
    similarity_threshold float DEFAULT 0.75,
    max_results integer DEFAULT 3
) RETURNS TABLE (
    id uuid,
    full_content_id uuid,
    content text,
    similarity float,
    matching_hashtags text[],
    post_url text,
    storage_bucket_id text,
    storage_object_name text
) LANGUAGE plpgsql STABLE SECURITY DEFINER 
SET search_path = content_data, pg_temp AS $$
DECLARE
    v_min_similarity float;
    v_top_multiplier int;
    v_penalty_expiry_seconds int;
BEGIN
    -- Validate basic parameters
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID cannot be null';
    END IF;

    IF query_embedding IS NULL THEN
        RAISE EXCEPTION 'Query embedding cannot be null';
    END IF;

    IF p_language_code IS NULL OR NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_collation 
        WHERE collname LIKE p_language_code || '%'
    ) THEN
        RAISE EXCEPTION 'Invalid language code: %', p_language_code;
    END IF;

    IF similarity_threshold IS NULL 
        OR similarity_threshold <= 0 
        OR similarity_threshold > 1 
    THEN
        RAISE EXCEPTION 'Similarity threshold must be between 0 and 1';
    END IF;

    IF max_results IS NULL 
        OR max_results < 1 
        OR max_results > 20 
    THEN
        RAISE EXCEPTION 'Max results must be between 1 and 20';
    END IF;

    -- Validate array parameters more carefully
    IF hashtags IS NULL THEN
        RAISE EXCEPTION 'Hashtags array cannot be null';
    END IF;
    
    -- Safely check array lengths
    IF hashtags IS NOT NULL AND cardinality(hashtags) = 0 THEN
        RAISE EXCEPTION 'Hashtags array cannot be empty';
    END IF;
    
    IF hashtags IS NOT NULL AND cardinality(hashtags) > 20 THEN
        RAISE EXCEPTION 'Too many hashtags provided (max 20)';
    END IF;
    
    IF secondary_hashtags IS NOT NULL AND cardinality(secondary_hashtags) > 20 THEN
        RAISE EXCEPTION 'Too many secondary hashtags provided (max 20)';
    END IF;

    -- Check permissions
    PERFORM content_data.check_rag_middleware();

    -- Get settings
    SELECT 
        min_similarity, 
        top_rag_result_multiplier,
        penalty_expiry_seconds
    INTO 
        v_min_similarity, 
        v_top_multiplier,
        v_penalty_expiry_seconds
    FROM content_data.get_current_content_settings();

    RETURN QUERY
    WITH initial_scores AS (
        SELECT 
            scd.id AS result_id,
            scd.full_content_id AS result_full_content_id,
            scd.content AS result_content,
            scd.embedding AS result_embedding,
            scd.all_hashtags AS result_hashtags,
            scd.main_hashtag AS result_main_hashtag,
            scd.post_url AS result_post_url,
            scd.storage_bucket_id AS result_storage_bucket_id,
            scd.storage_object_name AS result_storage_object_name,
            1 - (scd.embedding <=> query_embedding) AS initial_score
        FROM content_data.sectioned_content_descriptions_partitioned scd
        WHERE scd.language_code = p_language_code
        AND scd.main_hashtag = ANY(hashtags)
        AND (1 - (scd.embedding <=> query_embedding)) > similarity_threshold
        ORDER BY scd.embedding <=> query_embedding
        LIMIT (max_results * v_top_multiplier)
    ),
    filtered_content AS (
        SELECT *
        FROM initial_scores i
        WHERE EXISTS (
            SELECT 1
            FROM unnest(hashtags) h
            WHERE h = i.result_main_hashtag
            AND (
                hashtag_groups IS NULL 
                OR cardinality(hashtag_groups) = 0
                OR NOT EXISTS (
                    SELECT 1 
                    FROM unnest(hashtag_groups) g 
                    WHERE g = array_position(hashtags, i.result_main_hashtag)
                )
                OR (
                    secondary_hashtags IS NOT NULL
                    AND EXISTS (
                        SELECT 1
                        FROM unnest(i.result_hashtags) content_tag,
                             unnest(secondary_hashtags) sec_tag,
                             unnest(hashtag_groups) grp_idx
                        WHERE content_tag = sec_tag
                        AND array_position(hashtags, i.result_main_hashtag) = grp_idx
                    )
                )
            )
        )
    ),
    matching_hashtags AS (
        SELECT
            result_id AS mh_id,
            array_agg(DISTINCT tag) AS mh_tags
        FROM filtered_content
        CROSS JOIN LATERAL (
            SELECT unnest(result_hashtags) AS tag
            INTERSECT
            SELECT unnest(COALESCE(hashtags, ARRAY[]::text[]) || COALESCE(secondary_hashtags, ARRAY[]::text[]))
        ) h
        GROUP BY result_id
    ),
    penalties AS (
        SELECT ap.full_content_id, ap.penalty
        FROM content_data.active_penalties ap
        WHERE ap.user_id = p_user_id
        AND ap.full_content_id = ANY (
            SELECT result_full_content_id FROM initial_scores
        )
        AND ap.last_used_at > (CURRENT_TIMESTAMP - make_interval(secs => v_penalty_expiry_seconds))
    ),
    final_scores AS (
        SELECT
            fc.result_id AS fs_id,
            fc.result_full_content_id AS fs_full_content_id,
            fc.result_content AS fs_content,
            CASE
                WHEN fc.initial_score <= COALESCE(p.penalty, 0) THEN v_min_similarity
                ELSE fc.initial_score - COALESCE(p.penalty, 0)
            END AS fs_similarity,
            COALESCE(mh.mh_tags, ARRAY[]::text[]) AS fs_matching_tags,
            fc.result_post_url AS fs_post_url,
            fc.result_storage_bucket_id AS fs_storage_bucket_id,
            fc.result_storage_object_name AS fs_storage_object_name
        FROM filtered_content fc
        LEFT JOIN matching_hashtags mh ON fc.result_id = mh.mh_id
        LEFT JOIN penalties p ON fc.result_full_content_id = p.full_content_id
        WHERE CASE
            WHEN fc.initial_score <= COALESCE(p.penalty, 0) THEN v_min_similarity
            ELSE fc.initial_score - COALESCE(p.penalty, 0)
        END > similarity_threshold
    )
    SELECT 
        fs_id,
        fs_full_content_id,
        fs_content,
        fs_similarity,
        fs_matching_tags,
        fs_post_url,
        fs_storage_bucket_id,
        fs_storage_object_name
    FROM final_scores
    ORDER BY fs_similarity DESC, fs_id
    LIMIT max_results;
END;
$$;

-- 3. Hybrid search with storage fields
CREATE OR REPLACE FUNCTION content_data.hybrid_search_with_penalties (
  p_user_id uuid,
  query_embedding content_data.vector(1024),
  query_text text,
  p_language_code text DEFAULT 'en',
  similarity_threshold float DEFAULT 0.75,
  max_results integer DEFAULT 3
) RETURNS TABLE (
  id uuid,
  full_content_id uuid,
  content text,
  similarity float,
  post_url text,
  storage_bucket_id text,
  storage_object_name text
) LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = content_data, pg_temp
SET statement_timeout = '5s' AS $$
DECLARE
    v_min_similarity float;
    v_top_multiplier int;
    v_view_name text;
    search_config text;
    text_search_condition text;
    v_penalty_expiry_seconds int;
BEGIN
    -- Validate parameters
    PERFORM content_data.validate_rag_parameters(
        p_user_id, query_embedding, p_language_code,
        similarity_threshold, max_results
    );

    -- Check permissions
    PERFORM content_data.check_rag_middleware();

    -- Get settings once
    SELECT 
        min_similarity, 
        top_rag_result_multiplier,
        penalty_expiry_seconds
    INTO 
        v_min_similarity, 
        v_top_multiplier,
        v_penalty_expiry_seconds
    FROM content_data.get_current_content_settings();

    -- Get view name and verify existence
    v_view_name := format('normalized_sectioned_content_descriptions_%s', p_language_code);
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = v_view_name 
        AND n.nspname = 'content_data'
    ) THEN
        RAISE EXCEPTION 'Materialized view % does not exist', v_view_name;
    END IF;

    -- Get search configuration
    search_config := content_data.get_text_search_config(p_language_code);

    -- Prepare text search condition and ranking
    IF search_config IS NOT NULL THEN
        text_search_condition := format(
            'to_tsvector(%L::regconfig, nscd.content) @@ plainto_tsquery(%L::regconfig, $3)',
            search_config, search_config
        );
    ELSE
        text_search_condition := 'nscd.content ILIKE ''%%'' || $3 || ''%%''';
    END IF;

    RETURN QUERY EXECUTE format(
        'WITH initial_scores AS (
            SELECT 
                nscd.id AS result_id,
                nscd.full_content_id AS result_full_content_id,
                nscd.content AS result_content,
                nscd.post_url AS result_post_url,
                nscd.storage_bucket_id AS result_storage_bucket_id,
                nscd.storage_object_name AS result_storage_object_name,
                GREATEST(
                    CASE 
                        WHEN %s THEN 
                            CASE 
                                WHEN %L IS NOT NULL THEN 
                                    ts_rank(to_tsvector(%L::regconfig, nscd.content), plainto_tsquery(%L::regconfig, $3))
                                ELSE 
                                    0.5
                            END
                        ELSE 0
                    END,
                    1 - (nscd.normalized_embedding <=> $1)
                ) AS initial_score
            FROM content_data.%I nscd
            WHERE %s
               OR (1 - (nscd.normalized_embedding <=> $1)) > $2
            ORDER BY initial_score DESC
            LIMIT ($4 * $5)
        ),
        penalties AS (
            SELECT ap.full_content_id, ap.penalty
            FROM content_data.active_penalties ap
            WHERE ap.user_id = $6
            AND ap.full_content_id = ANY (
                SELECT result_full_content_id FROM initial_scores
            )
            AND ap.last_used_at > (CURRENT_TIMESTAMP - make_interval(secs => %s))
        ),
        final_scores AS (
            SELECT 
                i.result_id,
                i.result_full_content_id,
                i.result_content,
                CASE
                    WHEN i.initial_score <= COALESCE(p.penalty, 0) THEN $7
                    ELSE i.initial_score - COALESCE(p.penalty, 0)
                END AS similarity,
                i.result_post_url,
                i.result_storage_bucket_id,
                i.result_storage_object_name
            FROM initial_scores i
            LEFT JOIN penalties p ON i.result_full_content_id = p.full_content_id
            WHERE CASE
                WHEN i.initial_score <= COALESCE(p.penalty, 0) THEN $7
                ELSE i.initial_score - COALESCE(p.penalty, 0)
            END > $2
        )
        SELECT 
            result_id,
            result_full_content_id,
            result_content,
            similarity,
            result_post_url,
            result_storage_bucket_id,
            result_storage_object_name
        FROM final_scores
        ORDER BY similarity DESC, result_id
        LIMIT $4',
        text_search_condition,
        search_config,
        search_config,
        search_config,
        v_view_name,
        text_search_condition,
        v_penalty_expiry_seconds
    )
    USING 
        query_embedding,        -- $1
        similarity_threshold,   -- $2
        query_text,             -- $3
        max_results,            -- $4
        v_top_multiplier,       -- $5
        p_user_id,              -- $6
        v_min_similarity;       -- $7
END;
$$;

-- 4. Hybrid search with hashtags and storage fields
CREATE OR REPLACE FUNCTION content_data.hybrid_search_with_hashtags_and_penalties(
    hashtags text[],
    secondary_hashtags text[],
    hashtag_groups int[],
    p_user_id uuid,
    query_embedding content_data.vector(1024),
    query_text text,
    p_language_code text DEFAULT 'en',
    similarity_threshold float DEFAULT 0.75,
    max_results integer DEFAULT 3
) RETURNS TABLE (
    id uuid,
    full_content_id uuid,
    content text,
    similarity float,
    matching_hashtags text[],
    post_url text,
    storage_bucket_id text,
    storage_object_name text
) LANGUAGE plpgsql STABLE SECURITY DEFINER 
SET search_path = content_data, pg_temp AS $$
DECLARE
    v_min_similarity float;
    v_top_multiplier int;
    v_search_config text;
    v_penalty_expiry_seconds int;
BEGIN
    -- Basic parameter validation
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID cannot be null';
    END IF;

    IF query_embedding IS NULL THEN
        RAISE EXCEPTION 'Query embedding cannot be null';
    END IF;

    IF query_text IS NULL THEN
        RAISE EXCEPTION 'Query text cannot be null';
    END IF;

    IF p_language_code IS NULL OR NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_collation 
        WHERE collname LIKE p_language_code || '%'
    ) THEN
        RAISE EXCEPTION 'Invalid language code: %', p_language_code;
    END IF;

    IF similarity_threshold IS NULL 
        OR similarity_threshold <= 0 
        OR similarity_threshold > 1 
    THEN
        RAISE EXCEPTION 'Similarity threshold must be between 0 and 1';
    END IF;

    IF max_results IS NULL 
        OR max_results < 1 
        OR max_results > 20 
    THEN
        RAISE EXCEPTION 'Max results must be between 1 and 20';
    END IF;

    -- Optional parameter validation
    IF hashtags IS NULL THEN
        RAISE EXCEPTION 'Hashtags array cannot be null';
    END IF;
    
    -- Safely check array lengths with cardinality instead of array_length
    IF hashtags IS NOT NULL AND cardinality(hashtags) = 0 THEN
        RAISE EXCEPTION 'Hashtags array cannot be empty';
    END IF;
    
    IF hashtags IS NOT NULL AND cardinality(hashtags) > 20 THEN
        RAISE EXCEPTION 'Too many hashtags provided (max 20)';
    END IF;
    
    IF secondary_hashtags IS NOT NULL AND cardinality(secondary_hashtags) > 20 THEN
        RAISE EXCEPTION 'Too many secondary hashtags provided (max 20)';
    END IF;

    -- Check permissions
    PERFORM content_data.check_rag_middleware();

    -- Get settings once
    WITH settings AS (
        SELECT * FROM content_data.get_current_content_settings()
    )
    SELECT 
        min_similarity, 
        top_rag_result_multiplier,
        penalty_expiry_seconds
    INTO 
        v_min_similarity, 
        v_top_multiplier,
        v_penalty_expiry_seconds
    FROM settings;

    -- Get text search configuration
    v_search_config := content_data.get_text_search_config(p_language_code);

    RETURN QUERY
    WITH initial_scores AS (
        SELECT 
            scd.id AS is_id,
            scd.full_content_id AS is_full_content_id,
            scd.content AS is_content,
            scd.embedding AS is_embedding,
            scd.all_hashtags AS is_hashtags,
            scd.main_hashtag AS is_main_hashtag,
            scd.post_url AS is_post_url,
            scd.storage_bucket_id AS is_storage_bucket_id,
            scd.storage_object_name AS is_storage_object_name,
            1 - (scd.embedding <=> query_embedding) AS is_initial_score,
            CASE
                WHEN v_search_config IS NOT NULL THEN 
                    ts_rank_cd(to_tsvector(v_search_config::regconfig, scd.content), 
                             plainto_tsquery(v_search_config::regconfig, query_text))
                ELSE similarity(scd.content, query_text)
            END AS is_text_similarity
        FROM content_data.sectioned_content_descriptions_partitioned scd
        WHERE scd.language_code = p_language_code
        AND scd.main_hashtag = ANY(hashtags)
        AND (1 - (scd.embedding <=> query_embedding)) > similarity_threshold
        ORDER BY scd.embedding <=> query_embedding
        LIMIT (max_results * v_top_multiplier)
    ),
    filtered_content AS (
        SELECT i.*
        FROM initial_scores i
        WHERE EXISTS (
            SELECT 1
            FROM unnest(hashtags) h
            WHERE h = i.is_main_hashtag
            AND (
                hashtag_groups IS NULL 
                OR cardinality(hashtag_groups) = 0
                OR NOT EXISTS (
                    SELECT 1 
                    FROM unnest(hashtag_groups) g 
                    WHERE g = array_position(hashtags, i.is_main_hashtag)
                )
                OR (
                    secondary_hashtags IS NOT NULL
                    AND EXISTS (
                        SELECT 1
                        FROM unnest(i.is_hashtags) content_tag,
                             unnest(secondary_hashtags) sec_tag,
                             unnest(hashtag_groups) grp_idx
                        WHERE content_tag = sec_tag
                        AND array_position(hashtags, i.is_main_hashtag) = grp_idx
                    )
                )
            )
        )
    ),
    matching_hashtags AS (
        SELECT
            fc.is_id AS mh_id,
            array_agg(DISTINCT tag) AS mh_tags
        FROM filtered_content fc
        CROSS JOIN LATERAL (
            SELECT unnest(fc.is_hashtags) AS tag
            INTERSECT
            SELECT unnest(COALESCE(hashtags, ARRAY[]::text[]) || COALESCE(secondary_hashtags, ARRAY[]::text[]))
        ) h
        GROUP BY fc.is_id
    ),
    penalties AS (
        SELECT ap.full_content_id, ap.penalty
        FROM content_data.active_penalties ap
        WHERE ap.user_id = p_user_id
        AND ap.full_content_id = ANY (
            SELECT is_full_content_id FROM initial_scores
        )
        AND ap.last_used_at > (CURRENT_TIMESTAMP - make_interval(secs => v_penalty_expiry_seconds))
    ),
    final_scores AS (
        SELECT
            fc.is_id AS fs_id,
            fc.is_full_content_id AS fs_full_content_id,
            fc.is_content AS fs_content,
            CASE
                WHEN fc.is_initial_score <= COALESCE(p.penalty, 0) THEN v_min_similarity
                ELSE fc.is_initial_score - COALESCE(p.penalty, 0)
            END AS fs_similarity,
            COALESCE(mh.mh_tags, ARRAY[]::text[]) AS fs_matching_tags,
            fc.is_post_url AS fs_post_url,
            fc.is_storage_bucket_id AS fs_storage_bucket_id,
            fc.is_storage_object_name AS fs_storage_object_name,
            fc.is_text_similarity AS fs_text_similarity
        FROM filtered_content fc
        LEFT JOIN matching_hashtags mh ON fc.is_id = mh.mh_id
        LEFT JOIN penalties p ON fc.is_full_content_id = p.full_content_id
        WHERE CASE
            WHEN fc.is_initial_score <= COALESCE(p.penalty, 0) THEN v_min_similarity
            ELSE fc.is_initial_score - COALESCE(p.penalty, 0)
        END > similarity_threshold
    )
    SELECT 
        fs_id,
        fs_full_content_id,
        fs_content,
        fs_similarity,
        fs_matching_tags,
        fs_post_url,
        fs_storage_bucket_id,
        fs_storage_object_name
    FROM final_scores
    ORDER BY (fs_similarity + fs_text_similarity) / 2 DESC, fs_id
    LIMIT max_results;
END;
$$;

-- Content penalty specific functions
CREATE OR REPLACE FUNCTION content_data.apply_penalties_to_documents (p_document_ids uuid[]) RETURNS void AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_penalty float;
    v_expiry int;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    SELECT penalty_value, penalty_expiry_seconds
    INTO v_penalty, v_expiry
    FROM content_data.content_settings
    WHERE id = 1;

    INSERT INTO content_data.active_penalties (user_id, full_content_id, penalty, last_used_at)
    SELECT v_user_id, unnest(p_document_ids), v_penalty, current_timestamp
    ON CONFLICT (user_id, full_content_id)
    DO UPDATE SET
        penalty = EXCLUDED.penalty,
        last_used_at = EXCLUDED.last_used_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = content_data, pg_temp;

CREATE OR REPLACE FUNCTION content_data.apply_penalties_to_documents (p_document_ids uuid[]) RETURNS void AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_penalty float;
    v_count int;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to call this function';
    END IF;
    
    IF array_length(p_document_ids, 1) IS NULL THEN
        RAISE EXCEPTION 'No document IDs provided';
    END IF;
    
    -- Get the current penalty value from content_settings
    SELECT penalty_value INTO v_penalty
    FROM content_data.content_settings
    WHERE id = 1;
    
    IF v_penalty IS NULL THEN
        RAISE EXCEPTION 'No content settings found';
    END IF;
    
    WITH insertion_result AS (
        INSERT INTO content_data.active_penalties (user_id, full_content_id, penalty, last_used_at)
        SELECT v_user_id, unnest(p_document_ids), v_penalty, current_timestamp
        ON CONFLICT (user_id, full_content_id)
        DO UPDATE SET
            last_used_at = current_timestamp,
            penalty = v_penalty
        RETURNING *
    )
    SELECT COUNT(*) INTO STRICT v_count FROM insertion_result;
    
    IF v_count = 0 THEN
        RAISE EXCEPTION 'No documents were updated or inserted';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET statement_timeout = '10s'
SET search_path = content_data, pg_temp;

-- Cleanup functions
-- 1. Function that deletes entries from the active_penalties table if these entries expired
CREATE OR REPLACE FUNCTION content_data.cleanup_expired_active_penalties (
  batch_size int DEFAULT 1000
) RETURNS int AS $$
DECLARE
    v_expiry_seconds INT;
    v_deleted_count INT;
BEGIN
    PERFORM content_data.check_backend_worker();

    SELECT penalty_expiry_seconds INTO v_expiry_seconds
    FROM content_data.get_current_content_settings();

    WITH deleted AS (
        DELETE FROM content_data.active_penalties
        WHERE ctid IN (
            SELECT ctid
            FROM content_data.active_penalties
            WHERE last_used_at < (CURRENT_TIMESTAMP - make_interval(secs => v_expiry_seconds))
            LIMIT batch_size
        )
        RETURNING *
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted;

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET
  statement_timeout = '600s'
SET
  search_path = content_data,
  pg_temp;

-- 2. Function that force deletes entries from the content_usage table
CREATE OR REPLACE FUNCTION content_data.force_delete_active_penalties (
  p_user_ids uuid[] = NULL,
  p_content_ids uuid[] = NULL,
  batch_size int = 1000
) RETURNS int AS $$
DECLARE
    v_deleted_count INT;
BEGIN
    PERFORM content_data.check_backend_worker();

    IF p_user_ids IS NULL AND p_content_ids IS NULL THEN
        RAISE EXCEPTION 'At least one of user_ids or content_ids must be provided';
    END IF;

    WITH deleted AS (
        DELETE FROM content_data.active_penalties
        WHERE ctid IN (
            SELECT ctid
            FROM content_data.active_penalties
            WHERE (p_user_ids IS NULL OR user_id = ANY(p_user_ids))
              AND (p_content_ids IS NULL OR full_content_id = ANY(p_content_ids))
            LIMIT batch_size
        )
        RETURNING *
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted;

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET
  statement_timeout = '600s'
SET
  search_path = content_data,
  pg_temp;

-- Handle GRANT permissions for schemas, tables, functions etc
-- Permissions for authenticated users and the service role to access the schema
GRANT USAGE ON SCHEMA content_data TO authenticated;
GRANT USAGE ON SCHEMA content_data TO service_role;

GRANT
SELECT
  ON content_data.content_settings TO authenticated;

GRANT
SELECT
  ON content_data.active_penalties TO authenticated;

GRANT
SELECT
,
  INSERT,
UPDATE ON content_data.full_content_descriptions TO authenticated;

GRANT
SELECT
,
  INSERT,
UPDATE ON content_data.full_content_translations TO authenticated;

GRANT
SELECT
,
  INSERT,
UPDATE ON content_data.sectioned_content_descriptions_partitioned TO authenticated;

GRANT
SELECT
,
  INSERT,
UPDATE ON content_data.mv_refresh_control TO authenticated;

-- Function execution permissions
GRANT
EXECUTE ON FUNCTION content_data.apply_penalties_to_documents TO authenticated;

GRANT
EXECUTE ON FUNCTION content_data.search_similar_content_with_penalties TO authenticated;

GRANT
EXECUTE ON FUNCTION content_data.search_similar_content_with_hashtags_and_penalties TO authenticated;

GRANT
EXECUTE ON FUNCTION content_data.hybrid_search_with_penalties TO authenticated;

GRANT
EXECUTE ON FUNCTION content_data.hybrid_search_with_hashtags_and_penalties TO authenticated;

GRANT
EXECUTE ON FUNCTION content_data.get_full_content_paginated TO authenticated;

GRANT
EXECUTE ON FUNCTION content_data.get_content_translations TO authenticated;

GRANT
EXECUTE ON FUNCTION content_data.is_in_full_content TO authenticated;

GRANT
EXECUTE ON FUNCTION content_data.bulk_insert_sectioned_content TO authenticated;

GRANT
EXECUTE ON FUNCTION content_data.cleanup_expired_active_penalties TO authenticated;

GRANT
EXECUTE ON FUNCTION content_data.force_delete_active_penalties TO authenticated;

GRANT
EXECUTE ON FUNCTION content_data.update_content_settings TO authenticated;

GRANT
EXECUTE ON FUNCTION content_data.bulk_insert_full_content TO authenticated;

GRANT
EXECUTE ON FUNCTION content_data.perform_materialized_view_refresh TO authenticated;

GRANT
EXECUTE ON FUNCTION content_data.get_language_materialized_views TO authenticated;

GRANT
EXECUTE ON FUNCTION content_data.get_partition_sizes TO authenticated;

-- Enable RLS on all relevant tables
ALTER TABLE content_data.full_content_descriptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE content_data.full_content_translations ENABLE ROW LEVEL SECURITY;

ALTER TABLE content_data.sectioned_content_descriptions_partitioned ENABLE ROW LEVEL SECURITY;

ALTER TABLE content_data.content_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE content_data.active_penalties ENABLE ROW LEVEL SECURITY;

ALTER TABLE content_data.mv_refresh_control ENABLE ROW LEVEL SECURITY;

-- Policies for users to select their own penalties
CREATE POLICY user_select_own_penalties ON content_data.active_penalties
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Policy for creating partitions
CREATE POLICY trigger_partition_creation ON content_data.sectioned_content_descriptions_partitioned
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow the trigger to work regardless of role
CREATE POLICY sectioned_content_read_policy ON content_data.sectioned_content_descriptions_partitioned
FOR SELECT TO authenticated
USING ((SELECT auth.jwt()) ->> 'app_role' IN ('backend_worker', 'rag_middleware'));

-- Policies for backend_worker - full content
CREATE POLICY backend_worker_full_content_select ON content_data.full_content_descriptions
FOR SELECT TO authenticated
USING ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');

CREATE POLICY backend_worker_full_content_insert ON content_data.full_content_descriptions
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker' AND (SELECT auth.jwt()) ->> 'aud' = 'authenticated');

CREATE POLICY backend_worker_full_content_update ON content_data.full_content_descriptions
FOR UPDATE TO authenticated
USING ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker')
WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');

-- Policies for backend_worker - translations
CREATE POLICY backend_worker_translations_select ON content_data.full_content_translations
FOR SELECT TO authenticated
USING ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');

CREATE POLICY backend_worker_translations_insert ON content_data.full_content_translations
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker' AND (SELECT auth.jwt()) ->> 'aud' = 'authenticated');

CREATE POLICY backend_worker_translations_update ON content_data.full_content_translations
FOR UPDATE TO authenticated
USING ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker')
WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');

-- Policies for backend_worker - sectioned content
CREATE POLICY backend_worker_sectioned_content_select ON content_data.sectioned_content_descriptions_partitioned
FOR SELECT TO authenticated
USING ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');

CREATE POLICY backend_worker_sectioned_content_insert ON content_data.sectioned_content_descriptions_partitioned
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker' AND (SELECT auth.jwt()) ->> 'aud' = 'authenticated');

CREATE POLICY backend_worker_sectioned_content_update ON content_data.sectioned_content_descriptions_partitioned
FOR UPDATE TO authenticated
USING ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker')
WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');

-- Policies for backend_worker - materialized view refresh control
CREATE POLICY backend_worker_mv_refresh_select ON content_data.mv_refresh_control
FOR SELECT TO authenticated
USING ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');

CREATE POLICY backend_worker_mv_refresh_insert ON content_data.mv_refresh_control
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker' AND (SELECT auth.jwt()) ->> 'aud' = 'authenticated');

CREATE POLICY backend_worker_mv_refresh_update ON content_data.mv_refresh_control
FOR UPDATE TO authenticated
USING ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker')
WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');

-- Policies for backend_worker - content settings
CREATE POLICY backend_worker_content_settings_select ON content_data.content_settings
FOR SELECT TO authenticated
USING ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');

CREATE POLICY backend_worker_content_settings_update ON content_data.content_settings
FOR UPDATE TO authenticated
WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker' AND (SELECT auth.jwt()) ->> 'aud' = 'authenticated');
