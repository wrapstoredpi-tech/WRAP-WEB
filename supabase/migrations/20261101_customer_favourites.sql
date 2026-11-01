-- ============================================================
-- WRAPSTORE — CUSTOMER FAVOURITES TABLE & OWNER-ONLY POLICIES
-- supabase/migrations/20261101_customer_favourites.sql
-- ============================================================

-- 1. Create customer_favourites table
CREATE TABLE IF NOT EXISTS customer_favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customer_favourites_user_product_key UNIQUE (user_id, product_id)
);

-- 2. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_customer_favourites_user 
  ON customer_favourites(user_id);

CREATE INDEX IF NOT EXISTS idx_customer_favourites_product 
  ON customer_favourites(product_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE customer_favourites ENABLE ROW LEVEL SECURITY;

-- 4. Owner-only policies: users can only view, insert, and delete their own favourites
DROP POLICY IF EXISTS "Users can view their own favourites" ON customer_favourites;
CREATE POLICY "Users can view their own favourites"
  ON customer_favourites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own favourites" ON customer_favourites;
CREATE POLICY "Users can insert their own favourites"
  ON customer_favourites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favourites" ON customer_favourites;
CREATE POLICY "Users can delete their own favourites"
  ON customer_favourites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

