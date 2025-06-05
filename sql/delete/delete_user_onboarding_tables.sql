-- Revoke permissions first
REVOKE USAGE ON SCHEMA user_onboarding FROM authenticated;
REVOKE ALL ON FUNCTION user_onboarding.get_current_settings FROM authenticated;
REVOKE ALL ON FUNCTION user_onboarding.increment_user_count FROM authenticated;
REVOKE ALL ON FUNCTION user_onboarding.check_user_exists FROM authenticated;

-- Drop the functions
DROP FUNCTION IF EXISTS user_onboarding.get_current_settings();
DROP FUNCTION IF EXISTS user_onboarding.set_allowed_registrations();
DROP FUNCTION IF EXISTS user_onboarding.increment_user_count(text);
DROP FUNCTION IF EXISTS user_onboarding.check_user_exists(text);
DROP FUNCTION IF EXISTS user_onboarding.check_backend_worker();

-- Drop the tables
DROP TABLE IF EXISTS user_onboarding.user_signup_tracking;
DROP TABLE IF EXISTS user_onboarding.onboarding_settings;

-- Finally drop the schema
DROP SCHEMA IF EXISTS user_onboarding CASCADE;