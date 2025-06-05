-- Initial Setup: Disable triggers and RLS
SET session_replication_role = 'replica';

-- First detach all partitions and drop their constraints
DO $$
DECLARE
    partition_record record;
BEGIN
    -- First drop all foreign key constraints from partitions
    FOR partition_record IN (
        SELECT 
            child.relname as child_table,
            con.conname as constraint_name
        FROM pg_constraint con
        JOIN pg_class child ON con.conrelid = child.oid
        JOIN pg_namespace n ON child.relnamespace = n.oid
        WHERE n.nspname = 'content_data'
        AND child.relname LIKE 'sectioned_content_%'
        AND con.contype = 'f'
    )
    LOOP
        BEGIN
            EXECUTE format(
                'ALTER TABLE content_data.%I DROP CONSTRAINT IF EXISTS %I CASCADE',
                partition_record.child_table,
                partition_record.constraint_name
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop constraint % from table %: %', 
                partition_record.constraint_name, 
                partition_record.child_table, 
                SQLERRM;
        END;
    END LOOP;

    -- Then detach partitions
    FOR partition_record IN (
        SELECT child.relname as child_table
        FROM pg_inherits i
        JOIN pg_class parent ON i.inhparent = parent.oid
        JOIN pg_class child ON i.inhrelid = child.oid
        JOIN pg_namespace n ON child.relnamespace = n.oid
        WHERE parent.relname = 'sectioned_content_descriptions_partitioned'
        AND n.nspname = 'content_data'
    )
    LOOP
        BEGIN
            EXECUTE format(
                'ALTER TABLE content_data.sectioned_content_descriptions_partitioned DETACH PARTITION content_data.%I',
                partition_record.child_table
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not detach partition %: %', 
                partition_record.child_table, 
                SQLERRM;
        END;
    END LOOP;
END $$;

-- Drop remaining foreign key constraints
DO $$
DECLARE
    fk_record record;
BEGIN
    FOR fk_record IN (
        SELECT tc.table_schema, 
               tc.table_name, 
               tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'content_data'
    )
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I CASCADE',
                fk_record.table_schema,
                fk_record.table_name,
                fk_record.constraint_name
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop foreign key % from table %: %',
                fk_record.constraint_name,
                fk_record.table_name,
                SQLERRM;
        END;
    END LOOP;
END $$;

-- Now drop the partitions
DO $$
DECLARE
    partition_record record;
BEGIN
    FOR partition_record IN (
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'content_data'
        AND c.relname LIKE 'sectioned_content_%'
        AND c.relkind = 'r'
    )
    LOOP
        BEGIN
            EXECUTE format('DROP TABLE IF EXISTS content_data.%I CASCADE', 
                          partition_record.relname);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop table %: %', 
                partition_record.relname,
                SQLERRM;
        END;
    END LOOP;
END $$;

-- Disable Row Level Security on all tables
ALTER TABLE IF EXISTS content_data.full_content_descriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_data.full_content_translations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_data.sectioned_content_descriptions_partitioned DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_data.content_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_data.mv_refresh_control DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_data.active_penalties DISABLE ROW LEVEL SECURITY;

-- Revoke Schema Permissions
REVOKE USAGE ON SCHEMA content_data FROM authenticated;

-- Revoke Table Permissions
REVOKE ALL ON content_data.content_settings FROM authenticated;
REVOKE ALL ON content_data.active_penalties FROM authenticated;
REVOKE ALL ON content_data.full_content_descriptions FROM authenticated;
REVOKE ALL ON content_data.full_content_translations FROM authenticated;
REVOKE ALL ON content_data.sectioned_content_descriptions_partitioned FROM authenticated;
REVOKE ALL ON content_data.mv_refresh_control FROM authenticated;

-- Revoke Function Permissions
REVOKE EXECUTE ON FUNCTION content_data.apply_penalties_to_documents FROM authenticated;
REVOKE EXECUTE ON FUNCTION content_data.search_similar_content_with_penalties FROM authenticated;
REVOKE EXECUTE ON FUNCTION content_data.search_similar_content_with_hashtags_and_penalties FROM authenticated;
REVOKE EXECUTE ON FUNCTION content_data.hybrid_search_with_penalties FROM authenticated;
REVOKE EXECUTE ON FUNCTION content_data.hybrid_search_with_hashtags_and_penalties FROM authenticated;
REVOKE EXECUTE ON FUNCTION content_data.get_full_content_paginated FROM authenticated;
REVOKE EXECUTE ON FUNCTION content_data.get_content_translations FROM authenticated;
REVOKE EXECUTE ON FUNCTION content_data.is_in_full_content FROM authenticated;
REVOKE EXECUTE ON FUNCTION content_data.bulk_insert_sectioned_content FROM authenticated;
REVOKE EXECUTE ON FUNCTION content_data.cleanup_expired_active_penalties FROM authenticated;
REVOKE EXECUTE ON FUNCTION content_data.force_delete_active_penalties FROM authenticated;
REVOKE EXECUTE ON FUNCTION content_data.update_content_settings FROM authenticated;
REVOKE EXECUTE ON FUNCTION content_data.bulk_insert_full_content FROM authenticated;
REVOKE EXECUTE ON FUNCTION content_data.perform_materialized_view_refresh FROM authenticated;
REVOKE EXECUTE ON FUNCTION content_data.get_language_materialized_views FROM authenticated;
REVOKE EXECUTE ON FUNCTION content_data.get_partition_sizes FROM authenticated;

-- Drop RLS Policies
DROP POLICY IF EXISTS trigger_partition_creation ON content_data.sectioned_content_descriptions_partitioned;
DROP POLICY IF EXISTS sectioned_content_read_policy ON content_data.sectioned_content_descriptions_partitioned;
DROP POLICY IF EXISTS user_select_own_penalties ON content_data.active_penalties;
DROP POLICY IF EXISTS user_insert_own_penalties ON content_data.active_penalties;
DROP POLICY IF EXISTS user_update_own_penalties ON content_data.active_penalties;
DROP POLICY IF EXISTS backend_worker_full_content_select ON content_data.full_content_descriptions;
DROP POLICY IF EXISTS backend_worker_full_content_insert ON content_data.full_content_descriptions;
DROP POLICY IF EXISTS backend_worker_full_content_update ON content_data.full_content_descriptions;
DROP POLICY IF EXISTS backend_worker_translations_select ON content_data.full_content_translations;
DROP POLICY IF EXISTS backend_worker_translations_insert ON content_data.full_content_translations;
DROP POLICY IF EXISTS backend_worker_translations_update ON content_data.full_content_translations;
DROP POLICY IF EXISTS backend_worker_sectioned_content_select ON content_data.sectioned_content_descriptions_partitioned;
DROP POLICY IF EXISTS backend_worker_sectioned_content_insert ON content_data.sectioned_content_descriptions_partitioned;
DROP POLICY IF EXISTS backend_worker_sectioned_content_update ON content_data.sectioned_content_descriptions_partitioned;
DROP POLICY IF EXISTS backend_worker_mv_refresh_select ON content_data.mv_refresh_control;
DROP POLICY IF EXISTS backend_worker_mv_refresh_insert ON content_data.mv_refresh_control;
DROP POLICY IF EXISTS backend_worker_mv_refresh_update ON content_data.mv_refresh_control;
DROP POLICY IF EXISTS backend_worker_content_settings_select ON content_data.content_settings;
DROP POLICY IF EXISTS backend_worker_content_settings_update ON content_data.content_settings;

-- Drop Materialized Views
DO $$
DECLARE
    mv_record record;
BEGIN
    FOR mv_record IN 
        SELECT matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'content_data'
    LOOP
        EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS content_data.%I CASCADE', mv_record.matviewname);
    END LOOP;
END $$;

-- Drop Named Triggers
DROP TRIGGER IF EXISTS check_valid_bucket_trigger ON content_data.full_content_descriptions CASCADE;
DROP TRIGGER IF EXISTS check_metadata_match_trigger ON content_data.full_content_descriptions CASCADE;
DROP TRIGGER IF EXISTS update_sectioned_content_derived_columns_trigger ON content_data.sectioned_content_descriptions_partitioned CASCADE;
DROP TRIGGER IF EXISTS create_partition_trigger ON content_data.full_content_descriptions CASCADE;
DROP TRIGGER IF EXISTS create_mv_english_trigger ON content_data.full_content_descriptions CASCADE;
DROP TRIGGER IF EXISTS create_translation_partition_trigger ON content_data.full_content_translations CASCADE;

-- Drop Any Remaining Triggers
DO $$
DECLARE
    trig_record record;
BEGIN
    FOR trig_record IN 
        SELECT tgname, relname 
        FROM pg_trigger t 
        JOIN pg_class c ON t.tgrelid = c.oid 
        JOIN pg_namespace n ON c.relnamespace = n.oid 
        WHERE n.nspname = 'content_data'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON content_data.%I CASCADE', 
                      trig_record.tgname, 
                      trig_record.relname);
    END LOOP;
END $$;

-- Drop Indexes
DO $$
DECLARE
    idx_record record;
BEGIN
    FOR idx_record IN 
        SELECT schemaname, tablename, indexname 
        FROM pg_indexes 
        WHERE schemaname = 'content_data'
        AND indexname NOT LIKE '%_pkey'
    LOOP
        BEGIN
            EXECUTE format('DROP INDEX IF EXISTS %I.%I CASCADE', 
                          idx_record.schemaname, 
                          idx_record.indexname);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop index %: %', 
                idx_record.indexname,
                SQLERRM;
        END;
    END LOOP;
END $$;

-- Drop Functions - part 1: specific functions with complex signatures
DO $$
BEGIN
    -- Drop content-related functions
    DROP FUNCTION IF EXISTS content_data.validate_rag_parameters(uuid, content_data.vector, text, float, integer, text[], text[][]) CASCADE;
    DROP FUNCTION IF EXISTS content_data.search_similar_content_with_penalties(uuid, content_data.vector, text, float, integer) CASCADE;
    DROP FUNCTION IF EXISTS content_data.search_similar_content_with_hashtags_and_penalties(text[], text[], int[], uuid, content_data.vector, text, float, integer) CASCADE;
    DROP FUNCTION IF EXISTS content_data.hybrid_search_with_penalties(uuid, content_data.vector, text, text, float, integer) CASCADE;
    DROP FUNCTION IF EXISTS content_data.hybrid_search_with_hashtags_and_penalties(text[], text[], int[], uuid, content_data.vector, text, text, float, integer) CASCADE;
    
    -- Drop utility and data-retrieval functions
    DROP FUNCTION IF EXISTS content_data.get_content_translations(uuid) CASCADE;
    DROP FUNCTION IF EXISTS content_data.get_full_content_paginated(integer, integer, text, uuid) CASCADE;
    DROP FUNCTION IF EXISTS content_data.get_language_materialized_views() CASCADE;
    DROP FUNCTION IF EXISTS content_data.get_partition_sizes(text) CASCADE;
    DROP FUNCTION IF EXISTS content_data.apply_penalties_to_documents(uuid[]) CASCADE;
    DROP FUNCTION IF EXISTS content_data.cleanup_expired_active_penalties(int) CASCADE;
    DROP FUNCTION IF EXISTS content_data.force_delete_active_penalties(uuid[], uuid[], int) CASCADE;
END $$;

-- Drop Functions - part 2: remaining functions
DO $$
DECLARE
    func_record record;
BEGIN
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) AS argtypes 
        FROM pg_proc 
        JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
        WHERE nspname = 'content_data'
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS content_data.%I(%s) CASCADE', 
                          func_record.proname, 
                          func_record.argtypes);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop function %(%): %', 
                func_record.proname, 
                func_record.argtypes,
                SQLERRM;
        END;
    END LOOP;
END $$;

-- Drop Tables
DROP TABLE IF EXISTS content_data.active_penalties CASCADE;
DROP TABLE IF EXISTS content_data.mv_refresh_control CASCADE;
DROP TABLE IF EXISTS content_data.content_settings CASCADE;
DROP TABLE IF EXISTS content_data.full_content_translations CASCADE;
DROP TABLE IF EXISTS content_data.sectioned_content_descriptions_partitioned CASCADE;
DROP TABLE IF EXISTS content_data.full_content_descriptions CASCADE;

-- Drop Extensions (except uuid-ossp)
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
DROP EXTENSION IF EXISTS vector CASCADE;

-- Drop Schema
DROP SCHEMA IF EXISTS content_data CASCADE;

-- Re-enable Triggers
SET session_replication_role = 'origin';