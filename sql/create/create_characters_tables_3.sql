-- Ensure UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom type for chat starters
CREATE TYPE chat_starter_pair AS (
    title text,
    content text
);

-- Create character categories table
CREATE TABLE public.character_categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE
);

-- Create character categories translations table
CREATE TABLE public.character_category_translations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id uuid NOT NULL REFERENCES public.character_categories(id) ON DELETE CASCADE,
    language_code text NOT NULL,
    name text NOT NULL,
    UNIQUE (category_id, language_code)
);

-- Create characters table
CREATE TABLE public.characters (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    character_category uuid NOT NULL REFERENCES public.character_categories(id),
    name text NOT NULL UNIQUE,
    bio text NOT NULL,
    system_prompt text NOT NULL,
    system_prompt_token_count int NOT NULL,
    initial_message text NOT NULL,
    initial_message_token_count int NOT NULL,
    chat_starters chat_starter_pair[] NOT NULL,
    icon_url text NOT NULL,
    main_hashtags text[] NOT NULL,
    secondary_hashtags text[][] NOT NULL,
    display_hashtags text[] NOT NULL,
    initial_message_content text[],
    paused boolean DEFAULT false,
    CONSTRAINT check_chat_starters_count CHECK (array_length(chat_starters, 1) <= 3)
);

-- Create character translations table
CREATE TABLE public.character_translations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
    language_code text NOT NULL,
    name text NOT NULL,
    bio text NOT NULL,
    system_prompt text NOT NULL,
    system_prompt_token_count int NOT NULL,
    initial_message text NOT NULL,
    initial_message_token_count int NOT NULL,
    chat_starters chat_starter_pair[] NOT NULL,
    display_hashtags text[] NOT NULL,
    UNIQUE (character_id, language_code),
    CONSTRAINT check_chat_starters_count CHECK (array_length(chat_starters, 1) <= 3)
);

-- Create covering indexes for common query patterns
CREATE INDEX idx_char_translations_covering ON public.character_translations 
USING btree (character_id, language_code);

CREATE INDEX idx_category_translations_covering ON public.character_category_translations 
USING btree (category_id, language_code) 
INCLUDE (name);

-- Create indexes for foreign key relationships
CREATE INDEX idx_category_characters ON public.characters(character_category);
CREATE INDEX idx_icon_url_characters ON public.characters(icon_url);

-- Create partial indexes for non-paused characters
CREATE INDEX idx_active_characters ON public.characters(character_category, id) 
WHERE NOT paused;

-- Create language-specific indexes
CREATE INDEX idx_char_translations_lang ON public.character_translations(language_code, character_id);
CREATE INDEX idx_category_translations_lang ON public.character_category_translations(language_code, category_id);

-- Create trigger function to enforce icon_url bucket_id constraint
CREATE OR REPLACE FUNCTION public.enforce_icon_url_bucket()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
  IF NOT NEW.icon_url ~ '^character-profile-pics/' THEN
    RAISE EXCEPTION 'icon_url must start with character-profile-pics/';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to enforce content constraints
CREATE OR REPLACE FUNCTION public.enforce_content_constraints()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
  -- Check for main_hashtags and secondary_hashtags length
  IF array_length(NEW.main_hashtags, 1) != array_length(NEW.secondary_hashtags, 1) THEN
    RAISE EXCEPTION 'main_hashtags and secondary_hashtags must have the same length';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to enforce matching chat_starters length
CREATE OR REPLACE FUNCTION public.enforce_matching_chat_starters_length()
RETURNS TRIGGER 
SET search_path = public
AS $$
DECLARE
    character_starters_length INT;
BEGIN
    -- Get the number of chat starters from the parent character
    SELECT array_length(chat_starters, 1) INTO character_starters_length
    FROM public.characters
    WHERE id = NEW.character_id;

    -- Check if the lengths match
    IF array_length(NEW.chat_starters, 1) != character_starters_length THEN
        RAISE EXCEPTION 'Number of chat starters in translation (%) must match the number in the character table (%)', 
            array_length(NEW.chat_starters, 1), character_starters_length;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER trg_enforce_icon_url_bucket
  BEFORE INSERT OR UPDATE ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION enforce_icon_url_bucket();

CREATE TRIGGER trg_enforce_content_constraints
  BEFORE INSERT OR UPDATE ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION enforce_content_constraints();

CREATE TRIGGER trg_enforce_matching_chat_starters_length
    BEFORE INSERT OR UPDATE ON public.character_translations
    FOR EACH ROW
    EXECUTE FUNCTION enforce_matching_chat_starters_length();

-- Handle permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Enable RLS
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_category_translations ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Anyone authenticated can read characters" 
  ON public.characters FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "Anyone authenticated can read character categories" 
  ON public.character_categories FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "Anyone authenticated can read character translations" 
  ON public.character_translations FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "Anyone authenticated can read category translations" 
  ON public.character_category_translations FOR SELECT TO authenticated 
  USING (true);

-- Create policies for backend_worker
-- Character categories policies
CREATE POLICY "Backend worker can insert categories" 
  ON public.character_categories FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');

CREATE POLICY "Backend worker can update categories" 
  ON public.character_categories FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker')
  WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');

-- Category translations policies
CREATE POLICY "Backend worker can insert category translations" 
  ON public.character_category_translations FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');

CREATE POLICY "Backend worker can update category translations" 
  ON public.character_category_translations FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker')
  WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');

-- Characters policies
CREATE POLICY "Backend worker can insert characters" 
  ON public.characters FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');

CREATE POLICY "Backend worker can update characters" 
  ON public.characters FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker')
  WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');

-- Character translations policies
CREATE POLICY "Backend worker can insert character translations" 
  ON public.character_translations FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');

CREATE POLICY "Backend worker can update character translations" 
  ON public.character_translations FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker')
  WITH CHECK ((SELECT auth.jwt()) ->> 'app_role' = 'backend_worker');
