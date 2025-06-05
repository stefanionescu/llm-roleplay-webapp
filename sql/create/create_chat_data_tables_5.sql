-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS chat_data;

-- Authentication functions
CREATE OR REPLACE FUNCTION chat_data.check_backend_worker() RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = chat_data, pg_temp;

-- Create all tables in dependency order
DO $$
BEGIN
 -- 1. active_chat_sessions (no dependencies)
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat_data' AND table_name = 'active_chat_sessions') THEN
    CREATE TABLE chat_data.active_chat_sessions (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        character_id uuid REFERENCES public.characters(id),
        created_at timestamptz DEFAULT current_timestamp,
        set_for_migration boolean DEFAULT false,
        latest_message_at timestamptz,
        activity_rank timestamptz GENERATED ALWAYS AS (
          GREATEST(latest_message_at, created_at)
        ) STORED
    );

    CREATE INDEX idx_user_active_sessions ON chat_data.active_chat_sessions(user_id);
    CREATE INDEX idx_character_active_sessions ON chat_data.active_chat_sessions(character_id);
    CREATE INDEX idx_active_chat_sessions_user_character_created 
      ON chat_data.active_chat_sessions (user_id, character_id, created_at DESC);
    CREATE INDEX idx_sessions_user_activity 
      ON chat_data.active_chat_sessions (user_id, activity_rank DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_session_per_character
      ON chat_data.active_chat_sessions (user_id, character_id)
      WHERE set_for_migration = false;
  END IF;

  -- 2. active_chat_messages (depends on active_chat_sessions)
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat_data' AND table_name = 'active_chat_messages') THEN
    CREATE TABLE chat_data.active_chat_messages (
      id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
      position int,
      session_id uuid REFERENCES chat_data.active_chat_sessions(id) ON DELETE CASCADE,
      raw_human text,
      raw_ai text NOT NULL,
      stop_reason text,
      error_message text,
      created_at timestamptz DEFAULT current_timestamp,
      llm_model_used text NOT NULL,
      relevant_content text[],
      ai_token_count int NOT NULL,
      human_token_count int
    );
    
    CREATE INDEX idx_active_message_stop_reason ON chat_data.active_chat_messages(stop_reason);
    CREATE INDEX idx_active_message_session_id ON chat_data.active_chat_messages(session_id);
    CREATE INDEX idx_active_chat_messages_session_created
      ON chat_data.active_chat_messages (session_id, created_at DESC);
    CREATE INDEX idx_active_chat_messages_created_at 
      ON chat_data.active_chat_messages(created_at);
    CREATE INDEX idx_messages_context_lookup 
      ON chat_data.active_chat_messages 
      USING btree (session_id, position DESC) 
      INCLUDE (raw_human, raw_ai, ai_token_count, human_token_count);
  END IF;

  -- 3. historical_chat_sessions
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat_data' AND table_name = 'historical_chat_sessions') THEN
    CREATE TABLE chat_data.historical_chat_sessions (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id uuid REFERENCES auth.users(id),
        character_id uuid REFERENCES public.characters(id),
        created_at timestamptz DEFAULT current_timestamp
    );
    
    CREATE INDEX idx_user_historical_sessions ON chat_data.historical_chat_sessions(user_id);
    CREATE INDEX idx_character_historical_sessions ON chat_data.historical_chat_sessions(character_id);
    CREATE INDEX idx_character_historical_sessions_created_at ON chat_data.historical_chat_sessions(created_at);
  END IF;

  -- 4. historical_chat_messages
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat_data' AND table_name = 'historical_chat_messages') THEN
    CREATE TABLE chat_data.historical_chat_messages (
      id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
      position int,
      session_id uuid REFERENCES chat_data.historical_chat_sessions(id),
      raw_human text,
      raw_ai text,
      stop_reason text,
      error_message text,
      created_at timestamptz DEFAULT current_timestamp,
      llm_model_used text NOT NULL,
      relevant_content text[],
      ai_token_count int NOT NULL,
      human_token_count int
    );
    
    CREATE INDEX idx_historical_message_stop_reason ON chat_data.historical_chat_messages(stop_reason);
    CREATE INDEX idx_historical_message_session_id ON chat_data.historical_chat_messages(session_id);
    CREATE INDEX idx_historical_message_created_at ON chat_data.historical_chat_messages(created_at);
    CREATE INDEX idx_historical_messages_context_lookup 
      ON chat_data.historical_chat_messages 
      USING btree (session_id, position DESC) 
      INCLUDE (raw_human, raw_ai, ai_token_count, human_token_count);
  END IF;

  -- 5. session_message_counts
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat_data' AND table_name = 'session_message_counts') THEN
    CREATE TABLE chat_data.session_message_counts (
      session_id uuid PRIMARY KEY REFERENCES chat_data.active_chat_sessions(id) ON DELETE CASCADE,
      message_count int NOT NULL DEFAULT 0
    );
  END IF;
END $$;

-- Set position on new messages
CREATE OR REPLACE FUNCTION chat_data.set_message_position() RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1 
  INTO NEW.position
  FROM chat_data.active_chat_messages
  WHERE session_id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = chat_data, pg_temp;

-- Fetch latest messages that fit in the context window
CREATE OR REPLACE FUNCTION chat_data.fetch_context_messages(
  p_session_id UUID,
  p_max_tokens INT DEFAULT 3000
) RETURNS TABLE (
  token_count INT,
  content TEXT,
  role TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_session_exists BOOLEAN;
  v_tokens_remaining INT := p_max_tokens;
  v_current_index INT;
  v_max_allowed_tokens CONSTANT INT := 10000;
BEGIN
  -- Enforce token limit
  IF p_max_tokens > v_max_allowed_tokens THEN
    RAISE EXCEPTION 'p_max_tokens cannot exceed % (got %)', v_max_allowed_tokens, p_max_tokens;
  END IF;

  -- Authentication check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User is not authenticated';
  END IF;

  -- Ensure session exists and is owned by user
  SELECT EXISTS (
    SELECT 1 
    FROM chat_data.active_chat_sessions acs
    WHERE acs.id = p_session_id 
      AND acs.user_id = v_user_id
      AND acs.set_for_migration = false
  ) INTO v_session_exists;

  IF NOT v_session_exists THEN
    RAISE EXCEPTION 'Session not found or user not authorized';
  END IF;

  -- Get the highest message_index (latest message)
  SELECT position INTO v_current_index
  FROM chat_data.active_chat_messages
  WHERE session_id = p_session_id
  ORDER BY position DESC
  LIMIT 1;

  WHILE v_tokens_remaining > 0 AND v_current_index IS NOT NULL LOOP
    -- Process assistant (AI) message
    IF EXISTS (
      SELECT 1
      FROM chat_data.active_chat_messages acm
      WHERE acm.session_id = p_session_id 
        AND acm.position = v_current_index
        AND acm.raw_ai IS NOT NULL 
        AND acm.ai_token_count IS NOT NULL
        AND acm.ai_token_count <= v_tokens_remaining
    ) THEN
      -- Return AI message
      RETURN QUERY
      SELECT 
        acm.ai_token_count AS token_count,
        acm.raw_ai AS content,
        'assistant'::TEXT AS role
      FROM chat_data.active_chat_messages acm
      WHERE acm.session_id = p_session_id 
        AND acm.position = v_current_index;
        
      -- Reduce remaining tokens
      SELECT v_tokens_remaining - ai_token_count INTO v_tokens_remaining
      FROM chat_data.active_chat_messages 
      WHERE session_id = p_session_id AND position = v_current_index;
    END IF;
    
    -- If we still have tokens left, process human message from same position
    IF v_tokens_remaining > 0 THEN
      IF EXISTS (
        SELECT 1
        FROM chat_data.active_chat_messages acm
        WHERE acm.session_id = p_session_id 
          AND acm.position = v_current_index
          AND acm.raw_human IS NOT NULL 
          AND acm.human_token_count IS NOT NULL
          AND acm.human_token_count <= v_tokens_remaining
      ) THEN
        -- Return human message
        RETURN QUERY
        SELECT 
          acm.human_token_count AS token_count,
          acm.raw_human AS content,
          'user'::TEXT AS role
        FROM chat_data.active_chat_messages acm
        WHERE acm.session_id = p_session_id 
          AND acm.position = v_current_index;
          
        -- Reduce remaining tokens
        SELECT v_tokens_remaining - human_token_count INTO v_tokens_remaining
        FROM chat_data.active_chat_messages 
        WHERE session_id = p_session_id AND position = v_current_index;
      END IF;
    END IF;

    -- Step back to the previous message
    SELECT acm.position INTO v_current_index
    FROM chat_data.active_chat_messages acm
    WHERE acm.session_id = p_session_id AND acm.position < v_current_index
    ORDER BY acm.position DESC
    LIMIT 1;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET statement_timeout = '10s'
SET search_path = chat_data, pg_temp;

-- Background migration function
CREATE OR REPLACE FUNCTION chat_data.background_migrate_session(p_session_id UUID, p_batch_size INT DEFAULT 1000) RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_character_id UUID;
    v_created_at TIMESTAMPTZ;
    v_new_historical_session_id UUID;
    v_last_processed_id UUID;
    v_migration_completed BOOLEAN := FALSE;
    v_set_for_migration BOOLEAN;
    v_session_lock_obtained BOOLEAN;
    v_user_lock_obtained BOOLEAN;
BEGIN
    PERFORM chat_data.check_backend_worker();

    -- Try to obtain session-level advisory lock
    SELECT pg_try_advisory_lock(hashtext('migrate_session'::text || p_session_id::text)) 
    INTO v_session_lock_obtained;

    IF NOT v_session_lock_obtained THEN
        RAISE NOTICE 'Migration already in progress for session %', p_session_id;
        RETURN;
    END IF;

    BEGIN
        -- Check if the session is set for migration
        SELECT set_for_migration, user_id INTO v_set_for_migration, v_user_id
        FROM chat_data.active_chat_sessions
        WHERE id = p_session_id;

        IF NOT v_set_for_migration THEN
            PERFORM pg_advisory_unlock(hashtext('migrate_session'::text || p_session_id::text));
            RAISE EXCEPTION 'Session is not set for migration';
        END IF;

        -- Try to obtain user-level advisory lock
        SELECT pg_try_advisory_lock(hashtext('migrate_user'::text || v_user_id::text)) 
        INTO v_user_lock_obtained;

        IF NOT v_user_lock_obtained THEN
            PERFORM pg_advisory_unlock(hashtext('migrate_session'::text || p_session_id::text));
            RAISE NOTICE 'Migration already in progress for user %', v_user_id;
            RETURN;
        END IF;

        -- Create historical session
        SELECT character_id, created_at INTO v_character_id, v_created_at
        FROM chat_data.active_chat_sessions
        WHERE id = p_session_id;

        WITH insert_attempt AS (
            INSERT INTO chat_data.historical_chat_sessions (
                id, user_id, character_id, created_at
            )
            VALUES (
                p_session_id, v_user_id, v_character_id, v_created_at
            )
            ON CONFLICT (id) DO NOTHING
            RETURNING id
        )
        SELECT id INTO v_new_historical_session_id
        FROM insert_attempt
        UNION ALL
        SELECT id FROM chat_data.historical_chat_sessions 
        WHERE id = p_session_id
        LIMIT 1;

        -- Migrate messages in batches
        WITH messages_to_migrate AS (
          SELECT id, raw_human, raw_ai, stop_reason, error_message,
                 created_at, llm_model_used, relevant_content, ai_token_count, human_token_count, position
          FROM chat_data.active_chat_messages
          WHERE session_id = p_session_id 
          AND position > COALESCE(
            (SELECT position 
             FROM chat_data.historical_chat_messages 
             WHERE session_id = v_new_historical_session_id
             ORDER BY position DESC 
             LIMIT 1),
            -1
          )
          ORDER BY position
          LIMIT p_batch_size
        ),
        migrated_inserts AS (
          INSERT INTO chat_data.historical_chat_messages (
              id, session_id, raw_human, raw_ai, stop_reason, error_message, 
              created_at, llm_model_used, relevant_content, ai_token_count, human_token_count, position
          )
          SELECT 
              id, v_new_historical_session_id, raw_human, raw_ai, stop_reason,
              error_message, created_at, llm_model_used, relevant_content, ai_token_count,
              human_token_count, position
          FROM messages_to_migrate
          RETURNING id
        )
        DELETE FROM chat_data.active_chat_messages
        WHERE id IN (
          SELECT id FROM messages_to_migrate
        );

        -- Update last processed id
        SELECT id INTO v_last_processed_id 
        FROM chat_data.historical_chat_messages
        WHERE session_id = v_new_historical_session_id
        ORDER BY position DESC
        LIMIT 1;

        -- Check if migration is complete
        IF NOT EXISTS (
            SELECT 1 FROM chat_data.active_chat_messages
            WHERE session_id = p_session_id 
            AND position > (
              SELECT position 
              FROM chat_data.historical_chat_messages 
              WHERE id = v_last_processed_id
            )
        ) THEN
            v_migration_completed := TRUE;
        END IF;

        -- Update migration progress
        IF v_migration_completed THEN
            -- Delete original data and migration progress entry
            DELETE FROM chat_data.active_chat_messages 
            WHERE session_id = p_session_id;
            DELETE FROM chat_data.active_chat_sessions 
            WHERE id = p_session_id;
        END IF;

        -- Release both locks
        PERFORM pg_advisory_unlock(hashtext('migrate_user'::text || v_user_id::text));
        PERFORM pg_advisory_unlock(hashtext('migrate_session'::text || p_session_id::text));
    EXCEPTION
        WHEN OTHERS THEN
            -- Ensure both locks are released even if an error occurs
            IF v_user_id IS NOT NULL THEN
                PERFORM pg_advisory_unlock(hashtext('migrate_user'::text || v_user_id::text));
            END IF;
            PERFORM pg_advisory_unlock(hashtext('migrate_session'::text || p_session_id::text));
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET statement_timeout = '600s'
SET search_path = chat_data, pg_temp;

-- Trigger that sets set_for_migration to true when a user creates a new session
CREATE OR REPLACE FUNCTION chat_data.handle_new_session_migration() RETURNS TRIGGER AS $$
DECLARE
    v_previous_session_id UUID;
BEGIN
    -- First, find the most recent previous session
    SELECT id INTO v_previous_session_id
    FROM chat_data.active_chat_sessions
    WHERE user_id = NEW.user_id
      AND character_id = NEW.character_id
      AND id != NEW.id
      AND set_for_migration = false
    ORDER BY created_at DESC
    LIMIT 1;

    -- If we found a previous session, update it
    IF v_previous_session_id IS NOT NULL THEN
        RAISE NOTICE 'Setting session % for migration', v_previous_session_id;
        
        UPDATE chat_data.active_chat_sessions
        SET set_for_migration = true
        WHERE id = v_previous_session_id;
    END IF;
      
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = chat_data, pg_temp;

-- Trigger that checks relevant_content
CREATE OR REPLACE FUNCTION chat_data.check_relevant_content() RETURNS TRIGGER AS $$
BEGIN
    -- Skip validation if relevant_content is NULL
    IF NEW.relevant_content IS NULL THEN
        RETURN NEW;
    END IF;

    -- Check if any element in the array is NULL
    IF array_position(NEW.relevant_content, NULL) IS NOT NULL THEN
        RAISE EXCEPTION 'NULL elements are not allowed in relevant_content array';
    END IF;
    
    -- Check that relevant_content elements follow one of the allowed patterns
    IF EXISTS (
        SELECT 1
        FROM unnest(NEW.relevant_content) AS t
        WHERE t NOT SIMILAR TO '[^/]+-content/tiktok/no_watermark/[^/]+/[^/]+\.[^/]+'
          AND t NOT SIMILAR TO '[^/]+-content/tiktok/watermark/[^/]+/[^/]+\.[^/]+'
          AND t NOT SIMILAR TO '[^/]+-content/youtube/no_watermark/[^/]+/[^/]+\.[^/]+'
          AND t NOT SIMILAR TO '[^/]+-content/youtube/watermark/[^/]+/[^/]+\.[^/]+'
    ) THEN
        RAISE EXCEPTION 'relevant_content elements must be in one of these formats: 
            something_here-content/tiktok/no_watermark/*/file.ext, 
            something_here-content/tiktok/watermark/*/file.ext, 
            something_here-content/youtube/no_watermark/*/file.ext, 
            something_here-content/youtube/watermark/*/file.ext';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = chat_data, pg_temp;

-- Trigger to update latest_message_at for each session
CREATE OR REPLACE FUNCTION chat_data.update_session_latest_message_timestamp() 
RETURNS TRIGGER AS $$
BEGIN
    -- Update the session's latest_message_at timestamp
    UPDATE chat_data.active_chat_sessions
    SET latest_message_at = NEW.created_at
    WHERE id = NEW.session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = chat_data, pg_temp;

-- Function to get paginated sessions with character details
CREATE OR REPLACE FUNCTION chat_data.get_paginated_sessions(
  p_limit INT,
  p_cursor_activity_rank TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id UUID DEFAULT NULL
)
RETURNS TABLE (
  session_id UUID,
  character_id UUID,
  created_at TIMESTAMPTZ,
  latest_message_at TIMESTAMPTZ,
  activity_rank TIMESTAMPTZ,
  character_icon_url TEXT,
  character_names JSONB
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User is not authenticated';
  END IF;

  RETURN QUERY
  WITH sessions AS (
    SELECT 
      s.id,
      s.character_id,
      s.created_at,
      s.latest_message_at,
      s.activity_rank
    FROM chat_data.active_chat_sessions s
    WHERE s.user_id = v_user_id
      AND s.set_for_migration = false
      AND (
        p_cursor_activity_rank IS NULL
        OR (
          s.activity_rank < p_cursor_activity_rank
          OR (s.activity_rank = p_cursor_activity_rank AND s.id < p_cursor_id)
        )
      )
    ORDER BY s.activity_rank DESC, s.id DESC
    LIMIT p_limit
  ),
  translations AS (
    -- Get all translations for the characters in the fetched sessions
    SELECT 
      ct.character_id,
      ct.language_code,
      ct.name
    FROM public.character_translations ct
    JOIN sessions s ON ct.character_id = s.character_id
  ),
  grouped_translations AS (
    -- Group translations by character_id
    SELECT 
      t.character_id,
      jsonb_object_agg(t.language_code, t.name) AS translated_names
    FROM translations t
    GROUP BY t.character_id
  )
  SELECT 
    s.id AS session_id,
    s.character_id,
    s.created_at,
    s.latest_message_at,
    s.activity_rank,
    c.icon_url AS character_icon_url,
    -- Create a JSONB object with 'en' as the default name from characters table
    -- and merge it with all translations from character_translations
    jsonb_build_object('en', c.name) || 
      COALESCE(gt.translated_names, '{}'::jsonb) AS character_names
  FROM sessions s
  JOIN public.characters c ON s.character_id = c.id
  LEFT JOIN grouped_translations gt ON c.id = gt.character_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = chat_data, pg_temp;

-- Function to get paginated messages
CREATE OR REPLACE FUNCTION chat_data.get_paginated_messages(
  p_session_id UUID,
  p_limit INT,
  p_last_position INT DEFAULT NULL
) RETURNS TABLE (
  message_id UUID,
  message_raw_human TEXT,
  message_raw_ai TEXT,
  message_created_at TIMESTAMPTZ,
  message_relevant_content text[],
  message_ai_token_count INT,
  message_human_token_count INT,
  message_stop_reason TEXT,
  message_error_message TEXT,
  message_position INT,
  message_llm_model_used TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_set_for_migration BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User is not authenticated';
    END IF;

    SELECT s.set_for_migration INTO v_set_for_migration
    FROM chat_data.active_chat_sessions s
    WHERE s.id = p_session_id AND s.user_id = v_user_id;

    IF v_set_for_migration IS NULL THEN
        RAISE EXCEPTION 'Session not found or user not authorized';
    END IF;

    IF v_set_for_migration THEN
        RAISE EXCEPTION 'Session is set for migration';
    END IF;

    RETURN QUERY
    SELECT 
        m.id AS message_id,
        m.raw_human AS message_raw_human,
        m.raw_ai AS message_raw_ai,
        m.created_at AS message_created_at,
        m.relevant_content AS message_relevant_content,
        m.ai_token_count AS message_ai_token_count,
        m.human_token_count AS message_human_token_count,
        m.stop_reason AS message_stop_reason,
        m.error_message AS message_error_message,
        m.position AS message_position,
        m.llm_model_used AS message_llm_model_used
    FROM chat_data.active_chat_messages m
    WHERE m.session_id = p_session_id
    AND (p_last_position IS NULL OR m.position < p_last_position)
    ORDER BY m.position DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET statement_timeout = '10s'
SET search_path = chat_data, pg_temp;

-- Function to get latest session for character
CREATE OR REPLACE FUNCTION chat_data.get_latest_session_for_character(p_character_id UUID) 
RETURNS SETOF chat_data.active_chat_sessions AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User is not authenticated';
    END IF;

    RETURN QUERY
    SELECT s.*
    FROM chat_data.active_chat_sessions s
    WHERE s.user_id = v_user_id 
      AND s.character_id = p_character_id 
      AND s.set_for_migration = false
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET statement_timeout = '5s' 
SET search_path = chat_data, pg_temp;

-- Function to update active message fields
CREATE OR REPLACE FUNCTION chat_data.update_message(
  p_message_id UUID,
  p_raw_ai TEXT DEFAULT NULL,
  p_stop_reason TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_ai_token_count INT DEFAULT NULL,
  p_human_token_count INT DEFAULT NULL,
  p_relevant_content TEXT[] DEFAULT NULL
) RETURNS SETOF chat_data.active_chat_messages AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID;
  v_is_latest BOOLEAN;
BEGIN
  -- Get session info
  SELECT session_id INTO v_session_id
  FROM chat_data.active_chat_messages
  WHERE id = p_message_id;

  -- Get user ID
  v_user_id := auth.uid();
  
  -- Check ownership and migration status
  IF NOT EXISTS (
    SELECT 1 FROM chat_data.active_chat_sessions s
    WHERE s.id = v_session_id 
    AND s.user_id = v_user_id
    AND s.set_for_migration = false
  ) THEN
    RAISE EXCEPTION 'Session not found, not owned by user, or set for migration';
  END IF;

  -- Check if latest message
  SELECT id = p_message_id INTO v_is_latest
  FROM chat_data.active_chat_messages
  WHERE session_id = v_session_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT v_is_latest THEN
    RAISE EXCEPTION 'Can only update latest message';
  END IF;

  -- Update allowed fields
  RETURN QUERY
  UPDATE chat_data.active_chat_messages 
  SET
    -- These must be non-null, so only update if a non-null value is provided
    raw_ai = CASE 
      WHEN p_raw_ai IS NOT NULL THEN p_raw_ai 
      ELSE raw_ai 
    END,
    ai_token_count = CASE 
      WHEN p_ai_token_count IS NOT NULL THEN p_ai_token_count 
      ELSE ai_token_count 
    END,
    human_token_count = CASE 
      WHEN p_human_token_count IS NOT NULL THEN p_human_token_count 
      ELSE human_token_count 
    END,
    -- These can be null, so always update with whatever value is provided
    stop_reason = p_stop_reason,
    error_message = p_error_message,
    relevant_content = p_relevant_content
  WHERE id = p_message_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = chat_data, pg_temp;

-- Message count tracking function and trigger
CREATE OR REPLACE FUNCTION chat_data.update_message_count() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO chat_data.session_message_counts (session_id, message_count)
        VALUES (NEW.session_id, 1)
        ON CONFLICT (session_id)
        DO UPDATE SET message_count = chat_data.session_message_counts.message_count + 1;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Check if the session still exists before updating
        IF EXISTS (SELECT 1 FROM chat_data.active_chat_sessions WHERE id = OLD.session_id) THEN
            UPDATE chat_data.session_message_counts
            SET message_count = message_count - 1
            WHERE session_id = OLD.session_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = chat_data, pg_temp;

-- Anonymous limits trigger function
CREATE OR REPLACE FUNCTION chat_data.check_anonymous_limits() RETURNS TRIGGER AS $$
DECLARE
    v_is_anonymous boolean;
    v_current_sessions integer;
    v_current_messages integer;
    v_max_sessions integer;
    v_max_messages integer;
BEGIN
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    SELECT (auth.jwt() ->> 'is_anonymous')::boolean INTO v_is_anonymous;
  
    IF v_is_anonymous THEN
        -- Explicit schema-qualified call to avoid needing content_data in search_path
        SELECT 
            s.max_anonymous_sessions, 
            s.max_anonymous_session_messages
        INTO 
            v_max_sessions, 
            v_max_messages
        FROM content_data.get_current_content_settings() AS s;

        IF TG_TABLE_NAME = 'active_chat_sessions' THEN
            WITH total_sessions AS (
                SELECT user_id FROM chat_data.active_chat_sessions
                WHERE user_id = auth.uid()
                UNION ALL
                SELECT user_id FROM chat_data.historical_chat_sessions
                WHERE user_id = auth.uid()
            )
            SELECT COUNT(*) INTO v_current_sessions
            FROM total_sessions;

            IF v_current_sessions >= v_max_sessions THEN
                RAISE EXCEPTION 'Maximum number of sessions reached for anonymous user';
            END IF;
        ELSIF TG_TABLE_NAME = 'active_chat_messages' THEN
            IF NOT EXISTS (
                SELECT 1 FROM chat_data.active_chat_sessions
                WHERE id = NEW.session_id
                  AND user_id = auth.uid()
            ) THEN
                RAISE EXCEPTION 'You do not have permission to add messages to this session';
            END IF;
        
            SELECT message_count INTO v_current_messages
            FROM chat_data.session_message_counts
            WHERE session_id = NEW.session_id;

            IF v_current_messages >= v_max_messages THEN
                RAISE EXCEPTION 'Maximum number of messages reached for this session';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = chat_data, pg_temp;

-- Initialize message count trigger
CREATE OR REPLACE FUNCTION chat_data.initialize_message_count() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO chat_data.session_message_counts (session_id, message_count)
    VALUES (NEW.id, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = chat_data, pg_temp;

-- Create all necessary triggers
CREATE OR REPLACE TRIGGER set_message_position_trigger
BEFORE INSERT ON chat_data.active_chat_messages
FOR EACH ROW
EXECUTE FUNCTION chat_data.set_message_position();

CREATE TRIGGER update_session_latest_message_timestamp
AFTER INSERT ON chat_data.active_chat_messages
FOR EACH ROW
EXECUTE FUNCTION chat_data.update_session_latest_message_timestamp();

CREATE OR REPLACE TRIGGER set_previous_sessions_for_migration
AFTER INSERT ON chat_data.active_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION chat_data.handle_new_session_migration();

CREATE OR REPLACE TRIGGER check_relevant_content_trigger
BEFORE INSERT OR UPDATE ON chat_data.active_chat_messages
FOR EACH ROW
EXECUTE FUNCTION chat_data.check_relevant_content();

CREATE TRIGGER check_anonymous_session_limit
BEFORE INSERT ON chat_data.active_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION chat_data.check_anonymous_limits();

CREATE TRIGGER check_anonymous_message_limit
BEFORE INSERT ON chat_data.active_chat_messages
FOR EACH ROW
EXECUTE FUNCTION chat_data.check_anonymous_limits();

CREATE TRIGGER initialize_session_message_count
AFTER INSERT ON chat_data.active_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION chat_data.initialize_message_count();

CREATE TRIGGER update_message_count_insert
AFTER INSERT ON chat_data.active_chat_messages
FOR EACH ROW
EXECUTE FUNCTION chat_data.update_message_count();

CREATE TRIGGER update_message_count_delete
BEFORE DELETE ON chat_data.active_chat_messages
FOR EACH ROW
EXECUTE FUNCTION chat_data.update_message_count();

-- Enable RLS
ALTER TABLE chat_data.active_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_data.active_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_data.historical_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_data.historical_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_data.session_message_counts ENABLE ROW LEVEL SECURITY;

-- Grant schema usage early
GRANT USAGE ON SCHEMA chat_data TO authenticated;
GRANT USAGE ON SCHEMA chat_data TO service_role;

-- Grant minimal table access early
GRANT SELECT ON chat_data.session_message_counts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_data.active_chat_sessions TO authenticated;
GRANT SELECT, INSERT ON chat_data.active_chat_messages TO authenticated;
GRANT SELECT, INSERT ON chat_data.historical_chat_sessions TO authenticated;
GRANT SELECT, INSERT ON chat_data.historical_chat_messages TO authenticated;

-- Function grants
GRANT EXECUTE ON FUNCTION chat_data.get_paginated_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION chat_data.get_latest_session_for_character TO authenticated;
GRANT EXECUTE ON FUNCTION chat_data.get_paginated_messages TO authenticated;
GRANT EXECUTE ON FUNCTION chat_data.fetch_context_messages TO authenticated;
GRANT EXECUTE ON FUNCTION chat_data.update_message TO authenticated;

-- Active Chat Sessions Policies
CREATE POLICY active_chat_sessions_select_policy ON chat_data.active_chat_sessions 
  FOR SELECT TO authenticated 
  USING (
    user_id = (SELECT auth.uid()) 
    OR (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

CREATE POLICY active_chat_sessions_insert_policy ON chat_data.active_chat_sessions 
  FOR INSERT TO authenticated 
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY active_chat_sessions_update_policy ON chat_data.active_chat_sessions 
  FOR UPDATE TO authenticated 
  USING (
    user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()) AND set_for_migration = true
  );

CREATE POLICY active_chat_sessions_delete_policy ON chat_data.active_chat_sessions 
  FOR DELETE TO authenticated 
  USING (
    (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

-- Active Chat Messages Policies
CREATE POLICY active_chat_messages_select_policy ON chat_data.active_chat_messages 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM chat_data.active_chat_sessions s 
      WHERE s.id = session_id AND s.user_id = (SELECT auth.uid())
    )
    OR (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

CREATE POLICY active_chat_messages_insert_policy ON chat_data.active_chat_messages 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_data.active_chat_sessions s 
      WHERE s.id = session_id 
      AND s.user_id = (SELECT auth.uid())
      AND s.set_for_migration = false
    )
  );

CREATE POLICY active_chat_messages_delete_policy ON chat_data.active_chat_messages 
  FOR DELETE TO authenticated 
  USING (
    (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

-- Historical Chat Sessions Policies
CREATE POLICY historical_sessions_select_policy ON chat_data.historical_chat_sessions 
  FOR SELECT TO authenticated 
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

CREATE POLICY historical_sessions_insert_policy ON chat_data.historical_chat_sessions 
  FOR INSERT TO authenticated 
  WITH CHECK (
    (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

CREATE POLICY historical_sessions_update_policy ON chat_data.historical_chat_sessions 
  FOR UPDATE TO authenticated 
  USING (
    (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

-- Historical Chat Messages Policies
CREATE POLICY historical_messages_select_policy ON chat_data.historical_chat_messages 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM chat_data.historical_chat_sessions s 
      WHERE s.id = session_id AND s.user_id = (SELECT auth.uid())
    )
    OR (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

CREATE POLICY historical_messages_insert_policy ON chat_data.historical_chat_messages 
  FOR INSERT TO authenticated 
  WITH CHECK (
    (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

CREATE POLICY historical_messages_update_policy ON chat_data.historical_chat_messages 
  FOR UPDATE TO authenticated 
  USING (
    (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

-- Session Message Counts Policies
CREATE POLICY session_message_counts_select_policy ON chat_data.session_message_counts 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM chat_data.active_chat_sessions s 
      WHERE s.id = session_id AND s.user_id = (SELECT auth.uid())
    )
    OR (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

CREATE POLICY session_message_counts_insert_policy ON chat_data.session_message_counts 
  FOR INSERT TO authenticated 
  WITH CHECK (
    (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

CREATE POLICY session_message_counts_update_policy ON chat_data.session_message_counts 
  FOR UPDATE TO authenticated 
  USING (
    (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

CREATE POLICY session_message_counts_delete_policy ON chat_data.session_message_counts 
  FOR DELETE TO authenticated 
  USING (
    (SELECT auth.jwt()) ->> 'app_role' = 'backend_worker'
  );

-- Revoke direct table access and only grant specific privileges
REVOKE ALL ON chat_data.session_message_counts FROM authenticated;
GRANT SELECT ON chat_data.session_message_counts TO authenticated;
