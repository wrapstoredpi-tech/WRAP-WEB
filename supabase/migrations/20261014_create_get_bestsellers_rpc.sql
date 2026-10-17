-- ==============================================================================
-- Migration: Create get_bestsellers RPC
-- Description: Aggregates sales units over the last 90 days from POS invoices 
--              and online orders without exposing customer details, invoice numbers,
--              or pricing.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_bestsellers(p_limit int DEFAULT 8)
RETURNS TABLE (
  product_id uuid,
  units bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH combined_sales AS (
    -- 1. POS Invoice items from paid invoices in the last 90 days
    SELECT
      ii.product_id,
      ii.quantity::bigint AS qty
    FROM public.invoice_items ii
    INNER JOIN public.invoices inv ON ii.invoice_id = inv.id
    WHERE upper(inv.payment_status) = 'PAID'
      AND inv.created_at >= (now() - interval '90 days')
      AND ii.product_id IS NOT NULL

    UNION ALL

    -- 2. Online order items from confirmed or paid online orders in the last 90 days
    SELECT
      ooi.product_id,
      ooi.quantity::bigint AS qty
    FROM public.online_order_items ooi
    INNER JOIN public.online_orders ord ON ooi.order_id = ord.id
    WHERE (upper(ord.payment_status) = 'PAID' OR upper(ord.order_status) = 'CONFIRMED')
      AND ord.created_at >= (now() - interval '90 days')
      AND ooi.product_id IS NOT NULL
  )
  SELECT
    cs.product_id,
    COALESCE(SUM(cs.qty), 0)::bigint AS units
  FROM combined_sales cs
  GROUP BY cs.product_id
  ORDER BY units DESC
  LIMIT p_limit;
END;
$$;

-- Secure permissions: callable by anon and authenticated callers
REVOKE ALL ON FUNCTION public.get_bestsellers(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_bestsellers(int) TO anon, authenticated;
