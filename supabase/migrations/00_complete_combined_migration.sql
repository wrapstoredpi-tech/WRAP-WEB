-- =============================================================================
-- WRAPSTORE COMPLETE AUTHENTICATION SEPARATION — MASTER DEPLOYMENT SCRIPT
-- File: supabase/migrations/00_complete_combined_migration.sql
-- Execution Target: Supabase Dashboard SQL Editor
-- Total Execution Time: ~2-5 seconds
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Create Migration Audit Ledger
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public._auth_migration_audit (
    id BIGSERIAL PRIMARY KEY,
    batch_id TEXT NOT NULL,
    profile_id UUID NOT NULL,
    auth_user_id UUID NOT NULL,
    email TEXT NOT NULL,
    role_at_migration TEXT,
    migration_status TEXT NOT NULL,
    notes TEXT,
    migrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_migration_audit_batch 
ON public._auth_migration_audit (batch_id, profile_id);

-- Enable RLS and revoke all client access (Table remains private to postgres and SECURITY DEFINER functions)
ALTER TABLE public._auth_migration_audit ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public._auth_migration_audit FROM public;
REVOKE ALL ON TABLE public._auth_migration_audit FROM anon;
REVOKE ALL ON TABLE public._auth_migration_audit FROM authenticated;

-- -----------------------------------------------------------------------------
-- 2. Create public.online_user (Exclusively for registered ecommerce customers)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.online_user (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    default_shipping_address JSONB DEFAULT '{}'::jsonb NOT NULL,
    email_verified BOOLEAN DEFAULT false NOT NULL,
    auth_provider TEXT DEFAULT 'email' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_online_user_email_format 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_online_user_unique_lower_email 
ON public.online_user (LOWER(TRIM(email)));

CREATE INDEX IF NOT EXISTS idx_online_user_phone 
ON public.online_user (phone) 
WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_online_user_is_active 
ON public.online_user (is_active);

-- -----------------------------------------------------------------------------
-- 3. Row-Level Security & Column Permissions
-- -----------------------------------------------------------------------------
ALTER TABLE public.online_user ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "online_user_select_own" ON public.online_user;
DROP POLICY IF EXISTS "online_user_select_admin" ON public.online_user;
DROP POLICY IF EXISTS "online_user_insert_deny" ON public.online_user;
DROP POLICY IF EXISTS "online_user_update_own" ON public.online_user;
DROP POLICY IF EXISTS "online_user_delete_deny" ON public.online_user;

CREATE POLICY "online_user_select_own" 
ON public.online_user FOR SELECT TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "online_user_select_admin" 
ON public.online_user FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
          AND role IN ('super_admin', 'store_manager') 
          AND is_active = true
    )
);

CREATE POLICY "online_user_insert_deny" 
ON public.online_user FOR INSERT TO authenticated, anon 
WITH CHECK (false);

CREATE POLICY "online_user_update_own" 
ON public.online_user FOR UPDATE TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "online_user_delete_deny" 
ON public.online_user FOR DELETE TO authenticated, anon 
USING (false);

-- Database Engine Column Permissions
REVOKE UPDATE ON public.online_user FROM public;
REVOKE UPDATE ON public.online_user FROM anon;
REVOKE UPDATE ON public.online_user FROM authenticated;

GRANT UPDATE (
    full_name, 
    phone, 
    avatar_url, 
    default_shipping_address
) ON public.online_user TO authenticated;

GRANT SELECT ON public.online_user TO authenticated;

