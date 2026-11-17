-- =============================================================================
-- WRAPSTORE AUTHENTICATION SEPARATION — STEP 3: RLS & COLUMN PERMISSIONS
-- File: supabase/migrations/03_security_rls_and_permissions.sql
-- Purpose: Restrict customer access, enforce column-level privileges, and protect immutable fields.
-- Mode: [ADDITIVE] Security policies and trigger installation.
-- =============================================================================

-- 1. Enable Row-Level Security
ALTER TABLE public.online_user ENABLE ROW LEVEL SECURITY;

-- 2. Drop any prior policies on online_user to ensure clean setup
DROP POLICY IF EXISTS "online_user_select_own" ON public.online_user;
DROP POLICY IF EXISTS "online_user_select_admin" ON public.online_user;
DROP POLICY IF EXISTS "online_user_insert_deny" ON public.online_user;
DROP POLICY IF EXISTS "online_user_update_own" ON public.online_user;
DROP POLICY IF EXISTS "online_user_delete_deny" ON public.online_user;

-- 3. SELECT Policy: Customers read only their own profile
CREATE POLICY "online_user_select_own" 
ON public.online_user 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- 4. SELECT Policy: Active Store Admins can view customer profiles for fulfillment
CREATE POLICY "online_user_select_admin" 
ON public.online_user 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
          AND role IN ('super_admin', 'store_manager') 
          AND is_active = true
    )
);

-- 5. INSERT Policy: Direct client inserts blocked (Profile created strictly via system trigger)
CREATE POLICY "online_user_insert_deny" 
ON public.online_user 
FOR INSERT 
TO authenticated, anon 
WITH CHECK (false);

-- 6. UPDATE Policy: Customers can only target their own row
CREATE POLICY "online_user_update_own" 
ON public.online_user 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 7. DELETE Policy: Direct client deletions prohibited
CREATE POLICY "online_user_delete_deny" 
ON public.online_user 
FOR DELETE 
TO authenticated, anon 
USING (false);

-- =============================================================================
-- POSTGRESQL COLUMN-LEVEL PERMISSIONS (DATABASE ENGINE LEVEL)
-- =============================================================================
-- Revoke all table-level updates
REVOKE UPDATE ON public.online_user FROM public;
REVOKE UPDATE ON public.online_user FROM anon;
REVOKE UPDATE ON public.online_user FROM authenticated;

-- Grant column-specific update privileges to authenticated customers
GRANT UPDATE (
    full_name, 
    phone, 
    avatar_url, 
    default_shipping_address
) ON public.online_user TO authenticated;

-- Grant select on all columns to authenticated users (evaluated via RLS)
GRANT SELECT ON public.online_user TO authenticated;

-- =============================================================================
-- BEFORE UPDATE IMMUTABILITY & AUDIT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION public.trg_online_user_protect_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Prevent altering primary identity UUID
    IF NEW.id <> OLD.id THEN
        RAISE EXCEPTION 'Modification of account ID is strictly prohibited.'
            USING ERRCODE = 'integrity_constraint_violation';
    END IF;

    -- Prevent direct alteration of email (must proceed via Supabase Auth email change)
    IF NEW.email <> OLD.email THEN
        RAISE EXCEPTION 'Direct modification of email is prohibited. Use Supabase Auth verification.'
            USING ERRCODE = 'integrity_constraint_violation';
    END IF;

    -- Prevent self-verification of email
    IF NEW.email_verified <> OLD.email_verified THEN
        RAISE EXCEPTION 'Modification of email_verified status is restricted to auth triggers.'
            USING ERRCODE = 'integrity_constraint_violation';
    END IF;

    -- Prevent altering auth provider
    IF NEW.auth_provider <> OLD.auth_provider THEN
        RAISE EXCEPTION 'Modification of auth_provider is prohibited.'
            USING ERRCODE = 'integrity_constraint_violation';
    END IF;

    -- Prevent self-reactivation / deactivation
    IF NEW.is_active <> OLD.is_active THEN
        RAISE EXCEPTION 'Modification of account active status is restricted to administrators.'
            USING ERRCODE = 'integrity_constraint_violation';
    END IF;

    -- Prevent tampering with creation timestamp
    IF NEW.created_at <> OLD.created_at THEN
        RAISE EXCEPTION 'Modification of created_at timestamp is prohibited.'
            USING ERRCODE = 'integrity_constraint_violation';
    END IF;

    -- Prevent tampering with last_login_at via direct UPDATE
    IF NEW.last_login_at IS DISTINCT FROM OLD.last_login_at THEN
        -- Allow update only if executed through record_customer_login() or system
        IF current_setting('wrapstore.allow_login_timestamp_update', true) IS DISTINCT FROM 'true' THEN
            RAISE EXCEPTION 'Modification of last_login_at is restricted to system login tracking.'
                USING ERRCODE = 'integrity_constraint_violation';
        END IF;
    END IF;

    -- Automatically bump updated_at timestamp
    NEW.updated_at = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_online_user_fields ON public.online_user;

CREATE TRIGGER trg_protect_online_user_fields
    BEFORE UPDATE ON public.online_user
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_online_user_protect_fields();
