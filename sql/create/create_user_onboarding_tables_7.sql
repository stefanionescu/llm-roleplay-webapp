-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS user_onboarding;

-- Create settings table with added allowed_registrations column
CREATE TABLE IF NOT EXISTS user_onboarding.onboarding_settings (
    id int PRIMARY KEY DEFAULT 1,
    signed_up_users int NOT NULL DEFAULT 0,
    signed_up_user_limit int NOT NULL DEFAULT 150,
    waitlist_limit int NOT NULL CHECK (
        waitlist_limit > 0 
        AND waitlist_limit <= 10000000
    ) DEFAULT 50000,
    invite_code_limit int NOT NULL CHECK ( 
        invite_code_limit > 0 
        AND invite_code_limit <= 10
    ) DEFAULT 3,
    invite_code_length int NOT NULL CHECK (
        invite_code_length >= 6 
        AND invite_code_length <= 12
    ) DEFAULT 6,
    signup_cutoff int NOT NULL CHECK (
        signup_cutoff >= -1
    ) DEFAULT -1,
    allowed_registrations text NOT NULL CHECK (
        allowed_registrations IN ('all', 'waitlist')
    ) DEFAULT 'all'
);

CREATE TABLE IF NOT EXISTS user_onboarding.user_signup_tracking (
    username text PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default settings if not exists
INSERT INTO user_onboarding.onboarding_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Create function to check manager role
CREATE OR REPLACE FUNCTION user_onboarding.check_backend_worker() 
RETURNS void AS $$
BEGIN
    -- Check if the caller is using the service role
    IF auth.role() = 'service_role' THEN
        -- If it's the service role, allow access and exit the function
        RETURN;
    END IF;

    -- If not the service role, check for the 'backend_worker' role in the JWT
    -- Handle potential NULL from accessing jwt() ->> 'app_role'
    IF COALESCE(auth.jwt() ->> 'app_role', '') != 'backend_worker' THEN
        RAISE EXCEPTION 'Permission denied. Service role or backend worker JWT role required.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = user_onboarding, pg_temp;

-- Create function to get settings
CREATE OR REPLACE FUNCTION user_onboarding.get_current_settings()
RETURNS user_onboarding.onboarding_settings AS $$
DECLARE
    settings user_onboarding.onboarding_settings;
BEGIN
    -- Role check happens first, before any data access
    PERFORM user_onboarding.check_backend_worker();
    
    SELECT * INTO settings
    FROM user_onboarding.onboarding_settings
    WHERE id = 1;
    
    RETURN settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = user_onboarding, pg_temp;

-- Function to change allowed_registrations
CREATE OR REPLACE FUNCTION user_onboarding.set_allowed_registrations(
    registration_type text
) RETURNS boolean AS $$
DECLARE
    rows_updated int;
BEGIN
    -- Role check happens first
    PERFORM user_onboarding.check_backend_worker();

    IF registration_type IS NULL THEN
        RAISE EXCEPTION 'Registration type cannot be null';
    END IF;

    IF registration_type NOT IN ('all', 'waitlist') THEN
        RAISE EXCEPTION 'Registration type must be either "all" or "waitlist"';
    END IF;

    UPDATE user_onboarding.onboarding_settings
    SET allowed_registrations = registration_type
    WHERE id = 1;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = user_onboarding, pg_temp;

-- Create function to track signups
CREATE OR REPLACE FUNCTION user_onboarding.increment_user_count(
    username text
) RETURNS boolean AS $$
DECLARE
    rows_updated int;
BEGIN
    -- Role check happens first
    PERFORM user_onboarding.check_backend_worker();

    IF username IS NULL THEN
        RAISE EXCEPTION 'Username cannot be null';
    END IF;

    -- Check if user already tracked
    IF EXISTS (
        SELECT 1 
        FROM user_onboarding.user_signup_tracking 
        WHERE user_signup_tracking.username = increment_user_count.username
    ) THEN
        RETURN false;
    END IF;

    -- Increment counter and track user atomically
    WITH increment_result AS (
        UPDATE user_onboarding.onboarding_settings
        SET signed_up_users = signed_up_users + 1
        WHERE id = 1
        AND signed_up_users < signed_up_user_limit
        RETURNING id
    )
    INSERT INTO user_onboarding.user_signup_tracking (username)
    SELECT increment_user_count.username
    FROM increment_result;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated > 0;

EXCEPTION 
    WHEN unique_violation THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = user_onboarding, pg_temp;

-- Function to check if user exists in tracking
CREATE OR REPLACE FUNCTION user_onboarding.check_user_exists(
    username text
) RETURNS boolean AS $$
BEGIN
    -- Role check happens first
    PERFORM user_onboarding.check_backend_worker();

    IF username IS NULL THEN
        RAISE EXCEPTION 'Username cannot be null';
    END IF;

    RETURN EXISTS (
        SELECT 1 
        FROM user_onboarding.user_signup_tracking 
        WHERE user_signup_tracking.username = check_user_exists.username
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = user_onboarding, pg_temp;

-- Grant schema usage to authenticated and service_role
GRANT USAGE ON SCHEMA user_onboarding TO authenticated;
GRANT USAGE ON SCHEMA user_onboarding TO service_role;

-- Only grant function execution to authenticated
GRANT EXECUTE ON FUNCTION user_onboarding.get_current_settings TO authenticated;
GRANT EXECUTE ON FUNCTION user_onboarding.increment_user_count TO authenticated;
GRANT EXECUTE ON FUNCTION user_onboarding.check_user_exists TO authenticated;
GRANT EXECUTE ON FUNCTION user_onboarding.set_allowed_registrations TO authenticated;

-- Revoke direct table access and only grant specific privileges
REVOKE ALL ON user_onboarding.onboarding_settings FROM authenticated;
REVOKE ALL ON user_onboarding.user_signup_tracking FROM authenticated;