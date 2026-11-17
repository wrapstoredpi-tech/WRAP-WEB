-- =============================================================================
-- WRAPSTORE AUTHENTICATION SEPARATION — STEP 4: LOGIN TRACKING RPC
-- File: supabase/migrations/04_login_tracking_rpc.sql
-- Purpose: Secure RPC to record customer login timestamps using auth.uid().
-- Mode: [ADDITIVE] Function installation and execution grants.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.record_customer_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_id UUID := auth.uid();
BEGIN
    -- 1. Ensure caller is an authenticated user
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to record login timestamp.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- 2. Enable session-scoped flag to allow last_login_at update past the trigger
    PERFORM set_config('wrapstore.allow_login_timestamp_update', 'true', true);

    -- 3. Update customer last_login_at strictly for the authenticated caller
    UPDATE public.online_user
    SET 
        last_login_at = NOW(),
        updated_at = NOW()
    WHERE id = caller_id;
END;
$$;

-- Restrict execution permissions
REVOKE ALL ON FUNCTION public.record_customer_login() FROM public;
REVOKE ALL ON FUNCTION public.record_customer_login() FROM anon;
GRANT EXECUTE ON FUNCTION public.record_customer_login() TO authenticated;

COMMENT ON FUNCTION public.record_customer_login() IS 'Idempotently records login timestamp for the currently authenticated customer.';
