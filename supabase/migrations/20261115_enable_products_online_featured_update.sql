-- ==============================================================================
-- Migration: Enable Admin Update for products.online_featured
-- Target Database: ppwpedkqlgjvdosxabtf.supabase.co
-- Date: 2026-11-15
-- 
-- Description:
-- Grants permissions and creates RLS policy so the WrapStore Admin Portal
-- can toggle `online_featured` to feature multiple products simultaneously.
-- ==============================================================================

-- 1. Grant SELECT and UPDATE on products to authenticated, anon, and service_role
GRANT SELECT, UPDATE (online_featured, updated_at) ON public.products TO authenticated, anon;

-- 2. Open / update RLS policy for online_featured updates
DROP POLICY IF EXISTS "Allow online_featured update on products" ON public.products;
CREATE POLICY "Allow online_featured update on products"
ON public.products
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- 3. Ensure supabase_realtime publication includes products for instantaneous storefront updates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'products'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
