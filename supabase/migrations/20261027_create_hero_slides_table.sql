-- ==============================================================================
-- Migration: Create dedicated hero_slides table for WrapStore Hero Slider
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'image', -- 'image' | 'video'
  media_url text NOT NULL,
  poster_url text,
  tag text,
  tag_subtitle text,
  link_url text DEFAULT '/?category=Mobile%20Cases',
  alt_text text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Allow public read access for storefront
CREATE POLICY "Allow public read access to hero_slides"
ON public.hero_slides FOR SELECT
USING (true);

-- Allow write operations for admin / authenticated / anon clients
CREATE POLICY "Allow anon insert to hero_slides"
ON public.hero_slides FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow anon update to hero_slides"
ON public.hero_slides FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon delete to hero_slides"
ON public.hero_slides FOR DELETE
USING (true);