-- Immutability & Audit Trigger
CREATE OR REPLACE FUNCTION public.trg_online_user_protect_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.id <> OLD.id THEN
        RAISE EXCEPTION 'Modification of account ID is strictly prohibited.'
            USING ERRCODE = 'integrity_constraint_violation';
    END IF;

    IF NEW.email <> OLD.email THEN
        RAISE EXCEPTION 'Direct modification of email is prohibited. Use Supabase Auth verification.'
            USING ERRCODE = 'integrity_constraint_violation';
    END IF;

    IF NEW.email_verified <> OLD.email_verified THEN
        RAISE EXCEPTION 'Modification of email_verified status is restricted to auth triggers.'
            USING ERRCODE = 'integrity_constraint_violation';
    END IF;

    IF NEW.auth_provider <> OLD.auth_provider THEN
        RAISE EXCEPTION 'Modification of auth_provider is prohibited.'
            USING ERRCODE = 'integrity_constraint_violation';
    END IF;

    IF NEW.is_active <> OLD.is_active THEN
        RAISE EXCEPTION 'Modification of account active status is restricted to administrators.'
            USING ERRCODE = 'integrity_constraint_violation';
    END IF;

    IF NEW.created_at <> OLD.created_at THEN
        RAISE EXCEPTION 'Modification of created_at timestamp is prohibited.'
            USING ERRCODE = 'integrity_constraint_violation';
    END IF;

    IF NEW.last_login_at IS DISTINCT FROM OLD.last_login_at THEN
        IF current_setting('wrapstore.allow_login_timestamp_update', true) IS DISTINCT FROM 'true' THEN
            RAISE EXCEPTION 'Modification of last_login_at is restricted to system login tracking.'
                USING ERRCODE = 'integrity_constraint_violation';
        END IF;
    END IF;

    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_online_user_fields ON public.online_user;

CREATE TRIGGER trg_protect_online_user_fields
    BEFORE UPDATE ON public.online_user
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_online_user_protect_fields();

-- -----------------------------------------------------------------------------
-- 4. Login Tracking RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_customer_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_id UUID := auth.uid();
BEGIN
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to record login timestamp.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    PERFORM set_config('wrapstore.allow_login_timestamp_update', 'true', true);

    UPDATE public.online_user
    SET 
        last_login_at = NOW(),
        updated_at = NOW()
    WHERE id = caller_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_customer_login() FROM public;
REVOKE ALL ON FUNCTION public.record_customer_login() FROM anon;
GRANT EXECUTE ON FUNCTION public.record_customer_login() TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. Identity Router Trigger on auth.users
-- -----------------------------------------------------------------------------
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
    protected_role := LOWER(TRIM(COALESCE(NEW.raw_app_meta_data->>'role', '')));

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

    -- ROUTE A: Administrator Provisioning
    IF protected_role IN ('super_admin', 'store_manager') THEN
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

    -- ROUTE B: Customer Registration
    ELSIF protected_role = '' OR protected_role = 'customer' THEN
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
            NULL,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = CASE WHEN online_user.full_name IS NULL OR online_user.full_name = '' THEN EXCLUDED.full_name ELSE online_user.full_name END,
            avatar_url = CASE WHEN online_user.avatar_url IS NULL OR online_user.avatar_url = '' THEN EXCLUDED.avatar_url ELSE online_user.avatar_url END,
            email_verified = EXCLUDED.email_verified,
            updated_at = NOW();

    -- ROUTE C: Unknown / Unrecognized Role
    ELSE
        INSERT INTO public._auth_migration_audit (
            batch_id, profile_id, auth_user_id, email, role_at_migration, migration_status, notes
        ) VALUES (
            'LIVE_ROUTER_QUARANTINE', NEW.id, NEW.id, LOWER(TRIM(NEW.email)), protected_role,
            'UNRECOGNIZED_ROLE_QUARANTINED',
            'Auth user created with unrecognized role. Excluded from online_user and profiles.'
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_router();

-- -----------------------------------------------------------------------------
-- 6. Safe Allowlist Customer Migration
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    current_batch TEXT := 'BATCH_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS');
    migrated_count INT := 0;
    quarantined_count INT := 0;
    verified_cleaned_count INT := 0;
    rec RECORD;
    duplicate_email_list TEXT[];
