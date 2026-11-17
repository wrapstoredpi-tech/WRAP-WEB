-- =============================================================================
-- WRAPSTORE AUTHENTICATION SEPARATION — STEP 6: CUSTOMER MIGRATION & CLEANUP
-- File: supabase/migrations/06_execute_customer_migration.sql
-- Purpose: Safely migrate approved customer accounts into online_user and clean up profiles.
-- Mode: [CONTROLLED DATA-COPY & VERIFIED CLEANUP] Transactional, audited migration.
-- =============================================================================

DO $$
DECLARE
    current_batch TEXT := 'BATCH_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS');
    migrated_count INT := 0;
    quarantined_count INT := 0;
    verified_cleaned_count INT := 0;
    rec RECORD;
    duplicate_email_list TEXT[];
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'Starting WrapStore Customer Migration. Batch ID: %', current_batch;
    RAISE NOTICE '=======================================================';

    -- 1. Identify all normalized email collisions among customer candidates
    -- (If any email has multiple candidate profiles, isolate them from auto-migration)
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

    RAISE NOTICE 'Identified % duplicate email collision groups to quarantine.', ARRAY_LENGTH(duplicate_email_list, 1);

    -- 2. Iterate strictly through explicitly approved customer roles with matching auth identity
    -- Verified profiles columns: id, email, full_name, role, avatar_url, is_active, updated_at
    -- (u.created_at is used because profiles does NOT contain created_at)
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
          -- Strict safety guard: NEVER touch any administrator or legacy admin accounts
          AND LOWER(TRIM(COALESCE(p.role, ''))) NOT IN ('super_admin', 'store_manager', 'admin')
        ORDER BY u.created_at ASC
    LOOP
        -- Condition A: Quarantine email collisions
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

        -- Condition B: Skip if already exists in online_user (Idempotent)
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

        -- Condition C: Migrate approved customer record
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
            rec.id,
            rec.clean_email,
            rec.full_name,
            rec.auth_phone,
            rec.avatar_url,
            '{}'::jsonb,
            rec.is_email_confirmed,
            rec.provider,
            COALESCE(rec.is_active, true),
            NULL, -- Preserved as NULL until real login occurs
            rec.auth_created_at,
            COALESCE(rec.updated_at, rec.auth_created_at, NOW())
        );

        migrated_count := migrated_count + 1;

        -- 3. Post-Migration Verification: Verify online_user record, auth.users identity, and email
        IF EXISTS (
            SELECT 1 FROM public.online_user o 
            WHERE o.id = rec.id 
              AND LOWER(TRIM(o.email)) = rec.clean_email
        ) AND EXISTS (
            SELECT 1 FROM auth.users u2 
            WHERE u2.id = rec.id
        ) THEN
            -- Verification passed! Log verified status in audit ledger
            INSERT INTO public._auth_migration_audit (
                batch_id, profile_id, auth_user_id, email, role_at_migration, migration_status, notes
            ) VALUES (
                current_batch, rec.id, rec.auth_uuid, rec.clean_email, rec.role, 
                'VERIFIED_AND_REMOVED_FROM_PROFILES', 
                'Online user record verified. Cleaned up non-admin record from profiles.'
            );

            -- Safe removal of customer row from profiles ONLY (Never deletes admin profiles)
            DELETE FROM public.profiles
            WHERE id = rec.id
              AND LOWER(TRIM(COALESCE(role, ''))) NOT IN ('super_admin', 'store_manager', 'admin');

            verified_cleaned_count := verified_cleaned_count + 1;
        ELSE
            -- Verification failed! Log failure and DO NOT touch profiles
            INSERT INTO public._auth_migration_audit (
                batch_id, profile_id, auth_user_id, email, role_at_migration, migration_status, notes
            ) VALUES (
                current_batch, rec.id, rec.auth_uuid, rec.clean_email, rec.role, 
                'VERIFICATION_FAILED', 
                'Integrity check failed. Retained in profiles.'
            );
        END IF;

    END LOOP;

    RAISE NOTICE '-------------------------------------------------------';
    RAISE NOTICE 'MIGRATION COMPLETE SUMMARY:';
    RAISE NOTICE '  Batch ID:                %', current_batch;
    RAISE NOTICE '  Migrated to online_user: %', migrated_count;
    RAISE NOTICE '  Verified & Cleaned:      %', verified_cleaned_count;
    RAISE NOTICE '  Quarantined Duplicates:  %', quarantined_count;
    RAISE NOTICE '=======================================================';
END;
$$;
