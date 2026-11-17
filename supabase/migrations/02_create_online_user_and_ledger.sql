-- =============================================================================
-- WRAPSTORE AUTHENTICATION SEPARATION — STEP 2: SCHEMA & AUDIT LEDGER
-- File: supabase/migrations/02_create_online_user_and_ledger.sql
-- Purpose: Create migration audit ledger and public.online_user customer directory.
-- Mode: [ADDITIVE] Safe, non-destructive table and index creation.
-- =============================================================================

-- 1. Create Migration Audit Ledger
CREATE TABLE IF NOT EXISTS public._auth_migration_audit (
    id BIGSERIAL PRIMARY KEY,
    batch_id TEXT NOT NULL,
    profile_id UUID NOT NULL,
    auth_user_id UUID NOT NULL,
    email TEXT NOT NULL,
    role_at_migration TEXT,
    migration_status TEXT NOT NULL, -- 'MIGRATED', 'DUPLICATE_QUARANTINED', 'VERIFIED', 'FAILED', 'ROLLED_BACK'
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

COMMENT ON TABLE public._auth_migration_audit IS 'Audit trail tracking individual migrated accounts for surgical verification and rollback.';

-- 2. Create public.online_user (Exclusively for registered ecommerce customers)
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

    -- Constraints
    CONSTRAINT chk_online_user_email_format 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE public.online_user IS 'Exclusively stores registered WrapStore website customer accounts.';
COMMENT ON COLUMN public.online_user.default_shipping_address IS 'Customer saved shipping address JSON: {line1, line2, city, state, postal_code, country}.';
COMMENT ON COLUMN public.online_user.last_login_at IS 'Updated strictly via record_customer_login() RPC upon authenticated sessions.';

-- 3. Case-Insensitive Unique Email Index
-- Guarantees email uniqueness across all letter casing variations without merging accounts
CREATE UNIQUE INDEX IF NOT EXISTS idx_online_user_unique_lower_email 
ON public.online_user (LOWER(TRIM(email)));

-- 4. Search and Query Indexes
CREATE INDEX IF NOT EXISTS idx_online_user_phone 
ON public.online_user (phone) 
WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_online_user_is_active 
ON public.online_user (is_active);
