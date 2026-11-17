-- =============================================================================
-- WRAPSTORE AUTHENTICATION SEPARATION — STEP 5: IDENTITY ROUTER TRIGGER
-- File: supabase/migrations/05_identity_router_trigger.sql
-- Purpose: Routes newly registered identities between online_user and profiles.
-- Mode: [ADDITIVE / REPLACEMENT] Deploys router function and attaches to auth.users.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_auth_user_router()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    protected_role TEXT;
    extracted_full_name TEXT;
    extracted_avatar TEXT;
    extracted_phone TEXT;
    extracted_provider TEXT;
    is_verified BOOLEAN;
BEGIN
    -- 1. Extract protected role strictly from raw_app_meta_data (Never from user_meta_data)
    protected_role := LOWER(TRIM(COALESCE(NEW.raw_app_meta_data->>'role', '')));

    -- 2. Extract public profile metadata safely for display
    extracted_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        TRIM(CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name')),
        ''
    );
    extracted_avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url', 
        NEW.raw_user_meta_data->>'picture', 
        ''
    );
    extracted_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', NULL);
    extracted_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
    is_verified := COALESCE((NEW.email_confirmed_at IS NOT NULL), false);

    -- 3. ROUTE A: Explicit Administrator Provisioning (super_admin / store_manager)
    IF protected_role IN ('super_admin', 'store_manager') THEN
        -- Insert verified administrator into public.profiles
        -- Verified columns: id, email, full_name, role, avatar_url, is_active, updated_at
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            role,
            avatar_url,
            is_active,
            updated_at
        ) VALUES (
            NEW.id,
            LOWER(TRIM(NEW.email)),
            extracted_full_name,
            protected_role,
            extracted_avatar,
            true,
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            is_active = true,
            updated_at = NOW();

    -- 4. ROUTE B: Public Customer Registration (Missing, empty, or 'customer' role)
    ELSIF protected_role = '' OR protected_role = 'customer' THEN
        -- Insert verified customer into public.online_user
        -- Verified: last_login_at is left NULL on initial registration
        INSERT INTO public.online_user (
            id,
            email,
            full_name,
            phone,
            avatar_url,
            default_shipping_address,
            email_verified,
            auth_provider,
            is_active,
            last_login_at,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            LOWER(TRIM(NEW.email)),
            extracted_full_name,
            extracted_phone,
            extracted_avatar,
            '{}'::jsonb,
            is_verified,
            extracted_provider,
            true,
            NULL, -- Explicitly NULL at initial registration
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = CASE WHEN online_user.full_name IS NULL OR online_user.full_name = '' THEN EXCLUDED.full_name ELSE online_user.full_name END,
            avatar_url = CASE WHEN online_user.avatar_url IS NULL OR online_user.avatar_url = '' THEN EXCLUDED.avatar_url ELSE online_user.avatar_url END,
            email_verified = EXCLUDED.email_verified,
            updated_at = NOW();

    -- 5. ROUTE C: Unknown / Unrecognized Protected Role
    -- Reject or quarantine: Never automatically classify an unrecognized role as a customer
    ELSE
        -- Log quarantine entry into audit ledger
        INSERT INTO public._auth_migration_audit (
            batch_id,
            profile_id,
            auth_user_id,
            email,
            role_at_migration,
            migration_status,
            notes
        ) VALUES (
            'LIVE_ROUTER_QUARANTINE',
            NEW.id,
            NEW.id,
            LOWER(TRIM(NEW.email)),
            protected_role,
            'UNRECOGNIZED_ROLE_QUARANTINED',
            'Auth user created with unrecognized role. Excluded from online_user and profiles.'
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Drop legacy trigger and attach new smart router
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_router();

COMMENT ON FUNCTION public.handle_auth_user_router() IS 'Routes auth.users to public.profiles (admins) or public.online_user (customers) based on protected app_metadata.';
