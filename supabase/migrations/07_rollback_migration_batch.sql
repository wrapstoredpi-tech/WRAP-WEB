-- =============================================================================
-- WRAPSTORE AUTHENTICATION SEPARATION — STEP 7: SURGICAL ROLLBACK SCRIPT
-- File: supabase/migrations/07_rollback_migration_batch.sql
-- Purpose: Safely rolls back ONLY the records migrated by a specific batch.
-- Mode: [SCOPED RECOVERY] Zero use of TRUNCATE. Preserves all organic customer accounts.
-- =============================================================================

DO $$
DECLARE
    target_batch TEXT;
    records_restored INT := 0;
    records_removed INT := 0;
    rec RECORD;
BEGIN
    -- 1. Identify the most recent migration batch from the audit ledger
    SELECT batch_id INTO target_batch
    FROM public._auth_migration_audit
    WHERE migration_status IN ('MIGRATED', 'VERIFIED_AND_REMOVED_FROM_PROFILES')
    ORDER BY migrated_at DESC
    LIMIT 1;

    IF target_batch IS NULL THEN
        RAISE EXCEPTION 'No migration batch found in audit ledger to rollback.';
    END IF;

    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'Initiating surgical rollback for Batch ID: %', target_batch;
    RAISE NOTICE '=======================================================';

    -- 2. Restore customer records back into public.profiles (if they were removed)
    FOR rec IN 
        SELECT 
            o.id,
            o.email,
            o.full_name,
            o.avatar_url,
            a.role_at_migration,
            o.is_active,
            o.updated_at
        FROM public.online_user o
        JOIN public._auth_migration_audit a ON o.id = a.profile_id
        WHERE a.batch_id = target_batch
          AND a.migration_status = 'VERIFIED_AND_REMOVED_FROM_PROFILES'
    LOOP
        -- Re-insert into public.profiles
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            role,
            avatar_url,
            is_active,
            updated_at
        ) VALUES (
            rec.id,
            rec.email,
            rec.full_name,
            COALESCE(rec.role_at_migration, 'customer'),
            rec.avatar_url,
            rec.is_active,
            rec.updated_at
        )
        ON CONFLICT (id) DO NOTHING;

        records_restored := records_restored + 1;
    END LOOP;

    -- 3. Delete ONLY the rows in online_user created by this migration batch
    -- (Preserves any new customers who registered organically after migration)
    WITH deleted_rows AS (
        DELETE FROM public.online_user
        WHERE id IN (
            SELECT profile_id 
            FROM public._auth_migration_audit
            WHERE batch_id = target_batch 
              AND migration_status IN ('MIGRATED', 'VERIFIED_AND_REMOVED_FROM_PROFILES')
        )
        RETURNING id
    )
    SELECT COUNT(*) INTO records_removed FROM deleted_rows;

    -- 4. Mark batch audit records as ROLLED_BACK
    UPDATE public._auth_migration_audit
    SET migration_status = 'ROLLED_BACK',
        notes = 'Surgically rolled back on ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
    WHERE batch_id = target_batch 
      AND migration_status IN ('MIGRATED', 'VERIFIED_AND_REMOVED_FROM_PROFILES');

    RAISE NOTICE 'Rollback Complete Summary:';
    RAISE NOTICE '  Batch ID:                     %', target_batch;
    RAISE NOTICE '  Profiles Restored:            %', records_restored;
    RAISE NOTICE '  online_user Rows Removed:     %', records_removed;
    RAISE NOTICE '  Organic Customer Accounts:    PRESERVED (Untouched)';
    RAISE NOTICE '=======================================================';
END;
$$;
