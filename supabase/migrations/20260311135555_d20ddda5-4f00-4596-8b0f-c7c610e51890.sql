-- Xóa policies quá rộng vừa tạo
DROP POLICY IF EXISTS "Authenticated users can update product_suppliers stock" ON public.product_suppliers;
DROP POLICY IF EXISTS "Authenticated users can update product stock" ON public.products;

-- Tạo function SECURITY DEFINER để giảm tồn kho an toàn
CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id uuid,
  p_supplier_id uuid,
  p_quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Giảm stock trong product_suppliers
  IF p_supplier_id IS NOT NULL THEN
    UPDATE product_suppliers
    SET stock = GREATEST(0, stock - p_quantity)
    WHERE product_id = p_product_id AND supplier_id = p_supplier_id;
  END IF;

  -- Giảm stock trong products
  UPDATE products
  SET stock = GREATEST(0, COALESCE(stock, 0) - p_quantity)
  WHERE id = p_product_id;
END;
$$;