BEGIN
    SELECT ARRAY_AGG(normalized_email) INTO duplicate_email_list
    FROM (
        SELECT LOWER(TRIM(p.email)) AS normalized_email
        FROM public.profiles p
        JOIN auth.users u ON p.id = u.id
        WHERE LOWER(TRIM(COALESCE(p.role, ''))) IN ('customer', 'user', 'guest')
        GROUP BY LOWER(TRIM(p.email))
        HAVING COUNT(*) > 1
    ) sub;

    IF duplicate_email_list IS NULL THEN
        duplicate_email_list := ARRAY[]::TEXT[];
    END IF;

    FOR rec IN 
        SELECT 
            p.id,
            LOWER(TRIM(p.email)) AS clean_email,
            p.full_name,
            p.avatar_url,
            p.role,
            p.is_active,
            p.updated_at,
            u.id AS auth_uuid,
            u.created_at AS auth_created_at,
            u.phone AS auth_phone,
            (u.email_confirmed_at IS NOT NULL) AS is_email_confirmed,
            COALESCE(u.raw_app_meta_data->>'provider', 'email') AS provider
        FROM public.profiles p
        JOIN auth.users u ON p.id = u.id
        WHERE LOWER(TRIM(COALESCE(p.role, ''))) IN ('customer', 'user', 'guest')
          AND LOWER(TRIM(COALESCE(p.role, ''))) NOT IN ('super_admin', 'store_manager', 'admin')
        ORDER BY u.created_at ASC
    LOOP
        IF rec.clean_email = ANY(duplicate_email_list) THEN
            INSERT INTO public._auth_migration_audit (
                batch_id, profile_id, auth_user_id, email, role_at_migration, migration_status, notes
            ) VALUES (
                current_batch, rec.id, rec.auth_uuid, rec.clean_email, rec.role, 
                'DUPLICATE_QUARANTINED', 
                'Multiple profile accounts share this email. Quarantined for manual review.'
            );
            quarantined_count := quarantined_count + 1;
            CONTINUE;
        END IF;

        IF EXISTS (SELECT 1 FROM public.online_user WHERE id = rec.id OR LOWER(TRIM(email)) = rec.clean_email) THEN
            INSERT INTO public._auth_migration_audit (
                batch_id, profile_id, auth_user_id, email, role_at_migration, migration_status, notes
            ) VALUES (
                current_batch, rec.id, rec.auth_uuid, rec.clean_email, rec.role, 
                'ALREADY_EXISTS', 
                'Customer record already exists in online_user.'
            );
            CONTINUE;
        END IF;

        INSERT INTO public.online_user (
            id, email, full_name, phone, avatar_url, default_shipping_address,
            email_verified, auth_provider, is_active, last_login_at, created_at, updated_at
        ) VALUES (
            rec.id, rec.clean_email, rec.full_name, rec.auth_phone, rec.avatar_url,
            '{}'::jsonb, rec.is_email_confirmed, rec.provider, COALESCE(rec.is_active, true),
            NULL, rec.auth_created_at, COALESCE(rec.updated_at, rec.auth_created_at, NOW())
        );

        migrated_count := migrated_count + 1;

        IF EXISTS (
            SELECT 1 FROM public.online_user o 
            WHERE o.id = rec.id AND LOWER(TRIM(o.email)) = rec.clean_email
        ) AND EXISTS (
            SELECT 1 FROM auth.users u2 WHERE u2.id = rec.id
        ) THEN
            INSERT INTO public._auth_migration_audit (
                batch_id, profile_id, auth_user_id, email, role_at_migration, migration_status, notes
            ) VALUES (
                current_batch, rec.id, rec.auth_uuid, rec.clean_email, rec.role, 
                'VERIFIED_AND_REMOVED_FROM_PROFILES', 
                'Online user record verified. Cleaned up non-admin record from profiles.'
            );

            DELETE FROM public.profiles
            WHERE id = rec.id
              AND LOWER(TRIM(COALESCE(role, ''))) NOT IN ('super_admin', 'store_manager', 'admin');

            verified_cleaned_count := verified_cleaned_count + 1;
        ELSE
            INSERT INTO public._auth_migration_audit (
                batch_id, profile_id, auth_user_id, email, role_at_migration, migration_status, notes
            ) VALUES (
                current_batch, rec.id, rec.auth_uuid, rec.clean_email, rec.role, 
                'VERIFICATION_FAILED', 
                'Integrity check failed. Retained in profiles.'
            );
        END IF;

    END LOOP;

    RAISE NOTICE 'COMPLETE: Migrated: %, Verified & Cleaned: %, Quarantined: %', 
        migrated_count, verified_cleaned_count, quarantined_count;
END;
$$;

COMMIT;
