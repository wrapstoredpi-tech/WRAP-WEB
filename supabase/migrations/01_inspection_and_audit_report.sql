-- =============================================================================
-- WRAPSTORE AUTHENTICATION SEPARATION — STEP 1: PRE-MIGRATION INSPECTION
-- File: supabase/migrations/01_inspection_and_audit_report.sql
-- Purpose: Inspect live trigger definitions, column structures, and classify profiles.
-- Mode: [READ-ONLY] Safe to execute in Supabase Dashboard SQL Editor at any time.
-- =============================================================================

-- 1. Inspect live trigger on auth.users and its handler function definition
SELECT 
    t.tgname AS trigger_name,
    c.relname AS table_name,
    p.proname AS function_name,
    CASE t.tgtype::integer & 2 WHEN 2 THEN 'BEFORE' ELSE 'AFTER' END AS timing,
    CASE t.tgtype::integer & 28
        WHEN 4 THEN 'INSERT'
        WHEN 8 THEN 'DELETE'
        WHEN 16 THEN 'UPDATE'
        WHEN 20 THEN 'INSERT OR UPDATE'
        ELSE 'OTHER'
    END AS events,
    pg_get_functiondef(p.oid) AS full_function_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
  AND NOT t.tgisinternal;

-- 2. Conclusively verify public.profiles columns (Confirming absence of created_at)
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Detailed classification of all existing public.profiles records
-- Verified columns: id, email, full_name, role, avatar_url, is_active, updated_at
-- (Joining auth.users to inspect created_at and auth status without assuming profiles.created_at)
SELECT 
    p.id AS profile_id,
    p.email AS profile_email,
    p.full_name,
    p.role AS existing_role,
    p.is_active,
    u.created_at AS auth_created_at,
    CASE WHEN u.id IS NOT NULL THEN true ELSE false END AS has_matching_auth_user,
    CASE 
        -- 1. Flag orphaned profiles with no auth.users record
        WHEN u.id IS NULL THEN 
            'ORPHANED_PROFILE (NEEDS REVIEW - NO AUTH IDENTITY)'
        
        -- 2. Certified WrapStore Administrators (Protected in profiles)
        WHEN LOWER(TRIM(COALESCE(p.role, ''))) IN ('super_admin', 'store_manager') THEN 
            'ADMIN_PROTECTED (STAYS IN PROFILES)'
        
        -- 3. Legacy Admin Role (Retained in profiles pending explicit review)
        WHEN LOWER(TRIM(COALESCE(p.role, ''))) = 'admin' THEN 
            'LEGACY_ADMIN (STAYS IN PROFILES PENDING REVIEW)'
        
        -- 4. Explicit Customer Allowlist (Safe for online_user migration)
        WHEN LOWER(TRIM(COALESCE(p.role, ''))) IN ('customer', 'user', 'guest') THEN 
            'APPROVED_CUSTOMER (MIGRATES TO ONLINE_USER)'
        
        -- 5. Null or Empty Role (Quarantined for review; NOT auto-migrated)
        WHEN p.role IS NULL OR TRIM(p.role) = '' THEN
            'NULL_ROLE (NEEDS REVIEW - NOT AUTO-MIGRATED)'

        -- 6. Unknown or unverified roles (Quarantined)
        ELSE 
            'UNKNOWN_ROLE (NEEDS REVIEW - NOT AUTO-MIGRATED)'
    END AS classification
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY 
    CASE 
        WHEN LOWER(TRIM(COALESCE(p.role, ''))) IN ('super_admin', 'store_manager') THEN 1
        WHEN LOWER(TRIM(COALESCE(p.role, ''))) = 'admin' THEN 2
        WHEN u.id IS NULL THEN 3
        WHEN LOWER(TRIM(COALESCE(p.role, ''))) IN ('customer', 'user', 'guest') THEN 4
        ELSE 5
    END,
    p.updated_at DESC;

-- 4. Check for duplicate normalized emails among customer migration candidates
WITH customer_candidates AS (
    SELECT 
        p.id,
        p.email,
        LOWER(TRIM(p.email)) AS normalized_email,
        p.role,
        u.created_at AS auth_created_at
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE LOWER(TRIM(COALESCE(p.role, ''))) IN ('customer', 'user', 'guest')
)
SELECT 
    normalized_email,
    COUNT(*) AS collision_count,
    ARRAY_AGG(id) AS profile_ids,
    ARRAY_AGG(email) AS raw_emails,
    ARRAY_AGG(auth_created_at) AS auth_created_dates
FROM customer_candidates
GROUP BY normalized_email
HAVING COUNT(*) > 1;
