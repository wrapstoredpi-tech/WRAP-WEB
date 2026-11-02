-- Migration: Add shipping_state to online_orders
-- WRAPSTORE E-Commerce Platform
-- Note for owner: Run this SQL in your Supabase SQL Editor to store customer shipping state explicitly.

ALTER TABLE public.online_orders 
ADD COLUMN IF NOT EXISTS shipping_state text;

COMMENT ON COLUMN public.online_orders.shipping_state IS 'Customer shipping state (e.g. Tamil Nadu) for delivery timeline calculation';

