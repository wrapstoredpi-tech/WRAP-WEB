-- ==============================================================================
-- Migration: Add tile_image_url column to subcategories & configure storage
-- ==============================================================================

-- 1. Add tile_image_url column to public.subcategories table
ALTER TABLE public.subcategories 
ADD COLUMN IF NOT EXISTS tile_image_url TEXT;

-- 2. Create public storage bucket 'category-tile-images' for permanently hosted assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-tile-images', 'category-tile-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Public read policy for category-tile-images bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for Category Tile Images'
  ) THEN
    CREATE POLICY "Public Access for Category Tile Images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'category-tile-images');
  END IF;
END $$;

-- 4. Update each subcategory row with its permanent image URL
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/iphone.jpg' WHERE slug = 'iphone';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/samsung.jpg' WHERE slug = 'samsung';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/vivo.jpg' WHERE slug = 'vivo';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/power-bank.jpg' WHERE slug = 'power-bank';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/watch-strap.jpg' WHERE slug = 'watch-strap';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/ipad-case.jpg' WHERE slug = 'ipad-case';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/ipad-temper.jpg' WHERE slug = 'ipad-temper';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/cables.jpg' WHERE slug = 'cables';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/airpods-cases.jpg' WHERE slug = 'airpods-cases';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/wallet.jpg' WHERE slug = 'wallet';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/skin.jpg' WHERE slug = 'skin';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/badge-stickers.jpg' WHERE slug = 'badge-stickers';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/watch-cases.jpg' WHERE slug = 'watch-cases';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/phone-stand.jpg' WHERE slug = 'phone-stand';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/cleaning-kit.jpg' WHERE slug = 'cleaning-kit';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/adapters.jpg' WHERE slug = 'adapters';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/lens-protector.jpg' WHERE slug = 'lens-protector';
UPDATE public.subcategories SET tile_image_url = 'https://ppwpedkqlgjvdosxabtf.supabase.co/storage/v1/object/public/category-tile-images/tempered-glass.jpg' WHERE slug = 'tempered-glass';
