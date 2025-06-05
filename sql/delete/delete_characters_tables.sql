-- Revoke all permissions
DO $$
BEGIN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;
EXCEPTION
    WHEN undefined_object OR undefined_table THEN
        NULL;
END $$;

-- Drop backend worker policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Backend worker can insert categories" ON public.character_categories;
    DROP POLICY IF EXISTS "Backend worker can update categories" ON public.character_categories;
    DROP POLICY IF EXISTS "Backend worker can insert category translations" ON public.character_category_translations;
    DROP POLICY IF EXISTS "Backend worker can update category translations" ON public.character_category_translations;
    DROP POLICY IF EXISTS "Backend worker can insert characters" ON public.characters;
    DROP POLICY IF EXISTS "Backend worker can update characters" ON public.characters;
    DROP POLICY IF EXISTS "Backend worker can insert character translations" ON public.character_translations;
    DROP POLICY IF EXISTS "Backend worker can update character translations" ON public.character_translations;
EXCEPTION
    WHEN undefined_object OR undefined_table THEN
        NULL;
END $$;

-- Drop regular policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone authenticated can read characters" ON public.characters;
    DROP POLICY IF EXISTS "Anyone authenticated can read character categories" ON public.character_categories;
    DROP POLICY IF EXISTS "Anyone authenticated can read character translations" ON public.character_translations;
    DROP POLICY IF EXISTS "Anyone authenticated can read category translations" ON public.character_category_translations;
EXCEPTION
    WHEN undefined_object OR undefined_table THEN
        NULL;
END $$;

-- Disable RLS
ALTER TABLE IF EXISTS public.characters DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.character_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.character_translations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.character_category_translations DISABLE ROW LEVEL SECURITY;

-- Drop indexes
DROP INDEX IF EXISTS idx_char_translations_covering;
DROP INDEX IF EXISTS idx_category_translations_covering;
DROP INDEX IF EXISTS idx_category_characters;
DROP INDEX IF EXISTS idx_icon_url_characters;
DROP INDEX IF EXISTS idx_active_characters;
DROP INDEX IF EXISTS idx_char_translations_lang;
DROP INDEX IF EXISTS idx_category_translations_lang;

-- Drop triggers
DROP TRIGGER IF EXISTS trg_enforce_icon_url_bucket ON public.characters;
DROP TRIGGER IF EXISTS trg_enforce_content_constraints ON public.characters;
DROP TRIGGER IF EXISTS trg_enforce_matching_chat_starters_length ON public.character_translations;

-- Drop functions
DROP FUNCTION IF EXISTS public.enforce_icon_url_bucket() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_content_constraints() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_matching_chat_starters_length() CASCADE;

-- Drop tables
DROP TABLE IF EXISTS public.character_translations CASCADE;
DROP TABLE IF EXISTS public.character_category_translations CASCADE;
DROP TABLE IF EXISTS public.characters CASCADE;
DROP TABLE IF EXISTS public.character_categories CASCADE;

-- Drop custom type
DROP TYPE IF EXISTS chat_starter_pair CASCADE;